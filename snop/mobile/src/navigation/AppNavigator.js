import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import SplashScreen from "../screens/SplashScreen";
import DailyChallengesScreen from "../screens/DailyChallengesScreen";
import WeeklyChallengesScreen from "../screens/WeeklyChallengesScreen";
import MonthlyChallengesScreen from "../screens/MonthlyChallengesScreen";
import DailyScreen from "../screens/DailyScreen";
import WeeklyScreen from "../screens/WeeklyScreen";
import MonthlyScreen from "../screens/MonthlyScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      {/* Carousel screens for browsing challenges */}
      <Stack.Screen name="Daily" component={DailyChallengesScreen} />
      <Stack.Screen name="Weekly" component={WeeklyChallengesScreen} />
      <Stack.Screen name="Monthly" component={MonthlyChallengesScreen} />
      {/* Practice screens for recording and submitting */}
      <Stack.Screen name="DailyPractice" component={DailyScreen} />
      <Stack.Screen name="WeeklyPractice" component={WeeklyScreen} />
      <Stack.Screen name="MonthlyPractice" component={MonthlyScreen} />
    </Stack.Navigator>
  );
}
