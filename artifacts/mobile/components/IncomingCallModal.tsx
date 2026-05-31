import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSocket } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";

export function IncomingCallModal() {
  const colors = useColors();
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useSocket();
  const ringScale = useSharedValue(1);
  const outerScale = useSharedValue(1);

  useEffect(() => {
    if (incomingCall) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      ringScale.value = withRepeat(
        withTiming(1.2, { duration: 900, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
      outerScale.value = withRepeat(
        withTiming(1.45, { duration: 1300, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
    } else {
      ringScale.value = 1;
      outerScale.value = 1;
    }
  }, [!!incomingCall]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: 2.2 - ringScale.value,
  }));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: (2 - outerScale.value) * 0.35,
  }));

  if (!incomingCall) return null;

  const initials = incomingCall.fromName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <Modal transparent animationType="slide" visible statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: "rgba(5,8,18,0.92)" }]}>
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.incomingLabel, { color: colors.mutedForeground }]}>
            INCOMING CALL
          </Text>

          <View style={styles.avatarWrap}>
            <Animated.View
              style={[
                styles.outerRing,
                { borderColor: colors.online + "45" },
                outerStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.innerRing,
                { borderColor: colors.online + "70" },
                ringStyle,
              ]}
            />
            <View style={[styles.avatar, { backgroundColor: colors.primary + "28" }]}>
              <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
            </View>
          </View>

          <Text style={[styles.callerName, { color: colors.foreground }]}>
            {incomingCall.fromName}
          </Text>
          <Text style={[styles.callerSub, { color: colors.mutedForeground }]}>
            Voice Call
          </Text>

          <View style={styles.buttons}>
            <View style={styles.btnWrap}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.destructive }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  rejectIncomingCall();
                }}
                activeOpacity={0.8}
              >
                <Feather name="phone-off" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.btnLabel, { color: colors.mutedForeground }]}>Decline</Text>
            </View>
            <View style={styles.btnWrap}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.online }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  acceptIncomingCall();
                }}
                activeOpacity={0.8}
              >
                <Feather name="phone-call" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.btnLabel, { color: colors.mutedForeground }]}>Accept</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 50,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  incomingLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 24,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  outerRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  innerRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  callerName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  callerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 36,
  },
  buttons: {
    flexDirection: "row",
    gap: 52,
  },
  btnWrap: {
    alignItems: "center",
    gap: 10,
  },
  btn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
