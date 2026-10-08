import sys, os, json, math, cairosvg
sys.path.insert(0, '../build')
from geo import *
from textpath import shape
from curves import catmull
from sus4 import suspiro_solid
OUT = sys.argv[1]
for d in ['svg', 'pdf', 'png']: os.makedirs(f'{OUT}/{d}', exist_ok=True)
FONTS = '../fonts'
TYPE = f'{FONTS}/CourierPrime-Regular.ttf'; TYPEB = f'{FONTS}/CourierPrime-Bold.ttf'
C = dict(azul='#2D3E8F', morango='#C8423E', chocolate='#4A2C24', papel='#F4EADB', chantilly='#F2CFC6')

# ---------- signature ----------
J = json.load(open('chains.json'))
SW = 26  # pen width in source units (4x photo pixels)
center_paths = [catmull(s) for s in J['strokes']]
sig = U(*[STROKE(P(d), SW) for d in center_paths] + [circle(x, y, SW*0.75) for x, y in J['dots']])
x0, y0, x1, y1 = sig.bounds
k = 0.25  # back to photo-pixel scale
sig = T(sig, k, 0, 0, k, -x0*k, -y0*k)
SIGW, SIGH = (x1-x0)*k, (y1-y0)*k
# G monogram = the part of the signature left of the 'a'
G = INT(sig, P(f"M0,0 L76,0 L76,{SIGH*0.42} L140,{SIGH*0.42} L140,{SIGH} L0,{SIGH} Z"))
sig_nodot = T(U(*[STROKE(P(d), SW) for d in center_paths]), k, 0, 0, k, -x0*k, -y0*k)
DOT = [((x-x0)*k, (y-y0)*k) for x, y in J['dots']]
# centreline version for editing (stroke stays live)
center_svg = ''.join(f'<path d="{d}"/>' for d in center_paths)
dots_svg = ''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{SW*0.75:.1f}"/>' for x, y in J['dots'])

def text(s, size, font=TYPE, track=0):
    gl, adv, bb = shape(font, s, size, track)
    return U(*[P(d) for _, d in gl]), adv

SUS = suspiro_solid()
sx0, sy0, sx1, sy1 = SUS.bounds
SUS = MOVE(SUS, -sx0, -sy0); SUSW, SUSH = sx1-sx0, sy1-sy0

def svgdoc(items, title, pad=20, bg=None, box=None):
    xs = []; ys = []
    for _, _, p in items:
        b = p.bounds; xs += [b[0], b[2]]; ys += [b[1], b[3]]
    bx0, by0, bx1, by1 = box or (min(xs)-pad, min(ys)-pad, max(xs)+pad, max(ys)+pad)
    W, H = bx1-bx0, by1-by0
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="{fmt(bx0)} {fmt(by0)} {fmt(W)} {fmt(H)}" width="{fmt(W)}" height="{fmt(H)}"><title>{title}</title>']
    if bg: s.append(f'<g id="fundo" inkscape:label="fundo" inkscape:groupmode="layer"><rect x="{fmt(bx0)}" y="{fmt(by0)}" width="{fmt(W)}" height="{fmt(H)}" fill="{bg}"/></g>')
    for gid, col, p in items:
        s.append(f'<g id="{gid}" inkscape:label="{gid}" inkscape:groupmode="layer"><path d="{D(p)}" fill="{col}"/></g>')
    s.append('</svg>')
    return '\n'.join(s), W, H

def save(name, svg, W, H):
    open(f'{OUT}/svg/{name}.svg', 'w').write(svg)
    cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{OUT}/pdf/{name}.pdf')
    sc = 3000/max(W, H)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/png/{name}.png', output_width=round(W*sc), output_height=round(H*sc))

files = {}
# 1 signature alone
svg, W, H = svgdoc([('assinatura', C['azul'], sig)], 'Gabriela Barros — assinatura vetorizada (teste 01)')
save('gb-teste01_assinatura_azul', svg, W, H); files['assinatura'] = svg
# 1b editable centreline
W, H = SIGW+40, SIGH+40
cl = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="{-20} {-20} {fmt(W)} {fmt(H)}" width="{fmt(W)}" height="{fmt(H)}"><title>Assinatura — linha central com traço editável</title>'
      f'<g id="assinatura-linha-central" inkscape:label="assinatura (traço editável)" transform="matrix({k},0,0,{k},{-x0*k},{-y0*k})" fill="none" stroke="{C["azul"]}" stroke-width="{SW}" stroke-linecap="round" stroke-linejoin="round">{center_svg}</g>'
      f'<g id="pingo-do-i" transform="matrix({k},0,0,{k},{-x0*k},{-y0*k})" fill="{C["azul"]}">{dots_svg}</g></svg>')
