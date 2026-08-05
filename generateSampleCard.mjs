import { reportToSVG } from './src/services/shareReport.js'
import { getModule } from './src/data/modules.js'
import { analyzeModule } from './src/services/diagnostics.js'
import { writeFileSync } from 'node:fs'

const ids = ['overview', 'member', 'staff']
for (const id of ids) {
  const m = getModule(id)
  const a = analyzeModule(id)
  writeFileSync(`sample-card-${id}.svg`, reportToSVG(m, a))
  console.log('written', id, '| score=', a.score, '| findings=', a.findings ? a.findings.length : 0)
}
