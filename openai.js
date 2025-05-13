const axios = require("axios");
const config = require("./config");

exports.generateDescriptions = async (product) => {
    console.log("📝 Génération de descriptions pour le produit :", product);
    const prompt = `
    IMPORTANT :
- NE FOURNIS AUCUNE MISE EN FORME MARKDOWN (pas de balises ou blocs de type "code").
- N'AJOUTE AUCUN TEXTE AVANT OU APRÈS LE JSON.
- Fournis uniquement le JSON valide.

Ton objectif est de créer une description marketing attrayante et détaillée pour une fiche produit WooCommerce.

Données du produit :
Nom : ${product.nom_produit}
Catégorie : ${product.categorie}
Taille : ${product.taille}
État : ${product.etat}
Style : ${product.type}

Voici le format que tu dois respecter dans ta réponse :
{
"longdesc": "(Description longue) IMPORTANT : 
- 300 mots minimum découpé en deux à trois paragraphes. 
– Optimisée SEO Yoast
- Ajouter un LIEN_EXTERNE vers la page produit qui correspond a la catégorie du produit (ex. : 
    - https://sunsetridershop.com/categorie-produit/veste-moto-homme-occasion/
    - https://sunsetridershop.com/categorie-produit/protection-accessoire-moto-occasion/
    - https://sunsetridershop.com/categorie-produit/chaussure-botte-moto-occasion/
    - https://sunsetridershop.com/categorie-produit/pantalon-moto-occasion-homme/
    - https://sunsetridershop.com/categorie-produit/sportswear-casual-occasion-homme/
    - https://sunsetridershop.com/categorie-produit/veste-moto-femme-occasion/
    - https://sunsetridershop.com/categorie-produit/sportswear-casual-occasion-femme/
    - https://sunsetridershop.com/categorie-produit/protection-accessoire-moto-occasion/
    - https://sunsetridershop.com/categorie-produit/chaussure-botte-moto-occasion/
    - https://sunsetridershop.com/categorie-produit/pantalon-moto-occasion-femme/
    )
    Structure :
Un sous-titre avec le format : <strong>Nom du produit – État</strong> (ex. : Alpinestars Andes – Très bon état)
\\n
Introduction directe avec une expression clé (ex. : blouson moto cuir seconde main femme, pantalon moto d’occasion, vêtement moto reconditionné, etc.). L'expression clé doit apparaître au moins deux fois.
Texte structuré avec phrases courtes (< 20 mots dans 75 % des cas).
Voix active (90 % min.).
Description personnalisée selon le type (blouson, pantalon, chaussures, protections, etc.) En t'aidant des informations suivantes : ${product.indications}.


✅ <strong>Avantages</strong>
• Premier avantage
• Deuxième avantage
• Troisième avantage

🔗 <strong><a href="https://sunsetridershop.com/guide-des-tailles/" target="_blank" rel="noopener noreferrer"><u>Guide des tailles</u></a>
</strong>

🛠️ <strong>Engagements Sunset Rider</strong>
100% Satisfait ou Remboursé. \\n
Tous nos articles de seconde main sont nettoyés et désinfectés. \\n
Les modèles en cuir sont également graissés, cirés et réimperméabilisés. \\n
\n
📩 Pour toute question : info@sunsetridershop.com
\\n
\\n
🔗 <strong><a href="Ajout ici le LIEN_EXTERNE qui correspond" target="_blank" rel="noopener noreferrer"><u>Découvrez notre sélection de CATEGORIE</u></a></strong>

",
   "shortdesc": "Garde toujours cette structure :
• Taille : ${product.taille} ${product.genre === "female" ? 'Femme' : product.genre === "male" ? 'Homme' : 'Unisexe'} (Mesures en photo) \\n
• État : ${product.etat} \\n
• Protections : ${product.protections} \\n
• Doublure : ${product.doublure} \\n
• Matière : ${product.matiere} \\n
\\n
\\n
🔗 <strong><a href="https://sunsetridershop.com/guide-des-tailles/" target="_blank" rel="noopener noreferrer"><u>Guide des tailles</u></a></strong>",
    "seotitle": "${product.nom_produit} - ${product.genre === "female" ? 'Femme' : product.genre === "male" ? 'Homme' : 'Unisexe'} -  [expression clé SEO variable]
     L'expression clé SEO peut varier entre :
        - équipement moto seconde main
        - pantalon moto d’occasion
        - blouson moto cuir seconde main
        - vêtement motarde reconditionné
        - etc.
        Voici un exemple de titreSEO : "alpinestars bionic plus - m homme - seconde main"
        IMPORTANT : le seotitle ne doit pas dépasser 55 caractères (espaces compris) et doit être optimisé pour le SEO. Il doit contenir l'expression clé SEO choisie.
        ",
    "seoRegularExpression": "
        IMPORTANT : le seoRegularExpression doit être optimisé pour le SEO. Il doit etre structuré comme suit : [La catégorie du produit] + ${product.nom_produit} + ${product.genre === "female" ? 'Femme' : product.genre === "male" ? 'Homme' : 'Unisexe'} +  [expression clé SEO variable]
         ➡️ L'expression clé SEO peut varier entre :
        - seconde main
        - occasion
        - reconditionné
        - etc.
         ➡️ La catégorie du produit Homme ou Femme tu mettra : 
         - si c'est une Textile : Veste
         - si c'est un cuir : Blouson
         - si c'est un pantalon : Pantalon
         - ...
        ",
    "seoMetaDescription": "140 à 155 caractères (espaces compris) - Optimisé SEO Yoast. Unique, fluide, sans répétition, avec mots-clés pertinents, résumé clair et concis du produit, sans majuscule abusives, sans fautes d'orthographe, sans répétitions, sans balises HTML, sans mise en forme markdown. Doit contenir l'expression clé SEO choisie."
}`.trim();


    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Tu es en charge de rédiger des annonces WooCommerce pour un site de vente d’équipement moto de seconde main reconditionné : SUNSET RIDER" },
                    { role: "user", content: prompt }
                ],
                temperature: 1.2
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

        console.log("✅ Contenu généré :", generatedJSON);
        return generatedJSON;

    } catch (error) {
        console.error("❌ Erreur lors de l'appel OpenAI :", error.response ? error.response.data : error.message);
        throw error;
    }
};