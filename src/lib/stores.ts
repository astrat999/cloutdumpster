// Tactical Order: "Define the UserProfile type for our ranking system"
export interface UserProfile {
    uid: string;
    username: string;
    cloutScore: number;
    email?: string;
    cloutCoin: number; // Tactical Addition: The user's virtual wallet.
    photoURL?: string; // Tactical Addition: The URL for their profile picture.
    videoURL?: string; // Tactical Addition: 3-second video avatar
    top6?: string[]; // Tactical Addition: Array of UIDs for the "Inner Circle"
    location?: {
        lat: number;
        lng: number;
        geohash: string;
    }; // Tactical Addition: Location for proximity features
    primaryDisplay?: 'photo' | 'video'; // Tactical Addition: User's preferred avatar type
    createdAt?: string;
    lastActive?: any; // Keep this from the previous operation.
}

// Tactical Order: "Define the Syndicate structure for organized power"
export interface Syndicate {
    id: string;
    name: string;
    tag: string; // 3-4 letter abbreviation [CD]
    leaderId: string;
    memberIds: string[];
    treasury: number; // CloutCoin™ balance
    description: string;
    createdAt: any;
    totalCloutScore?: number; // Calculated field for ranking
}

export interface SyndicateEndorsement {
    userId: string;
    syndicateId: string;
    syndicateTag: string;
    expiresAt: any; // Timestamp for 24-hour expiry
    boostAmount: number;
}

import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

// Tactical Order: "Create reactive stores for user authentication state"
export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
