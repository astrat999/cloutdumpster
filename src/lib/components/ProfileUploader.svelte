<script lang="ts">
    import { storage, db } from '$lib/firebase';
    import { userProfile } from '$lib/stores';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { doc, updateDoc } from 'firebase/firestore';

    let file: FileList | null;
    let isLoading = false;
    let error: string | null = null;
    let success: string | null = null;

    // Tactical Order: "Create a function to handle file upload and update the user's profile."
    async function handleUpload() {
        if (!file || file.length === 0) {
            error = "Select a file, you amateur.";
            return;
        }
        if (!$userProfile) {
            error = "User profile not found. Are you even real?";
            return;
        }

        isLoading = true;
        error = null;
        success = null;

        const uploadedFile = file[0];
        const isVideo = uploadedFile.type.startsWith('video/');
        
        // Check file size for videos (5MB limit)
        if (isVideo && uploadedFile.size > 5 * 1024 * 1024) {
            error = "Video too large. Keep it under 5MB, attention seeker.";
            isLoading = false;
            return;
        }

        // Create appropriate storage path
        const basePath = isVideo ? 'profile-videos' : 'profile-pictures';
        const storagePath = `${basePath}/${$userProfile.uid}/${uploadedFile.name}`;
        const storageRef = ref(storage, storagePath);

        try {
            // Upload the file
            const snapshot = await uploadBytes(storageRef, uploadedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update the user's document with appropriate field
            const userDocRef = doc(db, 'users', $userProfile.uid);
            const updateData = isVideo 
                ? { videoURL: downloadURL }
                : { photoURL: downloadURL };
            
            await updateDoc(userDocRef, updateData);

            // Update the local store for instant feedback
            if (isVideo) {
                $userProfile.videoURL = downloadURL;
                success = "Video avatar uploaded. You're literally moving up in the world.";
            } else {
                $userProfile.photoURL = downloadURL;
                success = "New face, same dumpster. Profile picture updated.";
            }
            userProfile.set($userProfile);

        } catch (e) {
            error = `Upload failed. The server probably hates your ${isVideo ? 'video' : 'face'}.`;
            console.error(e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="bg-silk/30 rounded-2xl p-6 border border-royal/20">
    <div class="mb-4">
        <h3 class="font-display text-xl font-bold text-white mb-2">Avatar Upload</h3>
        <p class="text-gray-400 text-sm">Upload a photo or 3-second video to stand out</p>
    </div>
    
    <div class="space-y-4">
        <input 
            type="file" 
            class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-royal file:text-white hover:file:bg-purple-600 transition-colors" 
            bind:files={file} 
            accept="image/*, video/mp4, video/quicktime" 
        />
        
        <button 
            class="w-full bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2" 
            on:click={handleUpload} 
            disabled={isLoading}
        >
            {#if isLoading}
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {/if}
            <span>Upload Avatar</span>
        </button>
        
        {#if error}
            <div class="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p class="text-red-400 text-sm">{error}</p>
            </div>
        {/if}
        
        {#if success}
            <div class="p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                <p class="text-green-400 text-sm">{success}</p>
            </div>
        {/if}
    </div>
</div>
