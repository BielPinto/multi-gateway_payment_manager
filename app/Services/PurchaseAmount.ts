/**
 * Lógica pura de cálculo de valor de compra (sem dependências do Adonis).
 * Usado por PurchaseService e por testes unitários sem precisar do IoC.
 */

export interface PurchaseItem {
  productId: number
  quantity: number
}

export interface ProductForAmount {
  id: number
  amount: number
}

/**
 * Calcula o valor total em centavos a partir de itens e produtos.
 */
export function computeAmountFromItems(
  items: PurchaseItem[],
  products: ProductForAmount[]
): number {
  return items.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId)
    if (!p) return sum
    return sum + p.amount * item.quantity
  }, 0)
}
