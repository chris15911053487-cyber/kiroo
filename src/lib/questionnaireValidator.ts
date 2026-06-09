import type { Questionnaire, QuestionnaireCategory, ScoringRuleType } from '../types'

const VALID_CATEGORIES: QuestionnaireCategory[] = [
  'personality',
  'temperament',
  'mbti',
  'leadership',
  'career',
  'big5',
  '16pf',
  'creativity',
  'holland',
  'lzu-leadership',
  'lzu-personality',
  'lzu-creativity',
]

const VALID_SCORING_RULE_TYPES: ScoringRuleType[] = ['additive', 'categorical']

/**
 * Validates a raw unknown object as a Questionnaire.
 * Returns the typed Questionnaire if valid, or null if invalid.
 * Logs a warning message for each invalid configuration.
 */
export function validateQuestionnaire(raw: unknown): Questionnaire | null {
  if (typeof raw !== 'object' || raw === null) {
    console.warn('[QuestionnaireValidator] Invalid questionnaire: not an object')
    return null
  }

  const obj = raw as Record<string, unknown>
  const invalidFields: string[] = []

  // Validate id
  if (typeof obj['id'] !== 'string' || obj['id'].trim() === '') {
    invalidFields.push('id (must be a non-empty string)')
  }

  // Validate name
  if (typeof obj['name'] !== 'string' || obj['name'].trim() === '' || obj['name'].length > 50) {
    invalidFields.push('name (must be a non-empty string with <= 50 characters)')
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(obj['category'] as QuestionnaireCategory)) {
    invalidFields.push(`category (must be one of: ${VALID_CATEGORIES.join(', ')})`)
  }

  // Validate description
  if (
    typeof obj['description'] !== 'string' ||
    obj['description'].trim() === '' ||
    obj['description'].length > 100
  ) {
    invalidFields.push('description (must be a non-empty string with <= 100 characters)')
  }

  // Validate questions
  if (!Array.isArray(obj['questions']) || obj['questions'].length === 0) {
    invalidFields.push('questions (must be a non-empty array)')
  }

  // Validate scoring_rule
  const scoringRule = obj['scoring_rule']
  if (
    typeof scoringRule !== 'object' ||
    scoringRule === null ||
    !VALID_SCORING_RULE_TYPES.includes(
      (scoringRule as Record<string, unknown>)['type'] as ScoringRuleType,
    )
  ) {
    invalidFields.push(
      `scoring_rule (must be defined with type one of: ${VALID_SCORING_RULE_TYPES.join(', ')})`,
    )
  }

  if (invalidFields.length > 0) {
    const id = typeof obj['id'] === 'string' ? obj['id'] : 'unknown'
    console.warn(
      `[QuestionnaireValidator] Questionnaire "${id}" is invalid. Invalid/missing fields: ${invalidFields.join('; ')}`,
    )
    return null
  }

  return raw as Questionnaire
}
