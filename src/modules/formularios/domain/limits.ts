// Maximum length of each text field in a form definition, shared by the editor
// (character counter) and the server (validation).
export const TEXT_LIMITS = {
  title: 60,
  description: 500,
  authorName: 80,
  institution: 120,
  question: 300,
  alternative: 120,
  risk: 40,
  bandDescription: 300,
} as const;
