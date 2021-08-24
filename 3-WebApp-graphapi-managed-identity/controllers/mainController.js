require('dotenv').config();

const appServiceName = process.env.APP_SERVICE_NAME;

exports.getHomePage = (req, res, next) => {
    res.render('home', { user: req.session.user, appServiceName: appServiceName });
}

exports.getIdPage = (req, res, next) => {
    res.render('id', { user: req.session.user, appServiceName: appServiceName });
}

exports.handleLogin = (req, res, next) => {
    const userId = req.headers['x-ms-client-principal-id']; // oid
    const userName = req.headers['x-ms-client-principal-name']; // upn

    if (userId) {
        // add user info to session
        req.session.user = {
            isLoggedIn: true,
            id: userId,
            name: userName
        };
        req.session.save();

        // redirect to home page
        res.redirect('/');
    } else {
        // redirect to home page
        res.redirect('/');
    }
};

exports.handleLogout = (req, res, next) => {
    // clear user session
    req.session.user = { 
        isLoggedIn: false,  
        id: null,
        name: 'Guest'
    };

    req.session.save();

    // redirect to home page
    res.redirect('/');
};