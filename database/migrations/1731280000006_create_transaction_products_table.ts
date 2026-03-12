import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateTransactionProductsTable extends BaseSchema {
  protected tableName = 'transaction_products'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('RESTRICT')
      table.integer('quantity').unsigned().notNullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
