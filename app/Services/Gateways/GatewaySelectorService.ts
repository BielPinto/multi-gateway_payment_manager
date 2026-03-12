import Gateway from 'App/Models/Gateway'
import type { PaymentGateway } from './PaymentGateway'
import type { ChargePayload, ChargeResult } from './Types'
import { Gateway1Service } from './Gateway1Service'
import { Gateway2Service } from './Gateway2Service'
import { Gateway1AuthService } from './Gateway1AuthService'

export interface ChargeSuccessResult extends ChargeResult {
  success: true
  externalId: string
  gatewayId: number
}

/**
 * Seleciona gateways ativos por prioridade e tenta cobrança em ordem.
 * Erro de infraestrutura: tenta o próximo gateway.
 * Erro de negócio: não tenta outro; propaga o erro.
 */
export class GatewaySelectorService {
  private buildGatewayInstance(gateway: Gateway): PaymentGateway | null {
    const baseUrl = gateway.baseUrl || ''
    const config = gateway.configJson ? JSON.parse(gateway.configJson) : {}
    if (gateway.type === 'gateway1') {
      const auth = Gateway1AuthService.getInstance()
      auth.configure(baseUrl, config.loginEmail || '', config.loginToken || '')
      return new Gateway1Service(baseUrl, auth)
    }
    if (gateway.type === 'gateway2') {
      return new Gateway2Service(
        baseUrl,
        config.authToken || '',
        config.authSecret || ''
      )
    }
    return null
  }

  async charge(payload: ChargePayload): Promise<ChargeSuccessResult> {
    const gateways = await Gateway.query()
      .where('is_active', true)
      .orderBy('priority', 'asc')

    let lastError: ChargeResult | null = null
    for (const gateway of gateways) {
      const service = this.buildGatewayInstance(gateway)
      if (!service) continue
      const result = await service.charge(payload)
      if (result.success && result.externalId) {
        return {
          success: true,
          externalId: result.externalId,
          gatewayId: gateway.id,
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
}
