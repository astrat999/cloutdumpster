import { db } from '$lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { PageServerLoad } from './$types';
import type { UserProfile } from '$lib';

// Tactical Order: "Create a SvelteKit `load` function to fetch the top 100 users from Firestore, ordered by cloutScore."
export const load: PageServerLoad = async () => {
	// Justification: This query is the heart of the operation.
	// 1. `collection(db, 'users')`: Target the user data.
	// 2. `orderBy('cloutScore', 'desc')`: Sort from highest to lowest. This is the core of the ranking.
	// 3. `limit(100)`: We only care about the top tier. This keeps the query fast and the list exclusive.
	const usersCollectionRef = collection(db, 'users');
	const q = query(usersCollectionRef, orderBy('cloutScore', 'desc'), limit(100));

	const querySnapshot = await getDocs(q);

	const leaderboard = querySnapshot.docs.map((doc) => ({
		...doc.data()
	})) as UserProfile[];

	// Return the ranked list to the frontend.
	return {
		leaderboard
	};
};
