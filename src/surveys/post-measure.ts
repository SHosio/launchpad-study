const likertChoices = [
  { value: 1, text: "Strongly Disagree" },
  { value: 2, text: "Disagree" },
  { value: 3, text: "Neutral" },
  { value: 4, text: "Agree" },
  { value: 5, text: "Strongly Agree" },
];

const kgcPostItems = [
  {
    name: "kgc_post_1",
    text: "It's hard to take this goal seriously.",
  },
  {
    name: "kgc_post_2",
    text: "Quite frankly, I don't care if I achieve this goal or not.",
  },
  {
    name: "kgc_post_3",
    text: "I am strongly committed to pursuing this goal.",
  },
  {
    name: "kgc_post_4",
    text: "It wouldn't take much to make me abandon this goal.",
  },
  {
    name: "kgc_post_5",
    text: "I think this is a good goal to shoot for.",
  },
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

export function buildPostMeasureSurvey(isA2: boolean) {
  const pages: object[] = [
    {
      name: "self_efficacy_commitment_post",
      title: "Your Goal",
      description:
        "Thinking about the goal you just formulated, please answer the following.",
      elements: [
        {
          type: "radiogroup",
          name: "post_goal_self_efficacy",
          title: "How confident are you that you can achieve this goal?",
          isRequired: true,
          choices: selfEfficacyChoices,
          colCount: 7,
        },
        {
          type: "html",
          html: '<hr style="border-top: 1px solid #e4e4e7; margin: 8px 0;" />',
        },
        ...kgcPostItems.map((item) => ({
          type: "radiogroup",
          name: item.name,
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
          name: "post_goal_clarity",
          title:
            "How clear is your picture of what success looks like for this goal?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all clear" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat clear" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely clear" },
          ],
          colCount: 7,
        },
        {
          type: "radiogroup",
          name: "post_activation",
          title:
            "How ready do you feel to start working on this goal right now?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all ready" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat ready" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely ready" },
          ],
          colCount: 7,
        },
        {
          type: "radiogroup",
          name: "post_baseline_energy",
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
    {
      name: "process_experience",
      title: "Process Experience",
      description: "Please reflect on the goal-setting process you just completed.",
      elements: [
        {
          type: "radiogroup",
          name: "process_helpful",
          title: "How much did the goal-setting process help you think more carefully about your goal?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely much" },
          ],
          colCount: 7,
        },
        {
          type: "radiogroup",
          name: "process_frustrating",
          title: "How frustrating did you find the goal-setting process?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely" },
          ],
          colCount: 7,
        },
        {
          type: "radiogroup",
          name: "attention_check_1",
          title:
            "To show you are paying attention, please select 'Somewhat Agree' for this item.",
          isRequired: true,
          choices: [
            { value: 1, text: "Strongly Disagree" },
            { value: 2, text: "Somewhat Disagree" },
            { value: 3, text: "Neutral" },
            { value: 4, text: "Somewhat Agree" },
            { value: 5, text: "Strongly Agree" },
          ],
          colCount: 5,
          correctAnswer: 4,
        },
      ],
    },
  ];

  if (isA2) {
    pages.push({
      name: "coach_perception",
      title: "AI Coach Perception",
      description:
        "Please reflect on the AI feedback you received during the goal-setting process.",
      elements: [
        {
          type: "radiogroup",
          name: "coach_useful",
          title: "How much did the AI feedback help you improve your goal?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely much" },
          ],
          colCount: 7,
        },
        {
          type: "radiogroup",
          name: "coach_demanding",
          title: "How demanding or unreasonable did you find the AI feedback?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely" },
          ],
          colCount: 7,
        },
        {
          type: "radiogroup",
          name: "coach_reuse",
          title: "How likely would you be to use a tool like this again for setting goals?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all likely" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat likely" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely likely" },
          ],
          colCount: 7,
        },
        {
          type: "comment",
          name: "coach_experience",
          title:
            "What was your experience with the AI feedback? Was there anything particularly helpful or unhelpful?",
        },
      ],
    });
  }

  pages.push({
    name: "process_comparison",
    title: "Reflection",
    elements: [
      {
        type: "radiogroup",
        name: "attention_check_2",
        title:
          "Please select 'Somewhat Agree' for this item.",
        isRequired: true,
        choices: [
          { value: 1, text: "Strongly Disagree" },
          { value: 2, text: "Somewhat Disagree" },
          { value: 3, text: "Neutral" },
          { value: 4, text: "Somewhat Agree" },
          { value: 5, text: "Strongly Agree" },
        ],
        colCount: 5,
        correctAnswer: 4,
      },
      {
        type: "comment",
        name: "process_comparison",
        title:
          "Any thoughts on the goal-setting process you just completed?",
        isRequired: false,
      },
    ],
  });

  return {
    showProgressBar: "top",
    pages,
  };
}
