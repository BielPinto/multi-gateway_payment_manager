import type { ChargePayload, ChargeResult, RefundPayload, RefundResult } from './Types'

/**
 * Interface comum para gateways de pagamento.
 * Permite adicionar novos gateways de forma modular.
 */
export interface PaymentGateway {
  charge(payload: ChargePayload): Promise<ChargeResult>
  refund(payload: RefundPayload): Promise<RefundResult>
}
