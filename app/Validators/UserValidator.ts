import vine from '@vinejs/vine'

const roleSchema = vine.enum(['ADMIN', 'MANAGER', 'FINANCE', 'USER'])

export const createUserValidator = vine.create({
  email: vine.string().email().normalizeEmail(),
  password: vine.string().minLength(6),
  role: roleSchema,
})

export const updateUserValidator = vine.create({
  email: vine.string().email().normalizeEmail().optional(),
  password: vine.string().minLength(6).optional(),
  role: roleSchema.optional(),
})
