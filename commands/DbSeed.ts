import { BaseCommand } from '@adonisjs/core/build/standalone'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SeedsRunner } = require('@adonisjs/lucid/build/src/SeedsRunner')

export default class DbSeed extends BaseCommand {
  public static commandName = 'db:seed'

  public static description = 'Run database seeders'

  public static settings = {
    loadApp: true,
  }

  public async run() {
    const Database = this.application.container.use('Adonis/Lucid/Database')
    const seedsRunner = new SeedsRunner(Database, this.application, undefined)
    const files = await seedsRunner.getList()
    for (const file of files) {
      const result = await seedsRunner.run(file)
      if (result.status === 'failed') {
        this.logger.error(`Seeder ${file.name} failed: ${result.error?.message}`)
        this.exitCode = 1
        return
      }
      this.logger.info(`Ran seeder: ${file.name}`)
    }
    this.logger.success('Seeders completed')
  }
}
