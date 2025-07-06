import { onSchedule } from "firebase-functions/v2/scheduler";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, onRequest } from "firebase-functions/v2/https"; // Tactical Import for Stripe
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as webpush from "web-push";
import Stripe from "stripe"; // Tactical Import

admin.initializeApp();
const db = admin.firestore();
const visionClient = new ImageAnnotatorClient();

// Tactical Order: "Initialize the Stripe client with the secret key."
const stripeSecretKey = functions.config().stripe?.secret_key;
const stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2025-06-30.basil',
}) : null;

// Tactical Order: "Configure web-push with VAPID keys."
const vapidPublicKey = "BFhep7uswxcrFtbWlCx6-dQE9VZjFIeAHWg4EySQf-jQk26Ka0PXuSamOVLvEWnQwq-twUNrKdg01AOQ5pEmBNc"; // The same public key from your .env file
const vapidPrivateKey = functions.config().vapid?.private_key;

if (vapidPrivateKey) {
    webpush.setVapidDetails(
        "mailto:astrat999@gmail.com",
        vapidPublicKey,
        vapidPrivateKey
    );
}

const BUCKET_NAME = "clout-dumpster.appspot.com"; // Your default bucket name

// --- The Final, Corrected "Heat" Algorithm ---
// Tactical Order: Re-enable and redefine the storage function with an explicit bucket and region.
export const analyzeImageForHeat = onObjectFinalized(
    {
        bucket: BUCKET_NAME,
        // This explicit region setting is the key to bypassing the environmental lookup failure.
        region: "us-central1", 
    },
    async (event) => {
        const filePath = event.data.name;
        const contentType = event.data.contentType;

        if (!contentType?.startsWith("image/") || !filePath?.startsWith("feed-images/")) {
            return null;
        }
        
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
    }
);

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

// Tactical Order: "Create a function that triggers when a new whisper is written."
export const sendWhisperNotification = onDocumentWritten("users/{userId}/whispers/{whisperId}", async (event) => {
    const userId = event.params.userId;
    const whisperData = event.data?.after.data();

    if (!whisperData) {
        logger.log("No whisper data found.");
        return null;
    }

    // Get the user's push subscription from the 'subscriptions' collection.
    const subRef = db.collection("subscriptions").doc(userId);
    const subDoc = await subRef.get();
    if (!subDoc.exists) {
        logger.log(`No subscription found for user ${userId}.`);
        return null;
    }
    const subscription = subDoc.data();

    const payload = JSON.stringify({
        title: "� Someone whispered about you!",
        body: `A mysterious comment just appeared: "${whisperData.text.substring(0, 100)}..."`,
        icon: "/icons/high-heat.png",
        data: { url: `/profile/${userId}` }
    });

    try {
        if (subscription) {
            await webpush.sendNotification(subscription as any, payload);
            logger.log(`Successfully sent whisper notification to user ${userId}.`);
        }
    } catch (error: any) {
        logger.error(`Error sending notification to ${userId}:`, error);
        // If subscription is expired or invalid, delete it.
        if (error.statusCode === 410) {
            await subRef.delete();
        }
    }
    return null;
});

// === STRIPE PAYMENT FUNCTIONS - THE GILDED CAGE ===

// Tactical Order: "Create an onCall function to create a Stripe Checkout session."
export const createStripeCheckout = onCall(async (request) => {
    // Ensure the user is authenticated. onCall does this automatically.
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a purchase.");
    }

    if (!stripeClient) {
        throw new functions.https.HttpsError("failed-precondition", "Payment system not configured.");
    }

    const { priceId, successUrl, cancelUrl } = request.data;
    const userId = request.auth.uid;

    if (!priceId || !successUrl || !cancelUrl) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required purchase data.");
    }

    try {
        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            // We pass the userId and priceId in the metadata so we know who to give coins to on success.
            metadata: {
                userId: userId,
                priceId: priceId
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return { sessionId: session.id, sessionUrl: session.url };

    } catch (error) {
        logger.error("Stripe session creation failed:", error);
        throw new functions.https.HttpsError("internal", "Could not create Stripe session.");
    }
});

