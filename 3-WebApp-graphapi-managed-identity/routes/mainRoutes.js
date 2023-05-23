const express = require('express');

const mainController = require('../controllers/mainController');
const graphController = require('../controllers/graphController');

// initialize router
const router = express.Router();

// app routes
router.get('/', mainController.getHomePage);

router.get(
    '/login', 
    (req, res, next) => {
    return req.msid.login({
        postLoginRedirectUri: '/',
    })(req, res, next);
});

router.get(
    '/logout', 
    (req, res, next) => {
    return req.msid.logout({
        postLogoutRedirectUri: '/',
    })(req, res, next);
});

router.get(
    '/id', 
    (req, res, next) => {
        return req.msid.ensureAuthenticated()(req, res, next);
    }, 
    mainController.getIdPage
);

router.get(
    '/users', 
    (req, res, next) => {
        return req.msid.ensureAuthenticated()(req, res, next);
    },
    graphController.getUsersPage
);

// 404
router.get('*', (req, res) => res.status(404).redirect('/404.html'));

module.exports = router;