import fs from 'fs'

let file = fs.readFileSync('./bin/dingir.d.ts', 'utf-8')

file = file
.replace("declare namespace Dingir_2 {", "declare global {\nnamespace Dingir {")
.replace("export { Dingir_2 as Dingir }", "}")

fs.writeFileSync('./bin/dingir.d.ts', file) 