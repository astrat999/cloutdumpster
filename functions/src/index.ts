import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Tactical Order: "Create a scheduled function that runs every 24 hours to decay clout scores."
export const decayCloutScores = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
    functions.logger.info("Starting Clout Score Decay function.", {structuredData: true});

    const now = admin.firestore.Timestamp.now();
    // Inactivity threshold: 48 hours in milliseconds
    const inactivityThreshold = new admin.firestore.Timestamp(now.seconds - (48 * 60 * 60), 0);

    // Query for users who have not been active in the last 48 hours.
    const inactiveUsersQuery = db.collection("users")
        .where("lastActive", "<", inactivityThreshold);

    const querySnapshot = await inactiveUsersQuery.get();

    if (querySnapshot.empty) {
        functions.logger.info("No inactive users found. No scores decayed.");
        return null;
    }

    // Use a batched write to update all inactive users at once.
    const batch = db.batch();
    querySnapshot.forEach((doc) => {
        functions.logger.info(`Decaying score for user: ${doc.id}`);
        const userRef = db.collection("users").doc(doc.id);
        // The punishment: a 5 point deduction. Brutal and simple.
        batch.update(userRef, {cloutScore: admin.firestore.FieldValue.increment(-5)});
    });

    await batch.commit();

    functions.logger.info(`Successfully decayed scores for ${querySnapshot.size} users.`);
    return null;
});
