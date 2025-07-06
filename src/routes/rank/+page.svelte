<script lang="ts">
import type { PageData } from './$types';
import { enhance } from '$app/forms';

// Tactical Order: "Define the props for the page data and action data."
export let data: PageData;

// Destructure the combatants from the data prop for easier access.
$: ({ combatant1, combatant2 } = data);
</script>

<main class="flex flex-col items-center justify-center min-h-screen p-4 bg-base-300">
    <div class="text-center mb-10">
        <h1 class="text-5xl font-bold text-primary">THE ARENA</h1>
        <p class="text-xl mt-2 text-neutral-content">Render your judgment.</p>
        <h2 class="text-3xl mt-8 font-light">Who has more <span class="font-bold text-secondary">CLOUT</span>?</h2>
    </div>

    <!-- 
        Tactical Order: "Create a form that uses the 'enhance' action. 
        It should contain two columns for the two combatants."
    -->
    <form method="POST" use:enhance class="w-full max-w-4xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Combatant 1 Card -->
            <div class="card bg-base-100 shadow-xl hover:scale-105 transition-transform">
                <div class="card-body items-center text-center">
                    <h2 class="card-title text-3xl">{combatant1.username}</h2>
                    <p class="text-5xl font-mono font-bold my-4">{combatant1.cloutScore}</p>
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
            <div class="card bg-base-100 shadow-xl hover:scale-105 transition-transform">
                <div class="card-body items-center text-center">
                    <h2 class="card-title text-3xl">{combatant2.username}</h2>
                    <p class="text-5xl font-mono font-bold my-4">{combatant2.cloutScore}</p>
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
