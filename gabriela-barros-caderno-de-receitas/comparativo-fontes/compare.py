import sys, cairosvg
sys.path.insert(0, '../build'); sys.path.insert(0, '.')
from geo import *
from textpath import shape
from common import embed
from el3 import C, SUS, SUSW, SUSH, TYPEB, TYPE
F = '../fonts/'
OPTS = [('A', 'Fraunces Soft', 'Fraunces-SoftSemiBold', -10, ['Macia e calorosa, bem legível.', 'Risco: estilo muito usado hoje', 'em cafés e docerias.']),
        ('B', 'Gloock', 'Gloock-Regular', 0, ['Contraste alto e curvas generosas.', 'Mais elegante: bolo de festa,', 'presente, casamento.']),
        ('C', 'Young Serif', 'YoungSerif-Regular', 0, ['Rótulo antigo de doceria.', 'Afetiva e com personalidade,', 'pouco vista em confeitarias.']),
        ('D', 'EB Garamond', 'EBGaramond-SemiBold', 0, ['Livro de receitas clássico.', 'Discreta e atemporal; causa', 'menos impacto à distância.'])]
def tp(s, font, size, tr=0):
    g, a, b = shape(font, s, size, tr); p = U(*[P(d) for _, d in g]); x0, y0, x1, y1 = p.bounds
    return MOVE(p, -x0, 0), x1-x0, y0, y1
def place(p, w, cx, y, maxw=None, scale=1.0):
    return f'<path d="{D(T(p, scale, 0, 0, scale, cx - w*scale/2, y))}"'
W, H = 2400, 2060
b = f'<rect width="{W}" height="{H}" fill="#EFE3D6"/>'
b += f'<text x="60" y="80" font-family="Courier Prime" font-weight="700" font-size="22" letter-spacing="4" fill="{C["morango"]}">COMPARATIVO DE FONTES PARA O NOME</text>'
b += f'<text x="60" y="118" font-family="Courier Prime" font-size="18" fill="{C["chocolate"]}">Pingo do "i" normal em todas. Descritor, carimbo, paleta e padrões continuam iguais.</text>'
desc, dw, _, _ = tp('CONFEITARIA · RECEITAS DE FAMÍLIA', TYPEB, 13, 170)
for i, (letter, name, f, tr, notes) in enumerate(OPTS):
    x = 40 + i*590; cx = x + 280; font = F + f + '.ttf'
    nm, nw, ny0, ny1 = tp('Gabriela Barros', font, 100, tr)
    s = min(470/nw, 0.9)
    # header
    b += f'<text x="{x+20}" y="190" font-family="Courier Prime" font-weight="700" font-size="40" fill="{C["morango"]}">{letter}</text>'
    b += f'<text x="{x+70}" y="188" font-family="Courier Prime" font-weight="700" font-size="24" fill="{C["azul"]}">{name}</text>'
    for k, n in enumerate(notes): b += f'<text x="{x+20}" y="{226+k*24}" font-family="Courier Prime" font-size="16" fill="{C["chocolate"]}">{n}</text>'
    # logo on paper
    b += f'<rect x="{x}" y="310" width="560" height="300" rx="10" fill="{C["papel"]}"/>'
    b += place(nm, nw, cx, 450, scale=s) + f' fill="{C["azul"]}"/>'
    b += place(desc, dw, cx, 500) + f' fill="{C["chocolate"]}"/>'
    b += f'<rect x="{cx-dw/2}" y="510" width="{dw}" height="1.6" fill="{C["morango"]}"/>'
    # white on blue
    b += f'<rect x="{x}" y="630" width="560" height="180" rx="10" fill="{C["azul"]}"/>' + place(nm, nw, cx, 740, scale=s*0.8) + ' fill="#FFFFFF"/>'
    # small sizes
    b += f'<rect x="{x}" y="830" width="560" height="120" rx="10" fill="#FFFDF8"/>'
    b += place(nm, nw, x+110, 885, scale=0.18) + f' fill="{C["azul"]}"/>' + place(nm, nw, x+380, 900, scale=0.3) + f' fill="{C["azul"]}"/>'
    b += f'<text x="{x+20}" y="935" font-family="Courier Prime" font-size="13" fill="#8A746A">tamanho pequeno (etiqueta, rede social)</text>'
    # monogram
    b += f'<rect x="{x}" y="970" width="560" height="320" rx="10" fill="{C["chantilly"]}"/>'
    gb, gw, gy0, gy1 = tp('GB', font, 130, 0)
    b += f'<circle cx="{cx}" cy="1130" r="128" fill="none" stroke="{C["azul"]}" stroke-width="5"/><circle cx="{cx}" cy="1130" r="116" fill="none" stroke="{C["azul"]}" stroke-width="1.6"/>'
    b += place(gb, gw, cx, 1130 - (gy0+gy1)/2) + f' fill="{C["azul"]}"/>'
    # recipe label
    b += f'<rect x="{x}" y="1310" width="560" height="330" rx="10" fill="#FFFDF8"/>'
    for k in range(4): b += f'<line x1="{x+30}" y1="{1490+k*30}" x2="{x+530}" y2="{1490+k*30}" stroke="#D6DEF0" stroke-width="2"/>'
    rn, rw, _, _ = tp('RECEITA Nº 01', TYPEB, 16, 150)
    b += f'<path d="{D(MOVE(rn, x+40, 1365))}" fill="{C["morango"]}"/>'
    t1, t1w, _, _ = tp('Bolo de chocolate', font, 34, tr); t2, t2w, _, _ = tp('com morango', font, 34, tr)
    b += f'<path d="{D(MOVE(t1, x+40, 1415))}" fill="{C["chocolate"]}"/><path d="{D(MOVE(t2, x+40, 1455))}" fill="{C["chocolate"]}"/>'
    sm, smw, _, _ = tp('Gabriela Barros', font, 26, tr)
    b += f'<path d="{D(MOVE(sm, x+40, 1610))}" fill="{C["azul"]}"/>'
    b += f'<text x="{x+20}" y="1690" font-family="Courier Prime" font-size="14" fill="#8A746A">Licença SIL OFL 1.1 · Google Fonts</text>'
