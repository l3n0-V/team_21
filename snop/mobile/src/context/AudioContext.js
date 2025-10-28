import React, { createContext, useContext, useRef, useState } from "react";
import { startRecording, stopRecording, playAsync } from "../services/audioService";

const AudioContext = createContext();
export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const [recording, setRecording] = useState(null);
  const [lastUri, setLastUri] = useState(null);
  const isRecordingRef = useRef(false);

  const begin = async () => {
    if (isRecordingRef.current) return;
    const rec = await startRecording();
    if (rec) {
      setRecording(rec);
      isRecordingRef.current = true;
    }
  };

  const end = async () => {
    if (!isRecordingRef.current) return null;
    const uri = await stopRecording(recording);
    setRecording(null);
    isRecordingRef.current = false;
    setLastUri(uri);
    return uri;
  };

  const playLast = async () => {
    if (lastUri) await playAsync(lastUri);
  };

  return (
    <AudioContext.Provider value={{ recording, lastUri, begin, end, playLast }}>
      {children}
    </AudioContext.Provider>
  );
}
