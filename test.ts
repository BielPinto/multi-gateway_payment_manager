/*
|--------------------------------------------------------------------------
| Tests entrypoint
|--------------------------------------------------------------------------
*/

process.env.NODE_ENV = 'test'

import { configure, processCliArgs, run } from '@japa/runner'

/**
 * Reporter simples: imprime cada teste (✓/✗) e o resumo ao final.
 * Os resultados aparecem no terminal ao rodar `node ace test` ou `node ace test unit`.
 */
function listReporter(runner: any, emitter: any) {
  emitter.on('suite:start', (payload: { name: string }) => {
    console.log(`\n  ${payload.name}`)
  })
  emitter.on('test:end', (payload: any) => {
    const icon = payload.hasError ? '✗' : '✓'
    const title = payload.title?.toString?.() ?? payload.title
    console.log(`    ${icon} ${title}`)
    if (payload.hasError && payload.errors?.length) {
      const msg = payload.errors[0]?.error?.message ?? payload.errors[0]?.error
      if (msg) console.log(`      → ${String(msg).split('\n')[0]}`)
    }
  })
  emitter.on('runner:end', () => {
    const summary = runner.getSummary()
    const a = summary.aggregates || {}
    console.log('')
    console.log(`  total: ${a.total ?? 0} | passed: ${a.passed ?? 0} | failed: ${a.failed ?? 0} | skipped: ${a.skipped ?? 0}`)
    if (summary.hasError && summary.failedTestsTitles?.length) {
      console.log('  failed:')
      summary.failedTestsTitles.forEach((t: string) => console.log(`    - ${t}`))
    }
    console.log('')
  })
}

configure({
  suites: [
    {
      name: 'unit',
      files: ['tests/unit/**/*.spec.ts'],
      timeout: 10000,
    },
    {
      name: 'functional',
      files: ['tests/functional/**/*.spec.ts'],
      timeout: 30000,
    },
  ],
  ...processCliArgs(process.argv.slice(2)),
  plugins: [],
  reporters: [listReporter],
  importer: (filePath) => require(filePath),
  cwd: __dirname,
})

run()
