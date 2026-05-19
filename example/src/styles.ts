import { StyleSheet } from "react-native";

export const ROW_WIDTH = 320;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  homeContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d8d8d8",
  },
  headerWithBack: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#171717",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#5f6368",
  },
  exampleList: {
    gap: 12,
    marginTop: 18,
  },
  exampleCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#c7ccd1",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  exampleCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#171717",
  },
  exampleCardDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#4b5563",
  },
  backButton: {
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#b7bec7",
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
  },
  toolbar: {
    maxHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d8d8d8",
  },
  toolbarContent: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button: {
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#1f6feb",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d8d8d8",
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },
  row: {
    justifyContent: "center",
    width: ROW_WIDTH,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8a8a8a",
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171717",
  },
  rowText: {
    marginTop: 4,
    fontSize: 14,
    color: "#333333",
  },
  rowMeta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#555555",
  },
  dynamicRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#b9c0c9",
    borderRadius: 8,
  },
  dynamicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dynamicAccent: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dynamicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#171717",
  },
  dynamicBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#343a40",
  },
  dynamicMeta: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#59636e",
  },
});
