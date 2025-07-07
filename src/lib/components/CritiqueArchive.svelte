<script lang="ts">
    import { onMount } from 'svelte';
    import { db } from '$lib/firebase';
    import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
    import { createEventDispatcher } from 'svelte';

    export let userId: string;
    export let isOpen = false;

    const dispatch = createEventDispatcher();

    interface Critique {
        id: string;
        criticText: string;
        submittedBy: string;
        submitterUsername: string;
        createdAt: Timestamp;
        isAnonymous: boolean;
        cost: number;
    }

    let critiques: Critique[] = [];
    let loading = true;
    let mounted = false;

    onMount(() => {
        mounted = true;
        if (isOpen) {
            loadCritiques();
        }
    });

    $: if (isOpen && mounted) {
        loadCritiques();
    }

    async function loadCritiques() {
        loading = true;
        try {
            const q = query(
                collection(db, 'whispers'),
                where('targetUserId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            critiques = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as any
            })) as Critique[];

        } catch (error) {
            console.error('Error loading critiques:', error);
        } finally {
            loading = false;
        }
    }

    function closeModal() {
        isOpen = false;
        dispatch('close');
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && isOpen) {
            closeModal();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- Neural Critique Archive Modal -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div class="rounded-3xl bg-black/90 backdrop-blur-lg border border-white/10 overflow-hidden">
                <!-- Archive Header -->
                <div class="p-8 border-b border-white/10 relative overflow-hidden">
                    <!-- Animated background -->
                    <div class="absolute inset-0 opacity-5">
                        <div class="data-flow absolute top-0 h-full w-1 bg-neon-pink"></div>
                        <div class="data-flow absolute top-0 h-full w-1 bg-electric" style="animation-delay: 1s;"></div>
                        <div class="data-flow absolute top-0 h-full w-1 bg-gold" style="animation-delay: 2s;"></div>
                    </div>
                    
                    <div class="relative z-10">
                        <h2 class="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-electric to-gold mb-2">
                            Neural Critique Archive
                        </h2>
                        <p class="text-gray-400 font-mono">
                            {critiques.length} {critiques.length === 1 ? 'critique' : 'critiques'} on file
                        </p>
                    </div>

                    <!-- Close button -->
                    <button 
                        on:click={closeModal}
                        class="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                    >
                        ✕
                    </button>
                </div>

                <!-- Critiques Content -->
                <div class="max-h-[60vh] overflow-y-auto p-8">
                    {#if loading}
                        <!-- Loading State -->
                        <div class="flex items-center justify-center py-16">
                            <div class="relative">
                                <div class="w-12 h-12 border-2 border-electric/20 border-t-electric rounded-full animate-spin"></div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="w-6 h-6 border-2 border-royal/20 border-t-royal rounded-full animate-spin"></div>
                                </div>
                            </div>
                        </div>
                    {:else if critiques.length === 0}
                        <!-- Empty State -->
                        <div class="text-center py-16">
                            <div class="w-24 h-24 rounded-full bg-electric/10 border border-electric/20 flex items-center justify-center mx-auto mb-6">
                                <span class="text-4xl opacity-50">🛡️</span>
                            </div>
                            <h3 class="font-display text-2xl font-bold text-white mb-3">Archive Empty</h3>
                            <p class="text-gray-400 font-mono">No neural critiques detected. Your defenses hold strong.</p>
                        </div>
                    {:else}
                        <!-- Critiques List -->
                        <div class="space-y-6">
                            {#each critiques as critique, index}
                                <div class="group relative rounded-2xl bg-void/50 border border-white/10 p-6 hover:border-neon-pink/30 transition-all backdrop-blur-sm">
                                    <!-- Critique header -->
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="flex items-center space-x-3">
                                            <!-- Anonymous vs Known indicator -->
                                            <div class="w-8 h-8 rounded-full bg-neon-pink/20 border border-neon-pink/30 flex items-center justify-center">
                                                <span class="text-neon-pink text-sm">
                                                    {critique.isAnonymous ? '👤' : '🎯'}
                                                </span>
                                            </div>
                                            <div>
                                                <p class="text-white font-semibold text-sm">
                                                    {critique.isAnonymous ? 'Anonymous Neural Source' : `@${critique.submitterUsername}`}
                                                </p>
                                                <p class="text-gray-500 text-xs font-mono">
                                                    {critique.createdAt?.toDate ? new Date(critique.createdAt.toDate()).toLocaleString() : 'Recent'}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Cost indicator -->
                                        <div class="flex items-center space-x-2 bg-gold/10 border border-gold/20 rounded-lg px-3 py-1">
                                            <span class="text-gold text-xs">💰</span>
                                            <span class="text-gold text-xs font-mono">{critique.cost}</span>
                                        </div>
                                    </div>

                                    <!-- Critique content -->
                                    <div class="relative">
                                        <blockquote class="text-gray-200 font-mono text-sm leading-relaxed italic">
                                            "{critique.criticText}"
                                        </blockquote>
                                    </div>

                                    <!-- Neural activity indicator -->
                                    <div class="absolute top-2 right-2 w-2 h-2 rounded-full bg-neon-pink animate-pulse opacity-50"></div>

                                    <!-- Hover effect -->
                                    <div class="absolute inset-0 bg-gradient-to-r from-neon-pink/5 to-electric/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>
                            {/each}
                        </div>

                        <!-- Archive Statistics -->
                        <div class="mt-8 p-6 rounded-2xl bg-gradient-to-r from-electric/10 to-royal/10 border border-electric/20">
                            <h4 class="font-display text-lg font-bold text-white mb-3">Neural Analysis</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <p class="text-2xl font-black text-electric">{critiques.length}</p>
                                    <p class="text-electric/70 text-sm font-mono">Total Strikes</p>
                                </div>
                                <div>
                                    <p class="text-2xl font-black text-royal">{critiques.filter(c => !c.isAnonymous).length}</p>
                                    <p class="text-royal/70 text-sm font-mono">Direct Hits</p>
                                </div>
                                <div>
                                    <p class="text-2xl font-black text-gold">{critiques.reduce((sum, c) => sum + (c.cost || 0), 0)}</p>
                                    <p class="text-gold/70 text-sm font-mono">Coin Spent</p>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
