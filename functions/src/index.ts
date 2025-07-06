import { onSchedule } from "firebase-functions/v2/scheduler";
// import { onObjectFinalized } from "firebase-functions/v2/storage"; // Temporarily disabled due to bucket region issue
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
// import { ImageAnnotatorClient } from "@google-cloud/vision"; // Temporarily disabled due to bucket region issue

admin.initializeApp();
const db = admin.firestore();
// const visionClient = new ImageAnnotatorClient(); // Temporarily disabled due to bucket region issue

// --- The Corrected "Heat" Algorithm ---
// Tactical Order: "Re-define the storage function with an explicit bucket and region."
// Note: Temporarily commented out due to persistent bucket region detection issue
// This will need manual configuration via Google Cloud Console
/*
const BUCKET_NAME = "clout-dumpster.appspot.com"; // Your default bucket name

export const analyzeImageForHeat = onObjectFinalized({
    bucket: BUCKET_NAME,
    // We are now explicitly telling the function where to operate. This bypasses the auto-detection failure.
    region: "us-central1", 
}, async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    if (!contentType?.startsWith("image/") || !filePath?.startsWith("feed-images/")) {
        return null;
    }
    
    // ... The rest of the function logic remains the same. It is correct.
    logger.log(`Analyzing new image: ${filePath}`);
    const [result] = await visionClient.safeSearchDetection(`gs://${BUCKET_NAME}/${filePath}`);
    const detections = result.safeSearchAnnotation;
    const heatScore = (
        (detections?.racy === "LIKELY" || detections?.racy === "VERY_LIKELY" ? 2 : 0) +
        (detections?.adult === "LIKELY" || detections?.adult === "VERY_LIKELY" ? 2 : 0)
    );
    const docId = filePath.split('/')[1];
    if (!docId) return null;
    const feedDocRef = db.collection("feed").doc(docId);
    await feedDocRef.update({ heatScore: heatScore, isAnalyzed: true });
    if (heatScore > 1) {
        const feedDoc = await feedDocRef.get();
        const userId = feedDoc.data()?.userId;
        if (userId) {
            const userRef = db.collection("users").doc(userId);
            await userRef.update({ cloutCoin: admin.firestore.FieldValue.increment(25) });
            logger.log(`Awarded 25 CloutCoin to user ${userId} for high-heat post.`);
        }
    }
    return null;
});
*/

// --- The existing, functional bots ---
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

export const gossipBot = onSchedule({ schedule: "every 24 hours" }, async (event) => {
    logger.info("Running Gossip Bot.");
    const usersRef = admin.firestore().collection("users");
    
    // Get two random, high-clout users.
    const q = usersRef.orderBy("cloutScore", "desc").limit(20);
    const snapshot = await q.get();
    if (snapshot.docs.length < 2) return;

    const users = snapshot.docs;
    const user1 = users[Math.floor(Math.random() * users.length)].data();
    let user2;
    do {
        user2 = users[Math.floor(Math.random() * users.length)].data();
    } while (user1.uid === user2.uid);

    const gossipText = `GOSSIP ALERT: @${user1.username} and @${user2.username} were spotted interacting. Is a new power couple forming? 👀 #CloutCouple`;

    // Post the gossip to the main feed.
    await admin.firestore().collection("feed").add({
        userId: "gossip-bot",
        username: "GossipGirl",
        userPhotoURL: "/icons/high-heat.png", // Re-using an icon for the bot
        caption: gossipText,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        heatScore: 99, // Ensure it's always at the top
        isAnalyzed: true
    });

    logger.info(`Posted gossip: ${gossipText}`);
});
