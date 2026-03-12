import Gateway from 'App/Models/Gateway'
import type { PaymentGateway } from './PaymentGateway'
import type { ChargePayload } from './Types'
import { chargeWithFallback, type ChargeSuccessResult, type GatewayForTest } from './chargeWithFallback'
import { Gateway1Service } from './Gateway1Service'
import { Gateway2Service } from './Gateway2Service'
import { Gateway1AuthService } from './Gateway1AuthService'

export type { ChargeSuccessResult, GatewayForTest }

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

  /**
   * Cobra no primeiro gateway que responder sucesso; em erro de infra tenta o próximo.
   * @param gatewaysForTest Opcional: lista de { id, service } para testes (TDD fallback).
   */
  async charge(
    payload: ChargePayload,
    gatewaysForTest?: GatewayForTest[]
  ): Promise<ChargeSuccessResult> {
    const list = gatewaysForTest ?? (await this.loadActiveGatewaysFromDb())
    return chargeWithFallback(list, payload)
  }

  private async loadActiveGatewaysFromDb(): Promise<GatewayForTest[]> {
    const gateways = await (Gateway as any).query()
      .where('is_active', true)
      .orderBy('priority', 'asc')
    const list: GatewayForTest[] = []
    for (const gateway of gateways) {
      const service = this.buildGatewayInstance(gateway)
      if (service) list.push({ id: gateway.id, service })
    }
    return list
  }
}
