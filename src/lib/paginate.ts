import {
	collection,
	query,
	orderBy,
	limit,
	startAfter,
	getDocs,
	type QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface PaginationResult {
	docs: QueryDocumentSnapshot[];
	lastDoc: QueryDocumentSnapshot | null;
	hasMore: boolean;
}

export const getPage = async (
	db: Firestore,
	collectionName: string,
	orderField: string = 'timestamp',
	orderDirection: 'asc' | 'desc' = 'desc',
	pageSize: number = 20,
	lastDoc?: QueryDocumentSnapshot | null
): Promise<PaginationResult> => {
	try {
		let q = query(
			collection(db, collectionName),
			orderBy(orderField, orderDirection),
			limit(pageSize + 1) // Get one extra to check if there are more
		);

		if (lastDoc) {
			q = query(
				collection(db, collectionName),
				orderBy(orderField, orderDirection),
				startAfter(lastDoc),
				limit(pageSize + 1)
			);
		}

		const snapshot = await getDocs(q);
		const docs = snapshot.docs;

		// Check if there are more documents
		const hasMore = docs.length > pageSize;

		// Remove the extra document if it exists
		if (hasMore) {
			docs.pop();
		}

		return {
			docs,
			lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
			hasMore
		};
	} catch (error) {
		console.error('Error fetching page:', error);
		return {
			docs: [],
			lastDoc: null,
			hasMore: false
		};
	}
};

// Utility for leaderboard pagination
export const getLeaderboardPage = async (
	db: Firestore,
	pageSize: number = 20,
	lastDoc?: QueryDocumentSnapshot | null
): Promise<PaginationResult> => {
	return getPage(db, 'users', 'cloutScore', 'desc', pageSize, lastDoc);
};

// Utility for feed pagination
export const getFeedPage = async (
	db: Firestore,
	pageSize: number = 20,
	lastDoc?: QueryDocumentSnapshot | null
): Promise<PaginationResult> => {
	return getPage(db, 'posts', 'timestamp', 'desc', pageSize, lastDoc);
};
