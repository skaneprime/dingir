import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { version } from '../src/env';
import { SERVER_ADDRESS } from "../src/server/constants";

void async function () {
    const form = new FormData();
    
    form.append("decl", createReadStream(`${process.cwd()}/bin/dingir.d.ts`));
    form.append("macos", Buffer.from([]));
    form.append("linux", createReadStream(`${process.cwd()}/bin/dingir-linux`));
    form.append("win", createReadStream(`${process.cwd()}/bin/dingir-win.exe`));
    form.append("readme", createReadStream(`${process.cwd()}/bin/dingir.api.md`));

    const result = await axios({
        method: 'post',
        url: `${SERVER_ADDRESS}/versions/${version}`,
        data: form,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: form.getHeaders()
    })
    
    console.log(result.data);
}();