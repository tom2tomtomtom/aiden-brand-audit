import { describe, it, expect } from 'vitest'
import { estimateAuditCost, getMonthlyTokenGrant } from '../../src/lib/tokens'

describe('getMonthlyTokenGrant', () => {
  it('returns 100 for the free plan', () => {
    expect(getMonthlyTokenGrant('free')).toBe(100)
  })

  it('returns 0 for the starter plan', () => {
    expect(getMonthlyTokenGrant('starter')).toBe(0)
  })

  it('returns 1500 for the pro plan', () => {
    expect(getMonthlyTokenGrant('pro')).toBe(1500)
  })

  it('returns 5000 for the agency plan', () => {
    expect(getMonthlyTokenGrant('agency')).toBe(5000)
  })
})

describe('estimateAuditCost', () => {
  // Source of truth: aiden-gateway/lib/tokens.ts brand_audit costs.
  // Per-brand total: logo_scraping(8) + ad_library(10) + color_extraction(4)
  //                  + brand_intel(10) + social_sentiment(8) = 40
  // Strategic analysis fixed cost: 20
  // Formula: 40 * brandCount + 20

  it('returns perBrand=40 and analysis=20 regardless of brand count', () => {
    const result = estimateAuditCost(1)
    expect(result.perBrand).toBe(40)
    expect(result.analysis).toBe(20)
  })

  it('calculates correct total for 1 brand: 40*1 + 20 = 60', () => {
    expect(estimateAuditCost(1).total).toBe(60)
  })

  it('calculates correct total for 3 brands: 40*3 + 20 = 140', () => {
    expect(estimateAuditCost(3).total).toBe(140)
  })

  it('calculates correct total for 5 brands: 40*5 + 20 = 220', () => {
    expect(estimateAuditCost(5).total).toBe(220)
  })

  it('returns a breakdown matching the individual cost constants', () => {
    const { breakdown } = estimateAuditCost(1)
    expect(breakdown.logo_scraping).toBe(8)
    expect(breakdown.ad_library).toBe(10)
    expect(breakdown.color_extraction).toBe(4)
    expect(breakdown.brand_intel).toBe(10)
    expect(breakdown.social_sentiment).toBe(8)
  })

  it('returns a copy of breakdown (not a mutable reference)', () => {
    const result = estimateAuditCost(1)
    result.breakdown.logo_scraping = 999
    expect(estimateAuditCost(1).breakdown.logo_scraping).toBe(8)
  })
})
