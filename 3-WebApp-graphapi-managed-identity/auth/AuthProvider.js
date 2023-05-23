const { Router } = require("express");
const { CryptoProvider } = require("@azure/msal-node");
const AppServiceAuthProvider = require("./AppServiceAuthProvider");
const MsalAuthProvider = require("./MsalAuthProvider");
const {
    AppServiceEnvironmentVariables
} = require("./Constants");

class AuthProvider {
    #authProvider;

    constructor(appSettings) {
        const cryptoProvider = new CryptoProvider();

        if (this.#isAppServiceAuthEnabled()) {
            this.#authProvider = new AppServiceAuthProvider(appSettings, cryptoProvider);
        } else {
            this.#authProvider = new MsalAuthProvider(appSettings, cryptoProvider);
        }
    }

    /**
     * Initialize AuthProvider and set default routes and handlers
     * @returns {Router}
     */
    initialize() {
        const appRouter = Router();

        appRouter.use((req, res, next) => {
            req.msid = this;
            next();
        });

        return this.#authProvider.initialize(appRouter);
    }

    /**
     * Middleware that checks if user is authenticated. If not, 
     * it will attempt to sign in the user.
     * @returns {Middleware}
     */
    ensureAuthenticated() {
        return (req, res, next) => {
            if (!req.session.isAuthenticated) {
                return this.login()(req, res, next);
            }

            next();
        };
    }

    /**
     * 
     * @param {*} options 
     * @returns 
     */
    login(options = {
        postLoginRedirectUri: "/",
        scopes: []
    }) {
        return this.#authProvider.login(options);
    }

    /**
     * 
     * @param {*} options 
     * @returns 
     */
    logout(options = {
        postLogoutRedirectUri: "/",
    }) {
        return this.#authProvider.logout(options);
    }

    /**
     * 
     * @param {*} options 
     * @returns 
     */
    acquireToken(options = {
        scopes: []
    }) {
        return this.#authProvider.acquireToken(options);
    }

    #isAppServiceAuthEnabled = () => {
        return process.env[AppServiceEnvironmentVariables.WEBSITE_AUTH_ENABLED] === "True";
    }
}

module.exports = AuthProvider;