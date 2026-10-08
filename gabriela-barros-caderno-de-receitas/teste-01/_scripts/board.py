import sys, cairosvg
sys.path.insert(0, '../build')
from common import embed, T as TX, para
OUT = sys.argv[1]
C = dict(azul='#2D3E8F', morango='#C8423E', chocolate='#4A2C24', papel='#F4EADB', chantilly='#F2CFC6')
L = lambda n: open(f'{OUT}/svg/gb-teste01_{n}.svg').read()
def recolor(svg, frm, to):
    for f in frm: svg = svg.replace(f'fill="{f}"', f'fill="{to}"')
    return svg
logo, carimbo, sus, mono, sig = L('logo-principal_cor'), L('carimbo_morango'), L('suspiro_morango'), L('monograma-g_azul'), L('assinatura_azul')
W, H = 2400, 1700
b = ''
# hero
b += f'<rect width="1500" height="900" fill="{C["papel"]}"/>' + embed(logo, 170, 170, 1160, 560)[0]
b += TX(60, 70, 'TESTE 01 · CADERNO DE RECEITAS', 18, 700, C['morango'], family='Courier Prime', ls=3)
# stamp on blue
b += f'<rect x="1500" width="900" height="450" fill="{C["azul"]}"/>' + embed(recolor(carimbo, [C['morango']], C['papel']), 1765, 45, 370, 360)[0]
# suspiro on strawberry
b += f'<rect x="1500" y="450" width="900" height="450" fill="{C["morango"]}"/>' + embed(recolor(sus, [C['morango']], C['papel']), 1790, 560, 320, 200)[0]
b += TX(1950, 840, 'SUSPIRO', 20, 700, C['papel'], 'middle', family='Courier Prime', ls=6)
# monogram
b += f'<rect y="900" width="600" height="520" fill="{C["chantilly"]}"/>' + embed(mono, 150, 990, 300, 300)[0]
b += TX(300, 1370, 'MONOGRAMA · O "G" DA ASSINATURA', 15, 700, C['chocolate'], 'middle', family='Courier Prime', ls=2)
# recipe card label
b += f'<rect x="600" y="900" width="900" height="520" fill="#EADCC8"/>'
b += f'<g transform="rotate(-3 1050 1160)"><rect x="700" y="975" width="700" height="380" fill="#FFFDF8" stroke="#E2D3BD"/>'
for i in range(6): b += f'<line x1="730" y1="{1120+i*36}" x2="1370" y2="{1120+i*36}" stroke="#D9E1F2" stroke-width="2"/>'
b += f'<line x1="760" y1="975" x2="760" y2="1355" stroke="{C["chantilly"]}" stroke-width="2"/>'
b += TX(785, 1030, 'RECEITA Nº 01', 20, 700, C['morango'], family='Courier Prime', ls=3)
b += TX(785, 1080, 'Bolo de chocolate com morango', 28, 700, C['chocolate'], family='Courier Prime')
b += TX(785, 1150, 'feita com: chocolate, morangos e', 18, 400, C['azul'], family='Courier Prime')
b += TX(785, 1186, 'uma receita de família', 18, 400, C['azul'], family='Courier Prime')
b += embed(recolor(sig, [], ''), 785, 1225, 300, 110)[0]
b += embed(carimbo, 1240, 1200, 140, 140, extra='opacity="0.92"')[0] + '</g>'
# palette
b += f'<rect x="1500" y="900" width="900" height="520" fill="#FFFDF8"/>'
b += TX(1560, 970, 'PALETA', 18, 700, C['chocolate'], family='Courier Prime', ls=4)
PAL = [('azul', 'Azul caneta', 'a tinta da assinatura'), ('morango', 'Morango', 'o bolo-assinatura'), ('chocolate', 'Chocolate', 'textos e base'),
       ('chantilly', 'Chantilly', 'apoio suave'), ('papel', 'Papel', 'fundo, caderno')]
for i, (kk, n, why) in enumerate(PAL):
    x = 1600 + i*165
    b += f'<circle cx="{x}" cy="1070" r="62" fill="{C[kk]}" stroke="#E2D3BD"/>'
    b += TX(x, 1170, n, 16, 700, C['chocolate'], 'middle', family='Courier Prime')
    b += TX(x, 1194, C[kk].upper(), 14, 400, '#7A645C', 'middle', family='Courier Prime')
    b += TX(x, 1218, why, 12, 400, '#7A645C', 'middle', family='Courier Prime')
b += TX(1560, 1300, 'Tipografia: Courier Prime (OFL) — a máquina de escrever', 15, 400, C['chocolate'], family='Courier Prime')
b += TX(1560, 1326, 'das fichas de receita. O nome é a letra da Gabriela.', 15, 400, C['chocolate'], family='Courier Prime')
# notes footer
b += f'<rect y="1420" width="2400" height="280" fill="{C["chocolate"]}"/>'
notes = ['CONCEITO  Receitas aprendidas com a avó e a tia, testadas e inventadas em família. A marca é um caderno que continua sendo escrito.',
         'DETALHE   O pingo do "i" virou um suspiro — o doce e a reação de quem prova.',
         'TESTE     Assinatura vetorizada a partir da foto (baixa resolução). O "B" e o "rr" de Barros ainda pedem mais legibilidade:',
         '          a versão final será redesenhada com as novas amostras da letra dela.']
for i, n in enumerate(notes):
    b += TX(60, 1490 + i*44, n, 19, 400, C['papel'], family='Courier Prime', extra='xml:space="preserve"')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{b}</svg>'
cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/gb-teste01_prancha-conceito.png', output_width=3600)
cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{OUT}/gb-teste01_prancha-conceito.pdf')
