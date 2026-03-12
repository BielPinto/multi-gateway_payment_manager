import vine from '@vinejs/vine'

export const createProductValidator = vine.create({
  name: vine.string().trim().minLength(1),
  amount: vine.number().positive(), // centavos
})

export const updateProductValidator = vine.create({
  name: vine.string().trim().minLength(1).optional(),
  amount: vine.number().positive().optional(),
})
