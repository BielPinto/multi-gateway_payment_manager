import type Gateway from 'App/Models/Gateway'
import type { PaymentGateway } from './PaymentGateway'
import { Gateway1Service } from './Gateway1Service'
import { Gateway2Service } from './Gateway2Service'
import { Gateway1AuthService } from './Gateway1AuthService'

/**
 * Fábrica de gateways: um único ponto para criar instâncias a partir do registro no banco.
 * Para adicionar um novo gateway:
 * 1. Crie XxxGatewayService implementando PaymentGateway (charge + refund).
 * 2. Adicione um case aqui em createFromGateway com o type correspondente.
 * 3. Cadastre o gateway no banco (seed ou admin) com type, base_url e config_json.
 */
export class GatewayFactory {
  static createFromGateway(gateway: Gateway): PaymentGateway | null {
    const baseUrl = gateway.baseUrl || ''
    const config = gateway.configJson ? JSON.parse(gateway.configJson) : {}

    switch (gateway.type) {
      case 'gateway1': {
        const auth = Gateway1AuthService.getInstance()
        auth.configure(baseUrl, config.loginEmail || '', config.loginToken || '')
        return new Gateway1Service(baseUrl, auth)
      }
      case 'gateway2':
        return new Gateway2Service(
          baseUrl,
          config.authToken || '',
          config.authSecret || ''
        )
      default:
        return null
    }
  }
}
