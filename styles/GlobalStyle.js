import { StyleSheet } from "react-native";

// Varm, rolig palet. Ét accentfarve (terrakotta) til knapper og ikoner.
const COLORS = {
  background: "#FAF6F0",
  surface: "#FFFFFF",
  accent: "#C96F4A",
  accentPressed: "#A85A3A",
  accentSoft: "#F4E3DA",
  text: "#2B2622",
  textMuted: "#6F675F",
  border: "#E6DED3",
  overlay: "rgba(43, 38, 34, 0.45)",
};

export const GlobalStyle = StyleSheet.create({
  // Farver kan læses fra JS (fx til Ionicons) via GlobalStyle.colors
  colors: COLORS,

  // Fælles container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // HomeScreen
  homeBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  homeOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  homeTopBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  homeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  homeCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  homeTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  homeWelcome: {
    fontSize: 20,
    lineHeight: 30,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  homeSettingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ButtonComponent
  primaryBtn: {
    pressedColor: COLORS.accentPressed,
    defaultColor: COLORS.accent,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryBtn: {
    pressedColor: COLORS.accentSoft,
    defaultColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  secondaryBtnText: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },

  // TextInputComponent
  inpLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  textInput: {
    minHeight: 52,
    width: "100%",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 20,
  },

  // PictureComponent
  picture: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
