import os, sys, cairosvg
from el3 import *
from PIL import Image
OUT = sys.argv[1]
E = f'{OUT}/elementos'
for d in ['svg', 'pdf', 'png']: os.makedirs(f'{E}/{d}', exist_ok=True)
items = [('frase-feito-com-amor', 'feito com amor', ITAL, 60, 0), ('palavra-suspiro', 'suspiro', ITAL, 60, 0), ('palavra-confeitaria', 'confeitaria', ITAL, 60, 0),
         ('receita-n', 'RECEITA Nº', TYPEB, 40, 120)] + [(f'numero-{i}', str(i), TYPEB, 60, 0) for i in range(10)]
for name, s, font, size, tr in items:
    p, adv, bb = text(s, size, font, tr)
    x0, y0, x1, y1 = p.bounds; pad = 0.06*max(x1-x0, y1-y0)
    for cw, col in [('azul', C['azul']), ('morango', C['morango']), ('preto', '#000000'), ('branco', '#FFFFFF')]:
        W, H = x1-x0+2*pad, y1-y0+2*pad
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="{fmt(x0-pad)} {fmt(y0-pad)} {fmt(W)} {fmt(H)}" width="{fmt(W)}" height="{fmt(H)}">'
               f'<title>Gabriela Barros — {name} ({cw})</title><g id="{name}" inkscape:label="{name}" inkscape:groupmode="layer"><path d="{D(p)}" fill="{col}"/></g></svg>')
        base = f'gabriela-barros_{name}_{cw}'
        open(f'{E}/svg/{base}.svg', 'w').write(svg)
        cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{E}/pdf/{base}.pdf')
        sc = 3000/max(W, H)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{E}/png/{base}.png', output_width=round(W*sc), output_height=round(H*sc))

PD = f'{OUT}/padrao'; S = 600; TILE = P(f"M0,0 L{S},0 L{S},{S} L0,{S} Z")
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
sus_list, dots = [], []
ss = 70/SUSW
for r in range(4):
    for q in range(3):
        x = q*S/3 + (S/6 if r % 2 else 0) + S/6; y = r*S/4 + S/8
        p = T(SUS, ss, 0, 0, ss, x - SUSW*ss/2, y - SUSH*ss/2)
        sus_list.append(ROT(p, [-8, 6, -4, 10][(r+q) % 4], x, y)); dots.append(circle(x + S/6, y + 6, 4.2))
write('gabriela-barros_padrao-suspiros', 'Padrão suspiros (tile 600, repetição contínua)',
      [('fundo', 'Fundo', [('papel', C['papel'], TILE)]), ('suspiros', 'Suspiros', [('suspiros', C['morango'], wrap(U(*sus_list)))]),
       ('pontos', 'Pontos', [('pontos', C['azul'], wrap(U(*dots)))])])
lines = U(*[P(f"M0,{y} L{S},{y} L{S},{y+1.6} L0,{y+1.6} Z") for y in range(30, S, 40)])
fa, adv, _ = text('feito com amor', 34, ITAL, 0)
ph = [MOVE(fa, (r % 2)*S/2 + 40, r*S/4 + 66) for r in range(4)]
write('gabriela-barros_padrao-caderno', 'Padrão caderno (tile 600, repetição contínua)',
      [('fundo', 'Fundo', [('papel', C['papel'], TILE)]), ('pautas', 'Pautas', [('pautas', '#C9D2EA', lines)]),
       ('frase', 'Feito com amor', [('feito-com-amor', C['azul'], wrap(U(*ph)))])])
print('ok')
