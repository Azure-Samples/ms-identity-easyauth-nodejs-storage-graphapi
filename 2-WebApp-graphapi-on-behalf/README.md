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
- [Node.js v12](https://nodejs.org) or later
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

The web app now has the required permissions to access Microsoft Graph as the signed-in user. In this step, you configure App Service authentication and authorization to give you a usable access token for accessing Microsoft Graph.  For more information, read [Configure App Service to return a usable access token](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-user#configure-app-service-to-return-a-usable-access-token) in the tutorial on **docs.microsoft.com**.

### Step 5: Visit the web app

Open a browser and navigate to the deployed web app (replace *web-app-name* with the name of your web app): `https://web-app-name.azurewebsites.net`

## About the code

### Add authentication to your web app

The `handleLogin` controller in *controllers/mainController.js* receives the App Service authentication headers from the incoming request, and then initializes a session variable with the user id, which indicates that the user has successfully signed-in.

```javascript
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
```

In *routes/mainRoutes.js*, a custom middleware named `isLoggedIn` checks the user's session variable to make sure the user is still signed in during route transitions:

```javascript
// ensure the user is logged in
function isLoggedIn(req, res, next) {
    if (!req.session.user['isLoggedIn']) {
        return res.redirect('/login');
    }
    next();
}
```

When the user selects the sign-out button on the navigation bar, the `handleLogout` controller wipes clean the user's session variable, and redirects the app to home page:

```javascript
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
```

### Display name of the signed-in user

When you access the web app running on Azure, you see **sign-in/sign-out** and **ID** buttons at the top of the page. The ID page displays the contents of the singed-in user's ID token via App Service authentication `.auth/me` endpoint. The code for this is found in the *views/home.ejs* file:

```html
<html>
<head>
    <title>ID</title>
</head>

<body>

    <%- include('includes/navbar', {user: user}); %>

        <div class="table-area-div">
            <table class="table">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Claim</th>
                        <th scope="col">Value</th>
                    </tr>
                </thead>
                <tbody id="claims-table">
                </tbody>
            </table>
        </div>

        <% if(user.isLoggedIn) { %>
            <script>
                fetch('https://web-app-name.azurewebsites.net/.auth/me')
                    .then(response => response.json())
                    .then(data => {
                        data[0].user_claims.forEach((item) => {
                            const tableRow = document.createElement("tr");
                            tableRow.innerHTML = `<td>${item.typ}</td><td>${item.val}</td>`;
                            document.getElementById("claims-table").appendChild(tableRow);
                        })
                    }).catch(error => {
                        console.log(error);
                    });
            </script>
            <% } %>
</body>
</html>
```

### Call Microsoft Graph on behalf of the signed-in user

The sample app gets the user's access token from the incoming requests header, which is then passed down to Microsoft Graph client to make an authenticated request to the `/me` endpoint:

```javascript
const graphHelper = require('../utils/graphHelper');

exports.getProfilePage = async(req, res, next) => {

    try {
        const graphClient = graphHelper.getAuthenticatedClient(req.headers['x-ms-token-aad-access-token']);

        const profile = await graphClient
            .api('/me')
            .get();

        res.render('profile', { user: req.session.user, profile: profile });   
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
