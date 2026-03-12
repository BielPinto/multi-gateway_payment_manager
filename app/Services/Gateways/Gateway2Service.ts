import { httpRequest } from '../Http/HttpClient'
import type { PaymentGateway } from './PaymentGateway'
import type { ChargePayload, ChargeResult, RefundPayload, RefundResult } from './Types'

function isInfraError(status: number): boolean {
  return status >= 500 || status === 404
}

export class Gateway2Service implements PaymentGateway {
  private authHeaders: Record<string, string>

  constructor(
    private baseUrl: string,
    authToken: string,
    authSecret: string
  ) {
    this.authHeaders = {
      'Gateway-Auth-Token': authToken,
      'Gateway-Auth-Secret': authSecret,
    }
  }

  private async request(path: string, options: { method?: string; body?: object } = {}): Promise<{ status: number; data: any }> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`
    return httpRequest(url, {
      method: options.method || 'GET',
      headers: this.authHeaders,
      body: options.body,
    })
  }

  async charge(payload: ChargePayload): Promise<ChargeResult> {
    try {
      const { status, data } = await this.request('/transacoes', {
        method: 'POST',
        body: {
          valor: payload.amount,
          nome: payload.name,
          email: payload.email,
          numeroCartao: payload.cardNumber,
          cvv: payload.cvv,
        },
      })
      if ((status === 200 || status === 201) && data?.id) {
        return { success: true, externalId: String(data.id) }
      }
      if (status >= 400 && status < 500) {
        return {
          success: false,
          type: 'business',
          code: data?.code || 'CARD_DECLINED',
          message: data?.message || 'Payment rejected',
        }
      }
      return {
        success: false,
        type: 'infra',
        code: 'GATEWAY_ERROR',
        message: data?.message || `HTTP ${status}`,
      }
    } catch (err: any) {
      return {
        success: false,
        type: 'infra',
        code: err?.code || 'NETWORK_ERROR',
        message: err?.message,
      }
    }
  }

  async refund(payload: RefundPayload): Promise<RefundResult> {
    try {
      const { status, data } = await this.request('/transacoes/reembolso', {
        method: 'POST',
        body: { id: payload.externalId },
      })
      if (status === 200 || status === 201) {
        return { success: true }
      }
      if (status >= 400 && status < 500) {
        return {
          success: false,
          type: 'business',
          code: data?.code || 'REFUND_REJECTED',
          message: data?.message,
        }
      }
      return {
        success: false,
        type: isInfraError(status) ? 'infra' : 'business',
        code: 'GATEWAY_ERROR',
        message: data?.message || `HTTP ${status}`,
      }
    } catch (err: any) {
      return {
        success: false,
        type: 'infra',
        code: err?.code || 'NETWORK_ERROR',
        message: err?.message,
      }
    }
  }
}
