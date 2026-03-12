import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Client from './Client'
import Gateway from './Gateway'
import TransactionProduct from './TransactionProduct'

export default class Transaction extends BaseModel {
  public static table = 'transactions'

  @column({ isPrimary: true })
  public id: number

  @column()
  public clientId: number

  @column()
  public gatewayId: number | null

  @column()
  public externalId: string | null

  @column()
  public status: string

  @column()
  public amount: number

  @column()
  public cardLastNumbers: string | null

  @column()
  public idempotencyKey: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Client)
  public client: BelongsTo<typeof Client>

  @belongsTo(() => Gateway)
  public gateway: BelongsTo<typeof Gateway>

  @hasMany(() => TransactionProduct)
  public transactionProducts: HasMany<typeof TransactionProduct>
}
