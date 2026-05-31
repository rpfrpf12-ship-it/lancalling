import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setDeviceName } = useSocket();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!name.trim() || loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setDeviceName(name.trim());
    router.replace("/(tabs)/");
  }

  const canContinue = name.trim().length > 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 60),
            paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === "web" ? 34 : 0) + 40,
          },
        ]}
      >
        <View style={styles.topSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "1E" }]}>
            <Feather name="wifi" size={42} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>LAN Calling</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            What should we{"\n"}call you?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Other devices on your network{"\n"}will see this name
          </Text>
        </View>

        <View style={styles.inputSection}>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.input,
                borderColor: name ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name="user"
              size={18}
              color={name ? colors.primary : colors.mutedForeground}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Your device name..."
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={30}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.continueBtn,
              { backgroundColor: canContinue ? colors.primary : colors.muted },
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.continueBtnText,
                {
                  color: canContinue
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {loading ? "Connecting..." : "Continue"}
            </Text>
            {!loading && canContinue && (
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  topSection: { alignItems: "center" },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  inputSection: { gap: 14 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 58,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  continueBtn: {
    height: 58,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
