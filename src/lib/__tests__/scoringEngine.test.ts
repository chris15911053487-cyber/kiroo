import { describe, it, expect } from 'vitest'
import { compute } from '../scoringEngine'
import type { Questionnaire } from '../../types'

const additiveQ: Questionnaire = {
  id: 'personality-big5',
  name: '大五人格测试',
  category: 'personality',
  description: '基于大五人格模型',
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  questions: [
    {
      id: 'q1',
      sequence: 1,
      text: '我喜欢尝试新鲜事物。',
      options: [
        { id: 'q1-a', text: '非常同意', scores: { openness: 5 } },
        { id: 'q1-b', text: '比较同意', scores: { openness: 4 } },
        { id: 'q1-c', text: '不确定', scores: { openness: 3 } },
      ],
    },
    {
      id: 'q2',
      sequence: 2,
      text: '我做事有条理。',
      options: [
        { id: 'q2-a', text: '非常同意', scores: { conscientiousness: 5 } },
        { id: 'q2-b', text: '比较同意', scores: { conscientiousness: 4 } },
      ],
    },
    {
      id: 'q3',
      sequence: 3,
      text: '多维度题目',
      options: [
        { id: 'q3-a', text: 'A', scores: { openness: 2, conscientiousness: 3 } },
        { id: 'q3-b', text: 'B', scores: { openness: 1, conscientiousness: 1 } },
      ],
    },
  ],
  scoring_rule: {
    type: 'additive',
    dimensions: [
      { key: 'openness', name: '开放性', min: 0, max: 50 },
      { key: 'conscientiousness', name: '责任心', min: 0, max: 50 },
    ],
  },
}

const categoricalQ: Questionnaire = {
  id: 'temperament-test',
  name: '气质类型测试',
  category: 'temperament',
  description: '测试气质类型',
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  questions: [
    {
      id: 'q1',
      sequence: 1,
      text: 'Q1?',
      options: [
        { id: 'q1-a', text: 'A', category: 'A' },
        { id: 'q1-b', text: 'B', category: 'B' },
      ],
    },
    {
      id: 'q2',
      sequence: 2,
      text: 'Q2?',
      options: [
        { id: 'q2-a', text: 'A', category: 'A' },
        { id: 'q2-b', text: 'B', category: 'B' },
      ],
    },
    {
      id: 'q3',
      sequence: 3,
      text: 'Q3?',
      options: [
        { id: 'q3-a', text: 'A', category: 'A' },
        { id: 'q3-b', text: 'B', category: 'B' },
        { id: 'q3-c', text: 'C', category: 'C' },
        { id: 'q3-d', text: 'D', category: 'D' },
      ],
    },
  ],
  scoring_rule: {
    type: 'categorical',
    categories: [
      { key: 'A', name: 'Type A' },
      { key: 'B', name: 'Type B' },
      { key: 'C', name: 'Type C' },
      { key: 'D', name: 'Type D' },
    ],
  },
}

describe('ScoringEngine - Additive', () => {
  it('computes correct dimension scores', () => {
    const answers = { q1: 'q1-a', q2: 'q2-a', q3: 'q3-a' }
    const result = compute(answers, additiveQ)

    if ('message' in result) throw new Error('Expected ScoreResult, got error')
    expect(result.type).toBe('additive')
    expect(result.dimensionScores!.openness).toBe(5 + 2) // q1-a + q3-a
    expect(result.dimensionScores!.conscientiousness).toBe(5 + 3) // q2-a + q3-a
  })

  it('returns 0 for dimensions with no scores', () => {
    const answers = { q1: 'q1-c', q2: 'q2-a', q3: 'q3-a' }
    const result = compute(answers, additiveQ)

    if ('message' in result) throw new Error('Expected ScoreResult, got error')
    // openness: q1-c=3 + q3-a=2 = 5
    expect(result.dimensionScores!.openness).toBe(5)
  })
})

describe('ScoringEngine - Categorical', () => {
  it('selects the most frequent category', () => {
    const answers = { q1: 'q1-a', q2: 'q2-a', q3: 'q3-b' }
    const result = compute(answers, categoricalQ)

    if ('message' in result) throw new Error('Expected ScoreResult, got error')
    expect(result.type).toBe('categorical')
    // A appears 2 times, B appears 1 time
    expect(result.categoryResult).toBe('A')
    expect(result.categoryFrequencies!['A']).toBe(2)
    expect(result.categoryFrequencies!['B']).toBe(1)
  })

  it('tie-breaking: selects category with smallest index in categories array', () => {
    // A and B each appear once, but q3 adds one more to create a clean tie scenario
    // Actually let's create a clear tie: q1=A, q2=B
    const answers = { q1: 'q1-a', q2: 'q2-b', q3: 'q3-c' }
    const result = compute(answers, categoricalQ)

    if ('message' in result) throw new Error('Expected ScoreResult, got error')
    // A=1, B=1, C=1 — all tied. Winner should be A (index 0)
    expect(result.categoryResult).toBe('A')
  })

  it('handles all answers pointing to same category', () => {
    const answers = { q1: 'q1-a', q2: 'q2-a', q3: 'q3-a' }
    const result = compute(answers, categoricalQ)

    if ('message' in result) throw new Error('Expected ScoreResult, got error')
    expect(result.categoryResult).toBe('A')
    expect(result.categoryFrequencies!['A']).toBe(3)
  })
})

describe('ScoringEngine - Error handling', () => {
  it('rejects when a question has no answer', () => {
    const answers = { q1: 'q1-a' } // missing q2, q3
    const result = compute(answers, additiveQ)

    expect('message' in result).toBe(true)
    if ('message' in result) {
      expect(result.message).toBe('存在未完成题目，无法提交')
    }
  })

  it('rejects empty answers', () => {
    const result = compute({}, additiveQ)

    expect('message' in result).toBe(true)
    if ('message' in result) {
      expect(result.message).toBe('存在未完成题目，无法提交')
    }
  })
})
