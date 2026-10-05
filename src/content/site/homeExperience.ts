import { terms } from "@/content/shared/terms";

// WHAT: The approved local Home draft, using the existing Education hierarchy.
// Public reference for AiCall's FY2024 product ranking:
// https://line-works.com/pr/20260526-2/ (report: https://mic-r.co.jp/mr/03720/).
// WHY: Product ranking, showcase, and subscriber totals are service outcomes;
// company/role grouping does not claim one person caused market position or growth.
// CONTENT-REVIEW: GitHub publication remains a separate pending approval.
export const homeExperience = {
  eyebrow: "Careers",
  title: "Selected Projects",
  summary: "Selected work from NAVER Cloud and SK Telecom.",
  careerLabel: "Full career",
  productsLabel: "Products",
  outcomesLabel: "Outcomes",
  items: [
    {
      id: "naver-cloud",
      company: terms.naverCloud,
      role: "AI Product Manager",
      // User-selected readable Home labels; outcome.product keeps source branding.
      products: [
        "NAVER Care Call",
        "NAVER Care Call Console",
        "LINE WORKS AI Call",
      ],
      dates: "2024.07–2026.01 · 2023.07–2024.01",
      // The user treats completion/dropout as complements in the event trial:
      // completion 67%→92% becomes dropout 33%→8%, not a 37.3% dropout reduction.
      outcomes: [
        {
          product: "LINE WORKS AiCall",
          text: "No. 1 in Japan’s voicebot market (FY2024)",
          sourceUrl: "https://line-works.com/pr/20260526-2/",
        },
        {
          product: "CLOVA CareCall",
          text: "2025 APEC summit showcase",
        },
        {
          product: "CLOVA CareCall",
          text: "AI Call dropout: 33% → 8%",
          measurementContext:
            "Event trials with general visitors; completion 67%→92% converted to complementary dropout 33%→8% following the user’s clarification.",
        },
      ],
    },
    {
      id: "sk-telecom",
      company: terms.skTelecom,
      role: "AI Product Manager",
      products: ["A.Dot"],
      dates: "2024.04–2024.07",
      // Subscribers are not MAU. The CTR result is percentage-point change,
      // not an unqualified relative percentage or a production-wide causal claim.
      outcomes: [
        {
          product: "A.Dot",
          text: "2024 GDWEB GRAND PRIZE",
          sourceUrl: "https://www.gdweb.co.kr/sub/view.asp?str_no=23244",
        },
        {
          product: "A.Dot",
          text: "5.5M subscribers · 22% growth",
        },
        {
          product: "A.Dot",
          text: "Home-feed CTR: +3.74 percentage points",
          measurementContext:
            "Staged content tests versus January; raw CTR, click/impression definitions and sample size still need confirmation.",
        },
      ],
    },
  ],
} as const;
