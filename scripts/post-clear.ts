import fs from 'fs';

fs.rmSync('./bin/.tsc', { recursive: true, force: true });