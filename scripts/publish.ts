import http from 'http';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { version } from '../src/env';

void async function () {
    const form = new FormData();
    
    form.append("decl", createReadStream(`${process.cwd()}/bin/dingir.d.ts`));
    form.append("macos", Buffer.from([]));
    form.append("linux", createReadStream(`${process.cwd()}/bin/dingir-linux`));
    form.append("win", createReadStream(`${process.cwd()}/bin/dingir-win.exe`));
    form.append("readme", createReadStream(`${process.cwd()}/bin/dingir.api.md`));

    const request = http.request({
        method: 'post',
        host: "api.dingir.xyz",
        port: 25560,
        path: `/versions/${version}`,
        headers: form.getHeaders()
    })

    form.pipe(request);
    
    request.on('response', function(res) {
        let jsonStr = "";
        console.log(res.statusCode);
        
        res.on('data', (chunk) => jsonStr += chunk);
        res.on('end', () => console.log(JSON.parse(jsonStr)));
    });
}();