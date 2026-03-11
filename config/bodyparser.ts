import { BodyParserConfig } from '@ioc:Adonis/Core/BodyParser'

export const bodyParserConfig: BodyParserConfig = {
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: {
    encoding: 'utf-8',
    limit: '1mb',
    types: ['application/json', 'application/json-patch+json', 'application/vnd.api+json', 'application/csp-report'],
    strict: true,
  },
  form: {
    encoding: 'utf-8',
    limit: '1mb',
    types: ['application/x-www-form-urlencoded'],
    queryString: {},
    convertEmptyStringsToNull: true,
  },
  raw: {
    encoding: 'utf-8',
    limit: '1mb',
    types: ['text/*'],
    queryString: {},
  },
  multipart: {
    encoding: 'utf-8',
    limit: '1mb',
    types: ['multipart/form-data'],
    autoProcess: true,
    maxFields: 1000,
    processManually: [],
    convertEmptyStringsToNull: true,
  },
}

export default bodyParserConfig
