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
  // Per-brand total: logo_scraping(10) + ad_library(15) + color_extraction(5)
  //                  + brand_intel(15) + social_sentiment(15) = 60
  // Strategic analysis fixed cost: 50
  // Formula: 60 * brandCount + 50

  it('returns perBrand=60 and analysis=50 regardless of brand count', () => {
    const result = estimateAuditCost(1)
    expect(result.perBrand).toBe(60)
    expect(result.analysis).toBe(50)
  })

  it('calculates correct total for 1 brand: 60*1 + 50 = 110', () => {
    expect(estimateAuditCost(1).total).toBe(110)
  })

  it('calculates correct total for 3 brands: 60*3 + 50 = 230', () => {
    expect(estimateAuditCost(3).total).toBe(230)
  })

  it('calculates correct total for 5 brands: 60*5 + 50 = 350', () => {
    expect(estimateAuditCost(5).total).toBe(350)
  })

  it('returns a breakdown matching the individual cost constants', () => {
    const { breakdown } = estimateAuditCost(1)
    expect(breakdown.logo_scraping).toBe(10)
    expect(breakdown.ad_library).toBe(15)
    expect(breakdown.color_extraction).toBe(5)
    expect(breakdown.brand_intel).toBe(15)
    expect(breakdown.social_sentiment).toBe(15)
  })

  it('returns a copy of breakdown (not a mutable reference)', () => {
    const result = estimateAuditCost(1)
    result.breakdown.logo_scraping = 999
    expect(estimateAuditCost(1).breakdown.logo_scraping).toBe(10)
  })
})
