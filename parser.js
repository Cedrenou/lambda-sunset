const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const csv = require("csv-parser");

// Fonction pour nettoyer les noms de colonnes
function cleanKey(key) {
    return key
        .normalize("NFD") // décompose les accents
        .replace(/[\u0300-\u036f]/g, "") // supprime les diacritiques (accents)
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
}

exports.parseCSVFromS3 = async (bucket, key) => {
    const results = [];
    const stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();

    return new Promise((resolve, reject) => {
        stream
            .pipe(csv())
            .on("data", (data) => {
                const cleaned = {};

                // Nettoyage des noms de colonnes
                Object.keys(data).forEach(rawKey => {
                    const clean = cleanKey(rawKey);
                    cleaned[clean] = data[rawKey]?.trim();
                });

                // Mapping du produit avec les champs personnalisés
                const product = {
                    code_article: cleaned.code_article || "",
                    nom_produit: cleaned.designation || "",
                    taille: cleaned.taille || "",
                    categorie: cleaned.famille || "",
                    protections: cleaned.protections || "",
                    matiere: cleaned.matiere || "",
                    etat: cleaned.etat || "",
                    doublure: cleaned.doublure || "",
                    indications: cleaned.indications_pour_description || "",
                    marque: cleaned.designation.split(" ")[0]?.trim(),
                    genre: cleaned.famille.toLowerCase().includes("femme") ? "female" : cleaned.famille.toLowerCase().includes("homme") ? "male" : "unisex",
                };

                results.push(product);
            })
            .on("end", () => {
                console.log(`✅ Fichier CSV traité (${results.length} produits)`);
                resolve(results);
            })
            .on("error", (err) => {
                console.error("❌ Erreur parsing CSV :", err);
                reject(err);
            });
    });
};
