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
import { colors, shadows } from "../styles/colors";

export default function HomeScreen() {
  const { challenges } = useChallenges();
  const nav = useNavigation();
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
    <View style={styles.mainContainer}>
      <Header />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Utfordringer</Text>
      <Text style={styles.sectionSubtitle}>
        Velg en kategori for å øve uttale
      </Text>

      <View style={styles.cardsContainer}>
        <FeatureCard
          title="Daglig"
          titleEn="Daily"
          icon="☀️"
          count={challenges.daily.length}
          onPress={() => handlePress("Daily")}
          onLongPress={() => handleLongPress("Daglige", challenges.daily)}
        />

        <FeatureCard
          title="Ukentlig"
          titleEn="Weekly"
          icon="📅"
          count={challenges.weekly.length}
          onPress={() => handlePress("Weekly")}
          onLongPress={() => handleLongPress("Ukentlige", challenges.weekly)}
        />

        <FeatureCard
          title="Månedlig"
          titleEn="Monthly"
          icon="🏆"
          count={challenges.monthly.length}
          onPress={() => handlePress("Monthly")}
          onLongPress={() => handleLongPress("Månedlige", challenges.monthly)}
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
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {previewData?.type} utfordringer
              </Text>
              <Pressable
                onPress={() => setPreviewVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {previewData?.items.map((item, index) => (
              <View key={item.id} style={styles.previewItem}>
                <Text style={styles.previewItemNumber}>{index + 1}.</Text>
                <Text style={styles.previewItemTitle}>
                  {item.title_no || item.title}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => {
                setPreviewVisible(false);
                if (previewData?.type === "Daglige") handlePress("Daily");
                else if (previewData?.type === "Ukentlige") handlePress("Weekly");
                else if (previewData?.type === "Månedlige") handlePress("Monthly");
              }}
              style={styles.previewButton}
            >
              <Text style={styles.previewButtonText}>Se alle</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function FeatureCard({ title, titleEn, icon, count, onPress, onLongPress }) {
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
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.cardIcon}>{icon}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardTitleEn}>{titleEn}</Text>
          <Text style={styles.cardCount}>
            {count} {count === 1 ? "utfordring" : "utfordringer"}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>

        <Text style={styles.longPressHint}>Hold inne for forhåndsvisning</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.medium,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "rgba(0, 40, 104, 0.1)",
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardTitleEn: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: "500",
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.primary,
  },
  longPressHint: {
    position: "absolute",
    bottom: 6,
    right: 12,
    fontSize: 10,
    color: colors.textLight,
    fontStyle: "italic",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  previewContainer: {
    backgroundColor: colors.background,
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
    color: colors.primary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewItemNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    width: 30,
  },
  previewItemTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  previewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  previewButtonText: {
    color: colors.textWhite,
    fontWeight: "700",
    fontSize: 16,
  },
});
