"""Seamless tiles. Elements crossing an edge are repeated on the opposite edge and clipped to the tile."""
import os, sys, math, random, cairosvg
from layouts import *
from PIL import Image
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
S = 800
TILE = P(f"M0,0 L{S},0 L{S},{S} L0,{S} Z")
c = COL

def wrap(p):
    """Copies of p shifted by the tile size in every direction, clipped to the tile."""
    copies = [MOVE(p, dx, dy) for dx in (-S, 0, S) for dy in (-S, 0, S)]
    return INT(U(*copies), TILE)

def wave_band(k, n=4, amp=46):
    h = S/n
    def edge(y0, rev=False):
        pts = []
        for i in range(0, 65):
            x = S*i/64
            pts.append((x, y0 + amp*math.sin(2*math.pi*x/S)))
        return pts
    top = edge(k*h); bot = edge((k+1)*h)
    d = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in top) + " L" + " L".join(f"{x:.2f},{y:.2f}" for x, y in reversed(bot)) + " Z"
    return P(d)

def write(name, title, groups):
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 {S} {S}" width="{S}" height="{S}">',
           f'<title>{title}</title>']
    for gid, label, items in groups:
        out.append(f'<g id="{gid}" inkscape:label="{label}" inkscape:groupmode="layer">')
        for n, col, p in items:
            out.append(f'<path id="{gid}-{n}" d="{D(p)}" fill="{col}"/>')
        out.append('</g>')
    out.append('</svg>')
    svg = '\n'.join(out)
    open(f'{OUT}/{name}.svg', 'w').write(svg)
    cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{OUT}/{name}.pdf')
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/{name}.png', output_width=3000, output_height=3000)
    # repetition preview 3x3 to prove the seams
    t = Image.open(f'{OUT}/{name}.png').resize((800, 800), Image.LANCZOS)
    prev = Image.new('RGBA', (2400, 2400))
    for i in range(3):
        for j in range(3): prev.paste(t, (i*800, j*800))
    prev.convert('RGB').save(f'{OUT}/{name}_previa-repeticao-3x3.png')

def sprinkle(x, y, a, L=26, w=10): return capsule(x, y, L, w, a)

# ---------- pattern 1: waves ----------
cols = [c['terracota'], c['rosa'], c['bordo'], c['rosa']]
ink = {c['terracota']: c['rosa'], c['rosa']: c['bordo'], c['bordo']: c['rosa']}
bands = [(f'onda-{k+1}', cols[k], wrap(wave_band(k))) for k in range(4)]
random.seed(7)
el = {}
h = S/4
for k in range(4):
    col = ink[cols[k]]
    acc = []
    for i in range(5):
        x = (i + 0.5 + (0.5 if k % 2 else 0))*S/5 + random.uniform(-25, 25)
        y = k*h + h/2 + 46*math.sin(2*math.pi*x/S) + random.uniform(-14, 14)
        if (i + k) % 2 == 0:
            acc.append(heart(x, y, 44))
        else:
            acc.append(sprinkle(x - 16, y - 8, random.choice([-35, 30, 60])))
            acc.append(sprinkle(x + 18, y + 10, random.choice([-60, 20, -20])))
    el.setdefault(col, []).extend(acc)
items = [(f'cor-{i+1}', col, wrap(U(*ps))) for i, (col, ps) in enumerate(el.items())]
write('gabriela-barros_padrao-ondas', 'Gabriela Barros — padrão ondas (tile 800 px, repetição contínua)',
      [('fundo', 'Fundo', []), ('ondas', 'Ondas', bands), ('elementos-decorativos', 'Elementos decorativos', items)])

# ---------- pattern 2: light, with the symbol ----------
sym = sym_pieces('colorida')
role_col = palette('colorida')
grid = []
for r in range(4):
    for q in range(4):
        x = (q + (0.5 if r % 2 else 0))*S/4 + S/8; y = r*S/4 + S/8
        grid.append((x, y, (r*4 + q)))
sym_items = {}
hearts = []; spr_t = []; spr_r = []
ss = 92/SYM_H
for x, y, i in grid:
    if i % 2 == 0:
        for n, role, p in place(sym, ss, x - SYM_W*ss/2, y - 46):
            sym_items.setdefault(n, (role, []))[1].append(p)
    else:
        hearts.append(heart(x, y, 30))
for x, y, i in grid:
    # sprinkles in the gaps
    spr_t.append(sprinkle(x + S/8, y + S/16, 35, 22, 8))
    spr_r.append(sprinkle(x + S/16, y - S/12, -40, 22, 8))
items = [(n, role_col[role], wrap(U(*ps))) for n, (role, ps) in sym_items.items()]
deco = [('coracoes', c['terracota'], wrap(U(*hearts))), ('granulados-terracota', c['terracota'], wrap(U(*spr_t))),
        ('granulados-rosa', c['rosa'], wrap(U(*spr_r)))]
write('gabriela-barros_padrao-claro', 'Gabriela Barros — padrão claro (tile 800 px, repetição contínua)',
      [('fundo', 'Fundo', [('fundo', c['creme'], TILE)]), ('simbolos', 'Símbolos', items), ('elementos-decorativos', 'Elementos decorativos', deco)])
print('ok')
