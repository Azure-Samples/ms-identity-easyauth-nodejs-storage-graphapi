require('dotenv').config();

const appServiceName = process.env.APP_SERVICE_NAME;

exports.getHomePage = (req, res, next) => {
    res.render('home', { isAuthenticated: req.session.isAuthenticated, appServiceName: appServiceName });
}

exports.getIdPage = (req, res, next) => {
    const claims = {
        name: req.session.account.idTokenClaims.name,
        preferred_username: req.session.account.idTokenClaims.preferred_username,
        oid: req.session.account.idTokenClaims.oid,
        sub: req.session.account.idTokenClaims.sub
    };

    res.render('id', { isAuthenticated: req.session.isAuthenticated, appServiceName: appServiceName, claims: claims });
}