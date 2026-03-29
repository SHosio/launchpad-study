const likertChoices = [
  { value: 1, text: "Strongly Disagree" },
  { value: 2, text: "Disagree" },
  { value: 3, text: "Neutral" },
  { value: 4, text: "Agree" },
  { value: 5, text: "Strongly Agree" },
];

export const followupSurvey = {
  showProgressBar: "top",
  pages: [
    {
      name: "goal_recall",
      title: "Goal Recall",
      description:
        "Welcome back. It has been approximately one week since you set your goal. Please answer the following questions without referring to any prior notes.",
      elements: [
        {
          type: "comment",
          name: "goal_recall",
          title:
            "Without looking back at any notes, please write down the goal you set last week as specifically as you can remember.",
          isRequired: true,
        },
        {
          type: "radiogroup",
          name: "goal_achieved",
          title: "How would you characterise your progress toward this goal?",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "partially", text: "Partially" },
            { value: "no", text: "No" },
          ],
        },
        {
          type: "text",
          name: "attainment_pct",
          title: "What percentage of your goal did you complete?",
          description: "Enter a number from 0 to 100.",
          isRequired: true,
          inputType: "number",
          min: 0,
          max: 100,
        },
        {
          type: "comment",
          name: "behavioral_specificity",
          title:
            "Describe one specific thing you did toward this goal in the past week.",
          isRequired: true,
        },
      ],
    },
    {
      name: "ngse_fu",
      title: "General Self-Efficacy",
      description:
        "Please indicate how much you agree or disagree with each of the following statements.",
      elements: [
        {
          type: "radiogroup",
          name: "ngse_fu_1",
          title:
            "I will be able to achieve most of the goals that I have set for myself.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_2",
          title:
            "When facing difficult tasks, I am certain that I will accomplish them.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_3",
          title:
            "In general, I think that I can obtain outcomes that are important to me.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_4",
          title:
            "I believe I can succeed at most any endeavor to which I set my mind.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_5",
          title: "I will be able to successfully overcome many challenges.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_6",
          title:
            "I am confident that I can perform effectively on many different tasks.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_7",
          title: "Compared to other people, I can do most tasks very well.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "ngse_fu_8",
          title: "Even when things are tough, I can perform quite well.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
      ],
    },
    {
      name: "kgc_fu",
      title: "Goal Commitment",
      description:
        "Thinking about the goal you set last week, please indicate how much you agree or disagree with each statement.",
      elements: [
        {
          type: "radiogroup",
          name: "kgc_fu_1",
          title: "It's hard to take this goal seriously.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "kgc_fu_2",
          title:
            "Quite frankly, I don't care if I achieve this goal or not.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "kgc_fu_3",
          title: "I am strongly committed to pursuing this goal.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "kgc_fu_4",
          title: "It wouldn't take much to make me abandon this goal.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
        {
          type: "radiogroup",
          name: "kgc_fu_5",
          title: "I think this is a good goal to shoot for.",
          isRequired: true,
          choices: likertChoices,
          colCount: 5,
        },
      ],
    },
    {
      name: "structured_approach",
      title: "Approach",
      elements: [
        {
          type: "radiogroup",
          name: "used_structured_approach",
          title:
            "Did you use any structured approach or technique when working toward your goal over the past week?",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
      ],
    },
  ],
};
