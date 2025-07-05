// Tactical Order: "Define the UserProfile type for our ranking system"
export interface UserProfile {
    uid: string;
    username: string;
    cloutScore: number;
    email?: string;
    cloutCoin: number; // Tactical Addition: The user's virtual wallet.
    createdAt?: string;
    lastActive?: any; // Keep this from the previous operation.
}

import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

// Tactical Order: "Create reactive stores for user authentication state"
export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
