
const { AuthToken } = require("@azure/msal-common");
const {
    AppServiceAuthenticationHeaders,
    AppServiceEnvironmentVariables,
    AppServiceAuthenticationEndpoints,
    AppServiceAuthenticationQueryParameters,
} = require("./Constants");

class AppServiceAuthProvider {
    appSettings;
    #cryptoProvider;

    constructor(appSettings, cryptoProvider) {
        this.appSettings = appSettings;
        this.#cryptoProvider = cryptoProvider;
    }

    /**
     * Initialize AuthProvider and set default routes and handlers
     * @returns {Router}
     */
    initialize(appRouter) {

        appRouter.use((req, res, next) => {
            if (!req.session) {
                throw new Error("Session is not initialized. Ensure that your session middleware is set up correctly.");
            }

            if (!req.session.isAuthenticated) {
                // check headers for id token
                const rawIdToken = req.headers[
                    AppServiceAuthenticationHeaders.APP_SERVICE_ID_TOKEN_HEADER.toLowerCase()
                ];

                if (rawIdToken) {
                    // parse the id token
                    const idTokenClaims = AuthToken.extractTokenClaims(rawIdToken, this.#cryptoProvider);

                    req.session.isAuthenticated = true;

                    req.session.account = {
                        tenantId: idTokenClaims.tid,
                        homeAccountId: idTokenClaims.oid + "." + idTokenClaims.tid,
                        localAccountId: idTokenClaims.oid,
                        environment: idTokenClaims.iss?.split("://")[1].split("/")[0],
                        username: idTokenClaims.preferred_username,
                        name: idTokenClaims.name,
                        idTokenClaims: idTokenClaims,
                    };
                }
            }

            next();
        });

        // handle redirect
        const redirectPath = new URL(this.appSettings.redirectUri, "https://www.dummybase.com").pathname;
        appRouter.get(redirectPath, this.#handleRedirect());

        return appRouter;
    }

    login(options) {
        return (req, res) => {
            const postLoginRedirectUri = new URL(options.postLoginRedirectUri, `${req.protocol}://${req.get("host")}`).href;

            const loginUri =
                "https://" +
                process.env[AppServiceEnvironmentVariables.WEBSITE_HOSTNAME] +
                AppServiceAuthenticationEndpoints.AAD_SIGN_IN_ENDPOINT +
                AppServiceAuthenticationQueryParameters.POST_LOGIN_REDIRECT_QUERY_PARAM +
                postLoginRedirectUri;

            res.redirect(loginUri);
        };
    }

    logout(options) {
        return (req, res) => {
            const postLogoutRedirectUri = new URL(options.postLogoutRedirectUri, `${req.protocol}://${req.get("host")}`).href;

            const logoutUri =
                "https://" +
                process.env[AppServiceEnvironmentVariables.WEBSITE_HOSTNAME] +
                AppServiceAuthenticationEndpoints.AAD_SIGN_OUT_ENDPOINT +
                AppServiceAuthenticationQueryParameters.POST_LOGOUT_REDIRECT_QUERY_PARAM +
                postLogoutRedirectUri;

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        };
    }

    acquireToken(options) {
        return (req, res, next) => {
            const rawAccessToken = req.headers[
                AppServiceAuthenticationHeaders.APP_SERVICE_ACCESS_TOKEN_HEADER.toLowerCase()
            ];

            if (!rawAccessToken) {
                return next(new Error("No tokens found"));
            }

            return rawAccessToken;
        };
    }

    #handleRedirect() {
        return (req, res, next) => {
            next();
        };
    }
}

module.exports = AppServiceAuthProvider;