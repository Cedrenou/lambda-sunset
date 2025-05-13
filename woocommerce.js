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

    try {
        const res = await axios.get(`${config.woocommerceUrl}/wp-json/wc/v3/products`, {
            auth: { username: config.woocommerceKey, password: config.woocommerceSecret },
            params: { sku: product.code_article }
        });

        const productId = res.data[0]?.id;
        if (!productId) throw new Error(`Aucun produit trouvé avec le SKU ${product.code_article}`);

        const updateRes = await axios.put(
            `${config.woocommerceUrl}/wp-json/wc/v3/products/${productId}`,
            {
                name: product.nom_produit,
                slug: `${shortCategory}-${product.nom_produit.toLowerCase().replace(/ /g, "-")}-${randomSlug}`,
                description: longDescription,
                short_description: shortDescription,
                sku: product.code_article,
                size: product.taille || "N/A",
                color: "Noir",
                categories: [
                    { name: product.categorie}
                ],
                attributes: [
                    {
                        name: "Taille",
                        options: [product.taille || "N/A"],
                        visible: true,
                        variation: false
                    },
                    {
                        name: "Matière",
                        options: [product.matiere || "N/A"],
                        visible: true,
                        variation: false
                    },
                    {
                        name: "Marque",
                        options: [product.marque || "N/A"],
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
                    { key: "_wc_gla_condition", value: product.etat?.toLowerCase().includes("neuf") ? "new" : "used" },
                    { key: "_wc_gla_gender", value: product.genre },
                    { key: "_wc_gla_size", value: product.taille },
                    { key: "_wc_gla_color", value: "Noir" },
                    { key: "_wc_gla_material", value: product.matiere},
                    { key: "_wc_gla_age_group", value: "adult" },
                    { key: "_wc_gla_size_system", value: "EU" },
                    { key: "_wc_gla_size_type", value: product.taille},
                    { key: "_yoast_wpseo_title", value: `${generated.seotitle}`},
                    { key: "_yoast_wpseo_focuskw", value: `generated.seoRegularExpression`},
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
