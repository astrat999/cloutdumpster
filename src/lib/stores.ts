// Tactical Order: "Define the UserProfile type for our ranking system"
export interface UserProfile {
    uid: string;
    username: string;
    cloutScore: number;
    email?: string;
    createdAt?: string;
}
