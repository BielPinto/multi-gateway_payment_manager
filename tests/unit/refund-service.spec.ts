/**
 * TDD: testes unitários da validação de reembolso (status PAID, gateway e externalId).
 * Importa de RefundValidation.ts (sem Adonis) para não precisar do IoC.
 */
import { test } from '@japa/runner'
import assert from 'assert'
import {
  validateTransactionForRefund,
  type TransactionForRefundValidation,
} from '../../app/Services/RefundValidation'

test.group('RefundService - validateTransactionForRefund', () => {
  test('lança "Transaction not found" quando transaction é null', async () => {
    assert.throws(
      () => validateTransactionForRefund(null),
      (err: Error) => err.message === 'Transaction not found'
    )
  })

  test('lança "Transaction is not paid or already refunded" quando status não é PAID', async () => {
    const tx: TransactionForRefundValidation = {
      status: 'PENDING',
      externalId: 'ext-1',
      gatewayId: 1,
    }
    assert.throws(
      () => validateTransactionForRefund(tx),
      (err: Error) => err.message === 'Transaction is not paid or already refunded'
    )
  })

  test('lança "Transaction is not paid or already refunded" quando status é REFUNDED', async () => {
    const tx: TransactionForRefundValidation = {
      status: 'REFUNDED',
      externalId: 'ext-1',
      gatewayId: 1,
    }
    assert.throws(
      () => validateTransactionForRefund(tx),
      (err: Error) => err.message === 'Transaction is not paid or already refunded'
    )
  })

  test('lança "Transaction has no gateway reference" quando externalId é null', async () => {
    const tx: TransactionForRefundValidation = {
      status: 'PAID',
      externalId: null,
      gatewayId: 1,
    }
    assert.throws(
      () => validateTransactionForRefund(tx),
      (err: Error) => err.message === 'Transaction has no gateway reference'
    )
  })

  test('lança "Transaction has no gateway reference" quando gatewayId é null', async () => {
    const tx: TransactionForRefundValidation = {
      status: 'PAID',
      externalId: 'ext-1',
      gatewayId: null,
    }
    assert.throws(
      () => validateTransactionForRefund(tx),
      (err: Error) => err.message === 'Transaction has no gateway reference'
    )
  })

  test('não lança quando transação está PAID e tem externalId e gatewayId', async () => {
    const tx: TransactionForRefundValidation = {
      status: 'PAID',
      externalId: 'ext-123',
      gatewayId: 1,
    }
    assert.doesNotThrow(() => validateTransactionForRefund(tx))
  })
})
