import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateProductsTable extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.bigInteger('amount').unsigned().notNullable().comment('valor em centavos')
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
