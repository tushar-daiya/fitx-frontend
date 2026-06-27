import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSendMessage } from "@/src/hooks/useChat";
import { COLORS, RADIUS, SPACING } from "@/src/theme";
import { useKeyboardBehavior } from "@/src/hooks/useKeyboardBehavior";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS: {
  label: string;
  sub: string;
  prompt?: string;
  route?: string;
  icon: any;
}[] = [
  {
    label: "Gyms near me",
    sub: "Find gyms in your area",
    route: "/gyms",
    icon: "location-outline",
  },
  {
    label: "Best protein sources",
    sub: "High-protein foods for muscle gain",
    prompt:
      "What are the best high-protein foods for muscle gain in an Indian diet?",
    icon: "nutrition-outline",
  },
  {
    label: "Reduce belly fat",
    sub: "4-week plan · diet + workout",
    prompt: "Give me a 4-week plan to reduce belly fat with diet + workout.",
    icon: "flame-outline",
  },
  {
    label: "Pre-workout meal",
    sub: "What to eat before training",
    prompt: "What should I eat 1 hour before a strength workout?",
    icon: "fast-food-outline",
  },
  {
    label: "Beginner workout",
    sub: "20 min · no equipment needed",
    prompt:
      "I'm a beginner with no equipment. Give me a 20-minute home workout.",
    icon: "barbell-outline",
  },
];

export default function Chat() {
  const [headerHeight, setHeaderHeight] = useState(80);
  const behaviour = useKeyboardBehavior();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sessionIdRef = useRef(
    `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  );
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your FitX Coach 💪 Ask me anything about workouts, nutrition, recipes, or recovery. (I don't give medical advice.)",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const sendMsg = useSendMessage();

  const send = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sendMsg.isPending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    sendMsg.mutate(
      { session_id: sessionIdRef.current, message: text },
      {
        onSuccess: (r) =>
          setMessages((m) => [...m, { role: "assistant", content: r.reply }]),
        onError: (e: any) =>
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `(Error: ${e.message})` },
          ]),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="chat-screen" edges={["top"]}>
      <View
        style={styles.header}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <Text style={styles.title}>FitX Coach</Text>
        <Text style={styles.sub}>AI assistant · fitness & nutrition only</Text>
      </View>

      {/* <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 8}
      > */}
      <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "transparent" }}
      behavior={behaviour}
      keyboardVerticalOffset={0}
    >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.role === "user" ? styles.userText : styles.botText,
                ]}
              >
                {m.content}
              </Text>
            </View>
          ))}
          {sendMsg.isPending && (
            <View style={[styles.bubble, styles.botBubble]}>
              <ActivityIndicator color={COLORS.goldPremium} />
            </View>
          )}
        </ScrollView>

        {messages.length <= 1 && (
          <ScrollView
            style={styles.suggestionsScroll}
            contentContainerStyle={styles.suggestionsRow}
            showsVerticalScrollIndicator={false}
          >
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={i}
                testID={`quick-${i}`}
                style={styles.suggestionCard}
                activeOpacity={0.75}
                onPress={() => {
                  if (a.route) router.push(a.route as any);
                  else if (a.prompt) send(a.prompt);
                }}
              >
                <View style={styles.suggestionIcon}>
                  <Ionicons
                    name={a.icon}
                    size={18}
                    color={COLORS.goldPremium}
                  />
                </View>
                <View style={styles.suggestionTextWrap}>
                  <Text style={styles.suggestionTitle}>{a.label}</Text>
                  <Text style={styles.suggestionSub}>{a.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* The fix applies dynamically to inputRow container wrapper */}
        <View style={[styles.inputRow, { paddingBottom: 8 }]}>
          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder="Ask FitX Coach anything..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            testID="chat-send"
            onPress={() => send()}
            style={styles.sendBtn}
            disabled={sendMsg.isPending}
          >
            <Ionicons name="send" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  sub: { color: COLORS.textSecondary, marginTop: 4, fontSize: 12 },
  messages: { padding: SPACING.l, gap: 10 },
  bubble: { borderRadius: RADIUS.xl, padding: 14, maxWidth: "85%" },
  botBubble: {
    backgroundColor: COLORS.surface,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userBubble: { backgroundColor: COLORS.goldPremium, alignSelf: "flex-end" },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  botText: { color: "#fff" },
  userText: { color: "#000", fontWeight: "600" },
  suggestionsScroll: { maxHeight: "50%", flexShrink: 0 },
  suggestionsRow: { paddingHorizontal: SPACING.l, paddingBottom: 10, gap: 8 },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 12,
    gap: 12,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    flexShrink: 0,
  },
  suggestionTextWrap: { flex: 1 },
  suggestionTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  suggestionSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    paddingTop: SPACING.m,
    paddingHorizontal: SPACING.m,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldPremium,
    alignItems: "center",
    justifyContent: "center",
  },
});
