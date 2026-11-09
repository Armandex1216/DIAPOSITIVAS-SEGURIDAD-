"""Genera sw.js (funcionamiento sin internet) con la lista de archivos del sitio y una versión según su contenido.
Uso: python3 tools/gen-sw.py   (ejecutar antes de subir cambios)"""
import hashlib, json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
skip_dirs = {'.git', 'tools', 'supabase', 'node_modules'}
files, h = [], hashlib.sha1()
for d, ds, fs in os.walk(root):
    ds[:] = sorted(x for x in ds if x not in skip_dirs)
    for f in sorted(fs):
        if f in ('sw.js', 'README.md', '.gitignore', 'vercel.json') or f.startswith('.'): continue
        p = os.path.join(d, f); rel = os.path.relpath(p, root).replace(os.sep, '/')
        files.append(rel); h.update(rel.encode()); h.update(open(p, 'rb').read())
version = h.hexdigest()[:10]
tpl = open(os.path.join(root, 'tools', 'sw.template.js'), encoding='utf-8').read()
out = tpl.replace('__VERSION__', version).replace('__FILES__', json.dumps(['./'] + files, ensure_ascii=False, indent=0))
open(os.path.join(root, 'sw.js'), 'w', encoding='utf-8').write(out)
print('sw.js', version, len(files), 'archivos')
