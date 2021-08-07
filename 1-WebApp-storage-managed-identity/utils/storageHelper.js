const { DefaultAzureCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");

const defaultAzureCredential = new DefaultAzureCredential();

async function getBlobs(accountName, containerName) {
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        defaultAzureCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists();

    try {

        let blobs = containerClient.listBlobsFlat();
        let downloadedList = {};

        for await (const blob of blobs) {
            console.log(`${blob.name}`);

            const blobClient = containerClient.getBlobClient(blob.name);

            // Get blob content from position 0 to the end
            // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
            const downloadBlockBlobResponse = await blobClient.download();

            const downloaded = (
                await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
            ).toString();

            console.log("Downloaded blob content:", downloaded);

            if (downloadedList[blob.name]) {
                downloadedList[blob.name].push(downloaded);
            } else {
                downloadedList = {
                    ...downloadedList,
                    [blob.name]: [downloaded]
                }
            }
        }

        return downloadedList;
    } catch (error) {
        console.log(error);
    }
}

async function deleteBlob(accountName, containerName, blobName) {
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        defaultAzureCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    try {
        await blobClient.deleteIfExists();
    } catch (error) {
        console.log(error);
    }
}

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

// A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

module.exports = {
    getBlobs,
    deleteBlob,
    uploadBlob
};