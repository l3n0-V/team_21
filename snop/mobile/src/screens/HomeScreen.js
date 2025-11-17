import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import Header from "../components/Header";
import { useChallenges } from "../context/ChallengeContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function HomeScreen() {
  const { challenges } = useChallenges();
  const nav = useNavigation();
  const { colors } = useTheme();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleLongPress = (type, items) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPreviewData({ type, items: items.slice(0, 3) });
    setPreviewVisible(true);
  };

  const handlePress = (screenName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nav.navigate(screenName);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <Header />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Challenges</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Select a category to practice pronunciation
      </Text>

      <View style={styles.cardsContainer}>
        <FeatureCard
          title="Daily"
          icon="☀️"
          count={challenges.daily.length}
          onPress={() => handlePress("Daily")}
          onLongPress={() => handleLongPress("Daily", challenges.daily)}
          colors={colors}
        />

        <FeatureCard
          title="Weekly"
          icon="📅"
          count={challenges.weekly.length}
          onPress={() => handlePress("Weekly")}
          onLongPress={() => handleLongPress("Weekly", challenges.weekly)}
          colors={colors}
        />

        <FeatureCard
          title="Monthly"
          icon="🏆"
          count={challenges.monthly.length}
          onPress={() => handlePress("Monthly")}
          onLongPress={() => handleLongPress("Monthly", challenges.monthly)}
          colors={colors}
        />
      </View>
      </ScrollView>

      {/* Long-press Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPreviewVisible(false)}
        >
          <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.primary }]}>
                {previewData?.type} challenges
              </Text>
              <Pressable
                onPress={() => setPreviewVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {previewData?.items.map((item, index) => (
              <View key={item.id} style={[styles.previewItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.previewItemNumber, { color: colors.textSecondary }]}>{index + 1}.</Text>
                <Text style={[styles.previewItemTitle, { color: colors.textPrimary }]}>
                  {item.title_no || item.title}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => {
                setPreviewVisible(false);
                if (previewData?.type === "Daily") handlePress("Daily");
                else if (previewData?.type === "Weekly") handlePress("Weekly");
                else if (previewData?.type === "Monthly") handlePress("Monthly");
              }}
              style={[styles.previewButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.previewButtonText, { color: colors.textWhite }]}>See all</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function FeatureCard({ title, icon, count, onPress, onLongPress, colors }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={500}
    >
      <Animated.View
        style={[
          styles.featureCard,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: colors.background,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}1A` }]}>
          <Text style={styles.cardIcon}>{icon}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.cardCount, { color: colors.textLight }]}>
            {count} {count === 1 ? "challenge" : "challenges"}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </View>

        <Text style={[styles.longPressHint, { color: colors.textLight }]}>Hold for preview</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardTitleEn: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 24,
    fontWeight: "600",
  },
  longPressHint: {
    position: "absolute",
    bottom: 6,
    right: 12,
    fontSize: 10,
    fontStyle: "italic",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  previewContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  previewItemNumber: {
    fontSize: 16,
    fontWeight: "600",
    width: 30,
  },
  previewItemTitle: {
    fontSize: 16,
    flex: 1,
  },
  previewButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  previewButtonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
