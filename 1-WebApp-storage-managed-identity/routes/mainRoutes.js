const express = require('express');

const mainController = require('../controllers/mainController');
const storageController = require('../controllers/storageController');

// initialize router
const router = express.Router();

// ensure the user is logged in
function isLoggedIn(req, res, next) {
    if (!req.session.user['isLoggedIn']) {
        return res.redirect('/login');
    }
    next();
}

// app routes
router.get('/', (req, res, next) => res.redirect('/home'));

router.get('/home', mainController.getHomePage);

router.get('/login', mainController.handleLogin);

router.get('/logout', mainController.handleLogout);

router.get('/id', isLoggedIn, mainController.getIdPage);

router.get('/comments', isLoggedIn, storageController.getCommentsPage);

router.post('/comments', isLoggedIn, storageController.postCommentsPage);

router.delete('/comments', isLoggedIn, storageController.deleteCommentsPage);

// error
router.get('/error', (req, res) => res.redirect('/500.html'));

// unauthorized
router.get('/unauthorized', (req, res) => res.redirect('/401.html'));

// 404
router.get('*', (req, res) => res.status(404).redirect('/404.html'));

module.exports = router;