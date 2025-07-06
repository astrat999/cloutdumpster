<script lang="ts">
    import { db } from '$lib/firebase';
    import { user, userProfile } from '$lib/stores';
    import { collection, addDoc, doc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Header from '$lib/components/Header.svelte';

    let name = '';
    let tag = '';
    let description = '';
    let isLoading = false;
    let error = '';
    let success = false;

    const CREATION_FEE = 1000; // CloutCoin™ required to create a Syndicate

    onMount(() => {
        if (!$user) {
            goto('/');
        }
    });

    // Validate tag format (3-4 uppercase letters)
    function validateTag(value: string): boolean {
        return /^[A-Z]{3,4}$/.test(value);
    }

    // Check if syndicate name or tag already exists
    async function checkUniqueness(): Promise<boolean> {
        try {
            const nameQuery = query(collection(db, 'syndicates'), where('name', '==', name));
            const tagQuery = query(collection(db, 'syndicates'), where('tag', '==', tag.toUpperCase()));
            
            const [nameSnapshot, tagSnapshot] = await Promise.all([
                getDocs(nameQuery),
                getDocs(tagQuery)
            ]);

            if (!nameSnapshot.empty) {
                error = 'Syndicate name already taken. Choose something more original.';
                return false;
            }

            if (!tagSnapshot.empty) {
                error = 'Tag already claimed. Your originality is lacking.';
                return false;
            }

            return true;
        } catch (e) {
            error = 'Failed to verify uniqueness. The server is judging you.';
            return false;
        }
    }

    async function createSyndicate() {
        if (!$user || !$userProfile) {
            error = 'You must be logged in to create a Syndicate.';
            return;
        }

        // Validation
        if (!name.trim() || !tag.trim() || !description.trim()) {
            error = 'All fields are required. Attention to detail matters.';
            return;
        }

        if (name.length < 3 || name.length > 50) {
            error = 'Syndicate name must be 3-50 characters long.';
            return;
        }

        if (!validateTag(tag)) {
            error = 'Tag must be 3-4 uppercase letters only (e.g., CD, CLOUT).';
            return;
        }

        if (description.length < 10 || description.length > 200) {
            error = 'Description must be 10-200 characters long.';
            return;
        }

        // Check if user has enough CloutCoin™
        if (($userProfile.cloutCoin || 0) < CREATION_FEE) {
            error = `Insufficient funds. You need ${CREATION_FEE} CloutCoin™ to create a Syndicate.`;
            return;
        }

        isLoading = true;
        error = '';

        try {
            // Check uniqueness
            if (!(await checkUniqueness())) {
                isLoading = false;
                return;
            }

            // Create the Syndicate
            const syndicateData = {
                name: name.trim(),
                tag: tag.toUpperCase(),
                leaderId: $user.uid,
                memberIds: [$user.uid], // Leader is the first member
                treasury: 0,
                description: description.trim(),
                createdAt: serverTimestamp()
            };

            const syndicateDoc = await addDoc(collection(db, 'syndicates'), syndicateData);

            // Deduct the creation fee from user's balance
            const userRef = doc(db, 'users', $user.uid);
            await updateDoc(userRef, {
                cloutCoin: ($userProfile.cloutCoin || 0) - CREATION_FEE
            });

            // Update local store
            $userProfile.cloutCoin = ($userProfile.cloutCoin || 0) - CREATION_FEE;
            userProfile.set($userProfile);

            success = true;
            
            // Redirect to the new Syndicate page after a delay
            setTimeout(() => {
                goto(`/syndicates/${syndicateDoc.id}`);
            }, 2000);

        } catch (e) {
            console.error('Syndicate creation failed:', e);
            error = 'Creation failed. The server rejected your power grab.';
        } finally {
            isLoading = false;
        }
    }

    // Auto-format tag as user types
    $: if (tag) {
        tag = tag.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    }
</script>

<svelte:head>
    <title>Create Syndicate - CloutDumpster</title>
</svelte:head>

<Header />

<main class="pt-20 min-h-screen bg-velvet font-body">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="font-display text-6xl font-bold text-white mb-4">Create Your Syndicate</h1>
            <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
                Ascend from individual to <span class="text-gold font-semibold">Leader</span>. 
                Build your empire, command loyalty, wield collective power.
            </p>
            
            <!-- Cost Display -->
            <div class="inline-flex items-center space-x-3 bg-royal/20 border border-royal/30 rounded-2xl px-8 py-4">
                <span class="text-3xl">👑</span>
                <div>
                    <div class="text-gray-300 text-sm">Creation Fee</div>
                    <div class="font-display text-2xl font-bold text-gold">{CREATION_FEE.toLocaleString()} CloutCoin™</div>
                </div>
            </div>

            {#if $userProfile}
                <div class="mt-4 text-center">
                    <span class="text-gray-400">Your Balance: </span>
                    <span class="font-display text-xl font-bold {($userProfile.cloutCoin || 0) >= CREATION_FEE ? 'text-gold' : 'text-red-400'}">
                        {($userProfile.cloutCoin || 0).toLocaleString()} CloutCoin™
                    </span>
                </div>
            {/if}
        </div>

        <!-- Success Message -->
        {#if success}
            <div class="mb-8 bg-green-500/20 border border-green-500/30 rounded-2xl p-8 text-center">
                <div class="text-5xl mb-4">🏛️</div>
                <h2 class="font-display text-3xl font-bold text-green-400 mb-4">Syndicate Created!</h2>
                <p class="text-green-300 text-lg">Your empire has been founded. Redirecting to your new domain...</p>
            </div>
        {:else}
            <!-- Creation Form -->
            <div class="bg-silk/30 rounded-2xl border border-royal/20 p-8">
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Form Fields -->
                    <div class="space-y-6">
                        <div>
                            <label class="block text-white font-semibold mb-2">
                                Syndicate Name
                                <span class="text-red-400">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none transition-colors"
                                placeholder="The Shadow Collective"
                                bind:value={name}
                                maxlength="50"
                                disabled={isLoading || success}
                            />
                            <div class="text-gray-400 text-xs mt-1">{name.length}/50 characters</div>
                        </div>

                        <div>
                            <label class="block text-white font-semibold mb-2">
                                Tag (3-4 Letters)
                                <span class="text-red-400">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none transition-colors font-mono text-lg"
                                placeholder="TSC"
                                bind:value={tag}
                                maxlength="4"
                                disabled={isLoading || success}
                            />
                            <div class="text-gray-400 text-xs mt-1">Will appear as [{tag || 'TAG'}] next to member names</div>
                        </div>

                        <div>
                            <label class="block text-white font-semibold mb-2">
                                Description
                                <span class="text-red-400">*</span>
                            </label>
                            <textarea 
                                class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none transition-colors resize-none"
                                placeholder="We control the narrative. We shape the meta. We are inevitable."
                                rows="4"
                                bind:value={description}
                                maxlength="200"
                                disabled={isLoading || success}
                            ></textarea>
                            <div class="text-gray-400 text-xs mt-1">{description.length}/200 characters</div>
                        </div>
                    </div>

                    <!-- Preview Card -->
                    <div class="bg-velvet/50 rounded-xl p-6 border border-royal/10">
                        <h3 class="font-display text-xl font-bold text-white mb-4">Syndicate Preview</h3>
                        
                        <div class="bg-silk/30 rounded-xl p-4 border border-royal/20">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-royal to-purple-700 rounded-lg flex items-center justify-center">
                                    <span class="text-white font-bold text-sm">{tag || '??'}</span>
                                </div>
                                <div>
                                    <h4 class="font-display text-lg font-bold text-white">
                                        {name || 'Syndicate Name'}
                                    </h4>
                                    <div class="text-gray-400 text-sm">Founded by {$userProfile?.username || 'You'}</div>
                                </div>
                            </div>
                            
                            <p class="text-gray-300 text-sm mb-4">
                                {description || 'Your syndicate description will appear here...'}
                            </p>
                            
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div class="text-gold font-bold">1</div>
                                    <div class="text-gray-400 text-xs">Members</div>
                                </div>
                                <div>
                                    <div class="text-electric font-bold">0</div>
                                    <div class="text-gray-400 text-xs">Treasury</div>
                                </div>
                                <div>
                                    <div class="text-white font-bold">{$userProfile?.cloutScore || 0}</div>
                                    <div class="text-gray-400 text-xs">Total Clout</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error Display -->
                {#if error}
                    <div class="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                        <p class="text-red-400 text-center">{error}</p>
                    </div>
                {/if}

                <!-- Submit Button -->
                <div class="mt-8 text-center">
                    <button 
                        class="bg-gradient-to-r from-royal to-purple-600 text-white font-bold py-4 px-12 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-3 mx-auto" 
                        on:click={createSyndicate}
                        disabled={isLoading || success || !$userProfile || ($userProfile.cloutCoin || 0) < CREATION_FEE}
                    >
                        {#if isLoading}
                            <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {:else}
                            <span class="text-2xl">👑</span>
                        {/if}
                        <span class="text-xl">Establish Syndicate</span>
                        <span class="text-gold font-display">-{CREATION_FEE.toLocaleString()}</span>
                    </button>
                    
                    {#if ($userProfile?.cloutCoin || 0) < CREATION_FEE}
                        <p class="text-gray-400 text-sm mt-4">
                            Insufficient funds. Visit the <a href="/store" class="text-gold hover:underline">Store</a> to acquire more CloutCoin™.
                        </p>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</main>
