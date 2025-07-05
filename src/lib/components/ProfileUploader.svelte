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

        const imageFile = file[0];
        // Create a unique path for the image in Firebase Storage.
        const storagePath = `profile-pictures/${$userProfile.uid}/${imageFile.name}`;
        const storageRef = ref(storage, storagePath);

        try {
            // Upload the file.
            const snapshot = await uploadBytes(storageRef, imageFile);
            // Get the public URL of the uploaded file.
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update the user's document in Firestore with the new photo URL.
            const userDocRef = doc(db, 'users', $userProfile.uid);
            await updateDoc(userDocRef, {
                photoURL: downloadURL
            });

            // Update the local store for instant feedback.
            $userProfile.photoURL = downloadURL;
            success = "New face, same dumpster. Profile picture updated.";

        } catch (e) {
            error = "Upload failed. The server probably hates your face.";
            console.error(e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="card bg-base-100 shadow-xl">
    <div class="card-body">
        <h2 class="card-title">Update Profile Picture</h2>
        <div class="form-control w-full">
            <input type="file" class="file-input file-input-bordered w-full" bind:files={file} accept="image/png, image/jpeg" />
        </div>
        <div class="card-actions justify-end mt-2">
            <button class="btn btn-primary" on:click={handleUpload} disabled={isLoading}>
                {#if isLoading}<span class="loading loading-spinner"></span>{/if}
                Upload
            </button>
        </div>
        {#if error}<p class="text-error text-sm mt-2">{error}</p>{/if}
        {#if success}<p class="text-success text-sm mt-2">{success}</p>{/if}
    </div>
</div>
