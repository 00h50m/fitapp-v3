import sys, os, cairosvg
import common
from common import *
from brand import COL as C
common.LOGODIR = sys.argv[1]; OUT = sys.argv[2]; APR = sys.argv[3]
os.makedirs(OUT, exist_ok=True); os.makedirs(APR, exist_ok=True)
PAT = f'{common.LOGODIR}/padrao'
pat_ondas = open(f'{PAT}/gabriela-barros_padrao-ondas.svg').read()
pat_claro = open(f'{PAT}/gabriela-barros_padrao-claro.svg').read()
L = lambda v, c: load(v, c)
SH = '<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#45211A" flood-opacity="0.22"/></filter>'
def patdef(pid, svg, size, x=0, y=0):
    return f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="{size}" height="{size}" x="{x}" y="{y}">{embed(svg, 0, 0, size, size)[0]}</pattern>'

def save(name, w, h, body, bg):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{SH}</defs><rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>'
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/{name}.png', output_width=w*2)
    return svg

M = {}
# 1. box lid with sticker
b = f'<defs>{patdef("p1", pat_claro, 180)}</defs>'
b += f'<rect x="250" y="130" width="700" height="700" rx="18" fill="{C["rosa"]}" filter="url(#sh)"/>'
b += f'<rect x="575" y="130" width="50" height="700" fill="{C["terracota"]}"/><rect x="250" y="455" width="700" height="50" fill="{C["terracota"]}"/>'
b += f'<circle cx="600" cy="480" r="170" fill="#000" opacity="0.12" transform="translate(0,8)"/>'
b += embed(L('selo-circular', 'colorida'), 430, 310, 340, 340)[0]
M['caixa-tampa-adesivo'] = save('gabriela-barros_mockup_caixa-tampa-adesivo', 1200, 960, b, C['creme'])
# 2. open box of brigadeiros + lid with wave pattern
b = f'<defs>{patdef("p2", pat_ondas, 200, 90, 120)}</defs>'
b += f'<rect x="90" y="120" width="480" height="720" rx="14" fill="url(#p2)" filter="url(#sh)"/>'
b += f'<rect x="150" y="380" width="360" height="200" rx="12" fill="{C["creme"]}"/>' + embed(L('logo-horizontal', 'colorida'), 170, 400, 320, 160)[0]
b += f'<rect x="630" y="120" width="480" height="720" rx="14" fill="{C["bordo"]}" filter="url(#sh)"/>'
for r in range(4):
    for q in range(3):
        cx = 668 + q*150; cy = 150 + r*170
        b += f'<rect x="{cx-8}" y="{cy}" width="{136}" height="{150}" rx="10" fill="#4f1420"/>'
        b += embed(L('simbolo', 'colorida'), cx+4, cy+12, 112, 126)[0]
M['caixa-brigadeiros'] = save('gabriela-barros_mockup_caixa-brigadeiros', 1200, 960, b, C['creme'])
# 3. tags
b = ''
for i, (bg, cw, fg) in enumerate([(C['terracota'], 'branco', '#FFFFFF'), (C['creme'], 'colorida', C['bordo']), (C['bordo'], 'branco', '#FFFFFF')]):
    x = 150 + i*320
    b += f'<path d="M{x},{260} L{x+60},{180} L{x+180},{180} L{x+240},{260} L{x+240},{820} Q{x+240},{840} {x+220},{840} L{x+20},{840} Q{x},{840} {x},{820} Z" fill="{bg}" stroke="{C["rosa"]}" stroke-width="2" filter="url(#sh)"/>'
    b += f'<circle cx="{x+120}" cy="232" r="16" fill="{C["creme"] if bg != C["creme"] else "#EADBD2"}"/><path d="M{x+120},216 C{x+90},120 {x+170},80 {x+150},20" stroke="{C["marrom"]}" stroke-width="3" fill="none"/>'
    if i == 1:
        b += embed(L('selo-circular', 'colorida'), x+20, 300, 200, 200)[0]
    else:
        b += embed(L('simbolo', cw), x+70, 310, 100, 110)[0]
    b += T(x+120, 600, 'Feito', 46, 400, fg, 'middle', family='Grand Hotel') + T(x+120, 650, 'com amor', 46, 400, fg, 'middle', family='Grand Hotel')
    b += T(x+120, 760, 'GABRIELA BARROS', 13, 600, fg, 'middle', ls=3)
