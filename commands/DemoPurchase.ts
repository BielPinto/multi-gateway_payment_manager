import { BaseCommand } from '@adonisjs/core/build/standalone'
import { PurchaseService } from 'App/Services/PurchaseService'

/**
 * Demonstração: executa uma compra usando PurchaseService.
 * Requer gateways mock rodando (docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock)
 * e seeds já executados (node ace db:seed).
 */
export default class DemoPurchase extends BaseCommand {
  public static commandName = 'demo:purchase'

  public static description = 'Run a sample purchase using PurchaseService (demos Fase 3)'

  public static settings = {
    loadApp: true,
  }

  public async run() {
    const purchase = new PurchaseService()
    const transaction = await purchase.execute({
      clientName: 'Tester',
      clientEmail: 'tester@email.com',
      items: [{ productId: 1, quantity: 1 }],
      cardNumber: '5569000000006063',
      cvv: '010',
      idempotencyKey: `demo-${Date.now()}`,
    })
    this.logger.success(`Purchase completed. Transaction #${transaction.id} - Status: ${transaction.status}`)
    this.logger.info(`Amount: ${transaction.amount} centavos | Gateway ID: ${transaction.gatewayId} | External ID: ${transaction.externalId}`)
  }
}
