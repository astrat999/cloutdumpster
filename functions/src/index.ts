import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize the Admin SDK once.
admin.initializeApp();
const db = admin.firestore();

// Tactical Order: "Create a scheduled function using the modern v2 `onSchedule` syntax."
// This is the new, correct way to define a scheduled function.
export const decayCloutScores = onSchedule({ schedule: "every 24 hours" }, async (event) => {
    logger.info("Starting Clout Score Decay function.", { structuredData: true });

    const now = admin.firestore.Timestamp.now();
    // Inactivity threshold: 48 hours in seconds
    const inactivityThreshold = new admin.firestore.Timestamp(now.seconds - (48 * 60 * 60), 0);

    // The query remains the same. It is still effective.
    const inactiveUsersQuery = db.collection("users")
        .where("lastActive", "<", inactivityThreshold);

    const querySnapshot = await inactiveUsersQuery.get();

    if (querySnapshot.empty) {
        logger.info("No inactive users found. No scores decayed.");
        return;
    }

    const batch = db.batch();
    querySnapshot.forEach((doc) => {
        logger.info(`Decaying score for user: ${doc.id}`);
        const userRef = db.collection("users").doc(doc.id);
        // The punishment remains: a 5 point deduction.
        batch.update(userRef, { cloutScore: admin.firestore.FieldValue.increment(-5) });
    });

    await batch.commit();

    logger.info(`Successfully decayed scores for ${querySnapshot.size} users.`);
});
