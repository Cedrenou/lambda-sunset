const { parseCSVFromS3 } = require("./parser");
const { generateDescriptions } = require("./openai");
const { publishProduct } = require("./woocommerce");
const { moveFileToProcessed } = require("./s3");
const config = require("./config");

exports.handler = async (event) => {
    try {
        const s3Object = event.Records[0].s3;
        const bucket = s3Object.bucket.name;
        const key = decodeURIComponent(s3Object.object.key.replace(/\+/g, " "));

        const products = await parseCSVFromS3(bucket, key);

        for (const product of products) {
            console.log("Traitement du produit:", product);
            const generated = await generateDescriptions(product);
            await publishProduct(product, generated);
        }

        await moveFileToProcessed(bucket, key);
        console.log("Traitement terminé.");
    } catch (error) {
        console.error("Erreur dans le handler:", error);
        throw error;
    }
};