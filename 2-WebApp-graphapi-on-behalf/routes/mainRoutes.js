const express = require('express');

const mainController = require('../controllers/mainController');
const graphController = require('../controllers/graphController');

module.exports = (msid) => {
    // initialize router
    const router = express.Router();

    // app routes
    router.get('/', (req, res, next) => res.redirect('/home'));

    router.get('/home', mainController.getHomePage);

    router.get('/login', msid.signIn({
        successRedirect: '/home',
    }));

    router.get('/logout', msid.signOut({
        successRedirect: '/home',
    }));

    router.get('/id', msid.isAuthenticated(), mainController.getIdPage);

    router.get('/profile', 
        msid.isAuthenticated(), 
        msid.getToken({
            resource: {
                endpoint: "https://graph.microsoft.com/v1.0/me",
                scopes: ["User.Read"]
            }
        }), 
        graphController.getProfilePage
    );

    // error
    router.get('/error', (req, res) => res.redirect('/500.html'));

    // unauthorized
    router.get('/unauthorized', (req, res) => res.redirect('/401.html'));

    // 404
    router.get('*', (req, res) => res.status(404).redirect('/404.html'));

    return router;
};