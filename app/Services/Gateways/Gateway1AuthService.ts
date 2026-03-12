import { httpRequest } from '../Http/HttpClient'

/**
 * Singleton que mantém o Bearer token do Gateway 1.
 * Antes de cada chamada ao gateway, obter token com getToken().
 * Em 401, chamar clearToken() e repetir a chamada (retry único no Gateway1Service).
 */
export class Gateway1AuthService {
  private static instance: Gateway1AuthService
  private token: string | null = null
  private baseUrl: string = ''
  private loginEmail: string = ''
  private loginToken: string = ''

  static getInstance(): Gateway1AuthService {
    if (!Gateway1AuthService.instance) {
      Gateway1AuthService.instance = new Gateway1AuthService()
    }
    return Gateway1AuthService.instance
  }

  configure(baseUrl: string, loginEmail: string, loginToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.loginEmail = loginEmail
    this.loginToken = loginToken
  }

  clearToken(): void {
    this.token = null
  }

  async getToken(): Promise<string> {
    if (this.token) return this.token
    const { status, data } = await httpRequest(`${this.baseUrl}/login`, {
      method: 'POST',
      body: { email: this.loginEmail, token: this.loginToken },
    })
    if (status !== 200 || !data?.token) {
      throw new Error(data?.message || `Gateway 1 login failed: ${status}`)
    }
    this.token = data.token
    return this.token
  }
}
