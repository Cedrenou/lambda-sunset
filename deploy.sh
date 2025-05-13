#!/bin/bash

# Nom de ta Lambda
FUNCTION_NAME="lambda-sunset-csv-to-woo"

# Nom de l'archive
ZIP_FILE="lambda-package.zip"

echo "🔄 Installation des dépendances propres (npm ci)..."
npm ci

if [ $? -ne 0 ]; then
    echo "❌ Échec de l'installation des dépendances."
    exit 1
fi

echo "🗜️  Compression du code..."
zip -r $ZIP_FILE index.js parser.js openai.js woocommerce.js prompts.js s3.js config.js package.json node_modules

if [ $? -ne 0 ]; then
    echo "❌ Échec de la création de l'archive."
    exit 1
fi

echo "🚀 Déploiement vers Lambda ($FUNCTION_NAME)..."
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://$ZIP_FILE > /dev/null && echo "✅ Code déployé avec succès."

rm $ZIP_FILE
