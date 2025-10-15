const axios = require("axios");
const config = require("./config");
const { getGptPrompt } = require("./dynamo");

exports.generateDescriptions = async (product) => {
    // Récupère le prompt depuis DynamoDB
    const promptTemplate = await getGptPrompt();
    
    // Remplace les variables dans le template
    const prompt = promptTemplate
        .replace(/\${product\.nom_produit}/g, product.nom_produit)
        .replace(/\${product\.categorie}/g, product.categorie)
        .replace(/\${product\.taille}/g, product.taille)
        .replace(/\${product\.etat}/g, product.etat)
        .replace(/\${product\.type}/g, product.type)
        .replace(/\${product\.genre}/g, product.genre)
        .replace(/\${product\.indications}/g, product.indications || '')
        .replace(/\${product\.protections}/g, product.protections || '')
        .replace(/\${product\.doublure}/g, product.doublure || '')
        .replace(/\${product\.matiere}/g, product.matiere || '');

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-5",
                messages: [
                    { role: "system", content: "Tu es en charge de rédiger des annonces WooCommerce pour un site de vente d'équipement moto de seconde main occasion : SUNSET RIDER" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.9
            },
            {
                headers: {
                    Authorization: `Bearer ${config.openaiApiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let generatedText = response.data.choices[0].message.content.trim();
        generatedText = generatedText.replace(/```json|```/g, '').trim();

        let generatedJSON;
        try {
            generatedJSON = JSON.parse(generatedText);
        } catch (jsonError) {
            console.error("❌ Erreur de parsing JSON. Réponse brute :", generatedText);
            throw new Error("La réponse de ChatGPT n'était pas un JSON valide.");
        }

        // On vérifie que toutes les clés attendues sont présentes :
        if (!generatedJSON.longdesc || !generatedJSON.shortdesc) {
            console.error("❌ JSON incomplet :", generatedJSON);
            throw new Error("Le JSON ne contient pas toutes les clés attendues.");
        }

        return generatedJSON;

    } catch (error) {
        console.error("❌ Erreur lors de l'appel OpenAI :", error.response ? error.response.data : error.message);
        throw error;
    }
};
