<script lang="ts">
    import { db } from '$lib/firebase';
    import { doc, updateDoc } from 'firebase/firestore';
    import { userProfile } from '$lib/stores';

    let isLoading = false;
    let message = '';

    // Tactical Order: "Create a function to set the primary display preference."
    async function setPrimaryDisplay(type: 'video' | 'photo') {
        if (!$userProfile) return;
        
        isLoading = true;
        message = '';
        
        try {
            const userDocRef = doc(db, 'users', $userProfile.uid);
            await updateDoc(userDocRef, {
                primaryDisplay: type
            });
            
            // Update local store
            $userProfile.primaryDisplay = type;
            userProfile.set($userProfile);
            
            message = `Your ${type === 'video' ? 'video' : 'picture'} is now your primary display.`;
        } catch (error) {
            message = 'Failed to update preference. The server is judging you.';
            console.error(error);
        } finally {
            isLoading = false;
        }
    }

    // Check if user has both media types
    $: hasBothTypes = $userProfile?.photoURL && $userProfile?.videoURL;
</script>

{#if hasBothTypes}
    <div class="bg-silk/30 rounded-2xl p-6 border border-royal/20">
        <div class="mb-4">
            <h3 class="font-display text-xl font-bold text-white mb-2">Avatar Display</h3>
            <p class="text-gray-400 text-sm">Choose which format to showcase as your primary avatar</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
            <button 
                class="flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all duration-200 {$userProfile?.primaryDisplay === 'photo' ? 'border-gold bg-gold/10' : 'border-gray-600 hover:border-royal'}" 
                on:click={() => setPrimaryDisplay('photo')}
                disabled={isLoading}
            >
                <div class="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-royal to-purple-600 flex items-center justify-center">
                    {#if $userProfile?.photoURL}
                        <img src={$userProfile.photoURL} alt="Preview" class="w-full h-full object-cover" />
                    {:else}
                        <span class="text-white text-xl">📷</span>
                    {/if}
                </div>
                <span class="text-white font-semibold">Static Picture</span>
                {#if $userProfile?.primaryDisplay === 'photo'}
                    <span class="text-gold text-xs font-bold">ACTIVE</span>
                {/if}
            </button>
            
            <button 
                class="flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all duration-200 {$userProfile?.primaryDisplay === 'video' ? 'border-gold bg-gold/10' : 'border-gray-600 hover:border-royal'}" 
                on:click={() => setPrimaryDisplay('video')}
                disabled={isLoading}
            >
                <div class="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-royal to-purple-600 flex items-center justify-center">
                    {#if $userProfile?.videoURL}
                        <video src={$userProfile.videoURL} muted loop autoplay class="w-full h-full object-cover"></video>
                    {:else}
                        <span class="text-white text-xl">🎥</span>
                    {/if}
                </div>
                <span class="text-white font-semibold">Dynamic Video</span>
                {#if $userProfile?.primaryDisplay === 'video'}
                    <span class="text-gold text-xs font-bold">ACTIVE</span>
                {/if}
            </button>
        </div>
        
        {#if isLoading}
            <div class="flex justify-center py-2">
                <div class="w-5 h-5 border-2 border-royal/30 border-t-royal rounded-full animate-spin"></div>
            </div>
        {/if}
        
        {#if message}
            <div class="p-3 bg-electric/20 border border-electric/30 rounded-xl">
                <p class="text-electric text-sm text-center">{message}</p>
            </div>
        {/if}
    </div>
{/if}
