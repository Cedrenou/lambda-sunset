const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

// Cache pour stocker la configuration en mémoire
let configCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

/**
 * Récupère la configuration depuis DynamoDB
 * @param {string} lambdaName - Le nom de la Lambda (clé primaire dans DynamoDB)
 * @returns {Promise<Object>} - La configuration de la Lambda
 */
exports.getLambdaConfig = async (lambdaName = "uploadProductToWooCommerce") => {
    console.log("🔍 Tentative de récupération de la configuration pour la Lambda:", lambdaName);
    
    // Vérifie si la configuration est en cache et valide
    if (configCache && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        console.log("📦 Utilisation du cache (valide depuis", Math.round((Date.now() - lastFetchTime) / 1000), "secondes)");
        return configCache;
    }

    try {
        const params = {
            TableName: "ClientLambdas",
            Key: { lambdaName }
        };
        
        console.log("📡 Paramètres de la requête DynamoDB:", JSON.stringify(params, null, 2));

        const result = await dynamo.get(params).promise();
        console.log("✅ Résultat DynamoDB reçu:", JSON.stringify(result, null, 2));
        
        if (!result.Item) {
            console.error("❌ Aucune configuration trouvée pour la Lambda:", lambdaName);
            throw new Error(`Configuration non trouvée pour la Lambda ${lambdaName}`);
        }

        // Met à jour le cache
        configCache = result.Item;
        lastFetchTime = Date.now();
        console.log("💾 Cache mis à jour avec la nouvelle configuration");

        return configCache;
    } catch (error) {
        console.error("❌ Erreur détaillée lors de la récupération de la configuration DynamoDB:", {
            message: error.message,
            code: error.code,
            requestId: error.requestId,
            statusCode: error.statusCode,
            retryable: error.retryable
        });
        throw error;
    }
};

/**
 * Récupère spécifiquement le prompt GPT depuis la configuration
 * @returns {Promise<string>} - Le prompt GPT
 */
exports.getGptPrompt = async () => {
    console.log("🎯 Tentative de récupération du prompt GPT");
    const config = await exports.getLambdaConfig();
    
    if (!config.config?.gptPrompt) {
        console.error("❌ Structure de la configuration invalide:", JSON.stringify(config, null, 2));
        throw new Error("Le prompt GPT n'est pas configuré dans DynamoDB");
    }
    
    console.log("✅ Prompt GPT récupéré avec succès");
    return config.config.gptPrompt;
}; 