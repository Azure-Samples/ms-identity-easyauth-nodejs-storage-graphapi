const storageClient = require('../utils/storageHelper');

// get the name of the app service instance from environment variables
const appServiceName = process.env.WEBSITE_SITE_NAME;
const accountName = process.env.STORAGE_ACCOUNT_NAME;
const containerName = process.env.BLOB_CONTAINER_NAME;

exports.getCommentsPage = async(req, res, next) => {
    try {
        const blobs = await storageClient.getBlobs(accountName, containerName);
        res.render('comments', {isAuthenticated: req.session.isAuthenticated, blobs: blobs, appServiceName: appServiceName});
    } catch (error) {
        next(error);
    }
}

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

exports.deleteCommentsPage = async(req, res, next) => {
    const name = req.body.name;

    try {
        await storageClient.deleteBlob(accountName, containerName, name);
        res.redirect('/comments');
    } catch (error) {
        next(error);
    }
}