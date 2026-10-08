import sys, os, cairosvg
sys.path.insert(0, '../build')
import common
from common import embed, T
from el import C
OUT = sys.argv[1]; common.LOGODIR = OUT
MK = f'{OUT}/mockups'; AP = f'{OUT}/apresentacao'; os.makedirs(MK, exist_ok=True); os.makedirs(AP, exist_ok=True)
L = lambda v, c: open(f'{OUT}/svg/gabriela-barros_{v}_{c}.svg').read()
Mn = lambda n, c='azul': open(f'{OUT}/elementos-manuscritos/svg/gabriela-barros_{n}_{c}.svg').read()
Pt = lambda n: open(f'{OUT}/padrao/svg/gabriela-barros_padrao-{n}.svg').read()
def rc(svg, frm, to):
    for f in frm: svg = svg.replace(f'fill="{f}"', f'fill="{to}"')
    return svg
SH = '<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#4A2C24" flood-opacity="0.2"/></filter>'
def pat(pid, n, size, x=0, y=0): return f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="{size}" height="{size}" x="{x}" y="{y}">{embed(Pt(n), 0, 0, size, size)[0]}</pattern>'
Tc = lambda *a, **k: T(*a, family='Courier Prime', **k)
M = {}
def save(name, body, bg, w=1200, h=960):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{SH}</defs><rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>'
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{MK}/gabriela-barros_mockup_{name}.png', output_width=w*2)
    M[name] = svg
# 1 recipe-card label on cake box
b = f'<rect x="200" y="140" width="800" height="680" rx="14" fill="#FFFDF8" filter="url(#sh)"/>'
b += f'<g transform="rotate(-3 600 480)"><rect x="330" y="270" width="540" height="380" fill="#FFFDF8" stroke="#E3D5C1" filter="url(#sh)"/>'
for i in range(7): b += f'<line x1="350" y1="{392+i*34}" x2="850" y2="{392+i*34}" stroke="#D6DEF0" stroke-width="2"/>'
b += f'<line x1="380" y1="270" x2="380" y2="650" stroke="{C["chantilly"]}" stroke-width="2"/>'
b += embed(Mn('receita-n'), 400, 290, 190, 46)[0] + embed(Mn('numero-0'), 600, 288, 30, 46)[0] + embed(Mn('numero-1'), 634, 288, 30, 46)[0]
b += Tc(400, 380, 'Bolo de chocolate com morango', 22, 700, C['chocolate'])
b += Tc(400, 418, 'massa de chocolate, recheio de', 16, 400, C['azul']) + Tc(400, 452, 'brigadeiro e morangos frescos', 16, 400, C['azul'])
b += embed(L('assinatura', 'azul'), 400, 520, 260, 90)[0] + embed(L('carimbo', 'colorida'), 700, 480, 140, 140)[0] + '</g>'
save('ficha-de-receita', b, C['chantilly'])
# 2 tags
b = ''
for i, (bg, logo, fg) in enumerate([(C['azul'], ('suspiro', 'branco'), 'branco'), (C['papel'], ('monograma', 'colorida'), 'azul'), (C['morango'], ('suspiro', 'branco'), 'branco')]):
    x = 150 + i*320
    b += f'<path d="M{x},260 L{x+60},180 L{x+180},180 L{x+240},260 L{x+240},820 Q{x+240},840 {x+220},840 L{x+20},840 Q{x},840 {x},820 Z" fill="{bg}" stroke="#E3D5C1" stroke-width="2" filter="url(#sh)"/>'
    b += f'<circle cx="{x+120}" cy="232" r="15" fill="#F4E6DA"/><path d="M{x+120},217 C{x+90},120 {x+170},80 {x+150},20" stroke="{C["chocolate"]}" stroke-width="3" fill="none"/>'
    b += embed(L(*logo), x+50, 300, 140, 140)[0]
    b += embed(Mn('frase-feito-com-amor', fg), x+20, 560, 200, 60)[0]
    b += Tc(x+120, 770, 'GABRIELA BARROS', 13, 700, '#FFFFFF' if fg == 'branco' else C['azul'], 'middle', ls=2)
