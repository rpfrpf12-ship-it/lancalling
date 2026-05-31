import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";

type CallMode = "outgoing" | "incoming-accepted" | "connected" | "ended";

export default function CallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deviceId: string;
    deviceName: string;
    mode: string;
  }>();
  const { deviceId, deviceName, mode } = params;
  const { socket, myDevice } = useSocket();
  const [callMode, setCallMode] = useState<CallMode>((mode as CallMode) ?? "outgoing");
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ringScale = useSharedValue(1);
  const outerScale = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1300, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );

    if (mode === "outgoing" && socket && myDevice) {
      socket.emit("call-offer", {
        from: myDevice.id,
        to: deviceId,
        fromName: myDevice.name,
      });
    }
    if (mode === "incoming-accepted" && socket && myDevice) {
      socket.emit("call-answer", { from: myDevice.id, to: deviceId });
      setCallMode("connected");
      startTimer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    function onAnswer() {
      setCallMode("connected");
      startTimer();
    }
    function onReject() {
      setCallMode("ended");
      cleanupAndGoBack(2000);
    }
    function onEnd() {
      setCallMode("ended");
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupAndGoBack(1500);
    }

    socket.on("call-answer", onAnswer);
    socket.on("call-reject", onReject);
    socket.on("call-end", onEnd);
    return () => {
      socket.off("call-answer", onAnswer);
      socket.off("call-reject", onReject);
      socket.off("call-end", onEnd);
    };
  }, [socket]);

  function startTimer() {
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }

  function cleanupAndGoBack(delay: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => router.back(), delay);
  }

  function handleEndCall() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (socket && myDevice) {
      socket.emit("call-end", { from: myDevice.id, to: deviceId });
    }
    setCallMode("ended");
    cleanupAndGoBack(1500);
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const initials =
    (deviceName ?? "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const isConnected = callMode === "connected";
  const isEnded = callMode === "ended";

  const statusText = isEnded
    ? "Call ended"
    : isConnected
    ? formatDuration(duration)
    : callMode === "incoming-accepted"
    ? "Connecting..."
    : "Calling...";

  const accentColor = isConnected ? colors.online : colors.primary;

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: 2.15 - ringScale.value,
  }));
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: (2 - outerScale.value) * 0.3,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop:
            insets.top + (Platform.OS === "web" ? 67 : 40),
          paddingBottom:
            Math.max(insets.bottom, 24) + (Platform.OS === "web" ? 34 : 0) + 20,
        },
      ]}
    >
      <Text style={[styles.screenLabel, { color: colors.mutedForeground }]}>
        {isEnded ? "Call Ended" : "Voice Call"}
      </Text>

      <View style={styles.avatarSection}>
        <Animated.View
          style={[
            styles.outerRing,
            { borderColor: accentColor + "38" },
            outerStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.innerRing,
            { borderColor: accentColor + "60" },
            ringStyle,
          ]}
        />
        <View
          style={[
            styles.avatar,
            { backgroundColor: accentColor + "22" },
          ]}
        >
          <Text style={[styles.initials, { color: accentColor }]}>{initials}</Text>
        </View>
      </View>

      <View style={styles.nameSection}>
        <Text style={[styles.deviceName, { color: colors.foreground }]}>{deviceName}</Text>
        <Text
          style={[
            styles.statusText,
            { color: isConnected ? colors.online : colors.mutedForeground },
          ]}
        >
          {statusText}
        </Text>
      </View>

      <View style={styles.controls}>
        {!isEnded && (
          <TouchableOpacity
            style={[styles.endBtn, { backgroundColor: colors.destructive }]}
            onPress={handleEndCall}
            activeOpacity={0.8}
          >
            <Feather name="phone-off" size={28} color="#fff" />
          </TouchableOpacity>
        )}
        {isEnded && (
          <View style={[styles.endedIndicator, { backgroundColor: colors.muted }]}>
            <Feather name="phone-off" size={22} color={colors.mutedForeground} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  avatarSection: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1.5,
  },
  innerRing: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
  },
  nameSection: { alignItems: "center", gap: 10 },
  deviceName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statusText: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  controls: { alignItems: "center" },
  endBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  endedIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
