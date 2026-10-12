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

const styles = StyleSheet.create({
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
  pageBlockImage: {
    width: "100%",
    maxWidth: 900,
    height: 420,
    borderRadius: 20,
    marginBottom: 32,
    backgroundColor: COLORS.accentSoft,
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
  // LoginScreen og RegisterScreen
  authScroll: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  authDivider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  authLoading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  houseCreateCard: {
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  ownerLogoutRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
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
  // "Ny kategori"-rækken på OwnerPagesScreen
  ownerRowAdd: {
    borderStyle: "dashed",
  },

  // IconPickerComponent
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  iconOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  iconOptionPressed: {
    opacity: 0.6,
  },

  // Baggrundsbillede på EditHouseScreen (samme format som iPad'en i landscape)
  coverPreview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 14,
    marginBottom: 12,
  },

  // Blokke på EditPageScreen
  blockEmpty: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  blockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  blockContent: {
    flex: 1,
  },
  blockImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  blockControls: {
    gap: 6,
  },
  blockIconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blockIconButtonPressed: {
    backgroundColor: COLORS.accentSoft,
  },
  blockAddRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  blockUploading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -12,
    marginBottom: 24,
  },
  blockUploadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  // CameraScreen
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraView: {
    flex: 1,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraBottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: COLORS.overlay,
  },
  cameraShutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.surface,
    borderWidth: 6,
    borderColor: COLORS.accentSoft,
  },
  cameraShutterPressed: {
    backgroundColor: COLORS.accentSoft,
  },
  cameraButtons: {
    flexDirection: "row",
    gap: 16,
  },
  cameraUploading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 60,
  },
  cameraUploadingText: {
    fontSize: 20,
    color: COLORS.surface,
  },
  cameraError: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.surface,
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
    maxWidth: 680,
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
    justifyContent: "center",
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

  // AI quick-setup: store touchflader og kolonner på iPad i landscape.
  setupRoot: { flex: 1, backgroundColor: COLORS.background },
  setupScroll: { flexGrow: 1, padding: 20, alignItems: "center" },
  setupShell: { width: "100%", maxWidth: 1200, gap: 22 },
  setupGrow: { flex: 1, minWidth: 200 },
  setupTopRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 },
  setupEyebrow: { fontSize: 12, letterSpacing: 1.8, fontWeight: "700", color: COLORS.accent, marginBottom: 10 },
  setupTitle: { fontSize: 32, lineHeight: 40, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  setupHeading: { fontSize: 24, lineHeight: 32, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  setupLead: { fontSize: 17, lineHeight: 27, color: COLORS.textMuted, marginBottom: 20, maxWidth: 840 },
  setupBody: { fontSize: 17, lineHeight: 27, color: COLORS.text },
  setupMuted: { fontSize: 15, lineHeight: 23, color: COLORS.textMuted },
  setupCaption: { fontSize: 12, lineHeight: 19, color: COLORS.textMuted, marginVertical: 12 },
  setupSteps: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  setupStep: { flex: 1, minWidth: 130, minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  setupStepActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  setupStepNumber: { color: COLORS.accent, fontSize: 18, fontWeight: "700" },
  setupStepText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  setupCard: { backgroundColor: COLORS.surface, padding: 22, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 18, gap: 10 },
  setupCategoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  setupCategory: { flexGrow: 1, flexBasis: 240, minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16 },
  setupCategorySelected: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  setupCategoryText: { flex: 1, fontSize: 17, fontWeight: "600", color: COLORS.text },
  setupInline: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 },
  setupCustomInput: { flex: 1, minWidth: 180, minHeight: 60, fontSize: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, color: COLORS.text, backgroundColor: COLORS.background },
  setupActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  setupActionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  setupSmallButton: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  setupSmallButtonActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  setupSmallButtonText: { fontSize: 15, lineHeight: 22, fontWeight: "600", flexShrink: 1, color: COLORS.accent },
  setupPressed: { backgroundColor: COLORS.accentSoft },
  setupDisabled: { opacity: 0.45 },
  setupColumns: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  setupColumnsStacked: { flexDirection: "column", alignItems: "stretch" },
  setupSidebar: { width: 245, gap: 14 },
  setupSidebarCompact: { width: "100%" },
  setupTopicWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  setupTopicList: { gap: 8 },
  setupBlockEditor: { gap: 14 },
  setupChatColumn: { flex: 1, minWidth: 0 },
  setupChatHistory: { maxHeight: 280, marginVertical: 12 },
  setupBubble: { alignSelf: "flex-start", maxWidth: "94%", borderRadius: 16, padding: 18, backgroundColor: COLORS.background, marginBottom: 16, gap: 8 },
  setupUserBubble: { alignSelf: "flex-end", backgroundColor: COLORS.accentSoft },
  setupBubbleLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: COLORS.textMuted },
  setupComposer: { minHeight: 110, maxHeight: 240, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, color: COLORS.text, fontSize: 17, lineHeight: 26, textAlignVertical: "top", backgroundColor: COLORS.background },
  setupComposerActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" },
  setupNotice: { padding: 18, backgroundColor: COLORS.accentSoft, borderRadius: 14, gap: 12 },
  setupError: { backgroundColor: "#FFF0EC", borderRadius: 14, padding: 16 },
  setupBusy: { flexDirection: "row", alignItems: "center", gap: 12 },
  setupImages: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  setupImageItem: { gap: 8 },
  setupImage: { width: 200, height: 150, borderRadius: 14, backgroundColor: COLORS.background },
  setupFooter: { alignItems: "flex-start", paddingVertical: 14 },
  setupSuccess: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", padding: 32, gap: 18 },
  setupEntry: { flexDirection: "row", alignItems: "center", gap: 18, minHeight: 110, padding: 22, marginBottom: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  setupEntryIcon: { width: 62, height: 62, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },

  // Handling på en kategori i udlejerens sideliste.
  ownerRowAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerRowActionPressed: {
    backgroundColor: COLORS.accent,
  },
});

// Farver kan læses fra JS (fx til Ionicons) via GlobalStyle.colors.
export const GlobalStyle = {
  ...styles,
  colors: COLORS,
};
