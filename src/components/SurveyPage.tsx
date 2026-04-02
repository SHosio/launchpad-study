import { useCallback } from 'react'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import 'survey-core/defaultV2.min.css'

interface SurveyPageProps {
  surveyJson: object
  onComplete: (results: Record<string, unknown>) => void
  title?: string
  onCurrentPageChanged?: () => void
}

export function SurveyPage({ surveyJson, onComplete, title, onCurrentPageChanged }: SurveyPageProps) {
  const handleComplete = useCallback((sender: Model) => {
    onComplete(sender.data)
  }, [onComplete])

  const survey = new Model(surveyJson)
  survey.showCompletedPage = false

  // Light theme overrides
  survey.applyTheme({
    cssVariables: {
      '--sjs-general-backcolor': 'rgba(255,255,255,0)',
      '--sjs-general-backcolor-dim': '#f9fafb',
      '--sjs-general-forecolor': '#18181b',
      '--sjs-general-forecolor-light': '#52525b',
      '--sjs-primary-backcolor': '#f97316',
      '--sjs-primary-forecolor': '#fff',
      '--sjs-base-unit': '8px',
      '--sjs-corner-radius': '8px',
      '--sjs-shadow-small': 'none',
      '--sjs-border-default': '#e4e4e7',
      '--sjs-border-light': '#e4e4e7',
      '--sjs-questionpanel-backcolor': '#ffffff',
      '--sjs-editorpanel-backcolor': '#f9fafb',
      '--sjs-editor-background': '#ffffff',
    },
  } as any)

  survey.onComplete.add(handleComplete)
  if (onCurrentPageChanged) {
    survey.onCurrentPageChanged.add(() => {
      // Defer to allow SurveyJS to render the new page DOM
      setTimeout(onCurrentPageChanged, 0)
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      {title && <h1 className="mb-6 text-center font-display text-2xl font-bold text-zinc-900">{title}</h1>}
      <Survey model={survey} />
    </div>
  )
}
