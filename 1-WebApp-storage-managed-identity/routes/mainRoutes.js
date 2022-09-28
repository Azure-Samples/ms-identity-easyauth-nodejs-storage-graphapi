const express = require('express');

const mainController = require('../controllers/mainController');
const storageController = require('../controllers/storageController');

module.exports = (msid) => {
    // initialize router
    const router = express.Router();

    // app routes
    router.get('/', (req, res, next) => res.redirect('/home'));

    router.get('/home', mainController.getHomePage);

    router.get('/login', msid.signIn({
        postLoginRedirect: '/home',
    }));

    router.get('/logout', msid.signOut({
        postLogoutRedirect: '/home',
    }));

    router.get('/id', msid.isAuthenticated(), mainController.getIdPage);

    router.get('/comments', msid.isAuthenticated(), storageController.getCommentsPage);

    router.post('/comments', msid.isAuthenticated(), storageController.postCommentsPage);

    router.delete('/comments', msid.isAuthenticated(), storageController.deleteCommentsPage);

    // unauthorized
    router.get('/unauthorized', (req, res) => res.redirect('/401.html'));

    // 404
    router.get('*', (req, res) => res.status(404).redirect('/404.html'));

    return router;
};