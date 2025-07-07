// VERTICAL HOT/NOT FEED: infinite scroll list of user avatars, full-height card, 👍 👎 vote buttons, Firestore pagination with startAfter + limit
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { db } from '$lib/firebase';
  import { user, userProfile } from '$lib/stores';
  import { collection, query, orderBy, limit, getDocs, doc, updateDoc, increment, startAfter, where, setDoc, serverTimestamp } from 'firebase/firestore';
  import { goto } from '$app/navigation';

  interface HotUser {
    id: string;
    username: string;
    photoURL: string;
    thumbnailURL?: string;
    cloutScore: number;
    votes?: number;
  }

  let users: HotUser[] = [];
  let currentIndex = 0;
  let loading = true;
  let voting = false;
  let lastDoc: any = null;
  let hasMore = true;
  let intersectionObserver: IntersectionObserver | null = null;
  let sentinelElement: HTMLElement;

  $: currentUser = users[currentIndex];

  onMount(async () => {
    if (!$user) {
      goto('/');
      return;
    }
    await loadUsers();
    setupInfiniteScroll();
    setupKeyboardNavigation();
  });

  onDestroy(() => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
  });

  // BEGIN user loading with pagination
  async function loadUsers(loadMore = false) {
    if (loading && loadMore) return;
    
    loading = true;
    try {
      let usersQuery = query(
        collection(db, 'users'),
        where('uid', '!=', $user?.uid || ''), // Exclude current user
        orderBy('uid'), // Required for != queries
        orderBy('cloutScore', 'desc'),
        limit(10)
      );

      if (loadMore && lastDoc) {
        usersQuery = query(usersQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        hasMore = false;
        return;
      }

      const newUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HotUser[];

      if (loadMore) {
        users = [...users, ...newUsers];
      } else {
        users = newUsers;
        currentIndex = 0;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.docs.length === 10;

    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      loading = false;
    }
  }
  // END user loading

  // BEGIN infinite scroll setup
  function setupInfiniteScroll() {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadUsers(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sentinelElement) {
      intersectionObserver.observe(sentinelElement);
    }
  }

  function setupKeyboardNavigation() {
    function handleKeyPress(event: KeyboardEvent) {
      if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        vote(1); // Hot
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        vote(-1); // Not
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }
  // END infinite scroll

  // BEGIN voting system
  async function vote(type: number) {
    if (voting || !currentUser || !$user) return;
    
    voting = true;
    
    try {
      // Record the vote
      await updateDoc(doc(db, 'users', currentUser.id), {
        cloutScore: increment(type),
        votes: increment(1)
      });

      // Add vote record for tracking
      await setDoc(doc(db, 'votes'), {
        voterId: $user.uid,
        targetId: currentUser.id,
        targetUsername: currentUser.username,
        type: type === 1 ? 'hot' : 'not',
        createdAt: serverTimestamp()
      });

      // Move to next user
      nextUser();

    } catch (error) {
      console.error('Voting failed:', error);
    } finally {
      voting = false;
    }
  }

  function nextUser() {
    if (currentIndex < users.length - 1) {
      currentIndex++;
    } else if (hasMore && !loading) {
      // Load more users if we've reached the end
      loadUsers(true).then(() => {
        currentIndex++;
      });
    } else {
      // No more users, loop back to start
      currentIndex = 0;
    }
  }
  // END voting system

  function goToProfile(userId: string) {
    goto(`/profile/${userId}`);
  }
</script>
        where('photoURL', '!=', ''), // Only users with photos
        orderBy('photoURL'), // Required for != filter
        orderBy('cloutScore', 'desc'),
        limit(20)
      );
      
      if (loadMore && lastDoc) {
        usersQuery = query(usersQuery, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        hasMore = false;
        loading = false;
        return;
      }
      
      const newUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as HotUser))
        .filter(user => user.id !== $user?.uid); // Don't show current user
      
      if (loadMore) {
        users = [...users, ...newUsers];
      } else {
        users = newUsers;
      }
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.docs.length === 20;
      
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      loading = false;
    }
  }

  // Setup intersection observer for infinite scroll
  function setupInfiniteScroll() {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadUsers(true);
          }
        });
      },
      { threshold: 0.1 }
    );
  }
  // END user loading with pagination

  async function vote(userId: string, value: 1 | -1) {
    if (voting || !$user) return;
    
    voting = true;
    try {
      // Update the user's clout score
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        cloutScore: increment(value * 10), // Each vote is worth 10 points
        votes: increment(1)
      });

      // Move to next user
      if (currentIndex < users.length - 1) {
        currentIndex++;
      } else {
        // Reload more users when we reach the end
        await loadUsers();
        currentIndex = 0;
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      voting = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      vote(currentUser.id, -1);
    } else if (event.key === 'ArrowRight') {
      vote(currentUser.id, 1);
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-black flex flex-col items-center justify-center p-4">
  {#if loading}
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4"></div>
      <p class="text-white">Loading hot people...</p>
    </div>
  {:else if currentUser}
    <!-- Hot/Not Interface -->
    <div class="max-w-sm w-full mx-auto">
      <!-- User Card -->
      <div class="relative mb-8 group">
        <div class="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-900 relative">
          {#if currentUser.photoURL}
            <img 
              src={currentUser.photoURL} 
              alt={currentUser.username}
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
              <span class="text-white text-6xl font-bold">
                {currentUser.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          {/if}
          
          <!-- Overlay gradient -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <!-- User info overlay -->
          <div class="absolute bottom-6 left-6 right-6">
            <h3 class="text-white font-bold text-2xl mb-1">@{currentUser.username}</h3>
            <div class="flex items-center space-x-2">
              <span class="text-accent font-bold">{currentUser.cloutScore}</span>
              <span class="text-gray-300 text-sm">clout</span>
            </div>
          </div>

          <!-- Vote buttons overlay -->
          <div class="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="flex space-x-6">
              <button
                on:click={() => vote(currentUser.id, -1)}
                disabled={voting}
                class="w-16 h-16 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                👎
              </button>
              <button
                on:click={() => vote(currentUser.id, 1)}
                disabled={voting}
                class="w-16 h-16 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                👍
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vote buttons (always visible on mobile) -->
      <div class="flex space-x-4 mb-8 md:hidden">
        <button
          on:click={() => vote(currentUser.id, -1)}
          disabled={voting}
          class="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
        >
          <span class="text-2xl">👎</span>
          <span>Not Hot</span>
        </button>
        <button
          on:click={() => vote(currentUser.id, 1)}
          disabled={voting}
          class="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
        >
          <span class="text-2xl">👍</span>
          <span>Hot</span>
        </button>
      </div>

      <!-- Instructions -->
      <div class="text-center text-gray-400 text-sm">
        <p class="mb-2">Use arrow keys or tap buttons to vote</p>
        <p class="text-xs">
          {currentIndex + 1} of {users.length} • 
          <span class="text-accent">{users.length - currentIndex - 1}</span> remaining
        </p>
      </div>
    </div>
  {:else}
    <!-- Empty state -->
    <div class="text-center">
      <div class="text-6xl mb-4">🔥</div>
      <h3 class="text-white text-xl font-bold mb-2">No more people to rate!</h3>
      <p class="text-gray-400 mb-6">Check back later for fresh faces</p>
      <button 
        on:click={() => goto('/feed')}
        class="btn-primary"
      >
        Go to Feed
      </button>
    </div>
  {/if}
</div>
