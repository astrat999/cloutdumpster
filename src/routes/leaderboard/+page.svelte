<script lang="ts">
	import type { PageData } from './$types';

	// Tactical Order: "Define the prop for the page data."
	export let data: PageData;
</script>

<main class="min-h-screen bg-base-200 p-4 md:p-8">
	<div class="mx-auto max-w-4xl">
		<div class="mb-10 text-center">
			<h1 class="text-5xl font-bold text-secondary">THE LEADERBOARD</h1>
			<p class="mt-2 text-xl text-neutral-content">The Official Ranking of Clout.</p>
		</div>

		<!-- 
            Tactical Order: "Create a DaisyUI table to display the leaderboard data. 
            It should have columns for Rank, Username, and Clout Score."
        -->
		<div class="overflow-x-auto rounded-lg shadow-2xl">
			<table class="table table-zebra w-full">
				<!-- head -->
				<thead class="text-lg">
					<tr>
						<th>Rank</th>
						<th>Username</th>
						<th class="text-right">Clout Score</th>
					</tr>
				</thead>
				<tbody>
					<!-- Tactical Order: "Create an #each block to loop through the leaderboard data." -->
					{#each data.leaderboard as user, i}
						<!-- Highlight the top 3 for extra psychological impact. -->
						<tr class:bg-secondary={i === 0} class:bg-primary={i === 1} class:bg-accent={i === 2}>
							<th class="text-2xl font-bold">{i + 1}</th>
							<!-- TACTICAL MODIFICATION: Make the username a link to their profile. -->
							<td class="text-xl">
								<a href="/profile/{user.uid}" class="hover:underline">
									{user.username}
								</a>
							</td>
							<td class="text-right font-mono text-2xl font-bold">{user.cloutScore}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-8 flex justify-center gap-4 text-center">
			<a href="/" class="btn btn-ghost">Retreat to Dashboard</a>
			<a href="/rank" class="btn btn-primary">Return to the Arena</a>
		</div>
	</div>
</main>
