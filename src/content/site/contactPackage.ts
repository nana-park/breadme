import { siteMetadata } from "./siteMetadata";

export const contactPackage = {
  portfolioUrl: siteMetadata.portfolioUrl,
  resume: "Resume",
  portfolio: "Portfolio PDF",
  copy: "Copy URL",
  copying: "Copying portfolio URL…",
  copied: "포트폴리오 웹사이트 URL이 복사되었습니다",
  copyFailed:
    "자동으로 복사하지 못했습니다. 아래 포트폴리오 웹사이트 URL을 선택해 직접 복사해 주세요.",
  manualCopyLabel: "Portfolio URL",
} as const;
