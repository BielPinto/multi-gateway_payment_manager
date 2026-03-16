/**
 * Validação pura de reembolso (sem dependências do Adonis).
 * Usado por RefundService e por testes unitários sem precisar do IoC.
 */

const STATUS_PAID = 'PAID'

export interface TransactionForRefundValidation {
  status: string
  externalId: string | null
  gatewayId: number | null
}

/**
 * Valida se a transação pode ser reembolsada (PAID, com gateway e externalId).
 */
export function validateTransactionForRefund(
  transaction: TransactionForRefundValidation | null
): void {
  if (!transaction) {
    throw new Error('Transaction not found')
  }
  if (transaction.status !== STATUS_PAID) {
    throw new Error('Transaction is not paid or already refunded')
  }
  if (!transaction.externalId || !transaction.gatewayId) {
    throw new Error('Transaction has no gateway reference')
  }
}
