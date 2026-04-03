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
            <div style="max-width: 700px; line-height: 1.7;">
              <h2 style="margin-bottom: 0.5em;">Informed Consent</h2>

              <p><strong>Study:</strong> AI-Coached Goal Formulation</p>
              <p><strong>Principal Investigator &amp; Data Controller:</strong> Professor Simo Hosio, University of Oulu, Faculty of Information Technology and Electrical Engineering</p>
              <p><strong>Contact:</strong> simo.hosio@oulu.fi</p>

              <h3 style="margin-top: 1.2em;">Purpose</h3>
              <p>You are invited to participate in a research study examining how different approaches to goal formulation affect goal quality, commitment, and self-efficacy.</p>

              <h3 style="margin-top: 1.2em;">What the study involves</h3>
              <p>This session takes approximately 15–25 minutes. You will formulate a professional goal and respond to questionnaires about your goal-setting experience. Some participants will interact with an AI coaching tool as part of the process. You may also be invited to a brief follow-up survey approximately one week later (~3 minutes).</p>

              <h3 style="margin-top: 1.2em;">Data collected</h3>
              <p>We collect your survey responses, goal text, and interaction data (e.g., timestamps, number of revisions). Your Prolific ID is stored to link your session with the optional follow-up; it will be replaced with an anonymous identifier before analysis.</p>

              <h3 style="margin-top: 1.2em;">Legal basis &amp; data handling (GDPR Art. 6(1)(a))</h3>
              <p>Processing is based on your freely given consent. Data is stored on encrypted servers within the EU/EEA. Only the research team has access to identifiable data. Your Prolific ID will be pseudonymised after the follow-up window closes and permanently deleted upon study completion. Anonymised data may be shared in academic publications, open datasets, and related online materials about the system (e.g., project website).</p>

              <h3 style="margin-top: 1.2em;">Your rights</h3>
              <p>Under the EU General Data Protection Regulation (GDPR), you have the right to access, rectify, or request deletion of your personal data at any time by contacting the principal investigator. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.</p>

              <h3 style="margin-top: 1.2em;">Voluntary participation</h3>
              <p>Your participation is entirely voluntary. You may withdraw at any time by closing this browser window, without any consequence to you. If you withdraw, your data will be deleted unless it has already been anonymised.</p>

              <h3 style="margin-top: 1.2em;">Questions or concerns</h3>
              <p>Contact Professor Simo Hosio at <strong>simo.hosio@oulu.fi</strong>. For data protection concerns, you may also contact the University of Oulu Data Protection Officer at <strong>dpo@oulu.fi</strong>.</p>
            </div>
          `,
        },
        {
          type: "checkbox",
          name: "consent_given",
          isRequired: true,
          titleLocation: "hidden",
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
          name: "education_level",
          title: "What is your highest level of education?",
          isRequired: true,
          choices: [
            {
              value: "bachelors_enrolled",
              text: "Bachelor's degree (currently enrolled)",
            },
            {
              value: "bachelors_completed",
              text: "Bachelor's degree (completed)",
            },
            {
              value: "masters_enrolled",
              text: "Master's degree (currently enrolled)",
            },
            {
              value: "masters_completed",
              text: "Master's degree (completed)",
            },
            {
              value: "doctorate_enrolled",
              text: "Doctorate (currently enrolled)",
            },
            {
              value: "doctorate_completed",
              text: "Doctorate (completed)",
            },
            {
              value: "other",
              text: "Other",
            },
          ],
        },
        {
          type: "text",
          name: "field_of_study",
          title: "What is your field of study or professional domain?",
          isRequired: true,
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
