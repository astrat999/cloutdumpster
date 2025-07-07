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

<main class="min-h-screen bg-velvet pt-20 font-body">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<!-- Store Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 font-display text-6xl font-bold text-white">The CloutCoin™ Store</h1>
			<p class="mx-auto max-w-2xl text-xl text-gray-400">
				Your paranoia must be funded. Your vanity requires investment.
				<span class="font-semibold text-gold">Buy your way to relevance.</span>
			</p>

			{#if $userProfile}
				<div
					class="mt-6 inline-flex items-center space-x-2 rounded-full border border-gold/30 bg-silk/30 px-6 py-3"
				>
					<span class="text-2xl text-gold">💰</span>
					<span class="font-semibold text-white">Current Balance:</span>
					<span class="font-display text-2xl font-bold text-gold"
						>{$userProfile.cloutCoin || 0}</span
					>
					<span class="text-gray-400">CloutCoin™</span>
				</div>
			{/if}
		</div>

		<!-- Success Message -->
		{#if purchaseSuccess}
			<div class="mb-8 rounded-2xl border border-green-500/30 bg-green-500/20 p-6 text-center">
				<div class="mb-2 text-4xl">🎉</div>
				<h2 class="mb-2 font-display text-2xl font-bold text-green-400">Purchase Successful!</h2>
				<p class="text-green-300">
					Your CloutCoin™ has been added to your account. Spend it wisely, or don't.
				</p>
			</div>
		{/if}

		<!-- Error Message -->
		{#if purchaseError}
			<div class="mb-8 rounded-2xl border border-red-500/30 bg-red-500/20 p-6 text-center">
				<div class="mb-2 text-4xl">💸</div>
				<h2 class="mb-2 font-display text-2xl font-bold text-red-400">Purchase Failed</h2>
				<p class="text-red-300">{purchaseError}</p>
			</div>
		{/if}

		<!-- Package Grid -->
		<div class="grid gap-8 md:grid-cols-3">
			{#each packages as pkg, index}
				<div
					class="group relative overflow-hidden rounded-2xl border border-royal/20 bg-silk/30 transition-all duration-300 hover:scale-105"
				>
					<!-- Popular Badge -->
					{#if pkg.popular}
						<div class="absolute -top-3 left-1/2 z-10 -translate-x-1/2 transform">
							<div
								class="rounded-full bg-gradient-to-r from-gold to-yellow-600 px-4 py-1 text-sm font-bold text-black"
							>
								MOST POPULAR
							</div>
						</div>
					{/if}

					<div class="p-8 text-center">
						<!-- Package Icon -->
						<div
							class="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br {pkg.gradient} flex items-center justify-center"
						>
							<span class="text-3xl">
								{#if index === 0}💼{:else if index === 1}👑{:else}🐋{/if}
							</span>
						</div>

						<!-- Package Details -->
						<h2 class="mb-2 font-display text-3xl font-bold text-white">{pkg.name}</h2>
						<p class="mb-6 text-sm text-gray-400">{pkg.description}</p>

						<!-- Coin Amount -->
						<div class="mb-6">
							<div class="mb-2 font-display text-5xl font-bold text-gold">
								{pkg.amount.toLocaleString()}
							</div>
							<div class="text-lg text-gray-300">CloutCoin™</div>
						</div>

						<!-- Price -->
						<div class="mb-8">
							<div class="font-display text-3xl font-bold text-white">{pkg.price}</div>
							<div class="text-sm text-gray-400">One-time payment</div>
						</div>

						<!-- Purchase Button -->
						<button
							class="w-full bg-gradient-to-r {pkg.gradient} rounded-xl py-4 font-bold text-white hover:shadow-lg hover:shadow-{pkg.gradient.split(
								'-'
							)[1]}/20 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50"
							on:click={() => purchasePackage(pkg.priceId, pkg.name)}
							disabled={isLoading || !$user}
						>
							{#if isLoading}
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
								></div>
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
			<div class="rounded-2xl border border-royal/10 bg-silk/20 p-8">
				<h3 class="mb-4 font-display text-2xl font-bold text-white">What is CloutCoin™?</h3>
				<div class="grid gap-6 text-gray-300 md:grid-cols-3">
					<div>
						<div class="mb-2 text-3xl">🎯</div>
						<h4 class="mb-2 font-semibold text-white">Boost Your Presence</h4>
						<p class="text-sm">
							Use CloutCoin™ to enhance your profile and increase your visibility on the platform.
						</p>
					</div>
					<div>
						<div class="mb-2 text-3xl">🔥</div>
						<h4 class="mb-2 font-semibold text-white">Premium Features</h4>
						<p class="text-sm">
							Access exclusive features and premium content that separates you from the basic users.
						</p>
					</div>
					<div>
						<div class="mb-2 text-3xl">💎</div>
						<h4 class="mb-2 font-semibold text-white">Social Currency</h4>
						<p class="text-sm">
							CloutCoin™ is more than money—it's status, power, and proof you're worth something.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Login Prompt -->
		{#if !$user}
			<div class="mt-8 text-center">
				<div class="rounded-2xl border border-royal/30 bg-royal/20 p-6">
					<h3 class="mb-2 font-display text-xl font-bold text-white">Ready to Buy Your Way Up?</h3>
					<p class="mb-4 text-gray-400">You must be logged in to purchase CloutCoin™</p>
					<a
						href="/"
						class="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-royal to-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:from-purple-600 hover:to-purple-700"
					>
						<span>Login to Continue</span>
					</a>
				</div>
			</div>
		{/if}
	</div>
</main>
