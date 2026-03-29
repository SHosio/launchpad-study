import { useCallback } from 'react'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import 'survey-core/defaultV2.min.css'

interface SurveyPageProps {
  surveyJson: object
  onComplete: (results: Record<string, unknown>) => void
  title?: string
}

export function SurveyPage({ surveyJson, onComplete, title }: SurveyPageProps) {
  const handleComplete = useCallback((sender: Model) => {
    onComplete(sender.data)
  }, [onComplete])

  const survey = new Model(surveyJson)

  // Dark theme overrides
  survey.applyTheme({
    cssVariables: {
      '--sjs-general-backcolor': 'rgba(0,0,0,0)',
      '--sjs-general-backcolor-dim': '#18181b',
      '--sjs-general-forecolor': '#e4e4e7',
      '--sjs-general-forecolor-light': '#a1a1aa',
      '--sjs-primary-backcolor': '#f97316',
      '--sjs-primary-forecolor': '#fff',
      '--sjs-base-unit': '8px',
      '--sjs-corner-radius': '8px',
      '--sjs-shadow-small': 'none',
      '--sjs-border-default': '#27272a',
      '--sjs-border-light': '#27272a',
      '--sjs-questionpanel-backcolor': '#18181b',
      '--sjs-editorpanel-backcolor': '#27272a',
      '--sjs-editor-background': '#27272a',
    },
  } as any)

  survey.onComplete.add(handleComplete)

  return (
    <div className="mx-auto max-w-2xl">
      {title && <h1 className="mb-6 text-center font-display text-2xl font-bold text-zinc-100">{title}</h1>}
      <Survey model={survey} />
    </div>
  )
}
