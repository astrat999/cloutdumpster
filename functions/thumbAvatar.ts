// CLOUD FUNCTION: onFinalize storage trigger for /avatars/{uid}/avatar.jpg → generate 256x256 jpeg thumb with sharp, write to same folder
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import * as sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Initialize admin if not already done
if (!admin.apps.length) {
	admin.initializeApp();
}

const storage = new Storage();

export const thumbAvatar = functions.storage.object().onFinalize(async (object) => {
	const filePath = object.name!;
	const contentType = object.contentType!;

	// Only process avatar images
	if (!filePath.startsWith('avatars/') || !contentType.startsWith('image/')) {
		console.log('Not an avatar image, skipping');
		return null;
	}

	// Don't process thumbnails
	if (filePath.includes('thumb_')) {
		console.log('Already a thumbnail, skipping');
		return null;
	}

	const bucket = storage.bucket(object.bucket);
	const fileName = path.basename(filePath);
	const thumbFileName = `thumb_${fileName}`;
	const thumbFilePath = filePath.replace(fileName, thumbFileName);

	// Download file to temp directory
	const tempFilePath = path.join(os.tmpdir(), fileName);
	const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

	try {
		console.log('Downloading original image...');
		await bucket.file(filePath).download({ destination: tempFilePath });

		console.log('Creating thumbnail...');
		// Create 256x256 thumbnail with Sharp
		await sharp(tempFilePath)
			.resize(256, 256, {
				fit: 'cover',
				position: 'center'
			})
			.jpeg({
				quality: 85,
				progressive: true
			})
			.toFile(tempThumbPath);

		console.log('Uploading thumbnail...');
		// Upload thumbnail
		await bucket.upload(tempThumbPath, {
			destination: thumbFilePath,
			metadata: {
				contentType: 'image/jpeg',
				metadata: {
					isThumb: 'true',
					originalPath: filePath
				}
			}
		});

		console.log('Thumbnail created successfully');

		// Update user document with thumbnail URL
		const userId = filePath.split('/')[1]; // Extract userId from path: avatars/{userId}/avatar.jpg
		if (userId) {
			const thumbUrl = `https://storage.googleapis.com/${object.bucket}/${thumbFilePath}`;
			await admin.firestore().doc(`users/${userId}`).update({
				thumbURL: thumbUrl,
				updatedAt: admin.firestore.FieldValue.serverTimestamp()
			});
			console.log('User document updated with thumbnail URL');
		}

		return null;
	} catch (error) {
		console.error('Error creating thumbnail:', error);
		return null;
	} finally {
		// Clean up temp files
		try {
			fs.unlinkSync(tempFilePath);
			fs.unlinkSync(tempThumbPath);
		} catch (cleanupError) {
			console.warn('Error cleaning up temp files:', cleanupError);
		}
	}
});

// Helper function to manually trigger thumbnail generation for existing avatars
export const generateThumbnails = functions.https.onCall(async (data, context) => {
	// Verify user is authenticated
	if (!context.auth) {
		throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
	}

	const bucket = storage.bucket();
	const [files] = await bucket.getFiles({ prefix: 'avatars/' });

	const promises = files
		.filter(
			(file) =>
				file.name.includes('.jpg') || file.name.includes('.jpeg') || file.name.includes('.png')
		)
		.filter((file) => !file.name.includes('thumb_'))
		.map(async (file) => {
			try {
				const fileName = path.basename(file.name);
				const thumbFileName = `thumb_${fileName}`;
				const thumbFilePath = file.name.replace(fileName, thumbFileName);

				// Check if thumbnail already exists
				const [thumbExists] = await bucket.file(thumbFilePath).exists();
				if (thumbExists) {
					console.log(`Thumbnail already exists for ${file.name}`);
					return;
				}

				// Download and process
				const tempFilePath = path.join(os.tmpdir(), fileName);
				const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

				await file.download({ destination: tempFilePath });

				await sharp(tempFilePath)
					.resize(256, 256, { fit: 'cover', position: 'center' })
					.jpeg({ quality: 85, progressive: true })
					.toFile(tempThumbPath);

				await bucket.upload(tempThumbPath, {
					destination: thumbFilePath,
					metadata: {
						contentType: 'image/jpeg',
						metadata: { isThumb: 'true', originalPath: file.name }
					}
				});

				// Update user document
				const userId = file.name.split('/')[1];
				if (userId) {
					const thumbUrl = `https://storage.googleapis.com/${bucket.name}/${thumbFilePath}`;
					await admin.firestore().doc(`users/${userId}`).update({
						thumbURL: thumbUrl,
						updatedAt: admin.firestore.FieldValue.serverTimestamp()
					});
				}

				// Cleanup
				fs.unlinkSync(tempFilePath);
				fs.unlinkSync(tempThumbPath);

				console.log(`Thumbnail created for ${file.name}`);
			} catch (error) {
				console.error(`Error processing ${file.name}:`, error);
			}
		});

	await Promise.all(promises);
	return { success: true, processed: promises.length };
});
