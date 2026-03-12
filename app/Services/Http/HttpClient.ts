/**
 * Cliente HTTP simples (fetch nativo) para chamadas aos gateways.
 * Encapsulado para facilitar mock nos testes.
 */
export async function httpRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string | object
  } = {}
): Promise<{ status: number; data: any }> {
  const { method = 'GET', headers = {}, body } = options
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })
  let data: any
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = await res.text()
    }
  } else {
    data = await res.text()
  }
  return { status: res.status, data }
}
