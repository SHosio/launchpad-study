const likertChoices = [
  { value: 1, text: "Strongly Disagree" },
  { value: 2, text: "Disagree" },
  { value: 3, text: "Neutral" },
  { value: 4, text: "Agree" },
  { value: 5, text: "Strongly Agree" },
];

const ngseItems = [
  {
    value: "ngse_1",
    text: "I will be able to achieve most of the goals that I have set for myself.",
  },
  {
    value: "ngse_2",
    text: "When facing difficult tasks, I am certain that I will accomplish them.",
  },
  {
    value: "ngse_3",
    text: "In general, I think that I can obtain outcomes that are important to me.",
  },
  {
    value: "ngse_4",
    text: "I believe I can succeed at most any endeavor to which I set my mind.",
  },
  {
    value: "ngse_5",
    text: "I will be able to successfully overcome many challenges.",
  },
  {
    value: "ngse_6",
    text: "I am confident that I can perform effectively on many different tasks.",
  },
  {
    value: "ngse_7",
    text: "Compared to other people, I can do most tasks very well.",
  },
  {
    value: "ngse_8",
    text: "Even when things are tough, I can perform quite well.",
  },
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
      name: "ngse",
      title: "General Self-Efficacy",
      description:
        "Please indicate how much you agree or disagree with each of the following statements.",
      elements: ngseItems.map((item) => ({
        type: "radiogroup",
        name: item.value,
        title: item.text,
        isRequired: true,
        choices: likertChoices,
        colCount: 5,
      })),
    },
    {
      name: "kgc",
      title: "Goal Commitment",
      description:
        "Thinking about the goal you described earlier, please indicate how much you agree or disagree with each statement.",
      elements: kgcItems.map((item) => ({
        type: "radiogroup",
        name: item.value,
        title: item.text,
        isRequired: true,
        choices: likertChoices,
        colCount: 5,
      })),
    },
    {
      name: "single_items",
      title: "Goal Clarity & Readiness",
      elements: [
        {
          type: "radiogroup",
          name: "goal_clarity",
          title:
            "I have a clear picture of what success looks like for this goal.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "activation",
          title:
            "I feel energized and ready to start working on this goal right now.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "baseline_energy",
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
  ],
};
