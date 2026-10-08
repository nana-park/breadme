import { articlesPageContent } from "./articles/pageContent";

// WHAT: Short page labels with the existing introductory meaning retained below.
export const landingHeroes = {
  qualified: {
    title: "Qualifications",
    image: "nahyun_imported/image_source/About_Qualified/thumnail.png",
    imageAlt: "Qualified thumbnail",
    paragraphs: [
      "The foundation behind my product decisions.",
      "Core competencies, certifications, and product principles.",
    ],
  },
  projects: {
    title: "Products",
    image: "nahyun_imported/image_source/Projects_Products/bg.png",
    imageAlt: "Team Collaboration",
    paragraphs: [
      "Designing human-centered AI by bringing psychology and engineering together to shape motivation, trust, and human behavior.",
      "Collaborating with industry leaders in Korea, China, Japan, and Vietnam, and reaching users across Korea, Japan, and the US.",
    ],
  },
  research: {
    title: "Research",
    image: "nahyun_imported/image_source/Projects_Research/bg.png",
    imageAlt: "Research Environment",
    paragraphs: [
      "Exploring user-centric AI through academic inquiry and behavioral science, bridging human psychology and software engineering.",
      "Grounded in Interaction Science, Psychology, and Multimedia, applying empirical research to meaningful digital transformation.",
    ],
  },
  articles: {
    title: "Articles",
    image: articlesPageContent.image,
    imageAlt: articlesPageContent.imageAlt,
    paragraphs: [
      "Insights on AI product management and user experience at the intersection of business, technology, and design.",
      "Practical lessons, product strategies, and industry trends from the field.",
    ],
  },
} as const;
export type LandingHeroPage = keyof typeof landingHeroes;
