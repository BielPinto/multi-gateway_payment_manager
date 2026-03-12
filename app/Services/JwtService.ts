import * as jose from 'jose'
import Env from '@ioc:Adonis/Core/Env'

const DEFAULT_EXPIRES_IN = '7d'

export interface JwtPayload {
  sub: number
  role: string
  iat?: number
  exp?: number
}

export class JwtService {
  private static getSecret(): string {
    return Env.get('JWT_SECRET', Env.get('APP_KEY'))
  }

  static async sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    const secret = new TextEncoder().encode(this.getSecret())
    return await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(DEFAULT_EXPIRES_IN)
      .sign(secret)
  }

  static async verify(token: string): Promise<JwtPayload> {
    const secret = new TextEncoder().encode(this.getSecret())
    const { payload } = await jose.jwtVerify(token, secret)
    if (typeof payload.sub !== 'number' || typeof payload.role !== 'string') {
      throw new Error('Invalid token payload')
    }
    return { sub: payload.sub, role: payload.role, iat: payload.iat, exp: payload.exp }
  }
}
