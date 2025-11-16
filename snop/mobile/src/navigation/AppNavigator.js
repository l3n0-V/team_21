import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import SplashScreen from "../screens/SplashScreen";
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
      <Stack.Screen name="Daily" component={DailyScreen} />
      <Stack.Screen name="Weekly" component={WeeklyScreen} />
      <Stack.Screen name="Monthly" component={MonthlyScreen} />
    </Stack.Navigator>
  );
}
