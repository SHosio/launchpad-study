const likertChoices = [
  { value: 1, text: "Strongly Disagree" },
  { value: 2, text: "Disagree" },
  { value: 3, text: "Neutral" },
  { value: 4, text: "Agree" },
  { value: 5, text: "Strongly Agree" },
];

const ngsePostItems = [
  {
    name: "ngse_post_1",
    text: "I will be able to achieve most of the goals that I have set for myself.",
  },
  {
    name: "ngse_post_2",
    text: "When facing difficult tasks, I am certain that I will accomplish them.",
  },
  {
    name: "ngse_post_3",
    text: "In general, I think that I can obtain outcomes that are important to me.",
  },
  {
    name: "ngse_post_4",
    text: "I believe I can succeed at most any endeavor to which I set my mind.",
  },
  {
    name: "ngse_post_5",
    text: "I will be able to successfully overcome many challenges.",
  },
  {
    name: "ngse_post_6",
    text: "I am confident that I can perform effectively on many different tasks.",
  },
  {
    name: "ngse_post_7",
    text: "Compared to other people, I can do most tasks very well.",
  },
  {
    name: "ngse_post_8",
    text: "Even when things are tough, I can perform quite well.",
  },
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

export function buildPostMeasureSurvey(isA2: boolean) {
  const pages: object[] = [
    {
      name: "ngse_post",
      title: "General Self-Efficacy",
      description:
        "Please indicate how much you agree or disagree with each of the following statements.",
      elements: ngsePostItems.map((item) => ({
        type: "radiogroup",
        name: item.name,
        title: item.text,
        isRequired: true,
        choices: likertChoices,
        colCount: 5,
      })),
    },
    {
      name: "kgc_post",
      title: "Goal Commitment",
      description:
        "Thinking about the goal you just formulated, please indicate how much you agree or disagree with each statement.",
      elements: kgcPostItems.map((item) => ({
        type: "radiogroup",
        name: item.name,
        title: item.text,
        isRequired: true,
        choices: likertChoices,
        colCount: 5,
      })),
    },
    {
      name: "single_items_post",
      title: "Goal Clarity & Readiness",
      elements: [
        {
          type: "radiogroup",
          name: "post_goal_clarity",
          title:
            "I have a clear picture of what success looks like for this goal.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "post_activation",
          title:
            "I feel energized and ready to start working on this goal right now.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "post_baseline_energy",
          title:
            "Right now, how physically and mentally energized do you feel?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Very low" },
            { value: 2, text: "2" },
            { value: 3, text: "3 — Moderate" },
            { value: 4, text: "4" },
            { value: 5, text: "5 — Very high" },
          ],
          colCount: 5,
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
          title: "The goal-setting process I just completed was helpful.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "process_frustrating",
          title: "The goal-setting process I just completed was frustrating.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "attention_check_1",
          title:
            "To show you are paying attention, please select 'Agree' for this item.",
          isRequired: true,
          choices: likertChoices,
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
          title: "The AI feedback helped me improve my goal.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "coach_demanding",
          title: "The AI feedback was too demanding or unreasonable.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "coach_reuse",
          title: "I would use a tool like this again for setting goals.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "comment",
          name: "coach_experience",
          title:
            "Please share any additional thoughts about the AI feedback experience.",
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
          "How did this goal-setting process compare to how you normally set goals?",
        isRequired: true,
      },
    ],
  });

  return {
    showProgressBar: "top",
    pages,
  };
}
