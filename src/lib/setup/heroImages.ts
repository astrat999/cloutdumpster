// Hero Images Setup for CloutDumpster
// Run this script to initialize hero images in Firestore

import { doc, setDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';

export async function setupHeroImages() {
	try {
		const heroImagesRef = doc(db, 'settings', 'heroImages');
		
		await setDoc(heroImagesRef, {
			urls: [
				'/static/hero1.jpg',  // Upload: High-energy party/social scene
				'/static/hero2.jpg',  // Upload: Confident single person pose
				'/static/hero3.jpg'   // Upload: Group/lifestyle shot
			],
			lastUpdated: new Date().toISOString(),
			description: 'Hero images for A/B testing on landing page'
		});

		console.log('✅ Hero images configuration saved to Firestore');
		return true;
	} catch (error) {
		console.error('❌ Error setting up hero images:', error);
		return false;
	}
}

// Instructions for manual Firestore setup:
// 1. Go to Firebase Console → Firestore Database
// 2. Create collection: "settings"
// 3. Create document: "heroImages"
// 4. Add field "urls" (array) with values:
//    - "/static/hero1.jpg"
//    - "/static/hero2.jpg" 
//    - "/static/hero3.jpg"
// 5. Save and the landing page will start rotating images immediately
