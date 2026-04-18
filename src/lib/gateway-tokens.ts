/**
 * Gateway Token Client
 *
 * Calls the AIDEN Gateway token API for balance checks and deductions.
 * Uses X-Service-Key + X-User-Id headers for server-to-server auth.
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://www.aiden.services'
const SERVICE_KEY = process.env.AIDEN_SERVICE_KEY

interface CheckResult {
  allowed: boolean
  required: number
  balance: number
  /**
   * True when the Gateway could not be reached or returned an error.
   * Callers should fail closed: deny the operation and surface a clear
   * error to the user rather than silently granting free access.
   */
  gatewayUnavailable?: boolean
}

interface DeductResult {
  success: boolean
  remaining?: number
  error?: string
  required?: number
  balance?: number
  gatewayUnavailable?: boolean
}

function getHeaders(userId: string): Record<string, string> {
  if (!SERVICE_KEY) {
    throw new Error('AIDEN_SERVICE_KEY is not configured')
  }
  return {
    'Content-Type': 'application/json',
    'X-Service-Key': SERVICE_KEY,
    'X-User-Id': userId,
  }
}

export async function checkTokens(
  userId: string,
  product: string,
  operation: string
): Promise<CheckResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/tokens/check`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ product, operation }),
    })

    if (!res.ok) {
      console.error(`[gateway-tokens] Check failed: ${res.status}`)
      return {
        allowed: false,
        required: 0,
        balance: 0,
        gatewayUnavailable: true,
      }
    }

    return res.json()
  } catch (err) {
    console.error('[gateway-tokens] Check threw:', err)
    return {
      allowed: false,
      required: 0,
      balance: 0,
      gatewayUnavailable: true,
    }
  }
}

export async function deductTokens(
  userId: string,
  product: string,
  operation: string
): Promise<DeductResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/tokens/deduct`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ product, operation }),
    })

    if (!res.ok && res.status === 402) {
      return res.json()
    }

    if (!res.ok) {
      console.error(`[gateway-tokens] Deduct failed: ${res.status}`)
      return { success: false, error: `gateway_error_${res.status}`, gatewayUnavailable: true }
    }

    return res.json()
  } catch (err) {
    console.error('[gateway-tokens] Deduct threw:', err)
    return { success: false, error: 'gateway_unreachable', gatewayUnavailable: true }
  }
}