# common footer
b += f'<rect x="0" y="1730" width="{W}" height="330" fill="{C["papel"]}"/>'
b += f'<text x="60" y="1790" font-family="Courier Prime" font-weight="700" font-size="20" letter-spacing="3" fill="{C["morango"]}">IGUAL EM TODAS AS OPÇÕES</text>'
b += embed(open('o3/svg/gabriela-barros_carimbo_colorida.svg').read(), 60, 1810, 220, 220)[0]
b += embed(open('o3/svg/gabriela-barros_suspiro_colorida.svg').read(), 330, 1880, 160, 110)[0]
pat = open('o3/padrao/svg/gabriela-barros_padrao-suspiros.svg').read()
b += f'<defs><pattern id="pp" patternUnits="userSpaceOnUse" width="150" height="150" x="540" y="1810">{embed(pat, 0, 0, 150, 150)[0]}</pattern></defs><rect x="540" y="1810" width="420" height="220" rx="8" fill="url(#pp)"/>'
for k, (h, n) in enumerate([('azul', 'Azul caneta'), ('morango', 'Morango'), ('chocolate', 'Chocolate'), ('chantilly', 'Chantilly'), ('papel', 'Papel')]):
    b += f'<circle cx="{1060 + k*110}" cy="1900" r="42" fill="{C[h]}" stroke="#E3D5C1"/><text x="{1060 + k*110}" y="1972" text-anchor="middle" font-family="Courier Prime" font-size="13" fill="{C["chocolate"]}">{n}</text>'
b += f'<text x="1640" y="1860" font-family="Courier Prime" font-size="17" fill="{C["chocolate"]}">O suspiro sai do pingo do "i" e fica</text>'
b += f'<text x="1640" y="1886" font-family="Courier Prime" font-size="17" fill="{C["chocolate"]}">no carimbo, nos padrões e como</text>'
b += f'<text x="1640" y="1912" font-family="Courier Prime" font-size="17" fill="{C["chocolate"]}">detalhe de embalagem.</text>'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{b}</svg>'
import os; os.makedirs(sys.argv[1], exist_ok=True)
cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{sys.argv[1]}/gabriela-barros_comparativo-fontes.png', output_width=3600)
cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{sys.argv[1]}/gabriela-barros_comparativo-fontes.pdf')
