<script lang="ts">
    import type { PageData } from './$types';
    import { db } from '$lib/firebase';
    import { user, userProfile } from '$lib/stores';
    import { doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
    import { onMount } from 'svelte';
    import Header from '$lib/components/Header.svelte';

    export let data: PageData;

    $: syndicate = data.syndicate;
    $: members = data.members;
    $: endorsements = data.endorsements;
    $: isMember = $user && syndicate.memberIds?.includes($user.uid);
    $: isLeader = $user && syndicate.leaderId === $user.uid;

    let contributionAmount = '';
    let isContributing = false;
    let contributionError = '';
    let contributionSuccess = '';
    let endorsingUserId = '';
    let isEndorsing = false;

    // Calculate total clout score
    $: totalCloutScore = members.reduce((sum: number, member: any) => sum + (member.cloutScore || 0), 0);

    // Check if user has active endorsement
    function hasActiveEndorsement(userId: string): boolean {
        const now = new Date();
        return endorsements.some((endorsement: any) => 
            endorsement.userId === userId && 
            endorsement.expiresAt && 
            new Date(endorsement.expiresAt.toDate()) > now
        );
    }

    // Get active endorsement boost for user
    function getEndorsementBoost(userId: string): number {
        const now = new Date();
        const activeEndorsement = endorsements.find((endorsement: any) => 
            endorsement.userId === userId && 
            endorsement.expiresAt && 
            new Date(endorsement.expiresAt.toDate()) > now
        );
        return activeEndorsement?.boostAmount || 0;
    }

    async function contributeToTreasury() {
        if (!$user || !$userProfile || !isMember) return;

        const amount = parseInt(contributionAmount);
        if (isNaN(amount) || amount <= 0) {
            contributionError = 'Enter a valid amount greater than 0.';
            return;
        }

        if (amount > ($userProfile.cloutCoin || 0)) {
            contributionError = 'Insufficient CloutCoin™. Your poverty is showing.';
            return;
        }

        isContributing = true;
        contributionError = '';
        contributionSuccess = '';

        try {
            // Update user's balance
            const userRef = doc(db, 'users', $user.uid);
            await updateDoc(userRef, {
                cloutCoin: ($userProfile.cloutCoin || 0) - amount
            });

            // Update syndicate treasury
            const syndicateRef = doc(db, 'syndicates', syndicate.id);
            await updateDoc(syndicateRef, {
                treasury: syndicate.treasury + amount
            });

            // Update local stores
            $userProfile.cloutCoin = ($userProfile.cloutCoin || 0) - amount;
            userProfile.set($userProfile);
            syndicate.treasury += amount;

            contributionSuccess = `Contributed ${amount.toLocaleString()} CloutCoin™ to the treasury.`;
            contributionAmount = '';

            // Refresh page data
            setTimeout(() => {
                location.reload();
            }, 1500);

        } catch (error) {
            console.error('Contribution failed:', error);
            contributionError = 'Contribution failed. The treasury rejected your offering.';
        } finally {
            isContributing = false;
        }
    }

    async function endorseMember(userId: string, username: string) {
        if (!$user || !isMember || !isLeader) return;

        const ENDORSEMENT_COST = 50;
        if (syndicate.treasury < ENDORSEMENT_COST) {
            alert(`Insufficient treasury funds. Need ${ENDORSEMENT_COST} CloutCoin™ to endorse.`);
            return;
        }

        if (hasActiveEndorsement(userId)) {
            alert('This member already has an active endorsement.');
            return;
        }

        endorsingUserId = userId;
        isEndorsing = true;

        try {
            // Deduct from syndicate treasury
            const syndicateRef = doc(db, 'syndicates', syndicate.id);
            await updateDoc(syndicateRef, {
                treasury: syndicate.treasury - ENDORSEMENT_COST
            });

            // Create endorsement record
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

            await addDoc(collection(db, 'endorsements'), {
                userId: userId,
                syndicateId: syndicate.id,
                syndicateTag: syndicate.tag,
                boostAmount: 50,
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt)
            });

            // Update local syndicate treasury
            syndicate.treasury -= ENDORSEMENT_COST;

            alert(`Endorsed ${username} with +50 Clout boost for 24 hours!`);

            // Refresh page data
            setTimeout(() => {
                location.reload();
            }, 1000);

        } catch (error) {
            console.error('Endorsement failed:', error);
            alert('Endorsement failed. The member remains unblessed.');
        } finally {
            endorsingUserId = '';
            isEndorsing = false;
        }
    }
