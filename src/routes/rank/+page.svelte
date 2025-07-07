<script lang="ts">
	import HotStrip from '$lib/components/HotStrip.svelte';
	import Header from '$lib/components/Header.svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;

	// Get combatants from the data (assuming it's provided by the load function)
	$: combatant1 = data.combatant1 || { username: 'Loading...', cloutScore: 0, uid: '' };
	$: combatant2 = data.combatant2 || { username: 'Loading...', cloutScore: 0, uid: '' };
</script>

<svelte:head>
	<title>Hot or Not - CloutDumpster</title>
</svelte:head>

<Header />

<main class="pt-20">
	<HotStrip />
</main>

<main class="flex min-h-screen flex-col items-center justify-center bg-base-300 p-4">
	<div class="mb-10 text-center">
		<h1 class="text-5xl font-bold text-primary">THE ARENA</h1>
		<p class="mt-2 text-xl text-neutral-content">Render your judgment.</p>
		<h2 class="mt-8 text-3xl font-light">
			Who has more <span class="font-bold text-secondary">CLOUT</span>?
		</h2>
	</div>

	<!-- 
        Tactical Order: "Create a form that uses the 'enhance' action. 
        It should contain two columns for the two combatants."
    -->
	<form method="POST" use:enhance class="w-full max-w-4xl">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Combatant 1 Card -->
			<div class="card bg-base-100 shadow-xl transition-transform hover:scale-105">
				<div class="card-body items-center text-center">
					<h2 class="card-title text-3xl">{combatant1.username}</h2>
					<p class="my-4 font-mono text-5xl font-bold">{combatant1.cloutScore}</p>
					<!-- This button submits the form, declaring combatant1 the winner. -->
					<div class="card-actions">
						<button
							type="submit"
							name="winnerId"
							value={combatant1.uid}
							formaction="?/default&loserId={combatant2.uid}"
							class="btn btn-primary btn-lg w-full"
						>
							CHOOSE
						</button>
					</div>
				</div>
			</div>

			<!-- Combatant 2 Card -->
			<div class="card bg-base-100 shadow-xl transition-transform hover:scale-105">
				<div class="card-body items-center text-center">
					<h2 class="card-title text-3xl">{combatant2.username}</h2>
					<p class="my-4 font-mono text-5xl font-bold">{combatant2.cloutScore}</p>
					<!-- This button submits the form, declaring combatant2 the winner. -->
					<div class="card-actions">
						<button
							type="submit"
							name="winnerId"
							value={combatant2.uid}
							formaction="?/default&loserId={combatant1.uid}"
							class="btn btn-secondary btn-lg w-full"
						>
							CHOOSE
						</button>
					</div>
				</div>
			</div>
		</div>
	</form>

	<div class="mt-8">
		<a href="/" class="btn btn-ghost">Retreat to Dashboard</a>
	</div>
</main>
