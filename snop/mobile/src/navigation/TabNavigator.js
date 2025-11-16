import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import StatsScreen from "../screens/StatsScreen";
import { Text, View, StyleSheet } from "react-native";
import { colors, shadows } from "../styles/colors";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Text style={[styles.icon, focused && styles.iconActive]}>HOME</Text>
            </View>
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Text style={[styles.icon, focused && styles.iconActive]}>TOP</Text>
            </View>
          ),
          tabBarLabel: "Leaderboard",
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Text style={[styles.icon, focused && styles.iconActive]}>STATS</Text>
            </View>
          ),
          tabBarLabel: "Stats",
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 40, 104, 0.15)',
  },
  icon: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  iconActive: {
    color: colors.primary,
  },
});
