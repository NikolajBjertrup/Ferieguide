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

  // Navigation-header (bruges i App.js screenOptions)
  header: {
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  screenContent: {
    backgroundColor: COLORS.background,
  },

  // GuideScreen
  guideContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guideList: {
    padding: 16,
  },
  guideRow: {
    gap: 16,
    marginBottom: 16,
  },
  guideEmpty: {
    fontSize: 20,
    lineHeight: 30,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 48,
    paddingHorizontal: 32,
  },
  guideCard: {
    flex: 1,
    maxWidth: "50%",
    minHeight: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  guideCardPressed: {
    backgroundColor: COLORS.accentSoft,
  },
  guideIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  guideCardTitle: {
    fontSize: 26,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },

  // PageScreen
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageScroll: {
    padding: 24,
    alignItems: "center",
  },
  pageImage: {
    width: "100%",
    maxWidth: 900,
    height: 280,
    borderRadius: 20,
    marginBottom: 24,
  },
  pageTitleRow: {
    width: "100%",
    maxWidth: 900,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
  },
  pageBody: {
    width: "100%",
    maxWidth: 900,
    fontSize: 20,
    lineHeight: 32,
    color: COLORS.text,
    marginBottom: 32,
  },
  pageBackButton: {
    alignItems: "center",
  },

  // Udlejer-skærme (fælles)
  ownerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  ownerCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ownerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  ownerSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  ownerError: {
    fontSize: 16,
    color: "#B3261E",
    marginBottom: 16,
  },

  // OwnerPagesScreen
  ownerListContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  ownerList: {
    padding: 16,
  },
  ownerListHint: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 72,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
  },
  ownerRowPressed: {
    backgroundColor: COLORS.accentSoft,
  },
  ownerRowText: {
    flex: 1,
  },
  ownerRowTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  ownerRowStatus: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // EditPageScreen
  editScroll: {
    padding: 24,
    alignItems: "center",
  },
  editCard: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  editHeaderText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
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
    marginBottom: 24,
  },
  homeInfoRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 28,
  },
  homeInfoItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  homeInfoLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  homeInfoValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
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
  inputContainer: {
    width: "100%",
  },
  textInputMultiline: {
    minHeight: 180,
    textAlignVertical: "top",
  },
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
});