open(f'{OUT}/svg/gb-teste01_assinatura_traco-editavel.svg', 'w').write(cl)
# 2 suspiro
svg, W, H = svgdoc([('suspiro', C['morango'], SUS)], 'Suspiro — símbolo (teste 01)')
save('gb-teste01_suspiro_morango', svg, W, H); files['suspiro'] = svg
# 3 G monogram in stamp circle
gb = G.bounds; gs = 190/(gb[3]-gb[1])
Gm = GROW(T(G, gs, 0, 0, gs, -gb[0]*gs, -gb[1]*gs), 1.4); gw = (gb[2]-gb[0])*gs
R = 120
ring = SUB(circle(0, 0, R), circle(0, 0, R-4))
Gm = MOVE(Gm, -gw/2, -190/2)
svg, W, H = svgdoc([('moldura', C['azul'], ring), ('monograma-g', C['azul'], Gm)], 'Monograma G — da assinatura (teste 01)')
save('gb-teste01_monograma-g_azul', svg, W, H); files['monograma'] = svg

# 4 logo principal: signature + suspiro + typed line
# the dot of the i becomes a tiny suspiro
ss = 30/SUSW
dx, dy = DOT[0]
sus_l = T(SUS, ss, 0, 0, ss, dx - SUSW*ss/2, dy - SUSH*ss*0.62)
line, lw = text('CONFEITARIA · RECEITAS DE FAMÍLIA', 15, TYPEB, 120)
# place the typed line in the space to the right of the G loop, under 'abriela Barros'
lx = 110; ly = SIGH*0.66
line = MOVE(line, lx, ly)
rule = P(f"M{lx},{ly+12} L{lx+lw},{ly+12} L{lx+lw},{ly+13.6} L{lx},{ly+13.6} Z")
svg, W, H = svgdoc([('assinatura', C['azul'], sig_nodot), ('suspiro-pingo-do-i', C['morango'], sus_l), ('descritor', C['chocolate'], line), ('fio', C['morango'], rule)],
                   'Gabriela Barros — logo principal (teste 01)', pad=24)
save('gb-teste01_logo-principal_cor', svg, W, H); files['principal'] = svg

# 5 round stamp: text on circle + suspiro
def text_on_circle(s, size, r, font, track, start_deg, inside=False):
    gl, adv, _ = shape(font, s, size, track)
    out = []
    # per-glyph placement: need each glyph's advance -> re-shape per char for x positions
    import uharfbuzz as hb
    x = 0; paths = []
    for ch in s:
        g, a, _ = shape(font, ch, size)
        if g: paths.append((x, a, U(*[P(d) for _, d in g])))
        x += a + track/1000*size
    total = x - track/1000*size
    circ = 2*math.pi*r
    for gx, a, p in paths:
        mid = gx + a/2
        ang = start_deg + (mid - total/2)/circ*360
        rad = math.radians(ang)
        # glyph centred on its advance, baseline on the circle, upright toward the centre
        q = MOVE(p, -a/2, 0)
        q = ROT(q, ang, 0, 0) if False else q
        c, s_ = math.cos(rad), math.sin(rad)
        # rotate so that glyph's up (-y) points away from centre
        q = T(q, c, s_, -s_, c, 0, 0)
        q = MOVE(q, r*math.sin(rad), -r*math.cos(rad))
        out.append(q)
    return U(*out)
R = 150
outer = SUB(circle(0, 0, R), circle(0, 0, R-5))
inner = SUB(circle(0, 0, R-44), circle(0, 0, R-46.5))
top = text_on_circle('GABRIELA BARROS', 22, R-34, TYPEB, 180, 0)
bot_txt = text_on_circle('CONFEITARIA', 18, R-14, TYPEB, 220, 180)
# bottom text must read left-to-right: mirror trick -> place reversed upright glyphs
def text_on_circle_bottom(s, size, r, font, track):
    x = 0; paths = []
    for ch in s:
        g, a, _ = shape(font, ch, size)
        if g: paths.append((x, a, U(*[P(d) for _, d in g])))
        x += a + track/1000*size
    total = x - track/1000*size; circ = 2*math.pi*r; out = []
    for gx, a, p in paths:
        mid = gx + a/2
        ang = 180 - (mid - total/2)/circ*360
        rad = math.radians(ang)
        q = MOVE(p, -a/2, size*0.36)  # vertically centre on the circle
        c, s_ = math.cos(rad + math.pi), math.sin(rad + math.pi)
        q = T(q, c, s_, -s_, c, 0, 0)
        q = MOVE(q, r*math.sin(rad), -r*math.cos(rad))
        out.append(q)
    return U(*out)
bot = text_on_circle_bottom('RECEITAS DE FAMÍLIA', 17, R-25, TYPEB, 160)
dotl = circle(-(R-25), 0, 3.4); dotr = circle(R-25, 0, 3.4)
ss2 = 96/SUSH
sus_c = T(SUS, ss2, 0, 0, ss2, -SUSW*ss2/2, -96/2 + 4)
svg, W, H = svgdoc([('moldura', C['morango'], U(outer, inner)), ('texto-circular', C['morango'], U(top, bot, dotl, dotr)), ('suspiro', C['morango'], sus_c)],
                   'Gabriela Barros — carimbo (teste 01)', pad=10)
save('gb-teste01_carimbo_morango', svg, W, H); files['carimbo'] = svg
json.dump({k: v for k, v in files.items()}, open('files.json', 'w'))
print('ok', SIGW, SIGH)
