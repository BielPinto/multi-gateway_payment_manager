import Env from '@ioc:Adonis/Core/Env'

export default {
  appKey: Env.get('APP_KEY'),
  appName: Env.get('APP_NAME', 'multi-gateway-payment-manager'),
  http: {
    allowMethodSpoofing: false,
    trustProxy: (_address: string, _distance: number) => false,
    forceContentNegotiationTo: 'application/json',
    cookie: {
      domain: '',
      path: '/',
      maxAge: '2h',
      httpOnly: true,
      secure: false,
      sameSite: false,
    },
  },
}
