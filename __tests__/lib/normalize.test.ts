import { describe, expect, it } from 'vitest'
import { normalizeStrategicAnalysis, normalizeAuditResults } from '../../src/lib/normalize'

describe('normalizeStrategicAnalysis', () => {
  it('fills missing strategicSynthesis arrays that the LLM omitted (the report-crash bug)', () => {
    // Reproduces the production crash: LLM returned an object missing
    // whiteSpaceOpportunities and recommendedActions, so the component read
    // `.length` on undefined.
    const partial = {
      executiveSummary: { overview: 'x' },
      strategicSynthesis: { competitivePositioning: {} },
    }
    const n = normalizeStrategicAnalysis(partial)
    expect(n.strategicSynthesis.whiteSpaceOpportunities).toEqual([])
    expect(n.strategicSynthesis.recommendedActions).toEqual([])
    expect(n.executiveSummary.keyFindings).toEqual([])
    expect(n.visualDna.sharedPatterns).toEqual([])
    expect(n.visualDna.uniqueElements).toEqual({})
    expect(n.creativeDna.messagingThemes).toEqual({})
    expect(n.creativeDna.toneAndVoice).toEqual({})
  })

  it('survives completely missing / null / non-object input', () => {
    for (const bad of [null, undefined, 'nope', 42, []]) {
      const n = normalizeStrategicAnalysis(bad)
      expect(n.strategicSynthesis.whiteSpaceOpportunities).toEqual([])
      expect(n.strategicSynthesis.recommendedActions).toEqual([])
      expect(Object.keys(n.strategicSynthesis.competitivePositioning)).toEqual([])
    }
  })

  it('preserves valid data the LLM did return', () => {
    const good = {
      executiveSummary: { overview: 'o', keyFindings: ['a', 'b'], strategicImplications: 's' },
      creativeDna: { messagingThemes: { Nike: ['bold', 'fast'] }, toneAndVoice: { Nike: 'assertive' } },
      strategicSynthesis: {
        whiteSpaceOpportunities: ['gap one'],
        recommendedActions: [{ action: 'do x', rationale: 'because', expectedImpact: 'win' }],
      },
    }
    const n = normalizeStrategicAnalysis(good)
    expect(n.executiveSummary.keyFindings).toEqual(['a', 'b'])
    expect(n.creativeDna.messagingThemes.Nike).toEqual(['bold', 'fast'])
    expect(n.strategicSynthesis.whiteSpaceOpportunities).toEqual(['gap one'])
    expect(n.strategicSynthesis.recommendedActions[0].action).toBe('do x')
  })

  it('drops malformed array members instead of crashing', () => {
    const messy = {
      strategicSynthesis: {
        whiteSpaceOpportunities: ['ok', 42, null, 'fine'],
        recommendedActions: [{ action: 'a' }, 'garbage', null],
      },
    }
    const n = normalizeStrategicAnalysis(messy)
    expect(n.strategicSynthesis.whiteSpaceOpportunities).toEqual(['ok', 'fine'])
    expect(n.strategicSynthesis.recommendedActions).toEqual([
      { action: 'a', rationale: '', expectedImpact: '' },
      { action: '', rationale: '', expectedImpact: '' },
      { action: '', rationale: '', expectedImpact: '' },
    ])
  })

  it('normalizeAuditResults normalizes nested analysis and keeps other fields', () => {
    const results = { id: 'r1', brands: [{ name: 'A' }], duration: 10, strategicAnalysis: {} }
    const n = normalizeAuditResults(results)
    expect(n.id).toBe('r1')
    expect(n.brands).toEqual([{ name: 'A' }])
    expect(n.strategicAnalysis.strategicSynthesis.whiteSpaceOpportunities).toEqual([])
  })
})
