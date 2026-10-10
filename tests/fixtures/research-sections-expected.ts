// WHAT: Independent acceptance values from the reviewed source audit.
// WHY: Importing the production array as the expected value would let content
// omissions, repeated conferences and invented metadata silently pass.
export const researchSectionsBaselineCommit =
  "ecc017c66e645f156c87e447b3442d3d5f8b8ff3";

export const expectedResearchSections = [
  {
    id: "journal-publications",
    kind: "journal",
    title: "Journal Publications",
    count: 3,
  },
  {
    id: "ongoing-research",
    kind: "ongoing",
    title: "Ongoing Research",
    count: 2,
  },
  {
    id: "conference-presentations",
    kind: "conference",
    title: "Conference Presentations",
    count: 4,
  },
] as const;

type ExpectedPublication = {
  id: string;
  kind: "journal" | "ongoing" | "conference";
  title: string;
  venue: string;
  date?: string;
  status?: "In Progress";
  index?: "SSCI" | "KCI";
  preservedRecord?: number;
};

export const expectedResearchRecords: ExpectedPublication[] = [
  {
    id: "journal-credibility",
    kind: "journal",
    title:
      "User perceptions of credibility signals: A conjoint analysis of technological features in news platform",
    venue: "Technology in Society",
    date: "2026",
    index: "SSCI",
    preservedRecord: 0,
  },
  {
    id: "journal-books",
    kind: "journal",
    title:
      "Improvement of the delivery of information about books online: Focusing on book-flipping behavior",
    venue: "Information Development",
    date: "December 2025",
    index: "SSCI",
    preservedRecord: 1,
  },
  {
    id: "journal-fintech",
    kind: "journal",
    title: "Impact of cloud developers' work environment in Fintech",
    venue: "International Telecommunications Policy Review",
    date: "2022",
    index: "KCI",
    preservedRecord: 2,
  },
  {
    id: "ongoing-speech",
    kind: "ongoing",
    title:
      "Digital speech biomarkers from an AI call-based memory assessment and their structural and amyloid correlates",
    venue:
      "Seoul National University Boramae Medical Center, Boston University, NAVER Cloud",
    status: "In Progress",
  },
  {
    id: "ongoing-intimacy",
    kind: "ongoing",
    title:
      "When 'My AI' Interacts with Others: Scale Development for Measuring Romantic Jealousy in Human-AI Intimacy",
    venue: "Sungkyunkwan University, Pukyong National University",
    status: "In Progress",
  },
  {
    id: "conference-ica",
    kind: "conference",
    title:
      "Monetary value of credibility signals: Exploring user experience on online news platforms",
    venue: "ICA2025 · International Communication Association",
    date: "September 26, 2025",
  },
  {
    id: "conference-news-interface",
    kind: "conference",
    title:
      "Evaluating the News Interface: The Gatekeeping Role and Financial Worth of Online News Platforms",
    venue: "Cybercommunication Academic Society",
    date: "November 25, 2022",
  },
  {
    id: "conference-ethereum",
    kind: "conference",
    title:
      "Ethereum GenAI PFP user journey mapping: Based on value-based decision theories",
    venue: "Korea Society of IT Services",
    date: "October 22, 2022",
    preservedRecord: 3,
  },
  {
    id: "conference-omnichannel",
    kind: "conference",
    title:
      "Empowering the Omni-Channel Consumer: The Impact of User Agency on E-commerce Success",
    venue: "The Human Factors & Ergonomics Society of Korea",
    date: "October 13, 2022",
  },
];
