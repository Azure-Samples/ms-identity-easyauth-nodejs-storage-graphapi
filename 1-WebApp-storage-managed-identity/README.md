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

# Tutorial: Enable authentication in App Service and call Azure storage

## About this sample

### Overview

This sample demonstrates a Node.js & Express web app that uses authentication to limit access to users in your organization​ and then calls Azure storage as the web app (not as the signed-in user). The web app authenticates users and also uploads, displays, and deletes text blobs in Azure storage. This sample is a companion to the [Access Azure Storage from a web app](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-storage) tutorial on **docs.microsoft.com**.

### Scenario

You want to limit access to your web app running on Azure App Service to people in your organization. App Service provides built-in authentication and authorization support, so you can sign in users and access data by writing minimal or no code in your web app.

You also want to add access to the Azure data plane (Azure Storage, Azure SQL Database, Azure Key Vault, or other services) from your web app. You could use a shared key, but then you have to worry about operational security of who can create, deploy, and manage the secret. It's also possible that the key could be checked into GitHub, which hackers know how to scan for. A safer way to give your web app access to data is to use managed identities.

A managed identity from Azure Active Directory (Azure AD) allows App Service to access resources through role-based access control (RBAC), without requiring app credentials. After assigning a managed identity to your web app, Azure takes care of the creation and distribution of a certificate. People don't have to worry about managing secrets or app credentials.

## How to run this sample

To run this sample, you'll need:

- [Visual Studio Code](https://code.visualstudio.com) for debugging or editing files
- [Node.js v12](https://nodejs.org) or later
- An [Azure subscription](https://docs.microsoft.com/azure/guides/developer/azure-developer-guide#understanding-accounts-subscriptions-and-billing) and an [Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/quickstart-create-new-tenant) with one or more user accounts in the directory

### Step 1: Clone or download this repository

Clone or download this repository. From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-easyauth-nodejs-storage-graphapi.git
ms-identity-easyauth-nodejs-storage-graphapi
cd 1-WebApp-storage-managed-identity
```

Run the following command in a terminal to install the project dependencies:

```console
npm install
```

### Step 2: Create a resource group, storage account, and Blob Storage container

Create a storage account and Blob Storage container for the web app to access.

Every storage account must belong to an Azure resource group. A resource group is a logical container for grouping your Azure services. When you create a storage account, you have the option to either create a new resource group or use an existing resource group.

This article shows how to [create a new resource group, a storage account, and a Blob Storage container](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-storage#create-a-storage-account-and-blob-storage-container).

Make sure you take note of the storage account name and the Blob Storage container name, which you will need in step (4).

### Step 3: Deploy the web app and configure App Service authentication

This project has one web app project. To deploy it to Azure App Service, you'll need to:

- configure a deployment user
- create an Azure App Service plan
- create a web app
- publish the web app to Azure

For information on how to do this from VS Code using the [App Service Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice), see the [tutorial](https://docs.microsoft.com/azure/developer/javascript/tutorial/deploy-nodejs-azure-app-service-with-visual-studio-code?tabs=bash). Use the same resource group that you used in step 2 instead of creating a new resource group.

After you've deployed the web app to Azure, [configure the Azure App Service authentication/authorization module](https://docs.microsoft.com/azure/app-service/scenario-secure-app-authentication-app-service).  Also verify that only users in your organization can access the web site.

### Step 4: Configure the App Service to use your Azure storage account and blob container

Now you need to add environment variables to the App Service where you deployed your web app.

1. In the [Azure portal](https://portal.azure.com), search for and select **App Service**, and then select your app.
1. Select **Configuration** blade on the left, then select **New Application Settings**.
1. Add the following variables (key-value pairs):
    1. **STORAGE_ACCOUNT_NAME**: the name of the storage account you created in step (2)
    1. **BLOB_CONTAINER_NAME**: the name of the container blob you created in step (2)

Wait for a few minutes for your changes on **App Service** to take effect.

### Step 5: Enable managed identity on an app

Read this article to learn how to [enable a managed identity on a web app](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-storage#enable-managed-identity-on-an-app).

### Step 6: Grant access to the storage account

You need to grant your web app access to the storage account before you can create, read, or delete blobs. In a previous step, you configured the web app running on App Service with a managed identity. Using Azure RBAC, you can give the managed identity access to another resource, just like any security principal. The Storage Blob Data Contributor role gives the web app (represented by the system-assigned managed identity) read, write, and delete access to the blob container and data. Read this article to learn how to [grant access to the storage account](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-storage#grant-access-to-the-storage-account).

### Step 7: Visit the web app

Open a browser and navigate to the deployed web app (replace *web-app-name* with the name of your web app): `https://web-app-name.azurewebsites.net/`

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
                fetch('https://derisen-easyauth-nodejs.azurewebsites.net/.auth/me')
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

### Call storage using managed identities

The methods for uploading, getting, and deleting blobs are in *utils/StorageHelper.js*. The `DefaultAzureCredential` class from [@azure/identity](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md) package is used to get a token credential for your code to authorize requests to Azure Storage. Create an instance of the `DefaultAzureCredential` class, which uses the managed identity to fetch tokens and attach them to the service client. The following code example gets the authenticated token credential and uses it to create a service client object, which uploads a new blob.

```javascript
async function uploadBlob(accountName, containerName, blobName, blobContents) {
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        defaultAzureCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    try {
        await containerClient.createIfNotExists();
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.upload(blobContents, blobContents.length);
        console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);
    } catch (error) {
        console.log(error);
    }
}
```

The *StorageHelper.js* is used in the *controllers/storageController.js* as shown below:

```javascript
const storageClient = require('../utils/storageHelper');

exports.postCommentsPage = async(req, res, next) => {
    const name = req.body.name;
    const content = req.body.content;

    try {
        await storageClient.uploadBlob(accountName, containerName, name, content);
        res.redirect('/comments');
    } catch (error) {
        next(error);
    }
}
```

## Resources

Read the [Access Azure Storage from a web app](https://docs.microsoft.com/azure/app-service/scenario-secure-app-access-storage) tutorial.
