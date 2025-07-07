<script lang="ts">
    import { onMount } from 'svelte';
    import { auth, db, storage } from '$lib/firebase';
    import { user, userProfile } from '$lib/stores';
    import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, Timestamp, updateDoc, doc, startAfter } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { goto } from '$app/navigation';
    import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
    import Header from '$lib/components/Header.svelte';
    import VideoUploader from '$lib/components/VideoUploader.svelte';

    interface FeedPost {
        id: string;
        userId: string;
        imageURL?: string;
        videoURL?: string;
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
        postType: 'image' | 'video';
    }

    let feedPosts: FeedPost[] = [];
    let uploading = false;
    let uploadFile: File | null = null;
    let caption = '';
    let previewUrl = '';
    let currentTab: 'neural' | 'heat' | 'matrix' = 'neural';
    let lastDoc: any = null;
    let loading = false;
    let hasMore = true;
    let userLocation: { lat: number; lng: number } | null = null;
    let mounted = false;

    onMount(() => {
        mounted = true;
    });

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

    // Upload content to neural feed
    async function uploadToFeed() {
        if (!uploadFile || !$user?.uid || !$userProfile) {
            return;
        }

        uploading = true;
        try {
            // Determine post type
            const postType = uploadFile.type.startsWith('video/') ? 'video' : 'image';
            
            // Create a document in the feed collection first to get the ID
            const feedData: any = {
                userId: $user.uid,
                userName: $userProfile.username || 'Anonymous Neural Entity',
                userPhotoURL: $userProfile.photoURL || '',
                caption: caption.trim() || '',
                createdAt: serverTimestamp(),
                heatScore: Math.floor(Math.random() * 50) + 10, // Random initial heat
                isAnalyzed: false,
                postType: postType
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

            // Upload content to Storage
            const contentRef = ref(storage, `neural-feed/${feedDocRef.id}/${uploadFile.name}`);
            const snapshot = await uploadBytes(contentRef, uploadFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update the document with the content URL
            const updateData = postType === 'video' 
                ? { videoURL: downloadURL }
                : { imageURL: downloadURL };
            
            await updateDoc(feedDocRef, updateData);

            // Reset form
            uploadFile = null;
            caption = '';
            previewUrl = '';
            
            // Clear file input
            const fileInput = document.getElementById('neural-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Reload feed
            loadFeed(true);

        } catch (error) {
            console.error('Error uploading to neural matrix:', error);
            alert('Neural injection failed. Please retry the upload.');
        } finally {
            uploading = false;
        }
    }

    // Request neural coordinates
    async function requestLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported by this neural interface');
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

            // Save location to neural profile
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

            console.log('Neural coordinates locked:', userLocation);
        } catch (error) {
            console.error('Error acquiring neural coordinates:', error);
        }
    }

    // Load neural feed data
    async function loadFeed(reset = false) {
        if (loading) return;
        
        loading = true;
        
        try {
            let q: any;
            
            if (currentTab === 'matrix' && userLocation) {
                // Matrix tab: nearby neural activity
                q = query(
                    collection(db, 'feed'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else if (currentTab === 'heat') {
                // Heat tab: sorted by neural heat score
                q = query(
                    collection(db, 'feed'),
                    orderBy('heatScore', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else {
                // Neural tab: latest neural transmissions
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

            // Filter by neural proximity for matrix tab
            if (currentTab === 'matrix' && userLocation) {
                const filteredPosts = newPosts.filter(post => {
                    if (!post.location) return false;
                    const distance = distanceBetween(
                        [userLocation!.lat, userLocation!.lng],
                        [post.location.lat, post.location.lng]
                    );
                    return distance <= 50000; // 50km neural radius
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
            console.error('Error loading neural feed:', error);
        } finally {
            loading = false;
        }
    }

    // Handle neural scroll detection
    function handleScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && hasMore && !loading) {
            loadFeed();
        }
    }

    // Switch neural feed tabs
    function switchTab(tab: 'neural' | 'heat' | 'matrix') {
        currentTab = tab;
        lastDoc = null;
        hasMore = true;
        loadFeed(true);
    }

    // Initialize neural interface
    onMount(() => {
        // Redirect if not authenticated
        if (!$user?.uid) {
            goto('/');
            return;
        }

        // Request neural coordinates
        requestLocation();

        // Load initial neural feed
        loadFeed(true);

        // Add scroll listener for infinite neural scroll
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    // Reactive: reload feed when neural tab changes
    $: if (currentTab && $user) {
        lastDoc = null;
        hasMore = true;
        loadFeed(true);
    }
</script>

<svelte:head>
    <title>Neural Feed Matrix - CloutDumpster</title>
</svelte:head>

<Header />

<!-- Neural Feed Matrix -->
<main class="pt-20 min-h-screen bg-gradient-to-br from-void via-velvet to-void font-body">
    <!-- Animated neural grid background -->
    <div class="fixed inset-0 neural-grid opacity-20 pointer-events-none"></div>
    
    <div class="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <!-- Neural Feed Header -->
        <div class="text-center mb-12">
            <h1 class="font-display text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric via-royal to-gold mb-4">
                NEURAL FEED
            </h1>
            <p class="text-gray-400 text-lg font-mono">Matrix of consciousness and digital heat</p>
        </div>

        <!-- Neural Tab Navigation -->
        <div class="mb-8 relative">
            <div class="flex bg-black/40 backdrop-blur-lg rounded-3xl p-2 border border-white/10">
                <button 
                    class="flex-1 py-4 px-6 rounded-2xl font-black transition-all duration-300 text-sm relative overflow-hidden {currentTab === 'neural' ? 'bg-gradient-to-r from-electric to-royal text-black' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('neural')}
                >
                    <span class="relative z-10 flex items-center justify-center space-x-2">
                        <span>🧠</span>
                        <span>NEURAL</span>
                    </span>
                    {#if currentTab === 'neural'}
                        <div class="absolute inset-0 bg-gradient-to-r from-electric/20 to-royal/20 animate-pulse"></div>
                    {/if}
                </button>
                <button 
                    class="flex-1 py-4 px-6 rounded-2xl font-black transition-all duration-300 text-sm relative overflow-hidden {currentTab === 'heat' ? 'bg-gradient-to-r from-neon-pink to-gold text-black' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('heat')}
                >
                    <span class="relative z-10 flex items-center justify-center space-x-2">
                        <span>🔥</span>
                        <span>HEAT</span>
                    </span>
                    {#if currentTab === 'heat'}
                        <div class="absolute inset-0 bg-gradient-to-r from-neon-pink/20 to-gold/20 animate-pulse"></div>
                    {/if}
                </button>
                <button 
                    class="flex-1 py-4 px-6 rounded-2xl font-black transition-all duration-300 text-sm relative overflow-hidden {currentTab === 'matrix' ? 'bg-gradient-to-r from-cyber-green to-electric text-black' : 'text-gray-400 hover:text-white'}"
                    on:click={() => switchTab('matrix')}
                >
                    <span class="relative z-10 flex items-center justify-center space-x-2">
                        <span>📡</span>
                        <span>MATRIX</span>
                    </span>
                    {#if currentTab === 'matrix'}
                        <div class="absolute inset-0 bg-gradient-to-r from-cyber-green/20 to-electric/20 animate-pulse"></div>
                    {/if}
                </button>
            </div>
        </div>

        <!-- Neural Upload Terminal -->
        <div class="mb-12 rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 p-8 relative overflow-hidden">
            <!-- Matrix data streams -->
            <div class="absolute inset-0 opacity-5">
                <div class="data-flow absolute top-0 h-full w-1 bg-electric"></div>
                <div class="data-flow absolute top-0 h-full w-1 bg-royal" style="animation-delay: 1.5s;"></div>
                <div class="data-flow absolute top-0 h-full w-1 bg-gold" style="animation-delay: 3s;"></div>
            </div>
            
            <div class="relative z-10">
                <h2 class="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electric to-royal mb-6 flex items-center">
                    <span class="text-2xl mr-3">🚀</span>
                    Neural Content Injection
                </h2>
                
                <!-- Content Preview -->
                {#if previewUrl}
                    <div class="mb-6 rounded-2xl overflow-hidden border border-electric/20">
                        {#if uploadFile?.type.startsWith('video/')}
                            <video src={previewUrl} controls class="w-full max-h-80 object-cover bg-black" muted></video>
                        {:else}
                            <img src={previewUrl} alt="Preview" class="w-full max-h-80 object-cover" />
                        {/if}
                    </div>
                {/if}
                
                <div class="space-y-6">
                    <!-- Caption Input -->
                    <div class="relative">
                        <textarea 
                            class="w-full bg-void/80 border border-electric/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:border-electric focus:outline-none resize-none font-mono text-sm backdrop-blur-sm" 
                            placeholder="// Inject your neural transmission..."
                            rows="3"
                            bind:value={caption}
                            maxlength="280"
                        ></textarea>
                        <div class="absolute bottom-3 right-3 text-xs text-gray-500 font-mono">
                            {caption.length}/280
                        </div>
                    </div>
                    
                    <!-- File Input -->
                    <input 
                        id="neural-input"
                        type="file" 
                        class="w-full bg-void/80 border border-royal/20 rounded-2xl px-6 py-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-royal file:text-white hover:file:bg-purple-600 transition-colors backdrop-blur-sm" 
                        accept="image/*,video/*"
                        on:change={handleFileSelect}
                    />
                    
                    <!-- Upload Button -->
                    <button 
                        class="group relative w-full bg-gradient-to-r from-electric to-royal text-black font-black py-4 rounded-2xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50" 
                        on:click={uploadToFeed} 
                        disabled={uploading || !uploadFile}
                    >
                        <span class="relative z-10 flex items-center justify-center space-x-3">
                            {#if uploading}
                                <div class="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            {:else}
                                <span>🚀</span>
                            {/if}
                            <span>{uploading ? 'INJECTING INTO MATRIX...' : 'INJECT NEURAL CONTENT'}</span>
                        </span>
                        <div class="absolute inset-0 bg-gradient-to-r from-royal to-electric opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>
            </div>
        </div>

        <!-- Neural Feed Stream -->
        <div class="space-y-8">
            {#each feedPosts as post, index}
                <div class="group relative rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 overflow-hidden hover:border-electric/30 transition-all duration-300">
                    <!-- Neural Post Header -->
                    <div class="p-6 flex items-center justify-between">
                        <a href="/profile/{post.userId}" class="flex items-center space-x-4 flex-1 group-hover:scale-105 transition-transform">
                            <div class="relative">
                                <div class="w-12 h-12 rounded-2xl bg-gradient-to-r from-electric to-royal p-0.5">
                                    <div class="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                                        {#if post.userPhotoURL}
                                            <img src={post.userPhotoURL} alt={post.userName} class="w-full h-full object-cover" />
                                        {:else}
                                            <span class="text-white font-black text-sm">{post.userName?.charAt(0).toUpperCase()}</span>
                                        {/if}
                                    </div>
                                </div>
                                <!-- Neural activity indicator -->
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyber-green border-2 border-black animate-pulse"></div>
                            </div>
                            <div class="flex-1">
                                <p class="text-white font-bold text-lg">{post.userName}</p>
                                <p class="text-gray-400 text-sm font-mono">
                                    {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'RECENT'}
                                </p>
                            </div>
                        </a>
                        
                        <!-- Heat Score Display -->
                        {#if post.heatScore && post.heatScore > 20}
                            <div class="flex items-center space-x-2 bg-gradient-to-r from-neon-pink to-gold px-4 py-2 rounded-xl">
                                <span class="text-black text-sm font-black">🔥 HEAT: {post.heatScore}</span>
                            </div>
                        {/if}
                    </div>
                    
                    <!-- Neural Content Display -->
                    <div class="relative">
                        {#if post.postType === 'video' && post.videoURL}
                            <video 
                                src={post.videoURL} 
                                controls 
                                muted
                                class="w-full aspect-video object-cover bg-black"
                                preload="metadata"
                            ></video>
                        {:else if post.imageURL}
                            <img src={post.imageURL} alt="Neural transmission" class="w-full aspect-square object-cover" />
                        {/if}
                        
                        <!-- Neural overlay effect -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    
                    <!-- Neural Caption -->
                    {#if post.caption}
                        <div class="p-6">
                            <p class="text-gray-200 font-mono text-sm leading-relaxed">"{post.caption}"</p>
                        </div>
                    {/if}

                    <!-- Neural metrics -->
                    <div class="px-6 pb-6 flex items-center justify-between text-xs text-gray-500 font-mono">
                        <span>Neural Transmission #{post.id.slice(0, 8)}</span>
                        <span>Heat Index: {post.heatScore || 0}</span>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Neural Loading State -->
        {#if loading}
            <div class="flex justify-center py-12">
                <div class="relative">
                    <div class="w-12 h-12 border-2 border-electric/20 border-t-electric rounded-full animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-6 h-6 border-2 border-royal/20 border-t-royal rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- End of Neural Stream -->
        {#if !hasMore && feedPosts.length > 0}
            <div class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-electric/10 border border-electric/20 flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl">🧠</span>
                </div>
                <p class="text-gray-400 font-mono">End of neural stream detected</p>
            </div>
        {/if}

        <!-- Neural Empty State -->
        {#if !loading && feedPosts.length === 0}
            <div class="text-center py-20">
                <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-electric to-royal rounded-full flex items-center justify-center">
                    <span class="text-4xl">🚀</span>
                </div>
                <h3 class="font-display text-2xl font-bold text-white mb-3">Neural Matrix Inactive</h3>
                <p class="text-gray-400 font-mono">No neural transmissions detected. Initialize the feed.</p>
            </div>
        {/if}
    </div>
</main>
