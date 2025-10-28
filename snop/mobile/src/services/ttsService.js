import * as Speech from "expo-speech";

export function speak(text) {
  if (!text) return;
  Speech.speak(text, { language: "en-US", pitch: 1.0, rate: 1.0 });
}
