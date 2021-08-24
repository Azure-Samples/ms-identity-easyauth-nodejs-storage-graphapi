require('dotenv').config();

const appServiceName = process.env.APP_SERVICE_NAME;

const graphHelper = require('../utils/graphHelper');

exports.getProfilePage = async(req, res, next) => {

    try {
        const graphClient = graphHelper.getAuthenticatedClient(req.headers['x-ms-token-aad-access-token']);

        const profile = await graphClient
            .api('/me')
            .get();

        res.render('profile', { user: req.session.user, profile: profile, appServiceName: appServiceName });   
    } catch (error) {
        next(error);
    }
}