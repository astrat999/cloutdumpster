<script lang="ts">
	import type { PageData } from './$types';
	import type { Syndicate } from '$lib/stores';
	import { db, functions } from '$lib/firebase';
	import { user, userProfile } from '$lib/stores';
	import {
		doc,
		updateDoc,
		addDoc,
		collection,
		serverTimestamp,
		Timestamp
	} from 'firebase/firestore';
	import { httpsCallable } from 'firebase/functions';
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	export let data: PageData;

	$: syndicate = data.syndicate;
	$: members = data.members;
	$: userSyndicate = data.userSyndicate as Syndicate | undefined;
	$: endorsements = data.endorsements;
	$: isMember = $user && syndicate.memberIds?.includes($user.uid);
	$: isLeader = $user && syndicate.leaderId === $user.uid;

	// === TACTICAL ORDER: OPERATION CASUS BELLI VARIABLES ===
	$: userSyndicateId = data.userSyndicate?.id; // User's own Syndicate ID for attacks
	$: isUserSyndicateLeader =
		$user && userSyndicate && userSyndicate.leaderId === $user.uid;
	$: isRivalSyndicate = !isMember && userSyndicateId && userSyndicateId !== syndicate.id;

	let contributionAmount = '';
	let isContributing = false;
	let contributionError = '';
	let contributionSuccess = '';
	let endorsingUserId = '';
	let isEndorsing = false;

	// Warfare variables
	let activeTab = 'overview';
	let isLaunchingSmear = false;
	let isLaunchingHeist = false;
	let warfareError = '';
	let warfareSuccess = '';

	// Calculate total clout score
	$: totalCloutScore = members.reduce(
		(sum: number, member: any) => sum + (member.cloutScore || 0),
		0
	);

	// Check if user has active endorsement
	function hasActiveEndorsement(userId: string): boolean {
		const now = new Date();
		return endorsements.some(
			(endorsement: any) =>
				endorsement.userId === userId &&
				endorsement.expiresAt &&
				new Date(endorsement.expiresAt.toDate()) > now
		);
	}

	// Get active endorsement boost for user
	function getEndorsementBoost(userId: string): number {
		const now = new Date();
		const activeEndorsement = endorsements.find(
			(endorsement: any) =>
				endorsement.userId === userId &&
				endorsement.expiresAt &&
				new Date(endorsement.expiresAt.toDate()) > now
		);
		return activeEndorsement?.boostAmount || 0;
	}

	async function contributeToTreasury() {
		if (!$user || !$userProfile || !isMember) return;

		const amount = parseInt(contributionAmount);
		if (isNaN(amount) || amount <= 0) {
			contributionError = 'Enter a valid amount greater than 0.';
			return;
		}

		if (amount > ($userProfile.cloutCoin || 0)) {
			contributionError = 'Insufficient CloutCoin™. Your poverty is showing.';
			return;
		}

		isContributing = true;
		contributionError = '';
		contributionSuccess = '';

		try {
			// Update user's balance
			const userRef = doc(db, 'users', $user.uid);
			await updateDoc(userRef, {
				cloutCoin: ($userProfile.cloutCoin || 0) - amount
			});

			// Update syndicate treasury
			const syndicateRef = doc(db, 'syndicates', syndicate.id);
			await updateDoc(syndicateRef, {
				treasury: syndicate.treasury + amount
			});

			// Update local stores
			$userProfile.cloutCoin = ($userProfile.cloutCoin || 0) - amount;
			userProfile.set($userProfile);
			syndicate.treasury += amount;

			contributionSuccess = `Contributed ${amount.toLocaleString()} CloutCoin™ to the treasury.`;
			contributionAmount = '';

			// Refresh page data
			setTimeout(() => {
				location.reload();
			}, 1500);
		} catch (error) {
			console.error('Contribution failed:', error);
			contributionError = 'Contribution failed. The treasury rejected your offering.';
		} finally {
			isContributing = false;
		}
	}

	async function endorseMember(userId: string, username: string) {
		if (!$user || !isMember || !isLeader) return;

		const ENDORSEMENT_COST = 50;
		if (syndicate.treasury < ENDORSEMENT_COST) {
			alert(`Insufficient treasury funds. Need ${ENDORSEMENT_COST} CloutCoin™ to endorse.`);
			return;
		}

		if (hasActiveEndorsement(userId)) {
			alert('This member already has an active endorsement.');
			return;
		}

		endorsingUserId = userId;
		isEndorsing = true;

		try {
			// Deduct from syndicate treasury
			const syndicateRef = doc(db, 'syndicates', syndicate.id);
			await updateDoc(syndicateRef, {
				treasury: syndicate.treasury - ENDORSEMENT_COST
			});

			// Create endorsement record
			const expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

			await addDoc(collection(db, 'endorsements'), {
				userId: userId,
				syndicateId: syndicate.id,
				syndicateTag: syndicate.tag,
				boostAmount: 50,
				createdAt: serverTimestamp(),
				expiresAt: Timestamp.fromDate(expiresAt)
			});

			// Update local syndicate treasury
			syndicate.treasury -= ENDORSEMENT_COST;

			alert(`Endorsed ${username} with +50 Clout boost for 24 hours!`);

			// Refresh page data
			setTimeout(() => {
				location.reload();
			}, 1000);
		} catch (error) {
			console.error('Endorsement failed:', error);
			alert('Endorsement failed. The member remains unblessed.');
		} finally {
			endorsingUserId = '';
			isEndorsing = false;
		}
	}

	// === TACTICAL ORDER: OPERATION CASUS BELLI FUNCTIONS ===

	async function launchSmearCampaign() {
		if (!$user || !isUserSyndicateLeader || !userSyndicateId) {
			warfareError = 'Only Syndicate leaders can launch attacks.';
			return;
		}

		const SMEAR_COST = 2500;
		if (!userSyndicate || userSyndicate.treasury < SMEAR_COST) {
			warfareError = `Insufficient treasury funds. Need ${SMEAR_COST.toLocaleString()} CloutCoin™.`;
			return;
		}

		isLaunchingSmear = true;
		warfareError = '';
		warfareSuccess = '';

		try {
			const executeSmearCampaign = httpsCallable(functions, 'executeSmearCampaign');
			const result = await executeSmearCampaign({
				attackerSyndicateId: userSyndicateId,
				targetSyndicateId: syndicate.id
			});

			const data_result = result.data as any;
			warfareSuccess = `Smear campaign launched! ${data_result.membersTargeted} members targeted. ${data_result.costDeducted.toLocaleString()} CloutCoin™ deducted.`;

			// Refresh page after delay
			setTimeout(() => {
				location.reload();
			}, 3000);
		} catch (error: any) {
			console.error('Smear campaign failed:', error);
			warfareError = error.message || 'Attack failed. Your sabotage was detected.';
		} finally {
			isLaunchingSmear = false;
		}
	}

	async function launchCloutHeist() {
		if (!$user || !isUserSyndicateLeader || !userSyndicateId) {
			warfareError = 'Only Syndicate leaders can launch attacks.';
			return;
		}

		const HEIST_COST = 5000;
		if (!data.userSyndicate || data.userSyndicate.treasury < HEIST_COST) {
			warfareError = `Insufficient treasury funds. Need ${HEIST_COST.toLocaleString()} CloutCoin™.`;
			return;
		}

		isLaunchingHeist = true;
		warfareError = '';
		warfareSuccess = '';

		try {
			const executeCloutHeist = httpsCallable(functions, 'executeCloutHeist');
			const result = await executeCloutHeist({
				attackerSyndicateId: userSyndicateId,
				targetSyndicateId: syndicate.id
			});

			const data_result = result.data as any;
			warfareSuccess = `Clout heist successful! Stolen ${data_result.totalCloutStolen} clout, redistributed ${data_result.redistributedClout} among your members. ${data_result.costDeducted.toLocaleString()} CloutCoin™ deducted.`;

			// Refresh page after delay
			setTimeout(() => {
				location.reload();
			}, 3000);
		} catch (error: any) {
			console.error('Clout heist failed:', error);
			warfareError = error.message || 'Heist failed. Your theft was thwarted.';
		} finally {
			isLaunchingHeist = false;
		}
	}
