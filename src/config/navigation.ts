import { common } from "@/locales/ko/common";

// WHY: This milestone has one page; native anchors work with refresh and browser history.
export const navigation = [
  { href: "#overview", label: common.navigation.overview },
  { href: "#projects", label: common.navigation.projects },
  { href: "#contact", label: common.navigation.contact },
] as const;
