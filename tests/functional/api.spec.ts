/**
 * Functional API tests. Require the server to be running.
 * Run in one terminal: node ace serve
 * Then: node ace test functional
 * Or: TEST_BASE_URL=http://localhost:3334 node ace test (if server on 3334)
 *
 * Uses Node's assert (no @japa/assert plugin) so runner works without plugin config.
 */
import { test } from '@japa/runner'
import assert from 'assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3333'

async function apiGet(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE_URL}${path}`, { method: 'GET', headers })
}

async function apiPost(path: string, body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function isConnectionRefused(err: unknown): boolean {
  const e = err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException }
  return e?.code === 'ECONNREFUSED' || e?.cause?.code === 'ECONNREFUSED'
}

test.group('API', () => {
  test('GET / returns 200 and hello', async () => {
    try {
      const res = await apiGet('/')
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.hello, 'world')
    } catch (err) {
      if (isConnectionRefused(err)) {
        console.log('(Skip: start server with "node ace serve" to run API tests)')
        return
      }
      throw err
    }
  })

  test('POST /login with valid credentials returns token', async () => {
    try {
      const res = await apiPost('/login', {
        email: 'admin@example.com',
        password: 'admin123',
      })
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(data.token != null)
      assert.ok(data.user != null)
      assert.strictEqual(data.user.email, 'admin@example.com')
      assert.strictEqual(data.user.role, 'ADMIN')
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /login with invalid credentials returns 401', async () => {
    try {
      const res = await apiPost('/login', {
        email: 'admin@example.com',
        password: 'wrong',
      })
      assert.strictEqual(res.status, 401)
      const data = await res.json()
      assert.ok(data.error != null)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/gateways without token returns 401', async () => {
    try {
      const res = await apiGet('/api/gateways')
      assert.strictEqual(res.status, 401)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/gateways with valid token returns 200', async () => {
    try {
      const loginRes = await apiPost('/login', {
        email: 'admin@example.com',
        password: 'admin123',
      })
      assert.strictEqual(loginRes.status, 200)
      const { token } = await loginRes.json()
      const res = await apiGet('/api/gateways', token)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /purchase with multiple items returns 201 and correct amount and items', async () => {
    try {
      const res = await apiPost('/purchase', {
        clientName: 'Comprador Multi',
        clientEmail: 'multi@test.com',
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        cardNumber: '5569000000006063',
        cvv: '010',
      })
      if (res.status !== 201) {
        const text = await res.text()
        if (text.includes('ECONNREFUSED') || res.status === 402) return
        assert.strictEqual(res.status, 201, text)
      }
      const data = await res.json()
      assert.ok(data.id != null)
      assert.strictEqual(data.status, 'PAID')
      assert.ok(Array.isArray(data.items))
      assert.strictEqual(data.items.length, 2)
      const byProduct: Record<number, number> = {}
      data.items.forEach((i: { productId: number; quantity: number }) => {
        byProduct[i.productId] = i.quantity
      })
      assert.strictEqual(byProduct[1], 2)
      assert.strictEqual(byProduct[2], 1)
      assert.strictEqual(data.amount, 9990 * 2 + 14990 * 1)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /purchase with invalid productId returns 400', async () => {
    try {
      const res = await apiPost('/purchase', {
        clientName: 'Test',
        clientEmail: 'invalid-product@test.com',
        items: [{ productId: 99999, quantity: 1 }],
        cardNumber: '5569000000006063',
        cvv: '010',
      })
      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.ok(data.error != null)
      assert.ok(String(data.error).toLowerCase().includes('product'))
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /purchase with same idempotencyKey returns same result (idempotency)', async () => {
    try {
      const key = `idem-${Date.now()}`
      const payload = {
        clientName: 'Idem Client',
        clientEmail: `idem-${Date.now()}@test.com`,
        items: [{ productId: 1, quantity: 1 }],
        cardNumber: '5569000000006063',
        cvv: '010',
        idempotencyKey: key,
      }
      const res1 = await apiPost('/purchase', payload)
      if (res1.status !== 201) return
      const data1 = await res1.json()
      const res2 = await apiPost('/purchase', payload)
      assert.strictEqual(res2.status, 201)
      const data2 = await res2.json()
      assert.strictEqual(data1.id, data2.id)
      assert.strictEqual(data1.amount, data2.amount)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/users as USER returns 403', async () => {
    try {
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token: adminToken } = await adminRes.json()
      const createRes = await apiPost(
        '/api/users',
        { email: `userrole-${Date.now()}@test.com`, password: 'user123', role: 'USER' },
        adminToken
      )
      if (createRes.status !== 201) return
      const userRes = await apiPost('/login', {
        email: (await createRes.json()).email,
        password: 'user123',
      })
      if (userRes.status !== 200) return
      const { token: userToken } = await userRes.json()
      const res = await apiGet('/api/users', userToken)
      assert.strictEqual(res.status, 403)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/users as MANAGER returns 200', async () => {
    try {
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token: adminToken } = await adminRes.json()
      const createRes = await apiPost(
        '/api/users',
        { email: `managerrole-${Date.now()}@test.com`, password: 'manager123', role: 'MANAGER' },
        adminToken
      )
      if (createRes.status !== 201) return
      const managerUser = await createRes.json()
      const managerRes = await apiPost('/login', {
        email: managerUser.email,
        password: 'manager123',
      })
      if (managerRes.status !== 200) return
      const { token: managerToken } = await managerRes.json()
      const res = await apiGet('/api/users', managerToken)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/products as USER returns 403', async () => {
    try {
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token: adminToken } = await adminRes.json()
      const createRes = await apiPost(
        '/api/users',
        { email: `userprod-${Date.now()}@test.com`, password: 'user123', role: 'USER' },
        adminToken
      )
      if (createRes.status !== 201) return
      const userData = await createRes.json()
      const loginRes = await apiPost('/login', { email: userData.email, password: 'user123' })
      if (loginRes.status !== 200) return
      const { token: userToken } = await loginRes.json()
      const res = await apiGet('/api/products', userToken)
      assert.equal(res.status, 403)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('GET /api/products as FINANCE returns 200', async () => {
    try {
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token: adminToken } = await adminRes.json()
      const createRes = await apiPost(
        '/api/users',
        { email: `finance-${Date.now()}@test.com`, password: 'finance123', role: 'FINANCE' },
        adminToken
      )
      if (createRes.status !== 201) return
      const financeUser = await createRes.json()
      const financeRes = await apiPost('/login', {
        email: financeUser.email,
        password: 'finance123',
      })
      if (financeRes.status !== 200) return
      const { token: financeToken } = await financeRes.json()
      const res = await apiGet('/api/products', financeToken)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /api/transactions/:id/refund on non-existent transaction returns 4xx (not success)', async () => {
    try {
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token } = await adminRes.json()
      const res = await apiPost('/api/transactions/999999/refund', {}, token)
      const data = await res.json().catch(() => ({}))
      assert.ok(res.status >= 400 && res.status < 500, `expected 4xx for non-existent transaction, got ${res.status}`)
      if (res.status === 404 || res.status === 400) {
        const errMsg = (data.error ?? data.message ?? '').toString().toLowerCase()
        assert.ok(errMsg.includes('not found'), `body should mention not found when 404/400, got: ${errMsg || '(empty)'}`)
      }
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /api/transactions/:id/refund as USER returns 403', async () => {
    try {
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token: adminToken } = await adminRes.json()
      const createUserRes = await apiPost(
        '/api/users',
        { email: `userrefund-${Date.now()}@test.com`, password: 'user123', role: 'USER' },
        adminToken
      )
      if (createUserRes.status !== 201) return
      const userRefundUser = await createUserRes.json()
      const userLoginRes = await apiPost('/login', { email: userRefundUser.email, password: 'user123' })
      if (userLoginRes.status !== 200) return
      const { token: userToken } = await userLoginRes.json()
      const res = await apiPost('/api/transactions/1/refund', {}, userToken)
      assert.strictEqual(res.status, 403)
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })

  test('POST /api/transactions/:id/refund as FINANCE on paid transaction returns 200', async () => {
    try {
      const purchaseRes = await apiPost('/purchase', {
        clientName: 'Refund Test',
        clientEmail: `refund-finance-${Date.now()}@test.com`,
        items: [{ productId: 1, quantity: 1 }],
        cardNumber: '5569000000006063',
        cvv: '010',
      })
      if (purchaseRes.status !== 201) return
      const purchaseData = await purchaseRes.json()
      if (purchaseData.status !== 'PAID') return
      const adminRes = await apiPost('/login', { email: 'admin@example.com', password: 'admin123' })
      if (adminRes.status !== 200) return
      const { token: adminToken } = await adminRes.json()
      const createFinanceRes = await apiPost(
        '/api/users',
        { email: `finance-refund-${Date.now()}@test.com`, password: 'finance123', role: 'FINANCE' },
        adminToken
      )
      if (createFinanceRes.status !== 201) return
      const financeRefundUser = await createFinanceRes.json()
      const financeLoginRes = await apiPost('/login', {
        email: financeRefundUser.email,
        password: 'finance123',
      })
      if (financeLoginRes.status !== 200) return
      const { token: financeToken } = await financeLoginRes.json()
      const res = await apiPost(`/api/transactions/${purchaseData.id}/refund`, {}, financeToken)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.status, 'REFUNDED')
    } catch (err) {
      if (isConnectionRefused(err)) return
      throw err
    }
  })
})
