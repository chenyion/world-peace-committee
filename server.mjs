import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, extname, isAbsolute } from 'node:path';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const port = Number(process.env.PEACE_PORT || 4187);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8'};
createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    const rel = relative(root, target);
    if (rel.startsWith('..') || isAbsolute(rel)) { res.writeHead(403).end(); return; }
    if (!(await stat(target)).isFile()) throw new Error('missing');
    res.writeHead(200, {'Content-Type':mime[extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(target));
  } catch { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}).end('未找到此页面'); }
}).on('error', error => { console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已占用，请检查已有预览。` : error.message); process.exitCode=1; })
  .listen(port, '127.0.0.1', () => console.log(`世界和平委员会 · 本地试玩 http://127.0.0.1:${port}`));