save('tags-feito-com-amor', b, '#EFE3D6')
# 3 cake box with pattern + stamp sticker
b = f'<defs>{pat("p1", "suspiros", 160, 250, 130)}</defs>'
b += f'<rect x="250" y="130" width="700" height="700" rx="16" fill="url(#p1)" filter="url(#sh)"/>'
b += f'<rect x="250" y="455" width="700" height="50" fill="{C["azul"]}"/><circle cx="600" cy="480" r="176" fill="{C["papel"]}" filter="url(#sh)"/>'
b += embed(L('carimbo', 'colorida'), 430, 310, 340, 340)[0]
save('caixa-de-bolo', b, C['papel'])
# 4 business card
b = f'<defs>{pat("p4", "caderno", 160, 560, 480)}</defs>'
b += f'<g transform="rotate(-6 380 330)"><rect x="110" y="170" width="560" height="320" rx="10" fill="{C["azul"]}" filter="url(#sh)"/>' + embed(L('logo-principal', 'branco'), 170, 230, 440, 200)[0] + '</g>'
b += f'<g transform="rotate(4 880 640)"><rect x="560" y="480" width="560" height="320" rx="10" fill="url(#p4)" filter="url(#sh)"/>'
b += f'<rect x="600" y="520" width="480" height="240" fill="#FFFDF8" fill-opacity="0.92"/>'
b += embed(L('assinatura', 'azul'), 630, 540, 280, 80)[0] + Tc(632, 650, 'CONFEITARIA · ENCOMENDAS', 13, 700, C['morango'], ls=1.5)
b += Tc(632, 690, '(00) 00000-0000', 16, 400, C['chocolate']) + Tc(632, 716, '@seuperfil', 16, 400, C['chocolate']) + '</g>'
save('cartao-de-visita', b, '#EADDCF')
# 5 profile
b = f'<rect x="350" y="80" width="500" height="800" rx="50" fill="#FFFFFF" filter="url(#sh)"/>'
b += embed(L('monograma', 'colorida'), 390, 160, 140, 140)[0] + Tc(560, 215, 'seuperfil', 18, 700, '#222') + Tc(560, 242, 'Confeitaria · receitas de família', 13, 400, '#555')
b += '<rect x="380" y="330" width="440" height="1" fill="#ddd"/>'
cells = [(C['papel'], ('suspiro', 'colorida')), (C['azul'], ('frase-feito-com-amor', 'branco')), (C['chantilly'], ('carimbo', 'colorida')),
         (C['morango'], ('suspiro', 'branco')), ('#FFFDF8', ('receita-n', 'azul')), (C['azul'], ('monograma', 'branco')),
         (C['chantilly'], ('palavra-suspiro', 'azul')), (C['papel'], ('logo-principal', 'colorida')), (C['chocolate'], ('suspiro', 'branco'))]
for i, (bg, (n, c)) in enumerate(cells):
    x = 380 + (i % 3)*148; y = 360 + (i//3)*148
    src = Mn(n, c) if n.startswith(('frase', 'palavra', 'receita')) else L(n, c)
    b += f'<rect x="{x}" y="{y}" width="144" height="144" fill="{bg}"/>' + embed(src, x+16, y+30, 112, 84)[0]
save('perfil-redes-sociais', b, C['papel'])
# board
W, H = 2400, 2000
b = f'<rect width="1600" height="1100" fill="{C["papel"]}"/>' + embed(L('logo-principal', 'colorida'), 160, 300, 1280, 520)[0]
b += f'<rect x="1600" width="800" height="550" fill="{C["azul"]}"/>' + embed(L('carimbo', 'branco'), 1810, 75, 380, 400)[0]
b += f'<rect x="1600" y="550" width="800" height="550" fill="{C["morango"]}"/>' + embed(L('suspiro', 'branco'), 1820, 690, 360, 220)[0]
b += f'<rect y="1100" width="534" height="450" fill="{C["chantilly"]}"/>' + embed(L('monograma', 'azul'), 117, 1175, 300, 300)[0]
b += f'<rect x="534" y="1100" width="533" height="450" fill="{C["azul"]}"/>' + embed(Mn('frase-feito-com-amor', 'branco'), 600, 1250, 400, 120)[0]
b += f'<rect x="1067" y="1100" width="533" height="450" fill="#FFFDF8"/>'
for i, k in enumerate(['azul', 'morango', 'chocolate', 'chantilly', 'papel']):
    b += f'<circle cx="{1140 + i*96}" cy="1280" r="40" fill="{C[k]}" stroke="#E3D5C1"/>' + Tc(1140 + i*96, 1350, C[k].upper(), 12, 700, C['chocolate'], 'middle')
b += Tc(1110, 1440, 'Courier Prime + a letra da Gabriela', 17, 700, C['chocolate'])
b += f'<defs>{pat("pb", "caderno", 300, 1600, 1100)}</defs><rect x="1600" y="1100" width="800" height="450" fill="url(#pb)"/>'
b += f'<rect y="1550" width="2400" height="450" fill="#EFE3D6"/>'
for i, k in enumerate(['ficha-de-receita', 'tags-feito-com-amor', 'caixa-de-bolo', 'cartao-de-visita']):
    b += embed(M[k], 20 + i*595, 1570, 570, 410)[0]
board = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{SH}</defs>{b}</svg>'
cairosvg.svg2png(bytestring=board.encode(), write_to=f'{AP}/gabriela-barros_prancha-apresentacao.png', output_width=3600)
cairosvg.svg2pdf(bytestring=board.encode(), write_to=f'{AP}/gabriela-barros_prancha-apresentacao.pdf')
print('ok')
