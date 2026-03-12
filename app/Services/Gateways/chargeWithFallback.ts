/**
 * Lógica pura de cobrança com fallback (TDD).
 * Sem dependências de Adonis/Lucid; testável com mocks.
 * - Erro de infra → tenta o próximo gateway.
 * - Erro de negócio → não tenta outro; propaga.
 */
import type { PaymentGateway } from './PaymentGateway'
import type { ChargePayload, ChargeResult } from './Types'

export interface ChargeSuccessResult extends ChargeResult {
  success: true
  externalId: string
  gatewayId: number
}

export type GatewayForTest = { id: number; service: PaymentGateway }

export async function chargeWithFallback(
  list: GatewayForTest[],
  payload: ChargePayload
): Promise<ChargeSuccessResult> {
  let lastError: ChargeResult | null = null
  for (const { id: gatewayId, service } of list) {
    const result = await service.charge(payload)
    if (result.success && result.externalId) {
      return {
        success: true,
        externalId: result.externalId,
        gatewayId,
      }
    }
    if (result.type === 'business') {
      throw new Error(result.message || result.code || 'Payment rejected')
    }
    lastError = result
  }
  throw new Error(
    lastError?.message || lastError?.code || 'All gateways failed'
  )
}
