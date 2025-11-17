import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { UserStatsProvider } from "./src/context/UserStatsContext";
import { ChallengeProvider } from "./src/context/ChallengeContext";
import { AudioProvider } from "./src/context/AudioContext";
import { PerformanceProvider } from "./src/context/PerformanceContext";
import ErrorBoundary from "./src/components/ErrorBoundary";

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#ffffff" }
};

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer theme={theme}>
        <AuthProvider>
          <UserStatsProvider>
            <PerformanceProvider>
              <ChallengeProvider>
                <AudioProvider>
                  <AppNavigator />
                </AudioProvider>
              </ChallengeProvider>
            </PerformanceProvider>
          </UserStatsProvider>
        </AuthProvider>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