// Tactical Order: "Create an onRequest function to handle the Stripe webhook."
export const stripeWebhook = onRequest(async (request, response) => {
    if (!stripeClient) {
        logger.error("Stripe client not initialized");
        response.status(500).send("Payment system not configured");
        return;
    }

    const sig = request.headers["stripe-signature"];
    // You need to get your webhook signing secret from the Stripe Dashboard (Developers > Webhooks > Add endpoint)
    const endpointSecret = functions.config().stripe?.webhook_secret;

    if (!endpointSecret) {
        logger.error("Webhook secret not configured");
        response.status(500).send("Webhook not configured");
        return;
    }

    let event;
    try {
        event = stripeClient.webhooks.constructEvent(request.rawBody, sig as string, endpointSecret);
    } catch (err: any) {
        logger.error("Webhook signature verification failed.", err.message);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, priceId } = session.metadata || {};

        // Define how many coins each priceId gives. This MUST match your Stripe setup.
        const coinMap: Record<string, number> = {
            'price_1RhofqPFixwUyCR6M4TTJGL9': 100,  // The Intern - $1.99
            'price_1RhogHPFixwUyCR6H5YqPhvd': 500,  // The Influencer - $7.99  
            'price_1RhogcPFixwUyCR6Jy5hGIvo': 1000  // The Whale - $12.99
        };
        
        const coinsToGrant = priceId ? coinMap[priceId] : 0;

        if (coinsToGrant && userId) {
            const userRef = db.collection("users").doc(userId);
            await userRef.update({ cloutCoin: admin.firestore.FieldValue.increment(coinsToGrant) });
            logger.log(`Granted ${coinsToGrant} CloutCoin to user ${userId} for purchase ${priceId}.`);
        } else {
            logger.error(`Invalid purchase data: userId=${userId}, priceId=${priceId}, coins=${coinsToGrant}`);
        }
    }

    response.status(200).send();
});

// === TACTICAL ORDER: ROAST TO WHISPER MIGRATION ===
export const migrateRoastsToWhispers = onCall(
    { region: "us-central1" },
    async (request) => {
        // Require authentication for security
        if (!request.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }

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
            
            logger.log('Successfully migrated roasts to whispers');
            return { success: true, message: 'Successfully migrated roasts to whispers' };
            
        } catch (error) {
            logger.error('Migration failed:', error);
            throw new functions.https.HttpsError('internal', 'Migration failed');
        }
    }
);

// === TACTICAL ORDER: CLOUT DRIFT SYSTEM ===
export const updateDriftScores = onSchedule(
    {
        schedule: "every 60 minutes",
        region: "us-central1"
    },
    async () => {
        logger.log("Starting hourly clout drift update...");
        
        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();
        const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - (24 * 60 * 60 * 1000));
        
        try {
            // Get all users
            const usersSnapshot = await db.collection('users').get();
            let driftedUsers = 0;
            let totalUsers = usersSnapshot.size;
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const lastActivity = userData.lastActive;
                
                // Check if user has been inactive for more than 24 hours
                if (lastActivity && lastActivity < twentyFourHoursAgo) {
                    const currentScore = userData.cloutScore || 0;
                    const newScore = Math.floor(currentScore * 0.95); // 5% decay
                    
                    if (newScore !== currentScore && currentScore > 0) {
                        batch.update(userDoc.ref, {
                            cloutScore: newScore,
                            driftApplied: now,
                            momentumLoss: currentScore - newScore
                        });
                        driftedUsers++;
                    }
                }
            }
            
            await batch.commit();
            
            logger.log(`Clout drift applied to ${driftedUsers} out of ${totalUsers} users`);
            
        } catch (error) {
            logger.error('Clout drift update failed:', error);
        }
    }
);
