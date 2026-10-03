const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {root,evidence}=require('./handoff-browser.cjs'),{readCSV}=require('./csv-records.cjs');
const out=path.join(evidence,'after/render'),parts=[0,1].map(i=>JSON.parse(fs.readFileSync(path.join(out,`results-shard-${i}.json`),'utf8')));
assert.deepEqual(parts[0].source_hashes,parts[1].source_hashes,'shards must use the same source');
for(const [file,hash]of Object.entries(parts[0].source_hashes))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,'source changed during capture: '+file);
const rows=readCSV(path.join(evidence,'../checklists/RENDER-COVERAGE-416.csv')),map=new Map(parts.flatMap(p=>p.results).map(r=>[r.coverage_id,r]));
assert.equal(map.size,416);assert.equal(parts.reduce((n,p)=>n+p.results.length,0),416);
const results=rows.map(r=>{assert(map.has(r.coverage_id));return map.get(r.coverage_id)});assert(results.every(r=>r.automated_status==='PASS'));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({browser:parts[0].browser,source_hashes:parts[0].source_hashes,method:'two disjoint route/viewport shards; all 416 configured states verified once against frozen source',results},null,2));console.log('PASS all 416 render states; source hashes verified');
