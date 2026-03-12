import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateGatewaysTable extends BaseSchema {
  protected tableName = 'gateways'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('priority').unsigned().notNullable().defaultTo(0)
      table.string('type', 50).nullable()
      table.string('base_url', 255).nullable()
      table.text('config_json').nullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
