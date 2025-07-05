<script lang="ts">
    import type { PageData } from './$types';

    // Tactical Order: "Define the prop for the page data."
    export let data: PageData;
</script>

<main class="p-4 md:p-8 bg-base-200 min-h-screen">
    <div class="max-w-4xl mx-auto">
        <div class="text-center mb-10">
            <h1 class="text-5xl font-bold text-secondary">THE LEADERBOARD</h1>
            <p class="text-xl mt-2 text-neutral-content">The Official Ranking of Clout.</p>
        </div>

        <!-- 
            Tactical Order: "Create a DaisyUI table to display the leaderboard data. 
            It should have columns for Rank, Username, and Clout Score."
        -->
        <div class="overflow-x-auto shadow-2xl rounded-lg">
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
                            <td class="text-xl">{user.username}</td>
                            <td class="text-2xl font-mono font-bold text-right">{user.cloutScore}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="text-center mt-8 flex justify-center gap-4">
            <a href="/" class="btn btn-ghost">Retreat to Dashboard</a>
            <a href="/rank" class="btn btn-primary">Return to the Arena</a>
        </div>
    </div>
</main>
