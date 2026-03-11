import { test } from '@japa/runner'

test.group('Health (smoke)', () => {
  test('smoke test passes', () => {
    if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV should be test')
  })
})
