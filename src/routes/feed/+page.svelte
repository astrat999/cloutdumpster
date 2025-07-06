<script lang="ts">
    import { onMount } from 'svelte';
    import { auth, db, storage } from '$lib/firebase';
    import { user, userProfile } from '$lib/stores';
    import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, Timestamp, updateDoc, doc, startAfter } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { goto } from '$app/navigation';
    import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
    import Header from '$lib/components/Header.svelte';

    interface FeedPost {
        id: string;
        userId: string;
        imageURL: string;
        caption?: string;
        createdAt: Timestamp;
        heatScore?: number;
        isAnalyzed?: boolean;
        userName?: string;
        userPhotoURL?: string;
        location?: {
            lat: number;
            lng: number;
            geohash: string;
        };
    }

    let feedPosts: FeedPost[] = [];
    let uploading = false;
    let uploadFile: File | null = null;
    let caption = '';
    let previewUrl = '';
    let currentTab: 'hot' | 'recent' | 'nearby' = 'hot';
    let lastDoc: any = null;
    let loading = false;
    let hasMore = true;
    let userLocation: { lat: number; lng: number } | null = null;

    // Handle file selection
    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file && file.type.startsWith('image/')) {
            uploadFile = file;
            previewUrl = URL.createObjectURL(file);
        }
    }

    // Upload image to feed
    async function uploadToFeed() {
        if (!uploadFile || !$user?.uid || !$userProfile) {
            return;
        }

        uploading = true;
        try {
            // Create a document in the feed collection first to get the ID
            const feedData: any = {
                userId: $user.uid,
                userName: $userProfile.username || 'Anonymous',
                userPhotoURL: $userProfile.photoURL || '',
                caption: caption.trim() || '',
                createdAt: serverTimestamp(),
                heatScore: 0,
                isAnalyzed: false
            };

            // Add user location if available
            if (userLocation) {
                feedData.location = {
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    geohash: geohashForLocation([userLocation.lat, userLocation.lng])
                };
            }

            const feedDocRef = await addDoc(collection(db, 'feed'), feedData);

            // Upload image to Storage using the document ID as the folder name
            const imageRef = ref(storage, `feed-images/${feedDocRef.id}/${uploadFile.name}`);
            const snapshot = await uploadBytes(imageRef, uploadFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update the document with the image URL
            await updateDoc(feedDocRef, {
                imageURL: downloadURL
            });

            // Reset form
            uploadFile = null;
            caption = '';
            previewUrl = '';
            
            // Clear file input
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Reload feed
            loadFeed(true);

        } catch (error) {
            console.error('Error uploading to feed:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            uploading = false;
        }
    }

    // Request location permission
    async function requestLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            return;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });

            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Save location to user profile
            if ($user?.uid) {
                const userRef = doc(db, 'users', $user.uid);
                await updateDoc(userRef, {
                    location: {
                        lat: userLocation.lat,
                        lng: userLocation.lng,
                        geohash: geohashForLocation([userLocation.lat, userLocation.lng])
                    }
                });
            }

            console.log('Location saved:', userLocation);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    }

    // Load feed posts with infinite scroll support
    async function loadFeed(reset = false) {
        if (loading) return;
        
        loading = true;
        
        try {
            let q: any;
            
            if (currentTab === 'nearby' && userLocation) {
                // For nearby posts, we need a more complex query
                // This is a simplified version - in production you'd want proper geoqueries
                q = query(
                    collection(db, 'feed'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else if (currentTab === 'hot') {
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

            // Add cursor for pagination
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

            // Filter by distance for nearby tab
            if (currentTab === 'nearby' && userLocation) {
                const filteredPosts = newPosts.filter(post => {
                    if (!post.location) return false;
                    const distance = distanceBetween(
                        [userLocation!.lat, userLocation!.lng],
                        [post.location.lat, post.location.lng]
                    );
                    return distance <= 50000; // 50km radius
                });
                
                if (reset) {
                    feedPosts = filteredPosts;
                } else {
                    feedPosts = [...feedPosts, ...filteredPosts];
                }
            } else {
                if (reset) {
                    feedPosts = newPosts;
                } else {
                    feedPosts = [...feedPosts, ...newPosts];
                }
            }

            lastDoc = snapshot.docs[snapshot.docs.length - 1];
            hasMore = snapshot.docs.length === 20;

        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            loading = false;
        }
    }

    // Handle scroll for infinite loading
    function handleScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && hasMore && !loading) {
            loadFeed();
        }
    }

    // Switch tabs
    function switchTab(tab: 'hot' | 'recent' | 'nearby') {
        currentTab = tab;
        lastDoc = null;
        hasMore = true;
        loadFeed(true);
    }

    // Load feed posts and request location on mount
    onMount(() => {
        // Redirect if not authenticated
        if (!$user?.uid) {
            goto('/');
            return;
        }

        // Request location permission
        requestLocation();

        // Load initial feed
        loadFeed(true);

        // Add scroll listener
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    // Reactive: reload feed when tab changes
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

<main class="pt-20 min-h-screen bg-velvet font-body">
    <div class="max-w-2xl mx-auto px-4 py-8">
        <!-- Feed Header with Tabs -->
        <div class="mb-8">
            <h1 class="font-display text-5xl font-bold text-white text-center mb-6">The Feed</h1>
            
            <!-- Tab Navigation -->
            <div class="flex bg-silk/30 rounded-2xl p-2 border border-royal/20">
                <button 
                    class="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 {currentTab === 'hot' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('hot')}
                >
                    🔥 Hot
                </button>
                <button 
                    class="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 {currentTab === 'recent' ? 'bg-gradient-to-r from-royal to-purple-600 text-white' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('recent')}
                >
                    ⏰ Recent
                </button>
                <button 
                    class="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 {currentTab === 'nearby' ? 'bg-gradient-to-r from-electric to-blue-600 text-white' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('nearby')}
                >
                    📍 Nearby
                </button>
            </div>
        </div>

        <!-- Upload Card -->
        <div class="bg-silk/30 rounded-2xl p-6 border border-royal/20 mb-8">
            <h2 class="font-display text-xl font-bold text-white mb-4">Share Your Truth</h2>
            
            <!-- File Preview -->
            {#if previewUrl}
                <div class="mb-4">
                    <img src={previewUrl} alt="Preview" class="w-full max-h-64 object-cover rounded-xl" />
                </div>
            {/if}
            
            <div class="space-y-4">
                <textarea 
                    class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none resize-none" 
                    placeholder="Caption your chaos..."
                    rows="3"
                    bind:value={caption}
                ></textarea>
                
                <input 
                    id="file-input"
                    type="file" 
                    class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-royal file:text-white hover:file:bg-purple-600 transition-colors" 
                    accept="image/*"
                    on:change={handleFileSelect}
                />
                
                <button 
                    class="w-full bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2" 
                    on:click={uploadToFeed} 
                    disabled={uploading || !uploadFile}
                >
                    {#if uploading}
                        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {/if}
                    <span>Post to Feed</span>
                </button>
            </div>
        </div>

        <!-- Feed Posts -->
        <div class="space-y-6">
            {#each feedPosts as post}
                <div class="bg-silk/30 rounded-2xl border border-royal/20 overflow-hidden">
                    <!-- Post Header -->
                    <div class="p-4 flex items-center space-x-3">
                        <a href="/profile/{post.userId}" class="flex items-center space-x-3 flex-1">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-royal to-purple-600 flex items-center justify-center overflow-hidden">
                                {#if post.userPhotoURL}
                                    <img src={post.userPhotoURL} alt={post.userName} class="w-full h-full object-cover" />
                                {:else}
                                    <span class="text-white font-semibold">{post.userName?.charAt(0).toUpperCase()}</span>
                                {/if}
                            </div>
                            <div>
                                <p class="text-white font-semibold">{post.userName}</p>
                                <p class="text-gray-400 text-sm">
                                    {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                                </p>
                            </div>
                        </a>
                        
                        {#if post.heatScore && post.heatScore > 5}
                            <div class="flex items-center space-x-1 bg-gradient-to-r from-red-600 to-orange-600 px-3 py-1 rounded-full">
                                <span class="text-white text-xs font-bold">🔥 HOT</span>
                            </div>
                        {/if}
                    </div>
                    
                    <!-- Post Image -->
                    <img src={post.imageURL} alt="Feed post" class="w-full aspect-square object-cover" />
                    
                    <!-- Post Caption -->
                    {#if post.caption}
                        <div class="p-4">
                            <p class="text-gray-300">{post.caption}</p>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- Loading Indicator -->
        {#if loading}
            <div class="flex justify-center py-8">
                <div class="w-8 h-8 border-2 border-royal/30 border-t-royal rounded-full animate-spin"></div>
            </div>
        {/if}

        <!-- End of Feed Message -->
        {#if !hasMore && feedPosts.length > 0}
            <div class="text-center py-8">
                <p class="text-gray-400">You've reached the bottom of the dumpster.</p>
            </div>
        {/if}

        <!-- Empty State -->
        {#if !loading && feedPosts.length === 0}
            <div class="text-center py-16">
                <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-royal to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-2xl">📸</span>
                </div>
                <h3 class="font-display text-xl font-bold text-white mb-2">Nothing here yet</h3>
                <p class="text-gray-400">Be the first to post something!</p>
            </div>
        {/if}
    </div>
</main>
