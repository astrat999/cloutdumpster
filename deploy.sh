#!/bin/bash

# Deployment script for CloutDumpster infrastructure updates

echo "🚀 Deploying CloutDumpster infrastructure updates..."

# Deploy Cloud Functions
echo "📡 Deploying Cloud Functions..."
cd functions
npm run build
firebase deploy --only functions
cd ..

echo "✅ Deployment complete!"

echo "📋 Next steps:"
echo "1. Run migration function: firebase functions:shell -> migrateRoastsToWhispers()"
echo "2. Test infinite scroll on feed page"
echo "3. Test video upload functionality"
echo "4. Monitor clout drift system in logs"

echo "🧪 Test the PWA on mobile:"
echo "1. Check install banner appears"
echo "2. Verify video autoplay works"
echo "3. Test infinite scroll performance"
