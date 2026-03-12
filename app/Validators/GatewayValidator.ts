import vine from '@vinejs/vine'

export const gatewayPriorityValidator = vine.create({
  priority: vine.number().min(0),
})

export const gatewayActiveValidator = vine.create({
  isActive: vine.boolean(),
})
