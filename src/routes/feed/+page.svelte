<script lang="ts">
    import { onMount } from 'svelte';
    import { auth, db, storage } from '$lib/firebase';
    import { user, userProfile } from '$lib/stores';
    import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, Timestamp, updateDoc, doc, startAfter } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';

    interface FeedPost {
        id: string;
        userId: string;
        imageURL?: string;
        videoURL?: string;
        caption?: string;
        createdAt: Timestamp;
        heatScore?: number;
        userName?: string;
        userPhotoURL?: string;
        postType: 'image' | 'video';
    }

    let feedPosts: FeedPost[] = [];
    let uploading = false;
    let uploadFile: File | null = null;
    let caption = '';
    let previewUrl = '';
    let currentTab: 'hot' | 'recent' = 'hot';
    let lastDoc: any = null;
    let loading = false;
    let hasMore = true;

    // Handle file selection
    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                uploadFile = file;
                previewUrl = URL.createObjectURL(file);
            }
        }
    }

    // Upload content
    async function uploadToFeed() {
        if (!uploadFile || !$user?.uid || !$userProfile) {
            return;
        }

        uploading = true;
        try {
            const postType = uploadFile.type.startsWith('video/') ? 'video' : 'image';
            
            const feedData: any = {
                userId: $user.uid,
                userName: $userProfile.username || 'Anonymous',
                userPhotoURL: $userProfile.photoURL || '',
                caption: caption.trim() || '',
                createdAt: serverTimestamp(),
                heatScore: Math.floor(Math.random() * 50) + 10,
                postType: postType
            };

            const feedDocRef = await addDoc(collection(db, 'feed'), feedData);

            const contentRef = ref(storage, `feed/${feedDocRef.id}/${uploadFile.name}`);
            const snapshot = await uploadBytes(contentRef, uploadFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const updateData = postType === 'video' 
                ? { videoURL: downloadURL }
                : { imageURL: downloadURL };
            
            await updateDoc(feedDocRef, updateData);

            // Reset form
            uploadFile = null;
            caption = '';
            previewUrl = '';
            
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            loadFeed(true);

        } catch (error) {
            console.error('Error uploading:', error);
            alert('Upload failed. Try again.');
        } finally {
            uploading = false;
        }
    }

    // Load feed
    async function loadFeed(reset = false) {
        if (loading) return;
        
        loading = true;
        
        try {
            let q: any;
            
            if (currentTab === 'hot') {
                q = query(
                    collection(db, 'feed'),
                    orderBy('heatScore', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else {
                q = query(
                    collection(db, 'feed'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            }

            if (!reset && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                hasMore = false;
                loading = false;
                return;
            }

            const newPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as any
            })) as FeedPost[];

            if (reset) {
                feedPosts = newPosts;
            } else {
                feedPosts = [...feedPosts, ...newPosts];
            }

            lastDoc = snapshot.docs[snapshot.docs.length - 1];
            hasMore = snapshot.docs.length === 20;

        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            loading = false;
        }
    }

    // Handle infinite scroll
    function handleScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && hasMore && !loading) {
            loadFeed();
        }
    }

    // Switch tabs
    function switchTab(tab: 'hot' | 'recent') {
        currentTab = tab;
        lastDoc = null;
        hasMore = true;
        loadFeed(true);
    }

    onMount(() => {
        if (!$user?.uid) {
            goto('/');
            return;
        }

        loadFeed(true);
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    $: if (currentTab && $user) {
        lastDoc = null;
        hasMore = true;
        loadFeed(true);
    }
</script>

<svelte:head>
    <title>Feed - CloutDumpster</title>
</svelte:head>

<Header />

<!-- Minimal Feed -->
<main class="pt-20 min-h-screen bg-black">
    <div class="max-w-2xl mx-auto px-4 py-8">
        <!-- Feed Header -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-4">The Feed</h1>
            
            <!-- Tab Navigation -->
            <div class="flex bg-card rounded-2xl p-1 mb-6">
                <button 
                    class="flex-1 py-3 px-4 rounded-xl font-bold transition-all {currentTab === 'hot' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('hot')}
                >
                    🔥 Hot
                </button>
                <button 
                    class="flex-1 py-3 px-4 rounded-xl font-bold transition-all {currentTab === 'recent' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('recent')}
                >
                    ⏰ Recent
                </button>
            </div>
        </div>

        <!-- Upload Section -->
        <div class="card mb-8">
            <h2 class="text-xl font-bold text-white mb-4">Share Something</h2>
            
            {#if previewUrl}
                <div class="mb-4 rounded-xl overflow-hidden">
                    {#if uploadFile?.type.startsWith('video/')}
                        <video src={previewUrl} controls class="w-full max-h-64 object-cover" muted></video>
                    {:else}
                        <img src={previewUrl} alt="Preview" class="w-full max-h-64 object-cover" />
                    {/if}
                </div>
            {/if}
            
            <div class="space-y-4">
                <textarea 
                    class="w-full"
                    placeholder="What's the story?"
                    rows="3"
                    bind:value={caption}
                    maxlength="280"
                ></textarea>
                
                <input 
                    id="file-input"
                    type="file" 
                    class="w-full" 
                    accept="image/*,video/*"
                    on:change={handleFileSelect}
                />
                
                <button 
                    class="btn-primary w-full flex items-center justify-center space-x-2" 
                    on:click={uploadToFeed} 
                    disabled={uploading || !uploadFile}
                >
                    {#if uploading}
                        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {:else}
                        <span>📸</span>
                    {/if}
                    <span>{uploading ? 'Posting...' : 'Post'}</span>
                </button>
            </div>
        </div>

        <!-- Feed Posts -->
        <div class="space-y-6">
            {#each feedPosts as post}
                <div class="card">
                    <!-- Post Header -->
                    <div class="flex items-center space-x-3 mb-4">
                        <a href="/profile/{post.userId}" class="flex items-center space-x-3 flex-1">
                            <div class="w-12 h-12 rounded-xl bg-accent p-0.5">
                                <div class="w-full h-full rounded-xl bg-black flex items-center justify-center overflow-hidden">
                                    {#if post.userPhotoURL}
                                        <img src={post.userPhotoURL} alt={post.userName} class="w-full h-full object-cover" />
                                    {:else}
                                        <span class="text-white font-bold">{post.userName?.charAt(0).toUpperCase()}</span>
                                    {/if}
                                </div>
                            </div>
                            <div>
                                <p class="text-white font-bold">@{post.userName}</p>
                                <p class="text-gray-400 text-sm">
                                    {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                </p>
                            </div>
                        </a>
                        
                        {#if post.heatScore && post.heatScore > 25}
                            <div class="bg-accent text-black px-3 py-1 rounded-full text-sm font-bold">
                                🔥 {post.heatScore}
                            </div>
                        {/if}
                    </div>
                    
                    <!-- Post Content -->
                    <div class="mb-4">
                        {#if post.postType === 'video' && post.videoURL}
                            <video 
                                src={post.videoURL} 
                                controls 
                                muted
                                class="w-full aspect-video object-cover rounded-xl"
                                preload="metadata"
                            ></video>
                        {:else if post.imageURL}
                            <img src={post.imageURL} alt="Post" class="w-full aspect-square object-cover rounded-xl" />
                        {/if}
                    </div>
                    
                    {#if post.caption}
                        <p class="text-gray-300">{post.caption}</p>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- Loading -->
        {#if loading}
            <div class="flex justify-center py-8">
                <div class="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
            </div>
        {/if}

        <!-- End of feed -->
        {#if !hasMore && feedPosts.length > 0}
            <div class="text-center py-8">
                <p class="text-gray-400">You've reached the bottom</p>
            </div>
        {/if}

        <!-- Empty state -->
        {#if !loading && feedPosts.length === 0}
            <div class="text-center py-16">
                <div class="text-6xl mb-4">📸</div>
                <h3 class="text-white text-xl font-bold mb-2">Nothing here yet</h3>
                <p class="text-gray-400">Be the first to post!</p>
            </div>
        {/if}
    </div>
</main>
