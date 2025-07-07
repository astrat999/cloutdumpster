<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase';
	import { onAuthStateChanged } from 'firebase/auth';
	import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
	import { user, userProfile } from '$lib/stores';

	onMount(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			user.set(currentUser);

			if (currentUser) {
				// Tactical Order: "Update the user's lastActive timestamp on login."
				const userRef = doc(db, 'users', currentUser.uid);
				// Fire-and-forget update. We don't need to wait for this.
				updateDoc(userRef, { lastActive: serverTimestamp() }).catch(() => {
					// If user doesn't exist yet, create the profile
					setDoc(userRef, {
						uid: currentUser.uid,
						username: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
						email: currentUser.email,
						cloutScore: 100,
						cloutCoin: 10, // Tactical Addition: Give them 10 coins to start. Enough to want more.
						lastActive: serverTimestamp(),
						createdAt: serverTimestamp()
					});
				});

				const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
					if (docSnap.exists()) {
						userProfile.set(docSnap.data() as any);
					}
				});

				return () => unsubscribeProfile();
			} else {
				userProfile.set(null);
			}
		});

		return () => unsubscribe();
	});
</script>

<slot></slot>
