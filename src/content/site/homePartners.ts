import { terms } from "@/content/shared/terms";

// WHAT: Companies represented in Home's repeating experience/collaboration strip.
// WHY: SK Inc. (holding company) and SK Telecom are separate organizations.
export const homePartners = [
  {
    id: "naver",
    name: "NAVER",
    originalAsset: "Files/Logo/Naver-logo.svg",
  },
  {
    id: "naver-cloud",
    name: "NAVER CLOUD",
    originalAsset: "Files/Logo/Naver%20Cloud-logo.svg",
  },
  { id: "sk-inc", name: terms.skInc, originalAsset: null },
  {
    id: "sk-telecom",
    name: terms.skTelecom,
    originalAsset: "Files/Logo/SK%20Telecom-logo.svg",
  },
  { id: "line-works", name: terms.lineWorks, originalAsset: null },
  {
    id: "hm",
    name: "H&M",
    originalAsset: "Files/Logo/H&M-logo.svg",
  },
] as const;
