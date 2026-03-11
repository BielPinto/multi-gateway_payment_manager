/*
|--------------------------------------------------------------------------
| Tests entrypoint
|--------------------------------------------------------------------------
*/

process.env.NODE_ENV = 'test'

import { configure, processCliArgs, run } from '@japa/runner'

configure({
  suites: [
    {
      name: 'functional',
      files: ['tests/functional/**/*.spec.ts'],
      timeout: 30000,
    },
  ],
  ...processCliArgs(process.argv.slice(2)),
  plugins: [],
  reporters: [],
  importer: (filePath) => require(filePath),
  cwd: __dirname,
})

run()
