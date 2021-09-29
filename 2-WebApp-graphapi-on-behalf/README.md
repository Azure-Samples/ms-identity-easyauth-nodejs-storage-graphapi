---
languages:
- javascript
- powershell
- html
page_type: sample
description: "Learn how to sign-in users to your web app, call Azure storage, and call Microsoft Graph."
products:
- nodejs
- express
- ms-graph
- azure
- azure-storage
- azure-active-directory
---

# Tutorial: Enable authentication in App Service and call Microsoft Graph (as the signed-in user)

## About this sample

### Overview

This sample demonstrates a Node.js & Express web app that uses authentication to limit access to users in your organization​ and then calls Microsoft Graph as the signed-in user. The web app authenticates a user and displays some of the user's profile information. This sample is a companion to the [Access Microsoft Graph from a secured app as the user](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-user) tutorial on **docs.microsoft.com**.

### Scenario

You want to limit access to your web app running on Azure App Service to people in your organization. App Service provides built-in authentication and authorization support, so you can sign in users and access data by writing minimal or no code in your web app.

You also want to add access to Microsoft Graph from your web app and perform some action as the signed-in user. This section describes how to grant delegated permissions to the web app and get the signed-in user's profile information from Azure Active Directory (Azure AD).

## How to run this sample

To run this sample, you'll need:

- [Visual Studio Code](https://code.visualstudio.com) for debugging or editing files
- [Node.js v14](https://nodejs.org) or later
- An [Azure subscription](https://docs.microsoft.com/azure/guides/developer/azure-developer-guide#understanding-accounts-subscriptions-and-billing) and an [Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/quickstart-create-new-tenant) with one or more user accounts in the directory

### Step 1: Clone or download this repository

Clone or download this repository. From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-easyauth-nodejs-storage-graphapi.git
cd ms-identity-easyauth-nodejs-storage-graphapi
cd 2-WebApp-graphapi-on-behalf
```

### Step 2: Deploy the web app and configure App Service authentication

This project has one WebApp project. To deploy it to Azure App Service, you'll need to:

- configure a deployment user
- create an Azure App Service plan
- create a web app
- publish the web app to Azure

For information on how to do this from VS Code using the [App Service Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice), see the [tutorial](https://docs.microsoft.com/azure/developer/javascript/tutorial/deploy-nodejs-azure-app-service-with-visual-studio-code?tabs=bash).

After you've deployed the web app to Azure, [configure the Azure App Service authentication/authorization module](https://docs.microsoft.com/azure/app-service/scenario-secure-app-authentication-app-service). Also verify that only users in your organization can access the web site.

### Step 3: Grant web app access to call Microsoft Graph

Now that you've enabled authentication and authorization on your web app, the web app is registered with the Microsoft identity platform and is backed by an Azure AD application. In this step, you give the web app permissions to access Microsoft Graph for the user. For more information, read [Grant web app access](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-user#grant-front-end-access-to-call-microsoft-graph) in the tutorial on **docs.microsoft.com**.

### Step 4: Configure App Service to return a usable access token

The web app now has the required permissions to access Microsoft Graph as the signed-in user. In this step, you configure App Service authentication and authorization to give you a usable access token for accessing Microsoft Graph. For more information, read [Configure App Service to return a usable access token](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-user#configure-app-service-to-return-a-usable-access-token) in the tutorial on **docs.microsoft.com**.

### Step 5: Visit the web app

Open a browser and navigate to the deployed web app (replace *web-app-name* with the name of your web app): `https://web-app-name.azurewebsites.net`. Once authenticated, select the **Profile** button at the center of the page. This will take you to the page that displays your profile data from Microsoft Graph.

## About the code

This sample is built using the [@azure/identity](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md) and [@azure-samples/msal-express-wrapper](https://github.com/Azure-Samples/msal-express-wrapper) packages for authentication and authorization.

### Add authentication to your web app

The `signIn` middleware in *routes/mainRoutes.js* receives the App Service authentication headers from the incoming request, and then initializes a session variable with the user account, which indicates that the user has successfully signed-in.

```javascript
    router.get('/login', msid.signIn({
        successRedirect: '/home',
    }));
```

The `isAuthenticated` middleware checks the user's session variable to make sure the user is still signed in during route transitions:

```javascript
router.get('/id', msid.isAuthenticated(), mainController.getIdPage);
```

When the user selects the sign-out button on the navigation bar, the `signOut` middleware wipes clean the user's session variable, and redirects the app to home page:

```javascript
    router.get('/logout', msid.signOut({
        successRedirect: '/home',
    }));
```

### Display name of the signed-in user

When you access the web app running on Azure, you see **sign-in/sign-out** and **ID** buttons at the top of the page. The ID page displays the contents of the singed-in user's ID token. To do so, we access the user's account via the session variable, which is populated when the user signs-in. The code for this is found in the *controllers/mainController.js* file:

```javascript
exports.getIdPage = (req, res, next) => {
    const claims = {
        name: req.session.account.idTokenClaims.name,
        preferred_username: req.session.account.idTokenClaims.preferred_username,
        oid: req.session.account.idTokenClaims.oid,
        sub: req.session.account.idTokenClaims.sub
    };

    res.render('id', { isAuthenticated: req.session.isAuthenticated, appServiceName: appServiceName, claims: claims });
}
```

The `claims` object is then displayed on the *views/id.ejs* file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" status="width=device-width, initial-scale=1.0">
    <title>ID</title>
</head>
<body>
    <%- include('includes/navbar', {isAuthenticated: isAuthenticated, appServiceName: appServiceName}); %>
        <div class="table-area-div">
            <table class="table" style="table-layout: fixed">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Claim</th>
                        <th scope="col">Value</th>
                    </tr>
                </thead>
                <tbody>
                    <% for (const [key, value] of Object.entries(claims)) { %>
                        <tr>
                            <td><%= key %></td>
                            <td><%= value %></td>
                        </tr>
                    <% } %>
                </tbody>
            </table>
        </div>
</body>
</html>
```

### Call Microsoft Graph on behalf of the signed-in user

The sample app gets the user's access token from the incoming requests header, which is then passed down to Microsoft Graph client to make an authenticated request to the `/me` endpoint:

```javascript
const graphHelper = require('../utils/graphHelper');

exports.getProfilePage = async(req, res, next) => {

    try {
        const graphClient = graphHelper.getAuthenticatedClient(req.session.protectedResources["graphAPI"].accessToken);

        const profile = await graphClient
            .api('/me')
            .get();

        res.render('profile', { isAuthenticated: req.session.isAuthenticated, profile: profile, appServiceName: appServiceName });   
    } catch (error) {
        next(error);
    }
}
```

To query Microsoft Graph, the sample uses the [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript). The code for this is located in **utils/graphHelper.js**:

```javascript
getAuthenticatedClient = (accessToken) => {
    // Initialize Graph client
    const client = graph.Client.init({
        // Use the provided access token to authenticate requests
        authProvider: (done) => {
            done(null, accessToken);
        }
    });

    return client;
}
```

## Resources

Read the [Access Microsoft Graph from a secured app as the user](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-user) tutorial.
