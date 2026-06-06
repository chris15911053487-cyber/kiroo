import type { Questionnaire } from '../types'
import { validateQuestionnaire } from './questionnaireValidator'

/**
 * Loads all questionnaire JSON files from the data/questionnaires directory.
 * This function uses Vite's import.meta.glob with eager: true to load all files at build time.
 * Only validated questionnaires are returned; invalid ones are filtered out.
 * This function should only be called once at application startup.
 */
export function loadQuestionnaires(): Questionnaire[] {
  const modules = import.meta.glob<{ default: unknown }>(
    '../data/questionnaires/*.json',
    { eager: true }
  )

  const questionnaires: Questionnaire[] = []

  for (const [path, module] of Object.entries(modules)) {
    const validated = validateQuestionnaire(module.default)
    if (validated !== null) {
      questionnaires.push(validated)
    } else {
      console.warn(`[QuestionnaireLoader] Skipping invalid questionnaire from ${path}`)
    }
  }

  return questionnaires
}
