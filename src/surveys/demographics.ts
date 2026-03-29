export const demographicsSurvey = {
  showProgressBar: "top",
  pages: [
    {
      name: "consent",
      elements: [
        {
          type: "html",
          name: "consent_text",
          html: `
            <div style="max-width: 700px; line-height: 1.6;">
              <h2>Informed Consent</h2>
              <p><strong>Study:</strong> AI-Coached Goal Formulation for Early-Career Academics</p>
              <p><strong>Institution:</strong> University of Oulu</p>
              <p>You are invited to participate in a research study examining how different approaches to goal formulation affect goal quality, commitment, and self-efficacy among early-career academics.</p>
              <p><strong>What the study involves:</strong> This session will take approximately 15–25 minutes. You will be asked to formulate a professional goal and respond to several questionnaires about your goal-setting experience.</p>
              <p><strong>Follow-up:</strong> You may be contacted for a brief follow-up survey approximately one week after this session to assess your progress toward the goal you set today.</p>
              <p><strong>Data handling:</strong> All responses are stored securely and will be used solely for research purposes. Your data will be anonymised before any analysis or reporting. No personally identifying information will be shared.</p>
              <p><strong>Voluntary participation:</strong> Your participation is entirely voluntary. You may withdraw at any time without consequence.</p>
              <p><strong>Questions:</strong> If you have any questions about this study, please contact the research team at the University of Oulu.</p>
            </div>
          `,
        },
        {
          type: "checkbox",
          name: "consent_given",
          isRequired: true,
          title: " ",
          choices: [
            {
              value: "yes",
              text: "I have read the above information and consent to participate",
            },
          ],
          validators: [
            {
              type: "answercount",
              minCount: 1,
              text: "You must consent to participate in order to continue.",
            },
          ],
        },
      ],
    },
    {
      name: "demographics",
      elements: [
        {
          type: "text",
          name: "age",
          title: "What is your age?",
          isRequired: true,
          inputType: "number",
          min: 18,
          max: 80,
        },
        {
          type: "radiogroup",
          name: "gender",
          title: "What is your gender?",
          isRequired: true,
          choices: [
            { value: "man", text: "Man" },
            { value: "woman", text: "Woman" },
            { value: "non_binary", text: "Non-binary" },
            { value: "prefer_not_to_say", text: "Prefer not to say" },
            { value: "other", text: "Other" },
          ],
        },
        {
          type: "radiogroup",
          name: "career_stage",
          title: "What is your current career stage?",
          isRequired: true,
          choices: [
            {
              value: "phd_student",
              text: "Current PhD / doctoral student",
            },
            {
              value: "postdoc",
              text: "Postdoctoral researcher",
            },
            {
              value: "junior_faculty",
              text: "Junior faculty within first 5 years",
            },
            {
              value: "other_academic",
              text: "Other academic role",
            },
          ],
        },
        {
          type: "text",
          name: "field_of_study",
          title: "What is your field of study or discipline?",
          isRequired: true,
        },
        {
          type: "text",
          name: "institution",
          title: "What institution are you currently affiliated with?",
          isRequired: true,
        },
        {
          type: "comment",
          name: "current_goal",
          title:
            "Briefly describe a professional goal you are currently working on or would like to work on.",
          isRequired: true,
          rows: 2,
        },
        {
          type: "radiogroup",
          name: "prior_goal_setting",
          title:
            "Have you used any structured goal-setting approach before (e.g., SMART goals, WOOP, OKRs)?",
          isRequired: true,
          choices: [
            { value: "yes", text: "Yes" },
            { value: "no", text: "No" },
          ],
        },
        {
          type: "text",
          name: "prior_goal_setting_methods",
          title: "Which goal-setting approaches have you used?",
          visibleIf: "{prior_goal_setting} = 'yes'",
        },
      ],
    },
  ],
};
