require("dotenv").config();
const storageClient = require('../utils/storageHelper');

const accountName = process.env.STORAGE_ACCOUNT_NAME;
const containerName = process.env.BLOB_CONTAINER_NAME;
const appServiceName = process.env.APP_SERVICE_NAME;

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