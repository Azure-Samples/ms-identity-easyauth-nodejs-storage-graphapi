const graphHelper = require('../utils/graphHelper');
const { DefaultAzureCredential } = require("@azure/identity");

// get the name of the app service instance from environment variables
const appServiceName = process.env[WEBSITE_SITE_NAME];

exports.getUsersPage = async(req, res, next) => {

    const defaultAzureCredential = new DefaultAzureCredential();
    
    try {
        const tokenResponse = await defaultAzureCredential.getToken("https://graph.microsoft.com/.default");

        const graphClient = graphHelper.getAuthenticatedClient(tokenResponse.token);

        const users = await graphClient
            .api('/users')
            .get();

        res.render('users', { isAuthenticated: req.session.isAuthenticated, users: users, appServiceName: appServiceName });   
    } catch (error) {
        next(error);
    }
}