/**
 * Name of the cookie used for storing transient auth state before the redirect response.
 */
const TRANSIENT_COOKIE_NAME = "sample.auth.state";

/**
 * Request headers used by App Service authentication
 */
const AppServiceAuthenticationHeaders = {
    APP_SERVICE_AUTHENTICATION_HEADER: "X-MSAL-APP-SERVICE-AUTHENTICATION",
    APP_SERVICE_ACCESS_TOKEN_HEADER: "X-MS-TOKEN-AAD-ACCESS-TOKEN",
    APP_SERVICE_ID_TOKEN_HEADER: "X-MS-TOKEN-AAD-ID-TOKEN",
    APP_SERVICE_REFRESH_TOKEN_HEADER: "X-MS-TOKEN-AAD-REFRESH-TOKEN",
    APP_SERVICE_ACCESS_TOKEN_EXPIRES_HEADER: "X-MS-TOKEN-AAD-EXPIRES-ON",
    APP_SERVICE_USER_OID_HEADER: "X-MS-CLIENT-PRINCIPAL-ID",
    APP_SERVICE_USER_UPN_HEADER: "X-MS-CLIENT-PRINCIPAL-NAME",
    APP_SERVICE_IDP_X_HEADER: "X-MS-CLIENT-PRINCIPAL-IDP",
};

/**
 * Endpoints used by App Service authentication
 */
const AppServiceAuthenticationEndpoints = {
    ID_TOKEN_ENDPOINT: "/.auth/me",
    POST_LOGOUT_DEFAULT_ENDPOINT: "/.auth/logout/done",
    POST_LOGIN_DEFAULT_ENDPOINT: "/.auth/login/done",
    AAD_SIGN_IN_ENDPOINT: "/.auth/login/aad",
    AAD_SIGN_OUT_ENDPOINT: "/.auth/logout",
    TOKEN_REFRESH_ENDPOINT: "/.auth/refresh",
    AAD_REDIRECT_ENDPOINT: "/.auth/login/aad/callback",
};

/**
 * Query parameters used by App Service authentication endpoints
 */
const AppServiceAuthenticationQueryParameters = {
    POST_LOGIN_REDIRECT_QUERY_PARAM: "?post_login_redirect_url=",
    POST_LOGOUT_REDIRECT_QUERY_PARAM: "?post_logout_redirect_uri=",
};

/**
 * Environment variables used by App Service authentication
 */
const AppServiceEnvironmentVariables = {
    WEBSITE_AUTH_ENABLED: "WEBSITE_AUTH_ENABLED",
    WEBSITE_AUTH_ALLOWED_AUDIENCES: "WEBSITE_AUTH_ALLOWED_AUDIENCES",
    WEBSITE_AUTH_DEFAULT_PROVIDER: "WEBSITE_AUTH_DEFAULT_PROVIDER",
    WEBSITE_AUTH_TOKEN_STORE: "WEBSITE_AUTH_TOKEN_STORE",
    WEBSITE_AUTH_LOGIN_PARAMS: "WEBSITE_AUTH_LOGIN_PARAMS",
    WEBSITE_AUTH_PRESERVE_URL_FRAGMENT: "WEBSITE_AUTH_PRESERVE_URL_FRAGMENT",
    WEBSITE_AUTH_OPENID_ISSUER: "WEBSITE_AUTH_OPENID_ISSUER",
    WEBSITE_AUTH_CLIENT_ID: "WEBSITE_AUTH_CLIENT_ID",
    WEBSITE_HOSTNAME: "WEBSITE_HOSTNAME",
    WEBSITE_SITE_NAME: "WEBSITE_SITE_NAME",
    WEBSITE_AUTH_REQUIRE_HTTPS: "WEBSITE_AUTH_REQUIRE_HTTPS",
    WEBSITE_AUTH_UNAUTHENTICATED_ACTION: "WEBSITE_AUTH_UNAUTHENTICATED_ACTION",
    WEBSITE_AUTH_API_PREFIX: "WEBSITE_AUTH_API_PREFIX",
    MICROSOFT_PROVIDER_AUTHENTICATION_SECRET: "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET",
};

module.exports = {
    TRANSIENT_COOKIE_NAME,
    AppServiceAuthenticationHeaders,
    AppServiceAuthenticationEndpoints,
    AppServiceAuthenticationQueryParameters,
    AppServiceEnvironmentVariables,
}
