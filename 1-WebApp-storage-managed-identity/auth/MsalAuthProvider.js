const axios = require('axios');
const { Router } = require("express");
const {
    ConfidentialClientApplication,
    InteractionRequiredAuthError,
    ResponseMode
} = require("@azure/msal-node");
const {
    TRANSIENT_COOKIE_NAME,
} = require('./Constants');

class MsalAuthProvider {
    appSettings;
    #msalConfig;
    #cryptoProvider;

    constructor(appSettings, cryptoProvider) {
        this.appSettings = appSettings;
        this.#cryptoProvider = cryptoProvider;

        this.#msalConfig = {
            auth: {
                clientId: this.appSettings.clientId,
                authority: "https://login.microsoftonline.com/" + this.appSettings.tenantId,
                clientSecret: this.appSettings.clientSecret,
            }
        }
    }

    /**
     * Initialize AuthProvider and set default route handlers
     * @returns {Router}
     */
    initialize(appRouter) {
        appRouter.use((req, res, next) => {
            if (!req.session) {
                throw new Error("Session is not initialized. Ensure that your session middleware is set up correctly.");
            }

            next();
        });

        const redirectPath = new URL(this.appSettings.redirectUri, "https://www.dummybase.com").pathname
        appRouter.post(redirectPath, this.#handleRedirect());

        return appRouter;
    }

    login(options) {
        return async (req, res, next) => {
            /**
            * MSAL Node allows you to pass your custom state as state parameter in the Request object.
            * The state parameter can also be used to encode information of the app's state before redirect.
            * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
            */
            const state = this.#cryptoProvider.base64Encode(
                JSON.stringify({
                    redirectTo: options.postLoginRedirectUri ? options.postLoginRedirectUri : '/',
                })
            );

            const authCodeUrlRequestParams = {
                state: state,
                /**
                 * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
                 * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
                 */
                scopes: options.scopes || [],
            };

            const authCodeRequestParams = {
                state: state,
                /**
                 * By default, MSAL Node will add OIDC scopes to the auth code request. For more information, visit:
                 * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
                 */
                scopes: options.scopes || [],
            };

            /**
             * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will 
             * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making 
             * metadata discovery calls, thereby improving performance of token acquisition process.
             */
            if (!this.#msalConfig.auth.cloudDiscoveryMetadata || !this.#msalConfig.auth.authorityMetadata) {

                const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                    this.#getCloudDiscoveryMetadata(this.#msalConfig.auth.authority),
                    this.#getAuthorityMetadata(this.#msalConfig.auth.authority)
                ]);

                this.#msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(cloudDiscoveryMetadata);
                this.#msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
            }

            const msalInstance = this.#getMsalInstance(this.#msalConfig);

            return this.#redirectToAuthCodeUrl(
                authCodeUrlRequestParams,
                authCodeRequestParams,
                msalInstance
            )(req, res, next);
        }
    }

    logout(options) {
        return (req, res, next) => {
            const postLogoutRedirectUri = new URL(options.postLogoutRedirectUri, `${req.protocol}://${req.get("host")}`).href;

            /**
             * Construct a logout URI and redirect the user to end the
             * session with Azure AD. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
             */
            const logoutUri = `${this.#msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${postLogoutRedirectUri}`;

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        }
    }

    acquireToken(options) {
        return async (req, res, next) => {
            const msalInstance = this.#getMsalInstance(this.#msalConfig);

            try {
                msalInstance.getTokenCache().deserialize(req.session.tokenCache);

                const tokenResponse = await msalInstance.acquireTokenSilent({
                    account: req.session.account,
                    scopes: options.scopes || [],
                });

                req.session.tokenCache = msalInstance.getTokenCache().serialize();
                req.session.accessToken = tokenResponse.accessToken;
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;

                return tokenResponse.accessToken;
            } catch (error) {
                if (error instanceof InteractionRequiredAuthError) {
                    return this.login(options)(req, res, next);
                }

                next(error);
            }
        }
    }

    #handleRedirect() {
        return async (req, res, next) => {
            const authCodeRequest = {
                ...req.cookies[TRANSIENT_COOKIE_NAME].authCodeRequest,
                codeVerifier: req.cookies[TRANSIENT_COOKIE_NAME].pkceCodes.verifier,
                code: req.body.code,
            }

            try {
                const msalInstance = this.#getMsalInstance(this.#msalConfig);
                const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);

                req.session.tokenCache = msalInstance.getTokenCache().serialize();
                req.session.accessToken = tokenResponse.accessToken;
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;
                req.session.isAuthenticated = true;

                const { redirectTo } = JSON.parse(this.#cryptoProvider.base64Decode(req.body.state));

                res.clearCookie(TRANSIENT_COOKIE_NAME, { httpOnly: true, secure: true, sameSite: 'none' }); // discard the state cookie
                res.redirect(redirectTo);
            } catch (error) {
                next(error)
            }
        }
    }

    #getMsalInstance(msalConfig) {
        return new ConfidentialClientApplication(msalConfig);
    }

    #redirectToAuthCodeUrl(authCodeUrlRequestParams, authCodeRequestParams, msalInstance) {
        return async (req, res, next) => {
            const redirectUri = new URL(this.appSettings.redirectUri, `${req.protocol}://${req.get("host")}`).href;
            const { verifier, challenge } = await this.#cryptoProvider.generatePkceCodes();

            const authCodeUrlRequest = {
                redirectUri: redirectUri,
                responseMode: ResponseMode.FORM_POST, // recommended for confidential clients
                codeChallenge: challenge,
                codeChallengeMethod: 'S256',
                ...authCodeUrlRequestParams,
            };

            const cookiePayload = {
                pkceCodes: {
                    verifier: verifier,
                },
                authCodeRequest: {
                    redirectUri: redirectUri,
                    ...authCodeRequestParams,
                }
            };

            try {
                const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(authCodeUrlRequest);

                /**
                 * Web apps using OIDC form_post flow for authentication rely on cross-domain 
                 * cookies for security. Here we designate the cookie with sameSite=none to ensure we can retrieve 
                 * state after redirect from the Azure AD takes place. For more information, visit:
                 * https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-handle-samesite-cookie-changes-chrome-browser
                 */
                res.cookie(TRANSIENT_COOKIE_NAME, cookiePayload, { httpOnly: true, secure: true, sameSite: 'none' });
                res.redirect(authCodeUrlResponse);
            } catch (error) {
                next(error)
            }
        }
    }

    /**
     * Retrieves cloud discovery metadata from the /discovery/instance endpoint
     * @returns 
     */
    async #getCloudDiscoveryMetadata(authority) {
        const endpoint = 'https://login.microsoftonline.com/common/discovery/instance';

        try {
            const response = await axios.get(endpoint, {
                params: {
                    'api-version': '1.1',
                    'authorization_endpoint': `${authority}/oauth2/v2.0/authorize`
                }
            });

            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Retrieves oidc metadata from the openid endpoint
     * @returns 
     */
    async #getAuthorityMetadata(authority) {
        const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

        try {
            const response = await axios.get(endpoint);
            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = MsalAuthProvider;