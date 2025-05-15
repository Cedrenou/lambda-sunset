const axios = require("axios");
const config = require("./config");

// Fonction pour publier un produit sur WooCommerce
exports.publishProduct = async (product, generated = {}) => {
    const longDescription = generated.longdesc || "Description longue par défaut.";
    const shortDescription = generated.shortdesc || "Description courte par défaut.";
    // Si product.categorie contient le mot "veste" cette variable sera égale à "veste", si elle contient "pantalon" elle sera égale à "pantalon", si elle contient "chaussure" elle sera égale à "chaussure", sinon elle sera égale à "autre".
    const shortCategory =  product.categorie.toLowerCase().includes("veste") ? "veste" :
        product.categorie.toLowerCase().includes("pantalon") ? "pantalon" :
            product.categorie.toLowerCase().includes("protection") ? "protection" :
                product.categorie.toLowerCase().includes("casual") ? "casual" :
                    product.categorie.toLowerCase().includes("chaussures") ? "chaussures" : ""

    // Choisir un slug aléatoire parmi les options
    const slugLastPart = ['seconde-main', 'occasion', 'reconditionné']
    const randomSlug = slugLastPart[Math.floor(Math.random() * slugLastPart.length)];

    // Choisir le poid en fonction de la catgorie du produit , pour les veste 3kg, pour les pantalon 2kg, pour les chaussures 1,5kg, pour les protections 1kg
    const weight = shortCategory === "veste" ? 3 :
        shortCategory === "pantalon" ? 2 :
            shortCategory === "chaussures" ? 1.5 :
                shortCategory === "protection" ? 1 : 0;

    // WoodMartNewLabelDate doit etre egal à la date du jour + 7 jours formatter comme ca  : 2023-10-01
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const year = nextWeek.getFullYear();
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
    const day = String(nextWeek.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;


    // Liste des catégories telles qu'elles existent dans WooCommerce
    const CATEGORIES_BY_LABEL = [
        { id: 25, name: "Blouson et veste moto Homme" },
        { id: 26, name: "Blouson et veste moto Femme" },
        { id: 29, name: "Sportswear et Casual Homme" },
        { id: 30, name: "Sportswear et Casual Femme" },
        { id: 28, name: "Protection et accessoire" },
        { id: 24, name: "Pantalon Homme" },
        { id: 250, name: "Pantalon Femme" },
        { id: 27, name: "Chaussures et bottes" },
        { id: 246, name: "Non classé" }
    ];

    // Fonction qui fait la correspondance "intelligente"
    function resolveCategorieId(categorieCsv) {
        const lower = (categorieCsv || "").toLowerCase().trim();

        const found = CATEGORIES_BY_LABEL.find(cat => cat.name.toLowerCase() === lower);
        if (found) return found.id;

        console.warn("❗️Catégorie non trouvée, fallback vers 'Non classé' :", categorieCsv);
        return 246; // ID de 'Non classé'
    }



    try {
        const res = await axios.get(`${config.woocommerceUrl}/wp-json/wc/v3/products`, {
            auth: { username: config.woocommerceKey, password: config.woocommerceSecret },
            params: { sku: product.code_article }
        });

        const productId = res.data[0]?.id;
        if (!productId) throw new Error(`Aucun produit trouvé avec le SKU ${product.code_article}`);

        console.log(`INFO Produit ${product.categorie}`);

        const updateRes = await axios.put(
            `${config.woocommerceUrl}/wp-json/wc/v3/products/${productId}`,
            {
                name: product.nom_produit,
                slug: `${shortCategory}-${product.nom_produit.toLowerCase().replace(/ /g, "-")}-${randomSlug}`,
                description: longDescription,
                short_description: shortDescription,
                sku: product.code_article,
                weight: weight.toString(),
                size: product.taille || "N/A",
                color: "Noir",
                categories: [
                    { id: resolveCategorieId(product.categorie)}
                ],
                attributes: [
                    {
                        id: 7, // Taille
                        options: [product.taille],
                        visible: true,
                        variation: false
                    },
                    {
                        id: 8, // Matiere
                        options: [product.matiere],
                        visible: true,
                        variation: false
                    },
                    {
                        id: 5, // Marque
                        options: [product.marque],
                        visible: true,
                        variation: false
                    }
                ],
                yoast_head_json: {
                    description: generated.seoMetaDescription,
                    og_description: generated.seoMetaDescription
                },
                status: "draft",
                meta_data: [
                    { key: "_wc_gla_brand", value: product.marque},
                    { key: "fb_brand", value: product.marque},
                    { key: "_wc_gla_condition", value: product.etat?.toLowerCase().includes("neuf") ? "new" : "used" },
                    { key: "fb_product_condition", value: product.etat?.toLowerCase().includes("neuf") ? "new" : "used" },
                    { key: "_wc_gla_gender", value: product.genre },
                    { key: "fb_gender", value: product.genre },
                    { key: "_woosea_gender", value: product.genre },
                    { key: "_wc_gla_size", value: product.taille },
                    { key: "fb_size", value: product.taille },
                    { key: "_wc_gla_color", value: "Noir" },
                    { key: "fb_color", value: "Noir"},
                    { key: "_wc_gla_material", value: product.matiere},
                    { key: "fb_material", value: product.matiere},
                    { key: "_wc_gla_ageGroup", value: "adult" },
                    { key: "_woosea_age_group", value: "adult"},
                    { key: "fb_age_group", value: "adult"},
                    { key: "_wc_gla_size_system", value: "EU" },
                    { key: "_wc_gla_size_type", value: product.taille},
                    { key: "_yoast_wpseo_title", value: `${generated.seotitle}`},
                    { key: "_yoast_wpseo_focuskw", value: `${generated.seoRegularExpression}`},
                    { key: "_yoast_wpseo_metadesc", value: `${generated.seoMetaDescription}`},
                    { key: "_woodmart_new_label_date", value: formattedDate },
                ]
            },
            {
                auth: {
                    username: config.woocommerceKey,
                    password: config.woocommerceSecret
                }
            }
        );

        console.log(`✅ Meta données mises à jour pour le produit ID ${productId}`);
        return updateRes.data;

    } catch (error) {
        console.error("❌ Erreur lors de la publication ou de la mise à jour :", error.response ? error.response.data : error.message);
        throw error;
    }
};
