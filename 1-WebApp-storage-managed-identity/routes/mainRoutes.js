const express = require('express');

const mainController = require('../controllers/mainController');
const storageController = require('../controllers/storageController');

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
    '/comments', 
    (req, res, next) => {
        return req.msid.ensureAuthenticated()(req, res, next);
    }, 
    storageController.getCommentsPage
);

router.post(
    '/comments', 
    (req, res, next) => {
        return req.msid.ensureAuthenticated()(req, res, next);
    }, 
    storageController.postCommentsPage
);

router.delete(
    '/comments', 
    (req, res, next) => {
        return req.msid.ensureAuthenticated()(req, res, next);
    }, 
    storageController.deleteCommentsPage
);

module.exports = router;