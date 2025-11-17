import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import StatsScreen from "../screens/StatsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 28,
          height: 85,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.iconWrapper}>
              {focused && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.iconWrapper}>
              {focused && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
              <Ionicons
                name={focused ? "trophy" : "trophy-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: "Leaderboard",
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.iconWrapper}>
              {focused && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: "Stats",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={styles.iconWrapper}>
              {focused && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
});
