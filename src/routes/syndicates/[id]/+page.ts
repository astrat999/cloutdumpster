import type { PageLoad } from './$types';
import { db } from '$lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getAuth } from 'firebase/auth';

export const load: PageLoad = async ({ params }) => {
	try {
		// Get syndicate data
		const syndicateDoc = await getDoc(doc(db, 'syndicates', params.id));

		if (!syndicateDoc.exists()) {
			throw error(404, 'Syndicate not found');
		}

		const syndicateData = { id: syndicateDoc.id, ...syndicateDoc.data() } as any;

		// Get member details
		const usersQuery = query(collection(db, 'users'));
		const usersSnapshot = await getDocs(usersQuery);
		const allUsers = usersSnapshot.docs.map((doc) => doc.data());

		const members =
			syndicateData.memberIds?.map((memberId: string) => {
				const userData = allUsers.find((user) => user.uid === memberId);
				return userData || { uid: memberId, username: 'Unknown', cloutScore: 0 };
			}) || [];

		// Get endorsements for syndicate members
		const endorsementsQuery = query(
			collection(db, 'endorsements'),
			where('syndicateId', '==', params.id)
		);
		const endorsementsSnapshot = await getDocs(endorsementsQuery);
		const endorsements = endorsementsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		// === TACTICAL ORDER: GET USER'S SYNDICATE FOR WARFARE ===
		let userSyndicate = null;
		if (browser) {
			const auth = getAuth();
			const currentUser = auth.currentUser;

			if (currentUser) {
				// Find user's syndicate
				const userSyndicatesQuery = query(
					collection(db, 'syndicates'),
					where('memberIds', 'array-contains', currentUser.uid)
				);
				const userSyndicatesSnapshot = await getDocs(userSyndicatesQuery);

				if (!userSyndicatesSnapshot.empty) {
					const userSyndicateDoc = userSyndicatesSnapshot.docs[0];
					userSyndicate = { id: userSyndicateDoc.id, ...userSyndicateDoc.data() };
				}
			}
		}

		return {
			syndicate: syndicateData,
			members,
			endorsements,
			userSyndicate
		};
	} catch (e) {
		console.error('Error loading syndicate:', e);
		throw error(500, 'Failed to load syndicate');
	}
};