</script>

<svelte:head>
    <title>{syndicate.name} - CloutDumpster</title>
</svelte:head>

<Header />

<main class="pt-20 min-h-screen bg-velvet font-body">
    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- Syndicate Header -->
        <div class="bg-silk/30 rounded-2xl border border-royal/20 p-8 mb-8">
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-start space-x-6">
                    <!-- Syndicate Logo -->
                    <div class="w-24 h-24 bg-gradient-to-br from-royal to-purple-700 rounded-2xl flex items-center justify-center">
                        <span class="text-white font-bold text-2xl">{syndicate.tag}</span>
                    </div>
                    
                    <!-- Syndicate Info -->
                    <div>
                        <h1 class="font-display text-4xl font-bold text-white mb-2">{syndicate.name}</h1>
                        <div class="flex items-center space-x-4 text-gray-400 mb-4">
                            <span>[{syndicate.tag}]</span>
                            <span>•</span>
                            <span>Founded {syndicate.createdAt?.toDate ? new Date(syndicate.createdAt.toDate()).toLocaleDateString() : 'Recently'}</span>
                        </div>
                        <p class="text-gray-300 text-lg max-w-2xl">{syndicate.description}</p>
                    </div>
                </div>

                <!-- Join/Member Status -->
                <div class="text-right">
                    {#if isMember}
                        <div class="bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-2 mb-2">
                            <span class="text-green-400 font-semibold">
                                {isLeader ? '👑 Leader' : '👤 Member'}
                            </span>
                        </div>
                    {:else}
                        <div class="bg-gray-500/20 border border-gray-500/30 rounded-xl px-4 py-2 mb-2">
                            <span class="text-gray-400">👁️ Outsider</span>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-4 gap-8 text-center">
                <div>
                    <div class="font-display text-3xl font-bold text-gold">{syndicate.treasury.toLocaleString()}</div>
                    <div class="text-gray-400">Treasury</div>
                </div>
                <div>
                    <div class="font-display text-3xl font-bold text-electric">{members.length}</div>
                    <div class="text-gray-400">Members</div>
                </div>
                <div>
                    <div class="font-display text-3xl font-bold text-white">{totalCloutScore.toLocaleString()}</div>
                    <div class="text-gray-400">Total Clout</div>
                </div>
                <div>
                    <div class="font-display text-3xl font-bold text-royal">#{Math.floor(Math.random() * 10) + 1}</div>
                    <div class="text-gray-400">Rank</div>
                </div>
            </div>
        </div>

        {#if isMember}
            <!-- Member View - Private Hub -->
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Members List -->
                <div class="lg:col-span-2 bg-silk/30 rounded-2xl border border-royal/20 p-6">
                    <h2 class="font-display text-2xl font-bold text-white mb-6">
                        Syndicate Members ({members.length})
                    </h2>
                    
                    <div class="space-y-4">
                        {#each members as member}
                            <div class="bg-velvet/50 rounded-xl p-4 flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <!-- Member Avatar/Initial -->
                                    <div class="w-12 h-12 bg-gradient-to-br from-royal to-purple-600 rounded-full flex items-center justify-center">
                                        <span class="text-white font-bold">
                                            {member.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    
                                    <!-- Member Info -->
                                    <div>
                                        <div class="flex items-center space-x-2">
                                            <span class="text-white font-semibold">{member.username}</span>
                                            {#if member.uid === syndicate.leaderId}
                                                <span class="text-gold text-sm">👑 Leader</span>
                                            {/if}
                                            {#if hasActiveEndorsement(member.uid)}
                                                <span class="bg-gold/20 text-gold px-2 py-1 rounded text-xs font-bold">
                                                    ENDORSED +{getEndorsementBoost(member.uid)}
                                                </span>
                                            {/if}
                                        </div>
                                        <div class="text-gray-400 text-sm">
                                            Clout Score: {member.cloutScore?.toLocaleString() || 0}
                                            {#if hasActiveEndorsement(member.uid)}
                                                <span class="text-gold"> (+{getEndorsementBoost(member.uid)})</span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>

                                <!-- Endorse Button (Leader Only) -->
                                {#if isLeader && member.uid !== $user?.uid && !hasActiveEndorsement(member.uid)}
                                    <button 
                                        class="bg-gradient-to-r from-gold to-yellow-600 text-black font-semibold py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                                        on:click={() => endorseMember(member.uid, member.username)}
                                        disabled={isEndorsing || endorsingUserId === member.uid}
                                    >
                                        {#if endorsingUserId === member.uid}
                                            <div class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        {:else}
                                            <span>⭐</span>
                                        {/if}
                                        <span>Endorse (-50)</span>
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Treasury & Actions -->
                <div class="space-y-6">
                    <!-- Treasury Management -->
                    <div class="bg-silk/30 rounded-2xl border border-royal/20 p-6">
                        <h3 class="font-display text-xl font-bold text-white mb-4">Treasury Management</h3>
                        
                        <div class="text-center mb-6">
                            <div class="font-display text-3xl font-bold text-gold mb-1">
                                {syndicate.treasury.toLocaleString()}
                            </div>
                            <div class="text-gray-400 text-sm">CloutCoin™ Available</div>
                        </div>

                        <!-- Contribution Form -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-white font-semibold mb-2">Contribute CloutCoin™</label>
                                <input 
                                    type="number" 
                                    class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none"
                                    placeholder="Amount"
                                    bind:value={contributionAmount}
                                    min="1"
                                    disabled={isContributing}
                                />
                                <div class="text-gray-400 text-xs mt-1">
                                    Your balance: {($userProfile?.cloutCoin || 0).toLocaleString()}
                                </div>
                            </div>

                            <button 
                                class="w-full bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                                on:click={contributeToTreasury}
                                disabled={isContributing || !contributionAmount}
                            >
                                {#if isContributing}
                                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {:else}
                                    <span>💰</span>
                                {/if}
                                <span>Contribute</span>
                            </button>

                            {#if contributionError}
                                <div class="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                                    <p class="text-red-400 text-sm">{contributionError}</p>
                                </div>
                            {/if}

                            {#if contributionSuccess}
                                <div class="p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                                    <p class="text-green-400 text-sm">{contributionSuccess}</p>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="bg-silk/30 rounded-2xl border border-royal/20 p-6">
                        <h3 class="font-display text-xl font-bold text-white mb-4">Quick Stats</h3>
                        
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-400">Your Rank in Syndicate:</span>
                                <span class="text-white font-semibold">
                                    #{members.findIndex((m: any) => m.uid === $user?.uid) + 1}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Active Endorsements:</span>
                                <span class="text-gold font-semibold">
                                    {endorsements.filter((e: any) => e.expiresAt && new Date(e.expiresAt.toDate()) > new Date()).length}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Treasury per Member:</span>
                                <span class="text-electric font-semibold">
                                    {Math.floor(syndicate.treasury / members.length).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Public View - Limited Information -->
            <div class="bg-silk/30 rounded-2xl border border-royal/20 p-8 text-center">
                <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <span class="text-4xl">🔒</span>
                </div>
                
                <h2 class="font-display text-3xl font-bold text-white mb-4">Access Restricted</h2>
                <p class="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                    This Syndicate's internal affairs are for members only. Only public information is visible to outsiders.
                </p>

                <!-- Public Member List -->
                <div class="bg-velvet/30 rounded-xl p-6 mb-8">
                    <h3 class="font-display text-xl font-bold text-white mb-4">Public Members ({members.length})</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {#each members.slice(0, 8) as member}
                            <div class="text-center">
                                <div class="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-royal to-purple-600 rounded-full flex items-center justify-center">
                                    <span class="text-white font-bold text-sm">
                                        {member.username?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div class="text-white text-sm font-semibold">{member.username}</div>
                                <div class="text-gray-400 text-xs">{member.cloutScore?.toLocaleString() || 0}</div>
                            </div>
                        {/each}
                        {#if members.length > 8}
                            <div class="text-center text-gray-400">
                                <div class="w-12 h-12 mx-auto mb-2 bg-gray-600 rounded-full flex items-center justify-center">
                                    <span class="text-gray-300">+{members.length - 8}</span>
                                </div>
                                <div class="text-xs">More...</div>
                            </div>
                        {/if}
                    </div>
                </div>

                <a 
                    href="/syndicates" 
                    class="inline-flex items-center space-x-2 bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors"
                >
                    <span>← Browse All Syndicates</span>
                </a>
            </div>
        {/if}
    </div>
</main>
