import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Gateway from 'App/Models/Gateway'

export default class GatewaySeeder extends BaseSeeder {
  public async run() {
    await Gateway.updateOrCreate(
      { name: 'Gateway 1' },
      {
        name: 'Gateway 1',
        isActive: true,
        priority: 1,
        type: 'gateway1',
        baseUrl: 'http://localhost:3001',
        configJson: JSON.stringify({
          loginEmail: 'dev@betalent.tech',
          loginToken: 'FEC9BB078BF338F464F96B48089EB498',
        }),
      }
    )
    await Gateway.updateOrCreate(
      { name: 'Gateway 2' },
      {
        name: 'Gateway 2',
        isActive: true,
        priority: 2,
        type: 'gateway2',
        baseUrl: 'http://localhost:3002',
        configJson: JSON.stringify({
          authToken: 'tk_f2198cc671b5289fa856',
          authSecret: '3d15e8ed6131446ea7e3456728b1211f',
        }),
      }
    )
  }
}
