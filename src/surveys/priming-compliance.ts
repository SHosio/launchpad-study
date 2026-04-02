export const primingComplianceSurvey = {
  showProgressBar: "top",
  pages: [
    {
      name: "priming_compliance",
      title: "Priming Check-In",
      description:
        "Please answer a couple of quick questions about the preparation exercise you just completed.",
      elements: [
        {
          type: "comment",
          name: "priming_activity",
          title: "What did you do to prepare yourself?",
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "priming_energization",
          title: "How energized do you feel right now?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Moderately" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely" },
          ],
          colCount: 7,
        },
      ],
    },
  ],
};
