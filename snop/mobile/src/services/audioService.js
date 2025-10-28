import { Audio } from "expo-av";

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
