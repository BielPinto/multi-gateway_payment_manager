import vine from '@vinejs/vine'

const purchaseItemSchema = vine.object({
  productId: vine.number().positive(),
  quantity: vine.number().positive().min(1),
})

export const purchaseValidator = vine.create({
  clientName: vine.string().trim().minLength(1),
  clientEmail: vine.string().email().normalizeEmail(),
  items: vine.array(purchaseItemSchema).minLength(1),
  cardNumber: vine.string().regex(/^\d{16}$/),
  cvv: vine.string().regex(/^\d{3,4}$/),
  idempotencyKey: vine.string().trim().optional(),
})
