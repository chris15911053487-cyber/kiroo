import { describe, it, expect } from 'vitest'
import { computeMidsF2 } from '../midsF2Scoring'

describe('computeMidsF2', () => {
  it('calculates total score correctly (all max → 100)', () => {
    const scores = {
      strategic_breakthrough: 5,
      execution_disruption: 5,
      resource_integration: 5,
      adversity_quotient: 5,
      ethics_vision: 5,
    }
    const result = computeMidsF2(scores)
    expect(result.totalScore).toBe(100)
    expect(result.sScore).toBe(5)
    expect(result.pScore).toBe(5)
    expect(result.fScore).toBe(5)
    expect(result.decisionPath).toBe('leading_succession')
    expect(result.warnings).toHaveLength(0)
  })

  it('calculates total score correctly (all min → 20)', () => {
    const scores = {
      strategic_breakthrough: 1,
      execution_disruption: 1,
      resource_integration: 1,
      adversity_quotient: 1,
      ethics_vision: 1,
    }
    const result = computeMidsF2(scores)
    expect(result.totalScore).toBe(20)
    expect(result.decisionPath).toBe('further_study')
  })

  it('classifies as independent_startup when S high, P low, F low', () => {
    const scores = {
      strategic_breakthrough: 4.5,
      execution_disruption: 2.0,
      resource_integration: 2.0,
      adversity_quotient: 3.0,
      ethics_vision: 2.5,
    }
    const result = computeMidsF2(scores)
    expect(result.decisionPath).toBe('independent_startup')
  })

  it('classifies as functional_employment when S low, P high, F high', () => {
    const scores = {
      strategic_breakthrough: 2.0,
      execution_disruption: 4.5,
      resource_integration: 4.0,
      adversity_quotient: 4.0,
      ethics_vision: 4.0,
    }
    const result = computeMidsF2(scores)
    expect(result.decisionPath).toBe('functional_employment')
  })

  it('triggers warning when D4 < 2.5', () => {
    const scores = {
      strategic_breakthrough: 3.0,
      execution_disruption: 3.0,
      resource_integration: 3.0,
      adversity_quotient: 2.0,
      ethics_vision: 3.0,
    }
    const result = computeMidsF2(scores)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('2.5')
  })

  it('triggers warning when D5 < 3', () => {
    const scores = {
      strategic_breakthrough: 3.0,
      execution_disruption: 3.0,
      resource_integration: 3.0,
      adversity_quotient: 3.0,
      ethics_vision: 2.5,
    }
    const result = computeMidsF2(scores)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('伦理')
  })

  it('handles missing dimensions gracefully', () => {
    const result = computeMidsF2({ strategic_breakthrough: 3, execution_disruption: 3 })
    expect(result.totalScore).toBe(24)  // (3+3+0+0+0)*4
  })
})
