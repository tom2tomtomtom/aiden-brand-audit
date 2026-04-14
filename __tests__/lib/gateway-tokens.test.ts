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

  it('throws when AIDEN_SERVICE_KEY is not set', async () => {
    delete process.env.AIDEN_SERVICE_KEY
    const { checkTokens } = await import('../../src/lib/gateway-tokens')

    global.fetch = vi.fn()

    await expect(checkTokens('user-1', 'brandaudit', 'audit')).rejects.toThrow(
      'AIDEN_SERVICE_KEY is not configured'
    )
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

    const result = await checkTokens('user-abc', 'brandaudit', 'full_audit')

    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://test.aiden.services/api/tokens/check')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Service-Key']).toBe('test-key-123')
    expect(options.headers['X-User-Id']).toBe('user-abc')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ product: 'brandaudit', operation: 'full_audit' })
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

    const result = await deductTokens('user-xyz', 'brandaudit', 'full_audit')

    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://test.aiden.services/api/tokens/deduct')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Service-Key']).toBe('test-key-456')
    expect(options.headers['X-User-Id']).toBe('user-xyz')
    expect(JSON.parse(options.body)).toEqual({ product: 'brandaudit', operation: 'full_audit' })
    expect(result).toEqual(mockResponse)
  })

  it('checkTokens falls back gracefully on non-OK response', async () => {
    process.env.AIDEN_SERVICE_KEY = 'test-key'
    vi.resetModules()
    const { checkTokens } = await import('../../src/lib/gateway-tokens')

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    const result = await checkTokens('user-1', 'brandaudit', 'audit')
    expect(result).toEqual({ allowed: true, required: 0, balance: 0 })
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

    const result = await deductTokens('user-1', 'brandaudit', 'audit')
    expect(result).toEqual(payload)
  })
})
