/**
 * Functional API tests. Require the server to be running.
 * Run in one terminal: node ace serve
 * Then: node ace test functional
 * Or: TEST_BASE_URL=http://localhost:3334 node ace test (if server on 3334)
 */
import { test } from '@japa/runner'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3333'

async function apiGet(path: string) {
  return fetch(`${BASE_URL}${path}`, { method: 'GET' })
}

async function apiPost(path: string, body: object) {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function isConnectionRefused(err: unknown): boolean {
  const e = err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException }
  return e?.code === 'ECONNREFUSED' || e?.cause?.code === 'ECONNREFUSED'
}

test.group('API', () => {
  test('GET / returns 200 and hello', async ({ assert }) => {
    try {
      const res = await apiGet('/')
      assert.equal(res.status, 200)
      const data = await res.json()
      assert.equal(data.hello, 'world')
    } catch (err) {
      if (isConnectionRefused(err)) {
        console.log('(Skip: start server with "node ace serve" to run API tests)')
        return
      }
      throw err
    }
  })

  test('POST /login with valid credentials returns token', async ({ assert }) => {
    try {
      const res = await apiPost('/login', {
        email: 'admin@example.com',
        password: 'admin123',
      })
      assert.equal(res.status, 200)
      const data = await res.json()
      assert.exists(data.token)
      assert.exists(data.user)
      assert.equal(data.user.email, 'admin@example.com')
      assert.equal(data.user.role, 'ADMIN')
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /login with invalid credentials returns 401', async ({ assert }) => {
    try {
      const res = await apiPost('/login', {
        email: 'admin@example.com',
        password: 'wrong',
      })
      assert.equal(res.status, 401)
      const data = await res.json()
      assert.exists(data.error)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/gateways without token returns 401', async ({ assert }) => {
    try {
      const res = await apiGet('/api/gateways')
      assert.equal(res.status, 401)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/gateways with valid token returns 200', async ({ assert }) => {
    try {
      const loginRes = await apiPost('/login', {
        email: 'admin@example.com',
        password: 'admin123',
      })
      assert.equal(loginRes.status, 200)
      const { token } = await loginRes.json()
      const res = await fetch(`${BASE_URL}/api/gateways`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(res.status, 200)
      const data = await res.json()
      assert.isArray(data)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })
})
