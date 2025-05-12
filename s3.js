const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.moveFileToProcessed = async (bucket, key) => {
    const destinationKey = key.replace("todo/", "processed/");

    await s3.copyObject({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: destinationKey,
    })
        .promise();

    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
};