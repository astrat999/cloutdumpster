<script lang="ts">
    import { db } from '$lib/firebase';
    import { collection, getDocs, query, orderBy } from 'firebase/firestore';
    import { onMount } from 'svelte';
    import type { Syndicate } from '$lib/stores';
    import Header from '$lib/components/Header.svelte';

    let syndicates: (Syndicate & { memberCount: number; leaderName?: string })[] = [];
    let loading = true;
    let sortBy: 'treasury' | 'members' | 'clout' = 'treasury';

    async function loadSyndicates() {
        loading = true;
        try {
            const syndicatesQuery = query(collection(db, 'syndicates'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(syndicatesQuery);
            
            const syndicateData = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const data = doc.data() as Omit<Syndicate, 'id'>;
                    
                    // Get leader info
                    let leaderName = 'Unknown';
                    try {
                        const usersQuery = query(collection(db, 'users'), orderBy('uid'));
                        const usersSnapshot = await getDocs(usersQuery);
                        const leaderDoc = usersSnapshot.docs.find(userDoc => userDoc.data().uid === data.leaderId);
                        if (leaderDoc) {
                            leaderName = leaderDoc.data().username || 'Unknown';
                        }
                    } catch (e) {
                        console.error('Error fetching leader name:', e);
                    }

                    // Calculate total clout score (placeholder for now)
                    let totalCloutScore = 0;
                    try {
                        const usersQuery = query(collection(db, 'users'), orderBy('uid'));
                        const usersSnapshot = await getDocs(usersQuery);
                        
                        for (const memberId of data.memberIds) {
                            const memberDoc = usersSnapshot.docs.find(userDoc => userDoc.data().uid === memberId);
                            if (memberDoc) {
                                totalCloutScore += memberDoc.data().cloutScore || 0;
                            }
                        }
                    } catch (e) {
                        console.error('Error calculating total clout:', e);
                    }

                    return {
                        id: doc.id,
                        ...data,
                        memberCount: data.memberIds.length,
                        totalCloutScore,
                        leaderName
                    } as Syndicate & { memberCount: number; leaderName: string };
                })
            );

            syndicates = syndicateData;
            sortSyndicates();
        } catch (error) {
            console.error('Error loading syndicates:', error);
        } finally {
            loading = false;
        }
    }

    function sortSyndicates() {
        syndicates = [...syndicates].sort((a, b) => {
            switch (sortBy) {
                case 'treasury':
                    return b.treasury - a.treasury;
                case 'members':
                    return b.memberCount - a.memberCount;
                case 'clout':
                    return (b.totalCloutScore || 0) - (a.totalCloutScore || 0);
                default:
                    return 0;
            }
        });
    }

    function getSyndicateRank(index: number): string {
        if (index === 0) return '👑';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    }

    onMount(loadSyndicates);

    $: if (sortBy) {
        sortSyndicates();
    }
</script>

<svelte:head>
    <title>Syndicates - CloutDumpster</title>
</svelte:head>

<Header />

