<script lang="ts">
    import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
    import { getFunctions, httpsCallable } from 'firebase/functions';
    import { loadStripe } from '@stripe/stripe-js';
    import { user, userProfile } from '$lib/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Header from '$lib/components/Header.svelte';

    // Tactical Order: "Define the product packages with their Stripe Price IDs."
    const packages = [
        { 
            name: 'The Intern', 
            amount: 100, 
            price: '$1.99', 
            priceId: 'price_1RhofqPFixwUyCR6M4TTJGL9',
            description: 'Basic starter pack for wannabes',
            gradient: 'from-gray-600 to-gray-800'
        },
        { 
            name: 'The Influencer', 
            amount: 500, 
            price: '$7.99', 
            priceId: 'price_1RhogHPFixwUyCR6H5YqPhvd',
            description: 'For those ready to buy their way up',
            gradient: 'from-royal to-purple-600',
            popular: true
        },
        { 
            name: 'The Whale', 
            amount: 1000, 
            price: '$12.99', 
            priceId: 'price_1RhogcPFixwUyCR6Jy5hGIvo',
            description: 'Maximum clout acceleration',
            gradient: 'from-gold to-yellow-600'
        }
    ];

    let isLoading = false;
    let purchaseError = '';
    let purchaseSuccess = false;

    // Check for success/cancel parameters
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            purchaseSuccess = true;
        }
        if (urlParams.get('canceled') === 'true') {
            purchaseError = 'Purchase canceled. Your wallet remains as empty as your soul.';
        }
    });

    // Tactical Order: "Create a function to initiate the checkout process."
    async function purchasePackage(priceId: string, packageName: string) {
        if (!$user) {
            goto('/');
            return;
        }

        isLoading = true;
        purchaseError = '';
        
        try {
            const functions = getFunctions();
            const createStripeCheckout = httpsCallable(functions, 'createStripeCheckout');
            
            const successUrl = `${window.location.origin}/store?success=true`;
            const cancelUrl = `${window.location.origin}/store?canceled=true`;

            const { data } = await createStripeCheckout({ priceId, successUrl, cancelUrl });
            
            const stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
            if (stripe && data) {
                await stripe.redirectToCheckout({ sessionId: (data as any).sessionId });
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            purchaseError = `Purchase failed: ${error.message || 'The server rejected your offering.'}`;
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>CloutCoin™ Store - CloutDumpster</title>
</svelte:head>

<Header />

<main class="pt-20 min-h-screen bg-velvet font-body">
    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- Store Header -->
        <div class="text-center mb-12">
            <h1 class="font-display text-6xl font-bold text-white mb-4">The CloutCoin™ Store</h1>
            <p class="text-xl text-gray-400 max-w-2xl mx-auto">
                Your paranoia must be funded. Your vanity requires investment. 
                <span class="text-gold font-semibold">Buy your way to relevance.</span>
            </p>
            
            {#if $userProfile}
                <div class="mt-6 inline-flex items-center space-x-2 bg-silk/30 rounded-full px-6 py-3 border border-gold/30">
                    <span class="text-gold text-2xl">💰</span>
                    <span class="text-white font-semibold">Current Balance:</span>
                    <span class="font-display text-2xl font-bold text-gold">{$userProfile.cloutCoin || 0}</span>
                    <span class="text-gray-400">CloutCoin™</span>
                </div>
            {/if}
        </div>

        <!-- Success Message -->
        {#if purchaseSuccess}
            <div class="mb-8 bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
                <div class="text-4xl mb-2">🎉</div>
                <h2 class="font-display text-2xl font-bold text-green-400 mb-2">Purchase Successful!</h2>
                <p class="text-green-300">Your CloutCoin™ has been added to your account. Spend it wisely, or don't.</p>
            </div>
        {/if}

        <!-- Error Message -->
        {#if purchaseError}
            <div class="mb-8 bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
                <div class="text-4xl mb-2">💸</div>
                <h2 class="font-display text-2xl font-bold text-red-400 mb-2">Purchase Failed</h2>
                <p class="text-red-300">{purchaseError}</p>
            </div>
        {/if}

        <!-- Package Grid -->
        <div class="grid md:grid-cols-3 gap-8">
            {#each packages as pkg, index}
                <div class="relative bg-silk/30 rounded-2xl border border-royal/20 overflow-hidden group hover:scale-105 transition-all duration-300">
                    <!-- Popular Badge -->
                    {#if pkg.popular}
                        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <div class="bg-gradient-to-r from-gold to-yellow-600 text-black font-bold px-4 py-1 rounded-full text-sm">
                                MOST POPULAR
                            </div>
                        </div>
                    {/if}

                    <div class="p-8 text-center">
                        <!-- Package Icon -->
                        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br {pkg.gradient} flex items-center justify-center">
                            <span class="text-3xl">
                                {#if index === 0}💼{:else if index === 1}👑{:else}🐋{/if}
                            </span>
                        </div>

                        <!-- Package Details -->
                        <h2 class="font-display text-3xl font-bold text-white mb-2">{pkg.name}</h2>
                        <p class="text-gray-400 text-sm mb-6">{pkg.description}</p>
                        
                        <!-- Coin Amount -->
                        <div class="mb-6">
                            <div class="font-display text-5xl font-bold text-gold mb-2">{pkg.amount.toLocaleString()}</div>
                            <div class="text-gray-300 text-lg">CloutCoin™</div>
                        </div>

                        <!-- Price -->
                        <div class="mb-8">
                            <div class="font-display text-3xl font-bold text-white">{pkg.price}</div>
                            <div class="text-gray-400 text-sm">One-time payment</div>
                        </div>

                        <!-- Purchase Button -->
                        <button 
                            class="w-full bg-gradient-to-r {pkg.gradient} text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-{pkg.gradient.split('-')[1]}/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2" 
                            on:click={() => purchasePackage(pkg.priceId, pkg.name)} 
                            disabled={isLoading || !$user}
                        >
                            {#if isLoading}
                                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {:else}
                                <span>💳</span>
                            {/if}
                            <span>Purchase {pkg.name}</span>
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Footer Information -->
        <div class="mt-16 text-center">
            <div class="bg-silk/20 rounded-2xl p-8 border border-royal/10">
                <h3 class="font-display text-2xl font-bold text-white mb-4">What is CloutCoin™?</h3>
                <div class="grid md:grid-cols-3 gap-6 text-gray-300">
                    <div>
                        <div class="text-3xl mb-2">🎯</div>
                        <h4 class="font-semibold text-white mb-2">Boost Your Presence</h4>
                        <p class="text-sm">Use CloutCoin™ to enhance your profile and increase your visibility on the platform.</p>
                    </div>
                    <div>
                        <div class="text-3xl mb-2">🔥</div>
                        <h4 class="font-semibold text-white mb-2">Premium Features</h4>
                        <p class="text-sm">Access exclusive features and premium content that separates you from the basic users.</p>
                    </div>
                    <div>
                        <div class="text-3xl mb-2">💎</div>
                        <h4 class="font-semibold text-white mb-2">Social Currency</h4>
                        <p class="text-sm">CloutCoin™ is more than money—it's status, power, and proof you're worth something.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Login Prompt -->
        {#if !$user}
            <div class="mt-8 text-center">
                <div class="bg-royal/20 border border-royal/30 rounded-2xl p-6">
                    <h3 class="font-display text-xl font-bold text-white mb-2">Ready to Buy Your Way Up?</h3>
                    <p class="text-gray-400 mb-4">You must be logged in to purchase CloutCoin™</p>
                    <a href="/" class="inline-flex items-center space-x-2 bg-gradient-to-r from-royal to-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors">
                        <span>Login to Continue</span>
                    </a>
                </div>
            </div>
        {/if}
    </div>
</main>
