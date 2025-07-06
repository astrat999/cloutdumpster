<script lang="ts">
    import { db, storage, auth } from '$lib/firebase';
    import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { onMount } from 'svelte';
    import { userProfile } from '$lib/stores';

    let file: FileList | null;
    let caption = "";
    let isLoading = false;
    let feedItems: any[] = [];

    // Tactical Order: "Create a function to upload a new post to the feed."
    async function handlePost() {
        if (!file || file.length === 0 || !auth.currentUser) return;
        isLoading = true;
        try {
            const feedDocRef = await addDoc(collection(db, "feed"), {
                userId: auth.currentUser.uid,
                username: $userProfile?.username || auth.currentUser.email,
                userPhotoURL: $userProfile?.photoURL || null,
                caption: caption,
                createdAt: serverTimestamp(),
                heatScore: 0,
                isAnalyzed: false
            });
            const imageFile = file[0];
            const storagePath = `feed-images/${feedDocRef.id}/${imageFile.name}`;
            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            await updateDoc(feedDocRef, { imageURL: downloadURL });
            caption = "";
            file = null;
            loadFeed();
        } finally {
            isLoading = false;
        }
    }

    // Tactical Order: "Create a function to load the feed, sorted by heatScore."
    async function loadFeed() {
        const q = query(collection(db, "feed"), orderBy("heatScore", "desc"), orderBy("createdAt", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        feedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    onMount(loadFeed);
</script>

<svelte:head>
    <title>Feed - CloutDumpster</title>
</svelte:head>

<main class="p-4 md:p-8 bg-base-200 min-h-screen">
    <div class="max-w-2xl mx-auto">
        <h1 class="text-5xl font-bold text-center mb-8">The Feed</h1>
        <!-- Uploader Card -->
        <div class="card bg-base-100 shadow-xl mb-8">
            <div class="card-body">
                <h2 class="card-title">Post to the Feed</h2>
                <textarea class="textarea textarea-bordered" placeholder="Write a caption..." bind:value={caption}></textarea>
                <input type="file" class="file-input file-input-bordered mt-2" bind:files={file} accept="image/*" />
                <button class="btn btn-primary mt-2" on:click={handlePost} disabled={isLoading}>
                    {#if isLoading}<span class="loading loading-spinner"></span>{/if} Post
                </button>
            </div>
        </div>
        <!-- Feed Display -->
        <div class="space-y-4">
            {#each feedItems as item}
                <div class="card bg-base-100 shadow-lg">
                    <figure><img src={item.imageURL} alt={item.caption} class="w-full" /></figure>
                    <div class="card-body">
                        {#if item.heatScore > 1}
                            <div class="badge badge-secondary gap-2">
                                <img src="/icons/high-heat.png" alt="High Heat" class="w-4 h-4" /> HIGH HEAT
                            </div>
                        {/if}
                        <p>
                            <a href="/profile/{item.userId}" class="font-bold hover:underline">{item.username}</a> 
                            {item.caption}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</main>
