/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const MsIdExpress = require('microsoft-identity-express');

const mainRouter = require('./routes/mainRoutes');

// App constants
const SERVER_PORT = process.env.PORT || 3000;

// initialize express
const app = express();

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

app.use(express.static(path.join(__dirname, './public')));

app.use(methodOverride('_method'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: 'ENTER_YOUR_SECRET_HERE',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // set this to true on production
    }
}));

app.set('trust proxy', 1) // trust first proxy i.e. App Service

const appSettings = {
    appCredentials: {
        clientId: process.env.WEBSITE_AUTH_CLIENT_ID, // Enter the client Id here,
        tenantId: "common", // Enter the tenant info here,
        clientSecret: process.env.MICROSOFT_PROVIDER_AUTHENTICATION_SECRET // Enter the client secret here,
    },
    authRoutes: {
        redirect: "/.auth/login/aad/callback", // Enter the redirect URI here
        error: "/error", // enter the relative path to error handling route
        unauthorized: "/unauthorized" // enter the relative path to unauthorized route
    },
}

const msid = new MsIdExpress.WebAppAuthClientBuilder(appSettings)
                            .build();

app.use(msid.initialize());

app.use(mainRouter(msid));

app.listen(SERVER_PORT, () => console.log(`Node EasyAuth sample app listening on port ${SERVER_PORT}!`));