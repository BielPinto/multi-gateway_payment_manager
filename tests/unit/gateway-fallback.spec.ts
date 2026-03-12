/**
 * TDD: testes da lógica de fallback (chargeWithFallback).
 * Ciclo Red-Green-Refactor — garante que:
 * - Erro de infra no primeiro gateway → tenta o segundo.
 * - Erro de negócio no primeiro → não tenta o segundo, propaga o erro.
 * - Primeiro sucesso → retorna imediatamente, segundo não é chamado.
 * - Todos falham (infra) → lança com a mensagem do último erro.
 *
 * Usa apenas o módulo puro (chargeWithFallback) para não depender do IoC/Adonis.
 * Usa assert do Node para não depender do plugin @japa/assert no runner.
 */
import { test } from '@japa/runner'
import assert from 'assert'
import {
  chargeWithFallback,
  type GatewayForTest,
} from '../../app/Services/Gateways/chargeWithFallback'
import type {
  ChargePayload,
  ChargeResult,
  RefundPayload,
  RefundResult,
} from '../../app/Services/Gateways/Types'
import type { PaymentGateway } from '../../app/Services/Gateways/PaymentGateway'

const defaultPayload: ChargePayload = {
  amount: 100,
  name: 'Test',
  email: 'test@example.com',
  cardNumber: '4111111111111111',
  cvv: '123',
}

function createMockGateway(chargeReturn: ChargeResult): PaymentGateway {
  return {
    charge: async () => chargeReturn,
    refund: async (_: RefundPayload): Promise<RefundResult> => ({ success: true }),
  }
}

test.group('Fallback (TDD) - chargeWithFallback', () => {
  test('quando o primeiro gateway retorna sucesso, retorna imediatamente e não chama o segundo', async () => {
    let firstCalled = false
    let secondCalled = false
    const gateways: GatewayForTest[] = [
      {
        id: 1,
        service: {
          ...createMockGateway({ success: true, externalId: 'ext-1' }),
          charge: async () => {
            firstCalled = true
            return { success: true, externalId: 'ext-1' }
          },
        },
      },
      {
        id: 2,
        service: {
          ...createMockGateway({ success: false, type: 'infra' }),
          charge: async () => {
            secondCalled = true
            return { success: false, type: 'infra', message: 'unused' }
          },
        },
      },
    ]
    const result = await chargeWithFallback(gateways, defaultPayload)
    assert.strictEqual(firstCalled, true)
    assert.strictEqual(secondCalled, false)
    assert.strictEqual(result.gatewayId, 1)
    assert.strictEqual(result.externalId, 'ext-1')
  })

  test('quando o primeiro retorna erro de infra, tenta o segundo; se o segundo suceder, retorna sucesso', async () => {
    const gateways: GatewayForTest[] = [
      {
        id: 1,
        service: createMockGateway({
          success: false,
          type: 'infra',
          code: 'GATEWAY_ERROR',
          message: 'Connection failed',
        }),
      },
      {
        id: 2,
        service: createMockGateway({ success: true, externalId: 'ext-2' }),
      },
    ]
    const result = await chargeWithFallback(gateways, defaultPayload)
    assert.strictEqual(result.gatewayId, 2)
    assert.strictEqual(result.externalId, 'ext-2')
  })

  test('quando o primeiro retorna erro de negócio, não tenta o segundo e propaga o erro', async () => {
    let secondCalled = false
    const gateways: GatewayForTest[] = [
      {
        id: 1,
        service: createMockGateway({
          success: false,
          type: 'business',
          code: 'CARD_DECLINED',
          message: 'Cartão recusado',
        }),
      },
      {
        id: 2,
        service: {
          ...createMockGateway({ success: true, externalId: 'ext-2' }),
          charge: async () => {
            secondCalled = true
            return { success: true, externalId: 'ext-2' }
          },
        },
      },
    ]
    let threw = false
    try {
      await chargeWithFallback(gateways, defaultPayload)
    } catch (err: any) {
      threw = true
      assert.strictEqual(secondCalled, false)
      assert.ok(
        err?.message?.includes('Cartão recusado') || err?.message?.includes('Payment rejected')
      )
    }
    assert.strictEqual(threw, true)
  })

  test('quando todos retornam erro de infra, lança com mensagem do último erro', async () => {
    const gateways: GatewayForTest[] = [
      {
        id: 1,
        service: createMockGateway({
          success: false,
          type: 'infra',
          message: 'First gateway down',
        }),
      },
      {
        id: 2,
        service: createMockGateway({
          success: false,
          type: 'infra',
          message: 'Second gateway down',
        }),
      },
    ]
    let threw = false
    try {
      await chargeWithFallback(gateways, defaultPayload)
    } catch (err: any) {
      threw = true
      assert.ok((err?.message || '').includes('Second gateway down'))
    }
    assert.strictEqual(threw, true)
  })

  test('ordem de tentativa segue a lista injetada (prioridade)', async () => {
    const callOrder: number[] = []
    const gateways: GatewayForTest[] = [
      {
        id: 10,
        service: {
          ...createMockGateway({ success: false, type: 'infra' }),
          charge: async () => {
            callOrder.push(10)
            return { success: false, type: 'infra', message: 'A down' }
          },
        },
      },
      {
        id: 20,
        service: {
          ...createMockGateway({ success: true, externalId: 'ext-20' }),
          charge: async () => {
            callOrder.push(20)
            return { success: true, externalId: 'ext-20' }
          },
        },
      },
    ]
    const result = await chargeWithFallback(gateways, defaultPayload)
    assert.deepStrictEqual(callOrder, [10, 20])
    assert.strictEqual(result.gatewayId, 20)
  })
})
