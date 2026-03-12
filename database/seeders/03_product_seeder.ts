import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Product from 'App/Models/Product'

export default class ProductSeeder extends BaseSeeder {
  public async run() {
    const products = [
      { name: 'Produto A', amount: 9990 },
      { name: 'Produto B', amount: 14990 },
      { name: 'Produto C', amount: 2990 },
    ]
    for (const p of products) {
      await Product.updateOrCreate({ name: p.name }, { name: p.name, amount: p.amount })
    }
  }
}
