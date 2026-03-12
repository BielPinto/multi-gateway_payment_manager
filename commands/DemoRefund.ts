import { BaseCommand } from '@adonisjs/core/build/standalone'
import { RefundService } from 'App/Services/RefundService'
import Transaction from 'App/Models/Transaction'

/**
 * Demonstração: reembolsa a última transação paga usando RefundService.
 */
export default class DemoRefund extends BaseCommand {
  public static commandName = 'demo:refund'

  public static description = 'Refund the latest paid transaction (demos RefundService)'

  public static settings = {
    loadApp: true,
  }

  public async run() {
    const lastPaid = await Transaction.query().where('status', 'PAID').orderBy('id', 'desc').first()
    if (!lastPaid) {
      this.logger.warning('No paid transaction found. Run demo:purchase first.')
      return
    }
    const refund = new RefundService()
    const transaction = await refund.execute(lastPaid.id)
    this.logger.success(`Refund completed. Transaction #${transaction.id} - Status: ${transaction.status}`)
  }
}
