import Transaction from 'App/Models/Transaction'
import Gateway from 'App/Models/Gateway'
import { Gateway1Service } from './Gateways/Gateway1Service'
import { Gateway2Service } from './Gateways/Gateway2Service'
import { Gateway1AuthService } from './Gateways/Gateway1AuthService'

const STATUS_PAID = 'PAID'
const STATUS_REFUNDED = 'REFUNDED'

export class RefundService {
  async execute(transactionId: number): Promise<Transaction> {
    const transaction = await (Transaction as any).find(transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }
    if (transaction.status !== STATUS_PAID) {
      throw new Error('Transaction is not paid or already refunded')
    }
    if (!transaction.externalId || !transaction.gatewayId) {
      throw new Error('Transaction has no gateway reference')
    }

    const gateway = await (Gateway as any).find(transaction.gatewayId)
    if (!gateway?.isActive) {
      throw new Error('Gateway not available')
    }

    const baseUrl = gateway.baseUrl || ''
    const config = gateway.configJson ? JSON.parse(gateway.configJson) : {}
    let result

    if (gateway.type === 'gateway1') {
      const auth = Gateway1AuthService.getInstance()
      auth.configure(baseUrl, config.loginEmail || '', config.loginToken || '')
      const service = new Gateway1Service(baseUrl, auth)
      result = await service.refund({ externalId: transaction.externalId })
    } else if (gateway.type === 'gateway2') {
      const service = new Gateway2Service(
        baseUrl,
        config.authToken || '',
        config.authSecret || ''
      )
      result = await service.refund({ externalId: transaction.externalId })
    } else {
      throw new Error('Unknown gateway type')
    }

    if (!result.success) {
      throw new Error(result.message || result.code || 'Refund failed')
    }

    transaction.status = STATUS_REFUNDED
    await transaction.save()
    return transaction
  }
}
