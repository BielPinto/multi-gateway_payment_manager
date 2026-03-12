import { httpRequest } from '../Http/HttpClient'
import type { PaymentGateway } from './PaymentGateway'
import type { ChargePayload, ChargeResult, RefundPayload, RefundResult } from './Types'
import { Gateway1AuthService } from './Gateway1AuthService'

function isInfraError(status: number): boolean {
  return status >= 500 || status === 404
}

export class Gateway1Service implements PaymentGateway {
  constructor(
    private baseUrl: string,
    private auth: Gateway1AuthService
  ) {}

  private async requestWithAuth(
    path: string,
    options: { method?: string; body?: object },
    retryOn401 = true
  ): Promise<{ status: number; data: any }> {
    const token = await this.auth.getToken()
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`
    const { status, data } = await httpRequest(url, {
      method: options.method || 'GET',
      headers: { Authorization: `Bearer ${token}` },
      body: options.body,
    })
    if (status === 401 && retryOn401) {
      this.auth.clearToken()
      const newToken = await this.auth.getToken()
      const retry = await httpRequest(url, {
        method: options.method || 'GET',
        headers: { Authorization: `Bearer ${newToken}` },
        body: options.body,
      })
      return retry
    }
    return { status, data }
  }

  async charge(payload: ChargePayload): Promise<ChargeResult> {
    try {
      const { status, data } = await this.requestWithAuth('/transactions', {
        method: 'POST',
        body: {
          amount: payload.amount,
          name: payload.name,
          email: payload.email,
          cardNumber: payload.cardNumber,
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
        message: err?.message || 'Connection failed',
      }
    }
  }

  async refund(payload: RefundPayload): Promise<RefundResult> {
    try {
      const { status, data } = await this.requestWithAuth(
        `/transactions/${payload.externalId}/charge_back`,
        { method: 'POST' }
      )
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
