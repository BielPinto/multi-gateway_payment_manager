import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import bcrypt from 'bcrypt'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await User.updateOrCreate(
      { email: 'admin@example.com' },
      {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
      }
    )
  }
}
