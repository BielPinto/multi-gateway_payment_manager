import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Transaction from './Transaction'
import Product from './Product'

export default class TransactionProduct extends BaseModel {
  public static table = 'transaction_products'

  @column({ isPrimary: true })
  public id: number

  @column()
  public transactionId: number

  @column()
  public productId: number

  @column()
  public quantity: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Transaction)
  public transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>
}
