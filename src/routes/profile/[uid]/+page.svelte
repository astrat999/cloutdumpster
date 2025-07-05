<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { user } from '$lib/stores'; // To check if a user is logged in
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import ProfileUploader from '$lib/components/ProfileUploader.svelte';

    export let data: PageData;
    export let form: ActionData;

    // Reactive statements to keep data fresh
    $: profile = data.profile;
    $: roasts = data.roasts as any[];
</script>

<main class="p-4 md:p-8 bg-base-300 min-h-screen">
    <div class="max-w-4xl mx-auto">
        <!-- Profile Header -->
        <div class="card bg-base-100 shadow-xl mb-8">
            <div class="card-body items-center text-center">
                <!-- Tactical Order: "Display the user's avatar, falling back to a default." -->
                <div class="avatar mb-4">
                    <div class="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img src={profile.photoURL || `https://i.pravatar.cc/150?u=${profile.uid}`} alt="{profile.username}'s avatar" />
                    </div>
                </div>
                <h1 class="text-4xl font-bold">{profile.username}</h1>
                <p class="text-lg text-neutral-content">Clout Score:</p>
                <p class="text-6xl font-mono font-extrabold text-primary">{profile.cloutScore}</p>
            </div>
        </div>

        <!-- Tactical Order: "Show the uploader component ONLY if the logged-in user is viewing their OWN profile." -->
        {#if $user && $user.uid === profile.uid}
            <div class="mb-8">
                <ProfileUploader />
            </div>
        {/if}

        <!-- Roast Submission Form -->
        <!-- Tactical Order: "Create a form for the 'roast' action. It should only show if a user is logged in." -->
        {#if $user}
            <div class="card bg-base-100 shadow-xl mb-8">
                <div class="card-body">
                    <h2 class="card-title">Roast this User (Anonymously)</h2>
                    <form method="POST" action="?/roast" use:enhance>
                        <textarea 
                            name="roastText" 
                            class="textarea textarea-bordered w-full" 
                            placeholder="Unleash your fury..."
                            rows="3"
                        ></textarea>
                        <button type="submit" class="btn btn-secondary w-full mt-2">Submit Roast</button>
                    </form>
                    {#if form?.message}
                        <p class="text-center mt-2" class:text-success={form?.success} class:text-error={!form?.success}>
                            {form.message}
                        </p>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Roasts Display Section -->
        <!-- Tactical Order: "Create a section to display all the roasts using an #each block." -->
        <div class="space-y-4">
            <h2 class="text-3xl font-bold text-center mb-4">The Roasting Pit</h2>
            {#each roasts as roast}
                <div class="card bg-base-100 shadow-lg">
                    <div class="card-body">
                        <p class="text-lg">"{roast.text}"</p>
                        <p class="text-xs text-right text-neutral-content mt-2">
                            Roasted on: {new Date(roast.createdAt?.toDate()).toLocaleString()}
                        </p>
                    </div>
                </div>
            {:else}
                <p class="text-center text-neutral-content">This user is un-roasted. A pristine soul in a dumpster fire. Do something about it.</p>
            {/each}
        </div>
        
        <div class="text-center mt-8">
            <a href="/leaderboard" class="btn btn-ghost">Back to the Leaderboard</a>
        </div>
    </div>
</main>
