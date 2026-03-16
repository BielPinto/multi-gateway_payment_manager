import Transaction from 'App/Models/Transaction'
import Gateway from 'App/Models/Gateway'
import { GatewayFactory } from './Gateways/GatewayFactory'
import { validateTransactionForRefund } from './RefundValidation'

export type { TransactionForRefundValidation } from './RefundValidation'
export { validateTransactionForRefund } from './RefundValidation'

const STATUS_REFUNDED = 'REFUNDED'

export class RefundService {
  async execute(transactionId: number): Promise<Transaction> {
    const transaction = await (Transaction as any).find(transactionId)
    validateTransactionForRefund(
      transaction ? { status: transaction.status, externalId: transaction.externalId, gatewayId: transaction.gatewayId } : null
    )

    const gateway = await (Gateway as any).find(transaction!.gatewayId)
    if (!gateway?.isActive) {
      throw new Error('Gateway not available')
    }

    const service = GatewayFactory.createFromGateway(gateway)
    if (!service) {
      throw new Error(`Unknown gateway type: ${gateway.type}`)
    }

    const result = await service.refund({ externalId: transaction.externalId })

    if (!result.success) {
      throw new Error(result.message || result.code || 'Refund failed')
    }

    transaction.status = STATUS_REFUNDED
    await transaction.save()
    return transaction
  }
}
