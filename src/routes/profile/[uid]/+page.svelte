<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { user } from '$lib/stores';
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import ProfileUploader from '$lib/components/ProfileUploader.svelte';
    import Top6 from '$lib/components/Top6.svelte';
    import DisplaySelector from '$lib/components/DisplaySelector.svelte';
    import Header from '$lib/components/Header.svelte';
    import CritiqueModal from '$lib/components/CritiqueModal.svelte';
    import CritiqueArchive from '$lib/components/CritiqueArchive.svelte';

    export let data: PageData;
    export let form: ActionData;

    // Reactive statements to keep data fresh
    $: profile = data.profile;
    $: whispers = data.whispers as any[];
    $: isOwnProfile = $user && $user.uid === profile.uid;

    // Neural critique system state
    let showCritiqueModal = false;
    let showCritiqueArchive = false;

    function openCritiqueModal() {
        showCritiqueModal = true;
    }

    function openCritiqueArchive() {
        showCritiqueArchive = true;
    }
</script>

<Header />

<main class="pt-20 min-h-screen bg-velvet font-body">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Profile Header -->
        <div class="bg-silk/30 rounded-2xl p-8 border border-royal/20 mb-8">
            <div class="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <!-- Avatar with Video Support -->
                <div class="relative">
                    <div class="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-royal to-purple-700 p-1">
                        <div class="w-full h-full rounded-full overflow-hidden bg-velvet flex items-center justify-center">
                            {#if profile.primaryDisplay === 'video' && profile.videoURL}
                                <video 
                                    src={profile.videoURL} 
                                    autoplay 
                                    muted 
                                    loop 
                                    playsinline
                                    class="w-full h-full object-cover"
                                ></video>
                            {:else if profile.primaryDisplay === 'photo' && profile.photoURL}
                                <img 
                                    src={profile.photoURL} 
                                    alt="{profile.username}'s avatar" 
                                    class="w-full h-full object-cover"
                                />
                            {:else if profile.videoURL}
                                <video 
                                    src={profile.videoURL} 
                                    autoplay 
                                    muted 
                                    loop 
                                    playsinline
                                    class="w-full h-full object-cover"
                                ></video>
                            {:else if profile.photoURL}
                                <img 
                                    src={profile.photoURL} 
                                    alt="{profile.username}'s avatar" 
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <div class="w-full h-full bg-gradient-to-br from-royal to-purple-700 flex items-center justify-center">
                                    <span class="text-white text-4xl font-bold">
                                        {profile.username?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Profile Info -->
                <div class="flex-1 text-center md:text-left">
                    <h1 class="font-display text-4xl font-bold text-white mb-2">{profile.username}</h1>
                    <div class="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0">
                        <div class="text-center md:text-left">
                            <p class="font-display text-4xl font-bold text-electric">{profile.cloutScore}</p>
                            <p class="text-gray-400 text-sm uppercase tracking-wider">Clout Score</p>
                        </div>
                        <div class="text-center md:text-left">
                            <p class="font-display text-2xl font-bold text-gold">{profile.cloutCoin || 0}</p>
                            <p class="text-gray-400 text-sm uppercase tracking-wider">CloutCoin</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top 6 Inner Circle -->
        <div class="mb-8">
            <Top6 isOwnProfile={!!isOwnProfile} profileUserId={profile.uid} />
        </div>

        <!-- Profile Management (Own Profile Only) -->
        {#if isOwnProfile}
            <div class="space-y-6 mb-8">
                <ProfileUploader />
                <DisplaySelector />
            </div>
        {/if}

        <!-- Whisper Submission Form -->
        {#if $user && !isOwnProfile}
            <div class="bg-silk/30 rounded-2xl p-6 border border-royal/20 mb-8">
                <h3 class="font-display text-xl font-bold text-white mb-4">Drop a comment (Anonymously)</h3>
                <form method="POST" action="?/whisper" use:enhance class="space-y-4">
                    <textarea 
                        name="whisperText" 
                        class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none resize-none" 
                        placeholder="Throw shade anonymously..."
                        rows="3"
                    ></textarea>
                    <button 
                        type="submit" 
                        class="w-full bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                    >
                        � Send Whisper
                    </button>
                </form>
                
                {#if form?.message}
                    <div class="mt-4 p-3 rounded-xl border {form?.success ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}">
                        <p class="text-sm {form?.success ? 'text-green-400' : 'text-red-400'}">{form.message}</p>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Whispers Display -->
        <div class="bg-silk/30 rounded-2xl p-6 border border-royal/20">
            <h3 class="font-display text-xl font-bold text-white mb-6">The Whisper Chamber</h3>
            {#if whispers && whispers.length > 0}
                <div class="space-y-4">
                    {#each whispers as whisper}
                        <div class="bg-velvet/50 rounded-xl p-4 border border-royal/20">
                            <p class="text-gray-300">"{whisper.text}"</p>
                            <p class="text-gray-500 text-xs mt-2 text-right">
                                Whispered on: {new Date(whisper.createdAt?.toDate()).toLocaleString()}
                            </p>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="text-center py-8">
                    <p class="text-gray-400">Silent as the grave. No whispers yet.</p>
                </div>
            {/if}
        </div>
        
        <div class="text-center mt-8">
            <a href="/leaderboard" class="text-royal hover:text-purple-400 transition-colors font-semibold">
                ← Back to the Leaderboard
            </a>
        </div>

        <!-- Critique Modal (Hidden by default) -->
        {#if showCritiqueModal}
            <CritiqueModal on:close={() => showCritiqueModal = false} />
        {/if}

        <!-- Critique Archive (Hidden by default) -->
        {#if showCritiqueArchive}
            <CritiqueArchive on:close={() => showCritiqueArchive = false} />
        {/if}
    </div>
</main>