<main class="pt-20 min-h-screen bg-velvet font-body">
    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="font-display text-6xl font-bold text-white mb-4">The Syndicates</h1>
            <p class="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                Where individual ambition evolves into <span class="text-gold font-semibold">collective power</span>. 
                Join an empire, or build your own.
            </p>
            
            <!-- Create Syndicate CTA -->
            <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <a 
                    href="/syndicates/create" 
                    class="bg-gradient-to-r from-royal to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-3"
                >
                    <span class="text-xl">👑</span>
                    <span>Establish Syndicate</span>
                </a>
                
                <div class="text-gray-400 text-sm">
                    <span>Creation Fee: </span>
                    <span class="text-gold font-bold">1,000 CloutCoin™</span>
                </div>
            </div>
        </div>

        <!-- Sort Controls -->
        <div class="mb-8 flex flex-wrap items-center justify-center gap-4">
            <span class="text-white font-semibold">Rank by:</span>
            
            <button 
                class="px-4 py-2 rounded-lg font-medium transition-colors {sortBy === 'treasury' ? 'bg-gold text-black' : 'bg-silk/30 text-gray-300 hover:text-white'}"
                on:click={() => sortBy = 'treasury'}
            >
                💰 Treasury
            </button>
            
            <button 
                class="px-4 py-2 rounded-lg font-medium transition-colors {sortBy === 'members' ? 'bg-electric text-black' : 'bg-silk/30 text-gray-300 hover:text-white'}"
                on:click={() => sortBy = 'members'}
            >
                👥 Members
            </button>
            
            <button 
                class="px-4 py-2 rounded-lg font-medium transition-colors {sortBy === 'clout' ? 'bg-royal text-white' : 'bg-silk/30 text-gray-300 hover:text-white'}"
                on:click={() => sortBy = 'clout'}
            >
                ⚡ Total Clout
            </button>
        </div>

        <!-- Loading State -->
        {#if loading}
            <div class="text-center py-16">
                <div class="w-12 h-12 border-4 border-royal/30 border-t-royal rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-400">Loading the power structures...</p>
            </div>
        
        <!-- Empty State -->
        {:else if syndicates.length === 0}
            <div class="text-center py-16">
                <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-royal to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-4xl">🏛️</span>
                </div>
                <h3 class="font-display text-2xl font-bold text-white mb-4">No Syndicates Yet</h3>
                <p class="text-gray-400 mb-6">Be the first to establish a power structure.</p>
                <a 
                    href="/syndicates/create" 
                    class="inline-flex items-center space-x-2 bg-gradient-to-r from-royal to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors"
                >
                    <span>👑</span>
                    <span>Create First Syndicate</span>
                </a>
            </div>
        
        <!-- Syndicates Grid -->
        {:else}
            <div class="grid gap-6">
                {#each syndicates as syndicate, index}
                    <div class="bg-silk/30 rounded-2xl border border-royal/20 p-6 hover:border-royal/40 transition-all duration-200 group">
                        <div class="flex items-start justify-between">
                            <!-- Syndicate Info -->
                            <div class="flex items-start space-x-4 flex-1">
                                <!-- Rank & Logo -->
                                <div class="flex flex-col items-center space-y-2">
                                    <div class="text-2xl">{getSyndicateRank(index)}</div>
                                    <div class="w-16 h-16 bg-gradient-to-br from-royal to-purple-700 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <span class="text-white font-bold text-lg">{syndicate.tag}</span>
                                    </div>
                                </div>
                                
                                <!-- Details -->
                                <div class="flex-1">
                                    <div class="flex items-center space-x-3 mb-2">
                                        <h3 class="font-display text-2xl font-bold text-white">{syndicate.name}</h3>
                                        <span class="text-gray-400 text-sm">[{syndicate.tag}]</span>
                                    </div>
                                    
                                    <p class="text-gray-300 mb-4">{syndicate.description}</p>
                                    
                                    <div class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                                        <span>Led by</span>
                                        <span class="text-white font-semibold">{syndicate.leaderName}</span>
                                        <span>•</span>
                                        <span>Founded {syndicate.createdAt?.toDate ? new Date(syndicate.createdAt.toDate()).toLocaleDateString() : 'Recently'}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats -->
                            <div class="grid grid-cols-3 gap-6 text-center">
                                <div>
                                    <div class="font-display text-2xl font-bold text-gold">{syndicate.treasury.toLocaleString()}</div>
                                    <div class="text-gray-400 text-sm">Treasury</div>
                                </div>
                                <div>
                                    <div class="font-display text-2xl font-bold text-electric">{syndicate.memberCount}</div>
                                    <div class="text-gray-400 text-sm">Members</div>
                                </div>
                                <div>
                                    <div class="font-display text-2xl font-bold text-white">{(syndicate.totalCloutScore || 0).toLocaleString()}</div>
                                    <div class="text-gray-400 text-sm">Total Clout</div>
                                </div>
                            </div>
                        </div>

                        <!-- View Syndicate Button -->
                        <div class="mt-6 text-right">
                            <a 
                                href="/syndicates/{syndicate.id}" 
                                class="inline-flex items-center space-x-2 bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors"
                            >
                                <span>View Syndicate</span>
                                <span>→</span>
                            </a>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</main>
