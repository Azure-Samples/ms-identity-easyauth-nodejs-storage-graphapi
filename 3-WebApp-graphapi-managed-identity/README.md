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

# Tutorial: Enable authentication in App Service and call Microsoft Graph (as the web app)

## About this sample

### Overview

This sample demonstrates an Node.js & Express web app that uses authentication to limit access to users in your organization​ and then calls Microsoft Graph as the app. The web app authenticates a user and displays some of the user's profile information. The web app then displays a list of users in the Azure Active Directory tenant. This sample is a companion to the [Access Microsoft Graph from a secured app as the app](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-app) tutorial on docs.microsoft.com.

### Scenario

You want to limit access to your web app running on Azure App Service to people in your organization. App Service provides built-in authentication and authorization support, so you can sign in users and access data by writing minimal or no code in your web app.

You also want to call Microsoft Graph from the web app, as the app (not the signed-in user). A safe way to give your web app access to data is to use a system-assigned managed identity. A managed identity from Azure Active Directory allows App Service to access resources through role-based access control (RBAC), without requiring app credentials. After assigning a managed identity to your web app, Azure takes care of the creation and distribution of a certificate. You don't have to worry about managing secrets or app credentials.

## How to run this sample

To run this sample, you'll need:

- [Visual Studio Code](https://code.visualstudio.com) for debugging or editing files
- [Node.js 12.x](https://nodejs.org) or later
- An [Azure subscription](https://docs.microsoft.com/azure/guides/developer/azure-developer-guide#understanding-accounts-subscriptions-and-billing) and an [Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/quickstart-create-new-tenant) with one or more user accounts in the directory

### Step 1: Clone or download this repository

Clone or download this repository. From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-easyauth-nodejs-storage-graphapi.git
cd ms-identity-easyauth-nodejs-storage-graphapi
cd 3-WebApp-graphapi-managed-identity
```

### Step 2: Deploy the web app and configure App Service authentication

This project has one WebApp project. To deploy it to Azure App Service, you'll need to:

- configure a deployment user
- create an Azure App Service plan
- create a web app
- publish the web app to Azure

For information on how to do this from VS Code using the [App Service Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice), see the [tutorial](https://docs.microsoft.com/azure/developer/javascript/tutorial/deploy-nodejs-azure-app-service-with-visual-studio-code?tabs=bash).

After you've deployed the web app to Azure, [configure the Azure App Service authentication/authorization module](https://docs.microsoft.com/azure/app-service/scenario-secure-app-authentication-app-service). Also verify that only users in your organization can access the web site.

### Step 3: Enable managed identity on an app

Read this article to learn how to [enable a managed identity on a web app](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-storage#enable-managed-identity-on-an-app).

### Step 4: Grant access to Microsoft Graph

When accessing the Microsoft Graph, the managed identity needs to have proper permissions for the operation it wants to perform. Currently, there's no option to assign such permissions through the Azure portal. Use PowerShell or the Azure CLI to add the requested Microsoft Graph API permissions to the managed identity service principal object. For more information, read [Grant access to Microsoft Graph](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-app#grant-access-to-microsoft-graph) in the tutorial on docs.microsoft.com.

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

When you access the web app running on Azure, you see **sign-in/sign-out** and **ID** buttons at the top of the page. The ID page displays the contents of the singed-in user's ID token via App Service authentication `.auth/me` endpoint. The code for this is found in the *views/id.ejs* file:

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

### Call Microsoft Graph as the app

The call to Microsoft Graph is performed in the *controllers/graphController.js* file `getUsersPage` controller. The `DefaultAzureCredential` class from [@azure/identity](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md) package is used to get a token credential for your code to authorize requests to Azure Storage. Create an instance of the `DefaultAzureCredential` class, which uses the managed identity to fetch tokens and attach them to the service client. The following code example gets the authenticated token credential and uses it to create a service client object, which gets the users in the group.

```javascript
const graphHelper = require('../utils/graphHelper');
const { DefaultAzureCredential } = require("@azure/identity");

exports.getUsersPage = async(req, res, next) => {

    const defaultAzureCredential = new DefaultAzureCredential();
    
    try {
        const tokenResponse = await defaultAzureCredential.getToken("https://graph.microsoft.com/.default");

        const graphClient = graphHelper.getAuthenticatedClient(tokenResponse.token);

        const users = await graphClient
            .api('/users')
            .get();

        res.render('users', { user: req.session.user, users: users });   
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

Read the [Access Microsoft Graph from a secured app as the app](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-microsoft-graph-as-app) tutorial.
