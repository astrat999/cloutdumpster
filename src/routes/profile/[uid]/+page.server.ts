import { db } from '$lib/firebase';
import { doc, getDoc, collection, addDoc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { UserProfile } from '$lib';

// Tactical Order: "Create a SvelteKit `load` function to fetch a user's profile and their roasts."
export const load: PageServerLoad = async ({ params }) => {
    const { uid } = params;

    // Fetch the user's main profile data.
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw error(404, 'User not found in the dumpster.');
    }

    const profile = userSnap.data() as UserProfile;

    // Fetch the roasts from the subcollection, ordered by creation time.
    const roastsRef = collection(db, 'users', uid, 'roasts');
    const q = query(roastsRef, orderBy('createdAt', 'desc'));
    const roastsSnap = await getDocs(q);

    const roasts = roastsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
        profile,
        roasts
    };
};

// Tactical Order: "Create a SvelteKit `roast` action to submit a new anonymous roast."
export const actions: Actions = {
    roast: async ({ request, params, locals }) => {
        // We will use `locals` to get the current user later to prevent self-roasting.
        // For now, we keep it simple.
        const { uid: targetUid } = params;
        const data = await request.formData();
        const roastText = data.get('roastText') as string;

        if (!roastText || roastText.trim().length < 10) {
            return { success: false, message: 'A roast must have at least 10 characters of substance.' };
        }

        // Add the new roast to the 'roasts' subcollection of the target user.
        const roastsRef = collection(db, 'users', targetUid, 'roasts');
        await addDoc(roastsRef, {
            text: roastText,
            createdAt: serverTimestamp(),
            // We could store the roaster's UID here for moderation, but display it as anonymous.
            // roasterId: locals.user.uid 
        });

        return { success: true, message: 'Your venom has been delivered.' };
    }
};
