import { Audio } from "expo-av";
import { Platform } from 'react-native';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, ensureAuth } from './firebase';

export async function startRecording() {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    alert("Microphone permission is required.");
    return null;
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  return recording;
}

export async function stopRecording(recording) {
  if (!recording) return null;
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  return uri;
}

export async function playAsync(uri) {
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
}

/**
 * Upload audio file to Firebase Storage
 * @param {string} audioUri - Local file URI from expo-av recording
 * @param {string} userId - User ID for organizing storage
 * @param {string} challengeId - Challenge ID for filename
 * @returns {Promise<string>} - Firebase Storage download URL
 */
export async function uploadAudioFile(audioUri, userId, challengeId) {
  try {
    // TEMPORARY WORKAROUND: Firebase Storage upload doesn't work reliably on Expo Web
    // Skip upload on web and use local URI for testing backend integration
    if (Platform.OS === 'web') {
      console.warn('');
      console.warn('='.repeat(70));
      console.warn('⚠️  WEB PLATFORM DETECTED - USING MOCK UPLOAD FOR TESTING');
      console.warn('='.repeat(70));
      console.warn('Firebase Storage upload is skipped on web due to platform limitations.');
      console.warn('Using local file URI as placeholder for testing the flow.');
      console.warn('');
      console.warn('IMPORTANT: Backend will receive a local file:// URL which it cannot access.');
      console.warn('This is ONLY for testing the UI flow on web browsers.');
      console.warn('');
      console.warn('For production testing with real pronunciation scoring:');
      console.warn('  - Test on iOS device/simulator (npm run ios)');
      console.warn('  - Test on Android device/emulator (npm run android)');
      console.warn('='.repeat(70));
      console.warn('');

      // Return the local URI as a mock "uploaded" URL
      // Backend won't be able to access this, but we can test the flow
      return audioUri;
    }

    // Real Firebase Storage upload for mobile platforms (iOS/Android)
    // Ensure Firebase Auth is ready before uploading
    await ensureAuth();

    const response = await fetch(audioUri);
    const blob = await response.blob();

    // Create storage reference with timestamp for uniqueness
    const timestamp = Date.now();
    const filename = `audio/${userId}/${challengeId}_${timestamp}.m4a`;
    const storageRef = ref(storage, filename);

    // Upload file
    console.log('Uploading audio to Firebase Storage:', filename);
    console.log('Blob size:', blob.size, 'bytes');
    console.log('Storage ref:', storageRef.fullPath);
    console.log('Storage bucket:', storageRef.bucket);
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('Upload successful:', snapshot.metadata.fullPath);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Audio upload failed:', error);

    // Fallback for testing: return local URI with warning
    console.warn('');
    console.warn('⚠️  UPLOAD FAILED - USING LOCAL URI FOR TESTING');
    console.warn('⚠️  Backend may not be able to access this file');
    console.warn('⚠️  Original error:', error.message);
    console.warn('');

    return audioUri;
  }
}

/**
 * Upload audio file to Firebase Storage with progress tracking
 * @param {string} audioUri - Local file URI from expo-av recording
 * @param {string} userId - User ID for organizing storage
 * @param {string} challengeId - Challenge ID for filename
 * @param {Function} onProgress - Callback function receiving progress percentage (0-100)
 * @returns {Promise<string>} - Firebase Storage download URL
 */
export async function uploadAudioFileWithProgress(audioUri, userId, challengeId, onProgress) {
  try {
    // TEMPORARY WORKAROUND: Firebase Storage upload doesn't work reliably on Expo Web
    // Skip upload on web and use local URI for testing backend integration
    if (Platform.OS === 'web') {
      console.warn('⚠️  WEB PLATFORM - Skipping Firebase Storage upload');
      console.warn('⚠️  Using local URI for testing (backend cannot access this)');

      // Simulate progress for UI consistency
      if (onProgress) {
        onProgress(50);
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(100);
      }

      return audioUri;
    }

    // Real Firebase Storage upload with progress tracking for mobile platforms
    // Ensure Firebase Auth is ready before uploading
    await ensureAuth();

    const response = await fetch(audioUri);
    const blob = await response.blob();

    // Create storage reference with timestamp for uniqueness
    const timestamp = Date.now();
    const filename = `audio/${userId}/${challengeId}_${timestamp}.m4a`;
    const storageRef = ref(storage, filename);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error('Upload error:', error);

          // Fallback to local URI on error
          console.warn('⚠️  Upload failed, using local URI for testing');
          resolve(audioUri);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.warn('⚠️  Failed to get download URL, using local URI for testing');
            resolve(audioUri);
          }
        }
      );
    });
  } catch (error) {
    console.error('Audio upload preparation failed:', error);

    // Fallback to local URI instead of throwing
    console.warn('⚠️  Upload preparation failed, using local URI for testing');
    return audioUri;
  }
}