</script>

<svelte:head>
	<title>{syndicate.name} - CloutDumpster</title>
</svelte:head>

<Header />

<main class="min-h-screen bg-velvet pt-20 font-body">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<!-- Syndicate Header -->
		<div class="mb-8 rounded-2xl border border-royal/20 bg-silk/30 p-8">
			<div class="mb-6 flex items-start justify-between">
				<div class="flex items-start space-x-6">
					<!-- Syndicate Logo -->
					<div
						class="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-royal to-purple-700"
					>
						<span class="text-2xl font-bold text-white">{syndicate.tag}</span>
					</div>

					<!-- Syndicate Info -->
					<div>
						<h1 class="mb-2 font-display text-4xl font-bold text-white">{syndicate.name}</h1>
						<div class="mb-4 flex items-center space-x-4 text-gray-400">
							<span>[{syndicate.tag}]</span>
							<span>•</span>
							<span
								>Founded {syndicate.createdAt?.toDate
									? new Date(syndicate.createdAt.toDate()).toLocaleDateString()
									: 'Recently'}</span
							>
						</div>
						<p class="max-w-2xl text-lg text-gray-300">{syndicate.description}</p>
					</div>
				</div>

				<!-- Join/Member Status -->
				<div class="text-right">
					{#if isMember}
						<div class="mb-2 rounded-xl border border-green-500/30 bg-green-500/20 px-4 py-2">
							<span class="font-semibold text-green-400">
								{isLeader ? '👑 Leader' : '👤 Member'}
							</span>
						</div>
					{:else}
						<div class="mb-2 rounded-xl border border-gray-500/30 bg-gray-500/20 px-4 py-2">
							<span class="text-gray-400">👁️ Outsider</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Stats Grid -->
			<div class="grid grid-cols-4 gap-8 text-center">
				<div>
					<div class="font-display text-3xl font-bold text-gold">
						{syndicate.treasury.toLocaleString()}
					</div>
					<div class="text-gray-400">Treasury</div>
				</div>
				<div>
					<div class="font-display text-3xl font-bold text-electric">{members.length}</div>
					<div class="text-gray-400">Members</div>
				</div>
				<div>
					<div class="font-display text-3xl font-bold text-white">
						{totalCloutScore.toLocaleString()}
					</div>
					<div class="text-gray-400">Total Clout</div>
				</div>
				<div>
					<div class="font-display text-3xl font-bold text-royal">
						#{Math.floor(Math.random() * 10) + 1}
					</div>
					<div class="text-gray-400">Rank</div>
				</div>
			</div>
		</div>

		{#if isMember}
			<!-- Member View - Private Hub -->
			<div class="grid gap-8 lg:grid-cols-3">
				<!-- Members List -->
				<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6 lg:col-span-2">
					<h2 class="mb-6 font-display text-2xl font-bold text-white">
						Syndicate Members ({members.length})
					</h2>

					<div class="space-y-4">
						{#each members as member}
							<div class="flex items-center justify-between rounded-xl bg-velvet/50 p-4">
								<div class="flex items-center space-x-4">
									<!-- Member Avatar/Initial -->
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-royal to-purple-600"
									>
										<span class="font-bold text-white">
											{member.username?.charAt(0).toUpperCase() || '?'}
										</span>
									</div>

									<!-- Member Info -->
									<div>
										<div class="flex items-center space-x-2">
											<span class="font-semibold text-white">{member.username}</span>
											{#if member.uid === syndicate.leaderId}
												<span class="text-sm text-gold">👑 Leader</span>
											{/if}
											{#if hasActiveEndorsement(member.uid)}
												<span class="rounded bg-gold/20 px-2 py-1 text-xs font-bold text-gold">
													ENDORSED +{getEndorsementBoost(member.uid)}
												</span>
											{/if}
										</div>
										<div class="text-sm text-gray-400">
											Clout Score: {member.cloutScore?.toLocaleString() || 0}
											{#if hasActiveEndorsement(member.uid)}
												<span class="text-gold"> (+{getEndorsementBoost(member.uid)})</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- Endorse Button (Leader Only) -->
								{#if isLeader && member.uid !== $user?.uid && !hasActiveEndorsement(member.uid)}
									<button
										class="flex items-center space-x-1 rounded-lg bg-gradient-to-r from-gold to-yellow-600 px-4 py-2 font-semibold text-black transition-colors hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50"
										on:click={() => endorseMember(member.uid, member.username)}
										disabled={isEndorsing || endorsingUserId === member.uid}
									>
										{#if endorsingUserId === member.uid}
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
											></div>
										{:else}
											<span>⭐</span>
										{/if}
										<span>Endorse (-50)</span>
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Treasury & Actions -->
				<div class="space-y-6">
					<!-- Treasury Management -->
					<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
						<h3 class="mb-4 font-display text-xl font-bold text-white">Treasury Management</h3>

						<div class="mb-6 text-center">
							<div class="mb-1 font-display text-3xl font-bold text-gold">
								{syndicate.treasury.toLocaleString()}
							</div>
							<div class="text-sm text-gray-400">CloutCoin™ Available</div>
						</div>

						<!-- Contribution Form -->
						<div class="space-y-4">
							<div>
								<label class="mb-2 block font-semibold text-white">Contribute CloutCoin™</label>
								<input
									type="number"
									class="w-full rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none"
									placeholder="Amount"
									bind:value={contributionAmount}
									min="1"
									disabled={isContributing}
								/>
								<div class="mt-1 text-xs text-gray-400">
									Your balance: {($userProfile?.cloutCoin || 0).toLocaleString()}
								</div>
							</div>

							<button
								class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-royal to-purple-600 py-3 font-semibold text-white transition-colors hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
								on:click={contributeToTreasury}
								disabled={isContributing || !contributionAmount}
							>
								{#if isContributing}
									<div
										class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
									></div>
								{:else}
									<span>💰</span>
								{/if}
								<span>Contribute</span>
							</button>

							{#if contributionError}
								<div class="rounded-xl border border-red-500/30 bg-red-500/20 p-3">
									<p class="text-sm text-red-400">{contributionError}</p>
								</div>
							{/if}

							{#if contributionSuccess}
								<div class="rounded-xl border border-green-500/30 bg-green-500/20 p-3">
									<p class="text-sm text-green-400">{contributionSuccess}</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Quick Stats -->
					<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
						<h3 class="mb-4 font-display text-xl font-bold text-white">Quick Stats</h3>

						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-400">Your Rank in Syndicate:</span>
								<span class="font-semibold text-white">
									#{members.findIndex((m: any) => m.uid === $user?.uid) + 1}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-400">Active Endorsements:</span>
								<span class="font-semibold text-gold">
									{endorsements.filter(
										(e: any) => e.expiresAt && new Date(e.expiresAt.toDate()) > new Date()
									).length}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-400">Treasury per Member:</span>
								<span class="font-semibold text-electric">
									{Math.floor(syndicate.treasury / members.length).toLocaleString()}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Public View - Limited Information with Warfare Options -->
			<div class="space-y-8">
				<!-- Tab Navigation for Rival Syndicates -->
				{#if isRivalSyndicate && isUserSyndicateLeader}
					<div class="mb-8 flex justify-center space-x-4">
						<button
							class="rounded-xl px-6 py-3 font-semibold transition-colors {activeTab === 'overview'
								? 'bg-royal text-white'
								: 'bg-silk/30 text-gray-300 hover:text-white'}"
							on:click={() => (activeTab = 'overview')}
						>
							📊 Overview
						</button>
						<button
							class="rounded-xl px-6 py-3 font-semibold transition-colors {activeTab === 'actions'
								? 'bg-red-600 text-white'
								: 'bg-silk/30 text-gray-300 hover:text-white'}"
							on:click={() => (activeTab = 'actions')}
						>
							⚔️ Actions
						</button>
					</div>
				{/if}

				{#if activeTab === 'overview' || !isRivalSyndicate || !isUserSyndicateLeader}
					<!-- Standard Public View -->
					<div class="rounded-2xl border border-royal/20 bg-silk/30 p-8 text-center">
						<div
							class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-800"
						>
							<span class="text-4xl">🔒</span>
						</div>

						<h2 class="mb-4 font-display text-3xl font-bold text-white">Access Restricted</h2>
						<p class="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
							This Syndicate's internal affairs are for members only. Only public information is
							visible to outsiders.
						</p>

						<!-- Public Member List -->
						<div class="mb-8 rounded-xl bg-velvet/30 p-6">
							<h3 class="mb-4 font-display text-xl font-bold text-white">
								Public Members ({members.length})
							</h3>
							<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
								{#each members.slice(0, 8) as member}
									<div class="text-center">
										<div
											class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-royal to-purple-600"
										>
											<span class="text-sm font-bold text-white">
												{member.username?.charAt(0).toUpperCase() || '?'}
											</span>
										</div>
										<div class="text-sm font-semibold text-white">{member.username}</div>
										<div class="text-xs text-gray-400">
											{member.cloutScore?.toLocaleString() || 0}
										</div>
									</div>
								{/each}
								{#if members.length > 8}
									<div class="text-center text-gray-400">
										<div
											class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-600"
										>
											<span class="text-gray-300">+{members.length - 8}</span>
										</div>
										<div class="text-xs">More...</div>
									</div>
								{/if}
							</div>
						</div>

						<a
							href="/syndicates"
							class="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-royal to-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:from-purple-600 hover:to-purple-700"
						>
							<span>← Browse All Syndicates</span>
						</a>
					</div>
				{:else if activeTab === 'actions'}
					<!-- === WARFARE ACTIONS TAB === -->
					<div class="rounded-2xl border border-red-500/20 bg-silk/30 p-8">
						<div class="mb-8 text-center">
							<div
								class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800"
							>
								<span class="text-4xl">⚔️</span>
							</div>

							<h2 class="mb-4 font-display text-3xl font-bold text-white">Syndicate Warfare</h2>
							<p class="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
								Launch coordinated attacks against <span class="font-semibold text-red-400"
									>[{syndicate.tag}]</span
								>. All actions are funded by your Syndicate treasury and will be publicly logged.
							</p>

							<!-- User's Syndicate Info -->
							{#if data.userSyndicate}
								<div class="mx-auto mb-8 max-w-md rounded-xl bg-velvet/50 p-4">
									<h3 class="mb-2 font-semibold text-white">
										Your Treasury: [{data.userSyndicate.tag}]
									</h3>
									<div class="text-2xl font-bold text-gold">
										{data.userSyndicate.treasury.toLocaleString()} CloutCoin™
									</div>
								</div>
							{/if}
						</div>

						<!-- Warfare Actions Grid -->
						<div class="grid gap-8 md:grid-cols-2">
							<!-- Smear Campaign -->
							<div class="rounded-xl border border-yellow-500/20 bg-velvet/50 p-6">
								<div class="mb-6 text-center">
									<div
										class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-600"
									>
										<span class="text-2xl">🗞️</span>
									</div>
									<h3 class="mb-2 font-display text-xl font-bold text-white">Smear Campaign</h3>
									<p class="mb-4 text-sm text-gray-400">
										Launch coordinated character assassination against all rival members. Adds
										permanent "Anonymous Rival" roasts to their profiles.
									</p>
									<div class="text-lg font-bold text-yellow-400">Cost: 2,500 CloutCoin™</div>
								</div>

								<button
									class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 py-3 font-bold text-black transition-colors hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
									on:click={launchSmearCampaign}
									disabled={isLaunchingSmear ||
										!data.userSyndicate ||
										data.userSyndicate.treasury < 2500}
								>
									{#if isLaunchingSmear}
										<div
											class="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black"
										></div>
									{:else}
										<span>🗞️</span>
									{/if}
									<span>Launch Smear Campaign</span>
								</button>
							</div>

							<!-- Clout Heist -->
							<div class="rounded-xl border border-red-500/20 bg-velvet/50 p-6">
								<div class="mb-6 text-center">
									<div
										class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700"
									>
										<span class="text-2xl">💎</span>
									</div>
									<h3 class="mb-2 font-display text-xl font-bold text-white">Clout Heist</h3>
									<p class="mb-4 text-sm text-gray-400">
										Coordinate a direct assault on rival clout scores. Steals 1-5 points from each
										member, redistributes 50% among your Syndicate.
									</p>
									<div class="text-lg font-bold text-red-400">Cost: 5,000 CloutCoin™</div>
								</div>

								<button
									class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 py-3 font-bold text-white transition-colors hover:from-red-600 hover:to-red-800 disabled:opacity-50"
									on:click={launchCloutHeist}
									disabled={isLaunchingHeist ||
										!data.userSyndicate ||
										data.userSyndicate.treasury < 5000}
								>
									{#if isLaunchingHeist}
										<div
											class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
										></div>
									{:else}
										<span>💎</span>
									{/if}
									<span>Initiate Clout Heist</span>
								</button>
							</div>
						</div>

						<!-- Warfare Results -->
						{#if warfareError}
							<div class="mt-6 rounded-xl border border-red-500/30 bg-red-500/20 p-4">
								<p class="text-center font-semibold text-red-400">{warfareError}</p>
							</div>
						{/if}

						{#if warfareSuccess}
							<div class="mt-6 rounded-xl border border-green-500/30 bg-green-500/20 p-4">
								<p class="text-center font-semibold text-green-400">{warfareSuccess}</p>
							</div>
						{/if}

						<!-- Warning -->
						<div class="mt-8 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
							<p class="text-center text-sm text-yellow-400">
								⚠️ All attacks are publicly logged and will trigger retaliation. Warfare escalates
								quickly. Proceed with caution.
							</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</main>
