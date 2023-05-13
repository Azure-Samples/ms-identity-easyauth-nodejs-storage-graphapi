/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const AuthProvider = require('./auth/AuthProvider');
const mainRouter = require('./routes/mainRoutes');

// App constants
const SERVER_PORT = process.env.PORT || 3000;

// initialize express
const app = express();

const sessionConfig = {
    name: "SESSION_COOKIE_NAME",
    secret: 'ENTER_YOUR_SECRET_HERE',
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'lax',
        httpOnly: true, // set this to true on production
        secure: false, // set this to true when running on HTTPS,
    }
}

if (app.get('env') === 'production') {

    /**
     * In App Service, SSL termination happens at the network load balancers, so all HTTPS requests reach your app as unencrypted HTTP requests.
     * The line below is needed for getting the correct absolute URL for redirectUri configuration. For more information, visit:
     * https://docs.microsoft.com/azure/app-service/configure-language-nodejs?pivots=platform-linux#detect-https-session
     */

    app.set('trust proxy', 1) // trust first proxy e.g. App Service
    sessionConfig.cookie.secure = true // serve secure cookies on HTTPS
}

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session(sessionConfig));

app.use(express.static(path.join(__dirname, './public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

const appSettings = {
    tenantId: "b0a97cb-febb-4553-b51d-daf462e5033a", // Enter the tenant info here,
    clientId: process.env.WEBSITE_AUTH_CLIENT_ID, // Enter the client Id here,
    clientSecret: process.env.MICROSOFT_PROVIDER_AUTHENTICATION_SECRET, // Enter the client secret here,
    redirectUri: "/.auth/login/aad/callback", // Enter the redirect route here
}

/**
 * Initialize the AuthProvider class with the app settings above.
 */
const msid = new AuthProvider(appSettings);
app.use(msid.initialize()); // add the msid middleware

app.use(mainRouter);

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(SERVER_PORT, () => console.log(`Node EasyAuth sample app listening on port ${SERVER_PORT}!`));