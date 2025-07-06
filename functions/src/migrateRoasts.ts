import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// One-time migration to rename 'roasts' collection to 'whispers'
export const migrateRoastsToWhispers = functions.https.onCall(async (data, context) => {
    // Require authentication for security
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const db = admin.firestore();
    const batch = db.batch();
    
    try {
        // Get all users to migrate their roasts subcollections
        const usersSnapshot = await db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            
            // Get all roasts for this user
            const roastsSnapshot = await db.collection('users').doc(userId).collection('roasts').get();
            
            for (const roastDoc of roastsSnapshot.docs) {
                const roastData = roastDoc.data();
                
                // Create new whisper document
                const whisperRef = db.collection('users').doc(userId).collection('whispers').doc(roastDoc.id);
                batch.set(whisperRef, roastData);
                
                // Delete old roast document
                batch.delete(roastDoc.ref);
            }
        }
        
        await batch.commit();
        
        return { success: true, message: 'Successfully migrated roasts to whispers' };
    } catch (error) {
        console.error('Migration failed:', error);
        throw new functions.https.HttpsError('internal', 'Migration failed');
    }
});
