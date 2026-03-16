import Gateway from 'App/Models/Gateway'
import type { ChargePayload } from './Types'
import { chargeWithFallback, type ChargeSuccessResult, type GatewayForTest } from './chargeWithFallback'
import { GatewayFactory } from './GatewayFactory'

export type { ChargeSuccessResult, GatewayForTest }

/**
 * Seleciona gateways ativos por prioridade e tenta cobrança em ordem.
 * Erro de infraestrutura: tenta o próximo gateway.
 * Erro de negócio: não tenta outro; propaga o erro.
 * Novos gateways: implemente PaymentGateway e registre em GatewayFactory.
 */
export class GatewaySelectorService {
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
      const service = GatewayFactory.createFromGateway(gateway)
      if (service) list.push({ id: gateway.id, service })
    }
    return list
  }
}
