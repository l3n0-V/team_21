import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { ChallengeProvider } from "./src/context/ChallengeContext";
import { AudioProvider } from "./src/context/AudioContext";

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#ffffff" }
};

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <AuthProvider>
        <ChallengeProvider>
          <AudioProvider>
            <AppNavigator />
          </AudioProvider>
        </ChallengeProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
