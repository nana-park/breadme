/** Reviewed source map; provenance, date conflicts and proposed title normalization
 * are recorded in docs/content/research-source-audit.md. Unknown fields stay absent. */
export type ResearchKind = "journal" | "ongoing" | "conference";
export type ResearchPublication = {
  id: string;
  kind: ResearchKind;
  title: string;
  venue: string;
  date?: string;
  status?: "In Progress";
  index?: "SSCI" | "KCI";
  description?: string;
  topics: string[];
  links: { label: string; href: string; asset: boolean }[];
};
export type ResearchSection = {
  id: string;
  kind: ResearchKind;
  title: string;
  publications: ResearchPublication[];
};

export const researchSections: ResearchSection[] = [
  {
    id: "journal-publications",
    kind: "journal",
    title: "Journal Publications",
    publications: [
      {
        id: "journal-credibility",
        kind: "journal",
        title:
          "User perceptions of credibility signals: A conjoint analysis of technological features in news platform",
        venue: "Technology in Society",
        date: "2026",
        index: "SSCI",
        description:
          "A comprehensive study exploring how credibility signals on digital news platforms translate into tangible monetary value and impact overarching user experiences.",
        topics: ["Online News Platform", "User Credibility"],
        links: [
          {
            label: "Read Paper",
            href: "https://www.sciencedirect.com/science/article/abs/pii/S0160791X26000412?via%3Dihub",
            asset: false,
          },
        ],
      },
      {
        id: "journal-books",
        kind: "journal",
        title:
          "Improvement of the delivery of information about books online: Focusing on book-flipping behavior",
        venue: "Information Development",
        date: "December 2025",
        index: "SSCI",
        description:
          "Investigates UX methodologies to optimize information delivery paradigms during digital transformation processes within the e-commerce sector.",
        topics: ["E-commerce", "Digital Transformation"],
        links: [
          {
            label: "Read Paper",
            href: "https://doi.org/10.1177/02666669251399814",
            asset: false,
          },
        ],
      },
      {
        id: "journal-fintech",
        kind: "journal",
        title: "Impact of cloud developers' work environment in Fintech",
        venue: "International Telecommunications Policy Review",
        date: "2022",
        index: "KCI",
        description:
          "Evaluates the systemic impact of work environments on the productivity and code quality of cloud infrastructure developers specializing in financial technology.",
        topics: ["Fintech", "Developer UX"],
        links: [
          {
            label: "Read Paper",
            href: "https://doi.org/10.37793/ITPR.29.3.2",
            asset: false,
          },
        ],
      },
    ],
  },
  {
    id: "ongoing-research",
    kind: "ongoing",
    title: "Ongoing Research",
    publications: [
      {
        id: "ongoing-speech",
        kind: "ongoing",
        title:
          "Digital speech biomarkers from an AI call-based memory assessment and their structural and amyloid correlates",
        venue:
          "Seoul National University Boramae Medical Center, Boston University, NAVER Cloud",
        status: "In Progress",
        topics: [],
        links: [],
      },
      {
        id: "ongoing-intimacy",
        kind: "ongoing",
        title:
          "When 'My AI' Interacts with Others: Scale Development for Measuring Romantic Jealousy in Human-AI Intimacy",
        venue: "Sungkyunkwan University, Pukyong National University",
        status: "In Progress",
        topics: [],
        links: [],
      },
    ],
  },
  {
    id: "conference-presentations",
    kind: "conference",
    title: "Conference Presentations",
    publications: [
      {
        id: "conference-ica",
        kind: "conference",
        title:
          "Monetary value of credibility signals: Exploring user experience on online news platforms",
        venue: "ICA2025 · International Communication Association",
        date: "September 26, 2025",
        topics: [],
        links: [],
      },
      {
        id: "conference-news-interface",
        kind: "conference",
        title:
          "Evaluating the News Interface: The Gatekeeping Role and Financial Worth of Online News Platforms",
        venue: "Cybercommunication Academic Society",
        date: "November 25, 2022",
        topics: [],
        links: [],
      },
      {
        id: "conference-ethereum",
        kind: "conference",
        title:
          "Ethereum GenAI PFP user journey mapping: Based on value-based decision theories",
        venue: "Korea Society of IT Services",
        date: "October 22, 2022",
        description:
          "Maps the psychological and functional journey of users interacting with Ethereum-based Generative AI Profile Picture (PFP) networks.",
        topics: ["Web3.0", "Cryptocurrency"],
        links: [
          {
            label: "Conference",
            href: "https://share.google/diY1WuICUFJxf7NNe",
            asset: false,
          },
          {
            label: "Read Paper",
            href: "nahyun_imported/document_source/Projects_Research/(EN)Korea%20Society%20of%20IT%20Services.pdf",
            asset: true,
          },
        ],
      },
      {
        id: "conference-omnichannel",
        kind: "conference",
        title:
          "Empowering the Omni-Channel Consumer: The Impact of User Agency on E-commerce Success",
        venue: "The Human Factors & Ergonomics Society of Korea",
        date: "October 13, 2022",
        topics: [],
        links: [],
      },
    ],
  },
];
