<script lang="ts">
	import { userProfile, user } from '$lib/stores';
	import { auth } from '$lib/firebase';
	import { onMount } from 'svelte';

	let mounted = false;
	let isScrolled = false;

	onMount(() => {
		mounted = true;

		const handleScroll = () => {
			isScrolled = window.scrollY > 20;
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

{#if $user && $userProfile}
	<header
		class="fixed left-0 right-0 top-0 z-50 transition-all duration-300 {isScrolled
			? 'bg-black'
			: 'bg-black/80'} border-b border-gray-800 backdrop-blur-lg"
	>
		<div class="mx-auto max-w-6xl px-6 py-4">
			<div class="flex items-center justify-between">
				<!-- Brand -->
				<div class="flex items-center space-x-8">
					<a href="/" class="group flex items-center space-x-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent transition-transform group-hover:scale-110"
						>
							<span class="text-sm font-black text-black">CD</span>
						</div>
						<span class="text-xl font-bold text-white"> CloutDumpster </span>
					</a>

					<!-- Navigation -->
					<nav class="hidden items-center space-x-6 md:flex">
						<a href="/feed" class="font-medium text-gray-400 transition-colors hover:text-white">
							Feed
						</a>
						<a href="/rank" class="font-medium text-gray-400 transition-colors hover:text-white">
							Hot/Not
						</a>
						<a
							href="/leaderboard"
							class="font-medium text-gray-400 transition-colors hover:text-white"
						>
							Ranks
						</a>
					</nav>
				</div>

				<!-- User Status -->
				<div class="flex items-center space-x-4">
					<!-- Clout Score -->
					<div class="text-center">
						<p class="text-lg font-bold text-accent">
							{$userProfile.cloutScore}
						</p>
						<p class="text-xs uppercase text-gray-400">Clout</p>
					</div>

					<!-- CloutCoin Balance -->
					<div class="text-center">
						<p class="text-lg font-bold text-yellow-400">
							{$userProfile.cloutCoin || 0}
						</p>
						<p class="text-xs uppercase text-gray-400">Coins</p>
					</div>

					<!-- Profile -->
					<div class="flex items-center space-x-3">
						<a href="/profile/{$user.uid}" class="group">
							<div
								class="h-10 w-10 rounded-xl bg-accent p-0.5 transition-transform group-hover:scale-105"
							>
								<div
									class="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black"
								>
									{#if $userProfile.photoURL}
										<img
											src={$userProfile.photoURL}
											alt="Profile"
											class="h-full w-full object-cover"
										/>
									{:else}
										<span class="text-sm font-bold text-white"
											>{$userProfile.username?.charAt(0).toUpperCase() || '?'}</span
										>
									{/if}
								</div>
							</div>
						</a>

						<!-- Sign Out -->
						<button
							on:click={() => auth.signOut()}
							class="text-sm font-medium text-gray-400 transition-colors hover:text-red-400"
						>
							Exit
						</button>
					</div>
				</div>
			</div>
		</div>
	</header>
{/if}
