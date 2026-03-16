/**
 * TDD: testes unitários da lógica de compra (cálculo de amount).
 * Importa de PurchaseAmount.ts (sem Adonis) para não precisar do IoC.
 */
import { test } from '@japa/runner'
import assert from 'assert'
import {
  computeAmountFromItems,
  type PurchaseItem,
  type ProductForAmount,
} from '../../app/Services/PurchaseAmount'

test.group('PurchaseService - computeAmountFromItems', () => {
  const products: ProductForAmount[] = [
    { id: 1, amount: 9990 },
    { id: 2, amount: 14990 },
    { id: 3, amount: 2990 },
  ]

  test('calcula amount para um único item', async () => {
    const items: PurchaseItem[] = [{ productId: 1, quantity: 1 }]
    const amount = computeAmountFromItems(items, products)
    assert.strictEqual(amount, 9990)
  })

  test('calcula amount para múltiplos itens de um mesmo produto', async () => {
    const items: PurchaseItem[] = [{ productId: 1, quantity: 3 }]
    const amount = computeAmountFromItems(items, products)
    assert.strictEqual(amount, 9990 * 3)
  })

  test('calcula amount para múltiplos produtos e quantidades', async () => {
    const items: PurchaseItem[] = [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
      { productId: 3, quantity: 2 },
    ]
    const amount = computeAmountFromItems(items, products)
    assert.strictEqual(amount, 9990 * 2 + 14990 * 1 + 2990 * 2)
  })

  test('ignora itens cujo productId não está na lista de produtos (retorna soma parcial)', async () => {
    const items: PurchaseItem[] = [
      { productId: 1, quantity: 1 },
      { productId: 99, quantity: 10 },
    ]
    const amount = computeAmountFromItems(items, products)
    assert.strictEqual(amount, 9990)
  })

  test('retorna 0 para lista de itens vazia', async () => {
    const amount = computeAmountFromItems([], products)
    assert.strictEqual(amount, 0)
  })
})
