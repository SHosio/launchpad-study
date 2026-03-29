const likertChoices = [
  { value: 1, text: "Strongly Disagree" },
  { value: 2, text: "Disagree" },
  { value: 3, text: "Neutral" },
  { value: 4, text: "Agree" },
  { value: 5, text: "Strongly Agree" },
];

const recallConfidenceChoices = [
  { value: 1, text: "1 — Not at all" },
  { value: 2, text: "2" },
  { value: 3, text: "3" },
  { value: 4, text: "4 — Somewhat" },
  { value: 5, text: "5" },
  { value: 6, text: "6" },
  { value: 7, text: "7 — Perfectly" },
];

export const followupSurvey = {
  showProgressBar: "top",
  pages: [
    {
      name: "goal_recall_confidence",
      title: "Goal Recall",
      description:
        "Welcome back. It has been approximately one week since you set your goal.",
      elements: [
        {
          type: "radiogroup",
          name: "recall_confidence",
          title:
            "Without looking back at any notes, how well do you remember the specific goal you set last week?",
          isRequired: true,
          choices: recallConfidenceChoices,
          colCount: 7,
        },
      ],
    },
    {
      name: "goal_recall_recognition",
      title: "Goal Recall",
      description:
        "Here is the goal you set last week. Now that you see it, you can update your answer.",
      elements: [
        {
          type: "html",
          name: "original_goal_display",
          html: '<div style="padding: 16px; border-radius: 8px; background: #f4f4f5; border: 1px solid #e4e4e7; font-size: 14px; color: #27272a;" id="original-goal-display">Loading your goal...</div>',
        },
        {
          type: "radiogroup",
          name: "recall_recognition",
          title:
            "Now that you see your original goal, how accurately did you actually remember it?",
          isRequired: true,
          choices: recallConfidenceChoices,
          colCount: 7,
        },
      ],
    },
    {
      name: "goal_attainment",
      title: "Goal Progress",
      elements: [
        {
          type: "radiogroup",
          name: "goal_achieved",
          title: "How would you characterise your progress toward this goal?",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes, I achieved it" },
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
      ],
    },
    {
      name: "self_efficacy_fu",
      title: "Goal Self-Efficacy",
      elements: [
        {
          type: "radiogroup",
          name: "fu_goal_self_efficacy",
          title: "How confident are you that you can achieve this goal?",
          isRequired: true,
          choices: [
            { value: 1, text: "1 — Not at all confident" },
            { value: 2, text: "2" },
            { value: 3, text: "3" },
            { value: 4, text: "4 — Somewhat confident" },
            { value: 5, text: "5" },
            { value: 6, text: "6" },
            { value: 7, text: "7 — Extremely confident" },
          ],
          colCount: 7,
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
  ],
};