M['tags'] = save('gabriela-barros_mockup_tags', 1200, 960, b, '#F4E6DE')
# 4. business card
b = f'<defs>{patdef("p4", pat_ondas, 160, 640, 520)}</defs>'
b += f'<g transform="rotate(-6 380 330)"><rect x="110" y="170" width="560" height="320" rx="12" fill="{C["bordo"]}" filter="url(#sh)"/>' + embed(L('logo-principal', 'branco'), 240, 190, 300, 280)[0] + '</g>'
b += f'<g transform="rotate(4 880 640)"><rect x="560" y="480" width="560" height="320" rx="12" fill="{C["creme"]}" filter="url(#sh)"/>'
b += f'<rect x="560" y="480" width="150" height="320" fill="url(#p4)"/>'
b += T(750, 580, 'Gabriela Barros', 40, 400, C['bordo'], family='Grand Hotel') + T(752, 610, 'CONFEITEIRA', 12, 600, C['terracota'], ls=3)
b += T(752, 680, '(00) 00000-0000', 15, 500, C['marrom']) + T(752, 706, '@seuperfil', 15, 500, C['marrom']) + T(752, 732, 'encomendas@seudominio.com.br', 15, 500, C['marrom'])
b += '</g>'
M['cartao-de-visita'] = save('gabriela-barros_mockup_cartao-de-visita', 1200, 960, b, '#EFE0D8')
# 5. profile picture
b = f'<rect x="350" y="80" width="500" height="800" rx="50" fill="#FFFFFF" filter="url(#sh)"/>'
b += f'<circle cx="460" cy="230" r="72" fill="{C["terracota"]}"/>' + embed(L('selo-circular', 'colorida'), 392, 162, 136, 136)[0]
b += T(560, 215, 'seuperfil', 17, 600, '#222') + T(560, 242, 'Confeitaria artesanal', 15, 400, '#555')
b += f'<rect x="380" y="330" width="440" height="1" fill="#ddd"/>'
for r in range(3):
    for q in range(3):
        x = 380 + q*148; y = 360 + r*148
        col = [C['rosa'], C['bordo'], C['creme'], C['terracota']][(r+q) % 4]
        b += f'<rect x="{x}" y="{y}" width="144" height="144" fill="{col}"/>'
        v = 'simbolo'; cw = 'branco' if col in (C['bordo'], C['terracota']) else 'colorida'
        if (r+q) % 3 == 0: b += embed(L(v, cw), x+32, y+30, 80, 84)[0]
        elif (r+q) % 3 == 1: b += T(x+72, y+80, 'Feito com amor', 21, 400, '#fff' if cw == 'branco' else C['bordo'], 'middle', family='Grand Hotel')
M['perfil-redes-sociais'] = save('gabriela-barros_mockup_perfil-redes-sociais', 1200, 960, b, C['creme'])

# ---------- presentation board ----------
W, H = 2400, 2200
b = f'<defs>{patdef("pb", pat_ondas, 300, 1640, 1700)}</defs>'
b += f'<rect x="0" y="0" width="1600" height="1200" fill="{C["creme"]}"/>' + embed(L('logo-principal', 'colorida'), 300, 120, 1000, 960)[0]
b += f'<rect x="1600" y="0" width="800" height="700" fill="{C["terracota"]}"/>' + embed(L('selo-circular', 'colorida'), 1760, 110, 480, 480)[0]
b += f'<rect x="1600" y="700" width="800" height="500" fill="{C["bordo"]}"/>' + embed(L('simbolo', 'branco'), 1880, 800, 240, 300)[0]
for i, (v, c, bg) in enumerate([('logo-horizontal', 'preto', '#EFEAE6'), ('selo-circular', 'bordo', '#F6EFEA'), ('logo-compacta', 'branco', C['marrom'])]):
    x = i*533
    b += f'<rect x="{x}" y="1200" width="534" height="500" fill="{bg}"/>' + embed(L(v, c), x+50, 1300, 434, 300)[0]
b += f'<rect x="1600" y="1200" width="800" height="500" fill="#FFFFFF"/>' + T(1660, 1280, 'PALETA DE CORES', 22, 600, C['marrom'], ls=4)
for i, (k, n) in enumerate([('bordo', 'BORDÔ'), ('rosa', 'ROSA CLARO'), ('terracota', 'TERRACOTA'), ('marrom', 'MARROM'), ('creme', 'CREME')]):
    cx = 1700 + i*150
    b += f'<circle cx="{cx}" cy="1400" r="58" fill="{C[k]}" stroke="#E7D3CA"/>' + T(cx, 1500, n, 14, 600, C['marrom'], 'middle', ls=1.5) + T(cx, 1524, C[k].upper(), 13, 500, '#8A6A62', 'middle')
b += T(1660, 1610, 'Gabriela Barros', 44, 400, C['bordo'], family='Grand Hotel') + T(2040, 1606, 'MONTSERRAT', 18, 600, C['marrom'], ls=4)
b += f'<rect x="0" y="1700" width="1600" height="500" fill="#F4E6DE"/>'
for i, (k, cw) in enumerate([('tags', None)]):
    pass
mock = [('caixa-tampa-adesivo'), ('tags'), ('cartao-de-visita')]
for i, k in enumerate(mock):
    msvg = M[k]
    b += embed(msvg, 40 + i*520, 1730, 500, 440)[0]
b += f'<rect x="1600" y="1700" width="800" height="500" fill="url(#pb)"/>'
board = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{SH}</defs>{b}</svg>'
cairosvg.svg2png(bytestring=board.encode(), write_to=f'{APR}/gabriela-barros_prancha-apresentacao.png', output_width=3600)
cairosvg.svg2pdf(bytestring=board.encode(), write_to=f'{APR}/gabriela-barros_prancha-apresentacao.pdf')
print('ok')
