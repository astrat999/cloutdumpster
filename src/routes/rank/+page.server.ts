import { db } from '$lib/firebase';
import { collection, getDocs, doc, increment, writeBatch } from 'firebase/firestore';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { UserProfile } from '$lib';

// Tactical Order: "Create a SvelteKit `load` function to fetch two random users from Firestore."
export const load: PageServerLoad = async ({ locals }) => {
	// This is a placeholder for user auth check later. For now, we proceed.

	// Justification: For our MVP, we fetch ALL users and pick two randomly.
	// This is brutally inefficient but fast to implement. We will optimize it later when we have too many users to care.
	const usersCollectionRef = collection(db, 'users');
	const querySnapshot = await getDocs(usersCollectionRef);

	if (querySnapshot.docs.length < 2) {
		// Not enough users to create a conflict.
		throw error(500, "The dumpster isn't full enough. Not enough users to rank.");
	}

	const allUsers = querySnapshot.docs.map((doc) => ({ ...doc.data() })) as UserProfile[];

	// Select two distinct random users.
	let user1Index = Math.floor(Math.random() * allUsers.length);
	let user2Index;
	do {
		user2Index = Math.floor(Math.random() * allUsers.length);
	} while (user1Index === user2Index);

	const combatant1 = allUsers[user1Index];
	const combatant2 = allUsers[user2Index];

	return {
		combatant1,
		combatant2
	};
};

// Tactical Order: "Create a SvelteKit `default` action to handle the ranking vote."
export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const winnerId = data.get('winnerId') as string;
		const loserId = data.get('loserId') as string;

		if (!winnerId || !loserId) {
			throw error(400, 'Invalid vote. A choice must be made.');
		}

		// We use a write batch to ensure both updates happen together or not at all.
		// This is an atomic transaction, preventing data corruption.
		const batch = writeBatch(db);

		const winnerRef = doc(db, 'users', winnerId);
		batch.update(winnerRef, { cloutScore: increment(1) }); // Winner's score goes up.

		const loserRef = doc(db, 'users', loserId);
		batch.update(loserRef, { cloutScore: increment(-1) }); // Loser's score goes down.

		await batch.commit();

		return { success: true, message: 'Judgment has been rendered.' };
	}
};
