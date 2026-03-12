import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Gateway extends BaseModel {
  public static table = 'gateways'

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public isActive: boolean

  @column()
  public priority: number

  @column()
  public type: string | null

  @column()
  public baseUrl: string | null

  @column()
  public configJson: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
