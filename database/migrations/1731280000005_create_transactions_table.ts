import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateTransactionsTable extends BaseSchema {
  protected tableName = 'transactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('client_id').unsigned().notNullable().references('id').inTable('clients').onDelete('RESTRICT')
      table.integer('gateway_id').unsigned().nullable().references('id').inTable('gateways').onDelete('SET NULL')
      table.string('external_id', 100).nullable()
      table.string('status', 50).notNullable().defaultTo('PENDING')
      table.bigInteger('amount').unsigned().notNullable().comment('valor em centavos')
      table.string('card_last_numbers', 4).nullable()
      table.string('idempotency_key', 64).nullable().unique()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
