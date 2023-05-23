// get the name of the app service instance from environment variables
const appServiceName = process.env.WEBSITE_SITE_NAME;

const graphHelper = require('../utils/graphHelper');

exports.getProfilePage = async(req, res, next) => {
    try {
        const accessToken = await req.msid.acquireToken({
            scopes: ["Mail.Read"]
        })(req, res, next);
        
        const graphClient = graphHelper.getAuthenticatedClient(accessToken);

        const profile = await graphClient
            .api('/me')
            .get();

        res.render('profile', { isAuthenticated: req.session.isAuthenticated, profile: profile, appServiceName: appServiceName });   
    } catch (error) {
        next(error);
    }
}