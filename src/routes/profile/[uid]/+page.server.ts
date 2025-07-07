import { db } from '$lib/firebase';
import {
	doc,
	getDoc,
	collection,
	addDoc,
	query,
	orderBy,
	getDocs,
	serverTimestamp
} from 'firebase/firestore';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { UserProfile } from '$lib';

// Tactical Order: "Create a SvelteKit `load` function to fetch a user's profile and their whispers."
export const load: PageServerLoad = async ({ params }) => {
	const { uid } = params;

	// Fetch the user's main profile data.
	const userRef = doc(db, 'users', uid);
	const userSnap = await getDoc(userRef);

	if (!userSnap.exists()) {
		throw error(404, 'User not found in the dumpster.');
	}

	const profile = userSnap.data() as UserProfile;

	// Fetch the whispers from the subcollection, ordered by creation time.
	const whispersRef = collection(db, 'users', uid, 'whispers');
	const q = query(whispersRef, orderBy('createdAt', 'desc'));
	const whispersSnap = await getDocs(q);

	const whispers = whispersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

	return {
		profile,
		whispers
	};
};

// Tactical Order: "Create a SvelteKit `whisper` action to submit a new anonymous whisper."
export const actions: Actions = {
	whisper: async ({ request, params, locals }) => {
		// We will use `locals` to get the current user later to prevent self-whispering.
		// For now, we keep it simple.
		const { uid: targetUid } = params;
		const data = await request.formData();
		const whisperText = data.get('whisperText') as string;

		if (!whisperText || whisperText.trim().length < 10) {
			return {
				success: false,
				message: 'A whisper must have at least 10 characters of substance.'
			};
		}

		// Add the new whisper to the 'whispers' subcollection of the target user.
		const whispersRef = collection(db, 'users', targetUid, 'whispers');
		await addDoc(whispersRef, {
			text: whisperText,
			createdAt: serverTimestamp()
			// We could store the whisperer's UID here for moderation, but display it as anonymous.
			// whispererId: locals.user.uid
		});

		return { success: true, message: 'Your whisper has been delivered.' };
	}
};
