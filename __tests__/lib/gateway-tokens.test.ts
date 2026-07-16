import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// gateway-tokens reads SERVICE_KEY at module load time, so we must control
// process.env before importing and use a fresh module for each scenario.

describe('getHeaders (via checkTokens/deductTokens)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.AIDEN_SERVICE_KEY
    delete process.env.GATEWAY_URL
  })

  it('fails closed when AIDEN_SERVICE_KEY is not set', async () => {
    delete process.env.AIDEN_SERVICE_KEY
    const { checkTokens } = await import('../../src/lib/gateway-tokens')

    global.fetch = vi.fn()

    await expect(checkTokens('user-1', 'brand_audit', 'per_brand')).resolves.toEqual({
      allowed: false,
      required: 0,
      balance: 0,
      gatewayUnavailable: true,
    })
  })

  it('checkTokens POSTs to /api/tokens/check with correct body and headers', async () => {
    process.env.AIDEN_SERVICE_KEY = 'test-key-123'
    process.env.GATEWAY_URL = 'https://test.aiden.services'
    vi.resetModules()
    const { checkTokens } = await import('../../src/lib/gateway-tokens')

    const mockResponse = { allowed: true, required: 50, balance: 200 }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await checkTokens('user-abc', 'brand_audit', 'per_brand')

    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://test.aiden.services/api/tokens/check')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Service-Key']).toBe('test-key-123')
    expect(options.headers['X-User-Id']).toBe('user-abc')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ product: 'brand_audit', operation: 'per_brand' })
    expect(result).toEqual(mockResponse)
  })

  it('deductTokens POSTs to /api/tokens/deduct with correct body and headers', async () => {
    process.env.AIDEN_SERVICE_KEY = 'test-key-456'
    process.env.GATEWAY_URL = 'https://test.aiden.services'
    vi.resetModules()
    const { deductTokens } = await import('../../src/lib/gateway-tokens')

    const mockResponse = { success: true, remaining: 150 }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await deductTokens(
      'user-xyz',
      'brand_audit',
      'strategic_analysis',
      '11111111-1111-4111-8111-111111111111',
    )

    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://test.aiden.services/api/tokens/deduct')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Service-Key']).toBe('test-key-456')
    expect(options.headers['X-User-Id']).toBe('user-xyz')
    expect(JSON.parse(options.body)).toEqual({
      product: 'brand_audit',
      operation: 'strategic_analysis',
      requestId: '11111111-1111-4111-8111-111111111111',
    })
    expect(result).toEqual(mockResponse)
  })

  it('checkTokens fails closed on non-OK response', async () => {
    process.env.AIDEN_SERVICE_KEY = 'test-key'
    vi.resetModules()
    const { checkTokens } = await import('../../src/lib/gateway-tokens')

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    const result = await checkTokens('user-1', 'brand_audit', 'per_brand')
    expect(result).toEqual({
      allowed: false,
      required: 0,
      balance: 0,
      gatewayUnavailable: true,
    })
  })

  it('deductTokens returns 402 payload on insufficient tokens', async () => {
    process.env.AIDEN_SERVICE_KEY = 'test-key'
    vi.resetModules()
    const { deductTokens } = await import('../../src/lib/gateway-tokens')

    const payload = { success: false, error: 'Insufficient tokens', required: 110, balance: 50 }
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => payload,
    })

    const result = await deductTokens('user-1', 'brand_audit', 'per_brand')
    expect(result).toEqual(payload)
  })

  it('records provider usage against the active cost context', async () => {
    process.env.AIDEN_SERVICE_KEY = 'test-key'
    process.env.GATEWAY_URL = 'https://test.aiden.services'
    vi.resetModules()
    const { recordCostEvent, withCostContext } = await import('../../src/lib/gateway-tokens')

    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 201 })

    const recorded = await withCostContext({
      userId: 'user-cost',
      requestId: '22222222-2222-4222-8222-222222222222',
      operation: 'per_brand',
    }, () => recordCostEvent({
      idempotencyKey: 'anthropic:msg_123',
      provider: 'anthropic',
      providerRequestId: 'msg_123',
      model: 'claude-sonnet-4-6',
      inputTokens: 120,
      outputTokens: 30,
    }))

    expect(recorded).toBe(true)
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://test.aiden.services/api/cost-events')
    expect(JSON.parse(options.body)).toMatchObject({
      requestId: '22222222-2222-4222-8222-222222222222',
      product: 'brand_audit',
      operation: 'per_brand',
      providerRequestId: 'msg_123',
      inputTokens: 120,
      outputTokens: 30,
    })
  })
})
