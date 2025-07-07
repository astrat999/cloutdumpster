// Push Notification Test Utility
// Use this in browser console to test FCM integration

export async function testPushNotification() {
	if (!('serviceWorker' in navigator)) {
		console.error('Service Worker not supported');
		return;
	}

	try {
		// Import FCM
		const { getMessaging, getToken } = await import('firebase/messaging');
		const { app } = await import('$lib/firebase');
		const messaging = getMessaging(app);

		const vapidKey = import.meta.env.VITE_VAPID_KEY;
		if (!vapidKey) {
			console.error('❌ VITE_VAPID_KEY not configured in environment');
			console.log('Add to Netlify: Site Settings → Environment Variables');
			return;
		}

		// Get FCM token
		const token = await getToken(messaging, { vapidKey });
		if (token) {
			console.log('✅ FCM Token:', token);
			console.log('\n📋 Copy this token and use it in Firebase Console:');
			console.log('Firebase Console → Cloud Messaging → Send test message');
			console.log('\n🔥 Test notification payload:');
			console.log(JSON.stringify({
				title: '🔥 Someone ranked you!',
				body: 'Fight back before your score tanks.',
				icon: '/favicon.svg',
				badge: '/favicon.svg',
				data: {
					url: '/feed',
					action: 'view_feed'
				}
			}, null, 2));
		} else {
			console.error('❌ No FCM token received');
		}
	} catch (error) {
		console.error('❌ Push notification test failed:', error);
	}
}

// Test in browser console:
// 1. Open DevTools → Console
// 2. Type: testPushNotification()
// 3. Copy the token and use in Firebase Console
