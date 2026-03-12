/**
 * Payload para cobrança (comum aos gateways).
 */
export interface ChargePayload {
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

/**
 * Tipo de erro: negócio (não tentar outro gateway) ou infraestrutura (tentar próximo).
 */
export type GatewayErrorType = 'business' | 'infra'

/**
 * Resultado de uma tentativa de cobrança.
 */
export interface ChargeResult {
  success: boolean
  externalId?: string
  type?: GatewayErrorType
  code?: string
  message?: string
}

/**
 * Payload para reembolso (id externo do gateway).
 */
export interface RefundPayload {
  externalId: string
}

/**
 * Resultado de uma tentativa de reembolso.
 */
export interface RefundResult {
  success: boolean
  type?: GatewayErrorType
  code?: string
  message?: string
}
