<script lang="ts">
	import { user, userProfile } from '$lib/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SignupWizard from '$lib/components/SignupWizard.svelte';

	let mounted = false;
	let showSignup = false;

	// Social proof indicators
	let onlineCount = 0;
	let recentRatings = 0;

	onMount(() => {
		mounted = true;

		// Redirect if already authenticated
		if ($user && $userProfile) {
			goto('/feed');
			return;
		}

		// Generate fake social proof numbers
		onlineCount = Math.floor(Math.random() * 50) + 15;
		recentRatings = Math.floor(Math.random() * 200) + 50;

		// Pulse the online indicator
		setInterval(() => {
			onlineCount = Math.floor(Math.random() * 50) + 15;
			recentRatings = Math.floor(Math.random() * 200) + 50;
		}, 3000);
	});

	function startSignup() {
		showSignup = true;
	}

	function closeSignup() {
		showSignup = false;
	}
</script>

<svelte:head>
	<title>How Hot Are You? - CloutDumpster</title>
	<meta name="description" content="Find out instantly. One photo. Infinite judgment." />
</svelte:head>

{#if $user && $userProfile}
	<main class="min-h-screen bg-black pt-20">
		<!-- Redirect to feed if authenticated -->
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div
					class="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-pink-500/30 border-t-pink-500"
				></div>
				<p class="text-white">Redirecting to your feed...</p>
			</div>
		</div>
	</main>
{:else}
	<!-- HERO LANDING: full-screen blurred attractive face background, glass-morphism overlay, Tailwind classes, photo-upload CTA button -->
	<main class="relative h-screen w-full overflow-hidden bg-black">
		<!-- Hero Background - full-screen blurred attractive face -->
		<div
			class="absolute inset-0 bg-cover bg-center bg-no-repeat"
			style="background-image: url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1600&fit=crop&crop=face'); filter: blur(8px); transform: scale(1.1);"
		></div>

		<!-- Glass-morphism overlay -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

		<!-- Fake Activity Indicators -->
		<div class="absolute right-4 top-4 z-20">
			<div class="flex items-center space-x-4">
				<!-- Online indicator -->
				<div
					class="flex items-center space-x-2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm"
				>
					<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
					<span class="text-sm font-semibold text-white">{onlineCount} online</span>
				</div>

				<!-- Recent activity -->
				<div class="rounded-full bg-pink-500/20 px-3 py-1 backdrop-blur-sm">
					<span class="text-sm font-semibold text-white">{recentRatings} rated today</span>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
			{#if !showSignup}
				<!-- Landing State -->
				<div class="mx-auto max-w-lg">
					<h1 class="mb-4 text-5xl font-bold text-white md:text-6xl">
						How Hot Are <em class="text-pink-500">You</em>?
					</h1>
					<p class="mb-8 text-xl text-gray-300">
						Find out instantly. One photo. Infinite judgment.
					</p>

					<!-- Tease before signup -->
					<div
						class="mb-8 rounded-2xl border border-pink-500/20 bg-pink-500/10 p-6 backdrop-blur-sm"
					>
						<p class="mb-2 font-semibold text-pink-300">
							🔥 {Math.floor(Math.random() * 100) + 20} people just rated someone
						</p>
						<p class="text-sm text-gray-400">See your rating in 30 seconds</p>
					</div>

					<button
						on:click={startSignup}
						class="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-12 py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:from-pink-600 hover:to-purple-700"
					>
						Jump In →
					</button>

					<!-- Social proof -->
					<div class="mt-12 grid grid-cols-3 gap-8 text-center opacity-70">
						<div>
							<p class="text-2xl font-bold text-white">10K+</p>
							<p class="text-sm text-gray-400">Photos Rated</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-pink-500">4.8★</p>
							<p class="text-sm text-gray-400">Average Rating</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-white">24/7</p>
							<p class="text-sm text-gray-400">Live Judging</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Bottom gradient -->
		<div
			class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"
		></div>
	</main>
{/if}

<!-- SignupWizard Modal -->
{#if showSignup}
	<SignupWizard on:close={closeSignup} />
{/if}
