<script lang="ts">
    import { db } from '$lib/firebase';
    import { doc, updateDoc, increment } from 'firebase/firestore';
    import { userProfile } from '$lib/stores';

    const filters = [
        { name: 'Clout Goggles', icon: '/icons/filter-goggles.png', cost: 100 },
        { name: 'Diamond Skin', icon: '/icons/filter-diamond.png', cost: 100 },
        { name: 'Dumpster Halo', icon: '/icons/filter-halo.png', cost: 100 }
    ];

    // Tactical Order: "Create a function to handle the purchase of a filter."
    async function buyFilter(cost: number) {
        if (!$userProfile) return;
        if ($userProfile.cloutCoin < cost) {
            alert("Not enough CloutCoin. Go rank some users or post something... revealing.");
            return;
        }
        const userDocRef = doc(db, 'users', $userProfile.uid);
        await updateDoc(userDocRef, {
            cloutCoin: increment(-cost)
        });
        alert(`Purchase successful! You now have access to this premium filter.`);
        // In a real app, we'd add the filter name to a user's profile array.
    }
</script>

<div class="card bg-base-100 shadow-xl">
    <div class="card-body">
        <h2 class="card-title">Premium Filters</h2>
        <p>Look better than everyone else. For a price.</p>
        <div class="grid grid-cols-3 gap-4 mt-4">
            {#each filters as filter}
                <div class="text-center">
                    <button class="btn btn-ghost h-24 w-24" on:click={() => buyFilter(filter.cost)}>
                        <img src={filter.icon} alt={filter.name} class="w-16 h-16" />
                    </button>
                    <p class="text-sm">{filter.name}</p>
                    <p class="text-xs font-bold text-warning">{filter.cost} CC</p>
                </div>
            {/each}
        </div>
    </div>
</div>
