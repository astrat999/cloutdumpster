<script lang="ts">
	// Tactical Order: "Create a simple component to display the 'Who Viewed Your Profile' feature."
	import { userProfile } from '$lib/stores';

	// This is a placeholder. In a real implementation, this would be a complex mix
	// of real users who recently viewed the profile and algorithmically generated fakes.
	// For our MVP, we will use a static list of fakes to prove the concept.
	const fakeSpies = [
		{ username: 'Your_Ex', avatar: 'https://i.pravatar.cc/150?img=47' },
		{ username: 'A_Recruiter', avatar: 'https://i.pravatar.cc/150?img=56' },
		{ username: 'That_Person_From_The_Gym', avatar: 'https://i.pravatar.cc/150?img=32' }
	];

	let revealed = false;

	function revealSpies() {
		if ($userProfile && $userProfile.cloutCoin >= 50) {
			// This is where we would deduct the coins in a real transaction.
			// For now, we just reveal.
			revealed = true;
			alert('50 CloutCoin spent! The shadows reveal their secrets...');
		} else {
			alert('Not enough CloutCoin! Your paranoia must be funded. Go to the store.');
		}
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title text-accent">The Spyglass</h2>
		<p>Who's been stalking your profile? Reveal the spies for 50 CloutCoin™.</p>

		<div class="my-4 space-y-2">
			{#each fakeSpies as spy}
				<div class="flex items-center gap-4 rounded-lg bg-base-200 p-2">
					<div class="avatar">
						<div class="w-12 rounded-full">
							<img src={spy.avatar} alt="spy avatar" class:blur={!revealed} />
						</div>
					</div>
					<p class="font-bold" class:blur={!revealed}>{spy.username}</p>
				</div>
			{/each}
		</div>

		<div class="card-actions justify-end">
			<button class="btn btn-accent" on:click={revealSpies} disabled={revealed}>
				{#if revealed}Revealed!{:else}Reveal for 50 CC{/if}
			</button>
		</div>
	</div>
</div>
