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
    createdAt?: string;
    lastActive?: any; // Keep this from the previous operation.
}

import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

// Tactical Order: "Create reactive stores for user authentication state"
export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
