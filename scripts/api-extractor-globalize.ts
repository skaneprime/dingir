import fs from 'fs'

let file = fs.readFileSync('./bin/dingir.d.ts', 'utf-8')

file = file
.replace("declare namespace Dingir {", "declare global {\nnamespace Dingir {")
.replace("export { Dingir }", "}")

fs.writeFileSync('./bin/dingir.d.ts', file) 