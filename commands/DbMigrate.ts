import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class DbMigrate extends BaseCommand {
  public static commandName = 'db:migrate'

  public static description = 'Run database migrations'

  public static settings = {
    loadApp: true,
  }

  public async run() {
    const Database = this.application.container.use('Adonis/Lucid/Database')
    const Migrator = this.application.container.resolveBinding('Adonis/Lucid/Migrator')
    const migrator = new Migrator(Database, this.application, {
      direction: 'up',
      connectionName: undefined,
      dryRun: false,
      disableLocks: false,
    })
    await migrator.run()
    await migrator.close()
    this.logger.success('Migrations completed')
  }
}
