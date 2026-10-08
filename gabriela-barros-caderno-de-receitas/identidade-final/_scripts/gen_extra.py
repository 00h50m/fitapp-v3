import os, sys, math, random, cairosvg
from el import *
from gen2 import render, Tm, ap
from PIL import Image
OUT = sys.argv[1]
# ---------- handwritten elements ----------
E = f'{OUT}/elementos-manuscritos'
for d in ['svg', 'svg-traco-editavel', 'pdf', 'png']: os.makedirs(f'{E}/{d}', exist_ok=True)
items = [('palavra-confeitaria', WORDS['confeitaria']), ('palavra-suspiro', WORDS['suspiro']), ('frase-feito-com-amor', WORDS['feito']),
         ('receita-n', WORDS['receita'])] + [(f'numero-{k}', h) for k, h in DIGITS.items()]
for name, h in items:
    for cw, col in [('azul', C['azul']), ('preto', '#000000'), ('branco', '#FFFFFF'), ('morango', C['morango'])]:
        g = [('manuscrito', name, [(name, 'sig', h.path, ('stroke', h.d, Tm(1, 0, 0), h.pen))] +
              ([('pingos', 'sig', U(*[circle(x, y, h.dot_r) for x, y in h.dots]), ('dots', [(x, y, h.dot_r) for x, y in h.dots], Tm(1, 0, 0)))] if h.dots else []))]
        pal = {'sig': col}
        import gen2
        orig = gen2.pal; gen2.pal = lambda _cw, col=col: {'sig': col}
        svg, W, H = render(g, cw, f'Gabriela Barros — {name} (letra da Gabriela, {cw})')
        esvg, _, _ = render(g, cw, f'Gabriela Barros — {name} (traço editável, {cw})', editable=True)
        gen2.pal = orig
        base = f'gabriela-barros_{name}_{cw}'
        open(f'{E}/svg/{base}.svg', 'w').write(svg)
        open(f'{E}/svg-traco-editavel/{base}_editavel.svg', 'w').write(esvg)
        cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{E}/pdf/{base}.pdf')
        sc = 2000/max(W, H)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{E}/png/{base}.png', output_width=round(W*sc), output_height=round(H*sc))

# ---------- seamless patterns ----------
PD = f'{OUT}/padrao'; os.makedirs(PD, exist_ok=True)
S = 600; TILE = P(f"M0,0 L{S},0 L{S},{S} L0,{S} Z")
def wrap(p): return INT(U(*[MOVE(p, dx, dy) for dx in (-S, 0, S) for dy in (-S, 0, S)]), TILE)
def write(name, title, groups):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 {S} {S}" width="{S}" height="{S}"><title>{title}</title>']
    for gid, label, its in groups:
        o.append(f'<g id="{gid}" inkscape:label="{label}" inkscape:groupmode="layer">' + ''.join(f'<path id="{gid}-{n}" d="{D(p)}" fill="{c}"/>' for n, c, p in its) + '</g>')
    o.append('</svg>'); svg = '\n'.join(o)
    for d in ['svg', 'pdf', 'png']: os.makedirs(f'{PD}/{d}', exist_ok=True)
    open(f'{PD}/svg/{name}.svg', 'w').write(svg)
    cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{PD}/pdf/{name}.pdf')
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{PD}/png/{name}.png', output_width=3000, output_height=3000)
    t = Image.open(f'{PD}/png/{name}.png').resize((600, 600), Image.LANCZOS)
    pv = Image.new('RGBA', (1800, 1800))
    for i in range(3):
        for j in range(3): pv.paste(t, (i*600, j*600))
    pv.convert('RGB').save(f'{PD}/png/{name}_previa-repeticao-3x3.png')
# 1. suspiros scattered (half-drop grid) with small hearts? -> suspiros + pen dots
sus_list, dots = [], []
ss = 70/SUSW
for r in range(4):
    for q in range(3):
        x = q*S/3 + (S/6 if r % 2 else 0) + S/6; y = r*S/4 + S/8
        ang = [-8, 6, -4, 10][(r+q) % 4]
        p = T(SUS, ss, 0, 0, ss, x - SUSW*ss/2, y - SUSH*ss/2)
        sus_list.append(ROT(p, ang, x, y))
        dots.append(circle(x + S/6, y + 6, 4.2))
write('gabriela-barros_padrao-suspiros', 'Padrão suspiros (tile 600, repetição contínua)',
      [('fundo', 'Fundo', [('papel', C['papel'], TILE)]), ('suspiros', 'Suspiros', [('suspiros', C['morango'], wrap(U(*sus_list)))]),
       ('pontos', 'Pontos de caneta', [('pontos', C['azul'], wrap(U(*dots)))])])
# 2. caderno: ruled lines + 'feito com amor' handwriting in a half-drop
lines = U(*[P(f"M0,{y} L{S},{y} L{S},{y+1.6} L0,{y+1.6} Z") for y in range(30, S, 40)])
fa = WORDS['feito']; fs = 230/fa.w
ph = []
for r in range(4):
    x = (r % 2)*S/2 + 30; y = r*S/4 + 46
    ph.append(T(fa.path, fs, 0, 0, fs, x, y))
write('gabriela-barros_padrao-caderno', 'Padrão caderno (tile 600, repetição contínua)',
      [('fundo', 'Fundo', [('papel', C['papel'], TILE)]), ('pautas', 'Pautas', [('pautas', '#C9D2EA', lines)]),
       ('manuscrito', 'Feito com amor', [('feito-com-amor', C['azul'], wrap(U(*ph)))])])
print('ok')
