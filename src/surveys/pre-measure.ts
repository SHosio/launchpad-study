const likertChoices = [
  { value: 1, text: "Strongly Disagree" },
  { value: 2, text: "Disagree" },
  { value: 3, text: "Neutral" },
  { value: 4, text: "Agree" },
  { value: 5, text: "Strongly Agree" },
];

const selfEfficacyChoices = [
  { value: 1, text: "1 — Not at all confident" },
  { value: 2, text: "2" },
  { value: 3, text: "3" },
  { value: 4, text: "4 — Somewhat confident" },
  { value: 5, text: "5" },
  { value: 6, text: "6" },
  { value: 7, text: "7 — Extremely confident" },
];

const kgcItems = [
  {
    value: "kgc_1",
    text: "It's hard to take this goal seriously.",
  },
  {
    value: "kgc_2",
    text: "Quite frankly, I don't care if I achieve this goal or not.",
  },
  {
    value: "kgc_3",
    text: "I am strongly committed to pursuing this goal.",
  },
  {
    value: "kgc_4",
    text: "It wouldn't take much to make me abandon this goal.",
  },
  {
    value: "kgc_5",
    text: "I think this is a good goal to shoot for.",
  },
];

export const preMeasureSurvey = {
  showProgressBar: "top",
  pages: [
    {
      name: "self_efficacy_and_commitment",
      title: "Your Goal",
      description:
        "Thinking about the goal you have in mind, please answer the following.",
      elements: [
        {
          type: "radiogroup",
          name: "goal_self_efficacy",
          title: "How confident are you that you can achieve this goal?",
          isRequired: true,
          choices: selfEfficacyChoices,
          colCount: 7,
        },
        {
          type: "html",
          html: '<hr style="border-top: 1px solid #e4e4e7; margin: 8px 0;" />',
        },
        ...kgcItems.map((item) => ({
          type: "radiogroup",
          name: item.value,
          title: item.text,
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        })),
        {
          type: "html",
          html: '<hr style="border-top: 1px solid #e4e4e7; margin: 8px 0;" />',
        },
        {
          type: "radiogroup",
          name: "baseline_energy",
          title:
            "Right now, how energized do you feel?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all energized" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat energized" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely energized" },
          ],
          colCount: 7,
        },
      ],
    },
  ],
};
