/** Approved Home-only display copy; original image descriptions stay unchanged. */
export const homeEventCarouselOverrides: Record<
  string,
  {
    title: string;
    role?: { source: string; display: string };
    date?: { source: string; display: string };
  }
> = {
  "APEC 2025": { title: "APEC" },
  "Osaka Expo 2025": { title: "Osaka Expo" },
  "NAVER AiCall JP-KR": {
    title: "NAVER AI CALL",
    role: { source: "Product Launching", display: "Product Launch in Japan" },
  },
  "NAVER DAN24 Tech Exhibition": { title: "NAVER DAN" },
  "Smart Life Week Korea": { title: "Smart Life Week" },
  // Descriptive English heading, not an official event-name translation.
  // Event date: https://mayor.seoul.go.kr/oh/seoul/newsView.do?curPage=179&photoGallerySn=2271
  "Seoul Weak Companion Tech Fair": {
    title: "Seoul Inclusive Technology Expo",
    date: { source: "Dec 2023", display: "Nov 2023" },
  },
  "Sungkyunkwan University": { title: "Master’s Graduation" },
  "SK Telecom Creative Challenge (KAIST)": {
    title: "SK Telecom Creative Challenge at KAIST",
  },
  "The Ergonomics Society of Korea": {
    title: "Ergonomics Society Conference",
  },
};
