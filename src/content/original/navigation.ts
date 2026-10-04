export const originalNavigation = [
  { label: "HOME", path: "index.html" },
  {
    label: "ABOUT",
    path: "about.html",
    about: true,
    children: [
      { label: "breadme", path: "about.html" },
      { label: "Career", path: "career.html" },
      { label: "Qualified", path: "qualified.html" },
    ],
  },
  {
    label: "PROJECTS",
    path: "projects.html",
    children: [
      { label: "Products", path: "projects.html" },
      { label: "Research", path: "research.html" },
      { label: "Articles", path: "articles.html" },
      { label: "Lectures", path: "lectures.html" },
    ],
  },
  { label: "AWARDS", path: "awards.html" },
  { label: "CONTACT", path: "contact.html" },
] as const;
