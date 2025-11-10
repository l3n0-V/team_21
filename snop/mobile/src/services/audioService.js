import { Audio } from "expo-av";
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

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
    // Convert local URI to blob
    const response = await fetch(audioUri);
    const blob = await response.blob();

    // Create storage reference with timestamp for uniqueness
    const timestamp = Date.now();
    const filename = `audio/${userId}/${challengeId}_${timestamp}.m4a`;
    const storageRef = ref(storage, filename);

    // Upload file
    console.log('Uploading audio to Firebase Storage:', filename);
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('Upload successful:', snapshot.metadata.fullPath);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Audio upload failed:', error);
    throw new Error(`Failed to upload audio: ${error.message}`);
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
    // Convert local URI to blob
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
          reject(new Error(`Failed to upload audio: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Audio upload preparation failed:', error);
    throw new Error(`Failed to prepare audio upload: ${error.message}`);
  }
}
