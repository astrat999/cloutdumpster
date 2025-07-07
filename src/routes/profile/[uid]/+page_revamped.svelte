<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { user } from '$lib/stores';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { db, storage } from '$lib/firebase';
  import { doc, collection, query, orderBy, limit, getDocs, where, updateDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  
  export let data: PageData;
  export let form: ActionData;

  $: profile = data.profile;
  $: whispers = data.whispers as any[];
  $: isOwnProfile = $user && $user.uid === profile.uid;

  let recentVotes: any[] = [];
  let showPhotoUpload = false;
  let uploadingPhoto = false;
  let fileInput: HTMLInputElement;

  onMount(async () => {
    if (isOwnProfile) {
      await loadRecentVotes();
    }
  });

  async function loadRecentVotes() {
    if (!$user) return;
    
    try {
      const votesQuery = query(
        collection(db, 'votes'),
        where('voterId', '==', $user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(votesQuery);
      recentVotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading recent votes:', error);
    }
  }

  function openPhotoUpload() {
    fileInput.click();
  }

  async function handlePhotoUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file || !$user) return;
    
    uploadingPhoto = true;
    
    try {
      // Upload to Firebase Storage
      const avatarRef = ref(storage, `avatars/${$user.uid}/avatar.jpg`);
      await uploadBytes(avatarRef, file);
      const photoURL = await getDownloadURL(avatarRef);
      
      // Update user profile
      const userRef = doc(db, 'users', $user.uid);
      await updateDoc(userRef, { photoURL });
      
      // Update local profile data
      profile.photoURL = photoURL;
      
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      uploadingPhoto = false;
    }
  }

  function formatTimeAgo(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }
</script>

<svelte:head>
  <title>{profile.username} • CloutDumpster</title>
</svelte:head>

<!-- Hidden file input -->
<input 
  bind:this={fileInput}
  type="file" 
  accept="image/*" 
  on:change={handlePhotoUpload}
  class="hidden"
/>

<main class="min-h-screen bg-black text-white">
  <!-- Hero Section: Giant Avatar + Stats -->
  <section class="relative h-screen flex flex-col justify-center items-center px-4">
    <!-- Background blur effect -->
    <div class="absolute inset-0 z-0">
      {#if profile.photoURL || profile.thumbnailURL}
        <img 
          src={profile.thumbnailURL || profile.photoURL} 
          alt=""
          class="w-full h-full object-cover opacity-20 blur-3xl"
        />
      {/if}
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
    </div>

    <!-- Main content -->
    <div class="relative z-10 text-center max-w-sm mx-auto">
      <!-- Giant Avatar -->
      <div class="relative mb-8">
        <div class="w-80 h-80 mx-auto rounded-full overflow-hidden bg-gray-800 border-4 border-white/10">
          {#if profile.photoURL || profile.thumbnailURL}
            <img 
              src={profile.thumbnailURL || profile.photoURL} 
              alt={profile.username}
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span class="text-white text-8xl font-black">
                {profile.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          {/if}
        </div>
        
        <!-- Change Photo FAB (Own Profile Only) -->
        {#if isOwnProfile}
          <button 
            on:click={openPhotoUpload}
            disabled={uploadingPhoto}
            class="absolute bottom-4 right-4 w-16 h-16 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 disabled:opacity-50"
          >
            {#if uploadingPhoto}
              <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {:else}
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            {/if}
          </button>
        {/if}
      </div>

      <!-- Username -->
      <h1 class="text-4xl font-black mb-4 tracking-tight">{profile.username}</h1>

      <!-- Clout Score (HUGE) -->
      <div class="mb-6">
        <div class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
          {profile.cloutScore || 0}
        </div>
        <div class="text-gray-400 text-sm uppercase tracking-wider font-medium">Clout Score</div>
      </div>

      <!-- Quick Stats Row -->
      <div class="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
          <div class="text-2xl font-bold text-yellow-400">{profile.cloutCoin || 0}</div>
          <div class="text-gray-400 text-xs uppercase tracking-wider">CloutCoin</div>
        </div>
        <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
          <div class="text-2xl font-bold text-blue-400">{profile.votes || 0}</div>
          <div class="text-gray-400 text-xs uppercase tracking-wider">Total Votes</div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </section>

  <!-- Last 3 Whispers Section -->
  <section class="px-4 py-12">
    <div class="max-w-md mx-auto">
      <h2 class="text-2xl font-black mb-6 text-center">Latest Whispers</h2>
      
      {#if whispers && whispers.length > 0}
        <div class="space-y-4">
          {#each whispers.slice(0, 3) as whisper}
            <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <p class="text-gray-200 leading-relaxed mb-3">"{whisper.text}"</p>
              <div class="text-xs text-gray-500 text-right">
                {formatTimeAgo(whisper.createdAt)}
              </div>
            </div>
          {/each}
        </div>
        
        {#if whispers.length > 3}
          <div class="text-center mt-6">
            <button class="text-pink-400 hover:text-pink-300 text-sm font-medium">
              View All Whispers →
            </button>
          </div>
        {/if}
      {:else}
        <div class="text-center py-12">
          <div class="text-gray-500 text-6xl mb-4">💭</div>
          <p class="text-gray-400">No whispers yet</p>
          <p class="text-gray-500 text-sm mt-2">The silence is deafening</p>
        </div>
      {/if}
    </div>
  </section>

  <!-- Recent Votes (Own Profile Only) -->
  {#if isOwnProfile && recentVotes.length > 0}
    <section class="px-4 py-12 border-t border-white/10">
      <div class="max-w-md mx-auto">
        <h2 class="text-2xl font-black mb-6 text-center">Your Recent Votes</h2>
        
        <div class="space-y-3">
          {#each recentVotes as vote}
            <div class="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">
                  {vote.type === 'hot' ? '🔥' : '🧊'}
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-200">{vote.targetUsername}</div>
                  <div class="text-xs text-gray-500">{formatTimeAgo(vote.createdAt)}</div>
                </div>
              </div>
              <div class="text-xs text-gray-400">
                {vote.type === 'hot' ? '+1' : '-1'}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <!-- Whisper Submission (Other Profiles) -->
  {#if $user && !isOwnProfile}
    <section class="px-4 py-12 border-t border-white/10">
      <div class="max-w-md mx-auto">
        <h2 class="text-2xl font-black mb-6 text-center">Drop a Whisper</h2>
        
        <form method="POST" action="?/whisper" use:enhance class="space-y-4">
          <textarea 
            name="whisperText" 
            class="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none resize-none"
            placeholder="Say something anonymously..."
            rows="4"
            maxlength="280"
          ></textarea>
          
          <button 
            type="submit" 
            class="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Send Whisper 💭
          </button>
        </form>
        
        {#if form?.message}
          <div class="mt-4 p-4 rounded-2xl {form?.success ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}">
            <p class="text-sm {form?.success ? 'text-green-400' : 'text-red-400'} text-center">
              {form.message}
            </p>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Bottom Navigation Space -->
  <div class="h-24"></div>
</main>

<style>
  /* Ensure smooth scrolling and hide scrollbar */
  :global(html) {
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  :global(html::-webkit-scrollbar) {
    display: none;
  }
</style>
