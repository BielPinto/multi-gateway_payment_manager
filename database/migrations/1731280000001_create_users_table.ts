import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateUsersTable extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email', 255).notNullable().unique()
      table.string('password', 255).notNullable()
      table.string('role', 50).notNullable().defaultTo('USER')
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
