// Tactical Order: "Define the UserProfile type for our ranking system"
export interface UserProfile {
    uid: string;
    username: string;
    cloutScore: number;
    email?: string;
    createdAt?: string;
}

import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

// Tactical Order: "Create reactive stores for user authentication state"
export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
