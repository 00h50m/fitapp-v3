import sys, os, io, cairosvg
sys.path.insert(0, '../build')
import common
from common import embed, T, para
from PIL import Image, ImageCms
from pypdf import PdfWriter, PdfReader
from el4 import C
common.LOGODIR = OUT = sys.argv[1]; OUTPDF = sys.argv[2]; ICC = sys.argv[3]
W, H = 1123, 794
INK = C['chocolate']; MUTED = '#8A746A'; LINE = '#E3D5C1'; FAM = 'Courier Prime'
def L(v, c): return open(f'{OUT}/svg/gabriela-barros_{v}_{c}.svg').read()
def M(n, c='chocolate'): return open(f'{OUT}/elementos/svg/gabriela-barros_{n}_{c}.svg').read()
def Tx(*a, **k): k.setdefault('family', FAM); return T(*a, **k)
def Pa(*a, **k): k.setdefault('family', FAM); return para(*a, **k)
srgb = ImageCms.createProfile('sRGB'); cmyk = ImageCms.getOpenProfile(ICC)
xf = ImageCms.buildTransform(srgb, cmyk, 'RGB', 'CMYK', renderingIntent=1)
rgb = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def to_cmyk(h):
    im = Image.new('RGB', (1, 1), rgb(h)); return [round(v/2.55) for v in ImageCms.applyTransform(im, xf).getpixel((0, 0))]
def lum(h):
    f = lambda v: (v/255)/12.92 if v/255 <= 0.03928 else ((v/255+0.055)/1.055)**2.4
    r, g, b = rgb(h); return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b)
def contrast(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True); return (x+0.05)/(y+0.05)
pages = []
def page(body, bg=C['papel'], num=True, title=None, kicker=None):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="{bg}"/>']
    if title:
        s += [Tx(56, 66, kicker.upper(), 11, 700, C['morango'], ls=2.5), Tx(56, 104, title, 28, 700, C['chocolate']),
              f'<rect x="56" y="120" width="44" height="2.5" fill="{C["morango"]}"/>']
    s.append(body)
    if num:
        s += [Tx(56, H-30, 'Gabriela Barros · Caderno de receitas · Guia da marca', 9.5, 400, MUTED), Tx(W-56, H-30, f'{len(pages)+1:02d}', 10, 700, MUTED, anchor='end')]
    s.append('</svg>'); pages.append(''.join(s))
def card(x, y, w, h, fill='#FFFDF8'): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{LINE}"/>'

# 1 cover
b = embed(L('logo-principal', 'colorida'), 160, 180, 800, 300)[0]
b += Tx(W/2, 600, 'GUIA DA MARCA', 15, 700, C['morango'], 'middle', ls=5) + Tx(W/2, 628, 'Caderno de receitas · versão 1.0 · outubro de 2026', 12, 400, MUTED, 'middle')
page(b, num=False)

# 2 concept
b = Pa(56, 170, ['A Gabriela aprendeu a confeitar na infância, com a avó', 'paterna, e depois com a tia materna. Juntas, testavam', 'receitas e inventavam as delas.',
                 '', 'A marca é esse caderno de receitas de família — que', 'continua sendo escrito.'], 13, fill=INK)
items = [('Nome', ['Young Serif: cara de rótulo antigo de doceria.', 'Afetiva, legível e pouco vista em confeitarias.']),
         ('Suspiro', ['O doce e a reação de quem prova: símbolo,', 'carimbo, padrões e detalhes de embalagem.']),
         ('Datilografia', ['Courier Prime: a máquina de escrever das fichas', 'de receita. Garante a leitura do nome e dos dados.']),
         ('Cores', ['O bolo-assinatura: chocolate amargo, morango,', 'rosa-morango, creme de leite e folha.'])]
for i, (h1, ls_) in enumerate(items):
    y = 350 + i*80
    b += f'<circle cx="62" cy="{y-5}" r="4.5" fill="{C["morango"]}"/>' + Tx(76, y, h1, 14, 700, C['chocolate']) + Pa(76, y+20, ls_, 11.5, fill=INK)
b += card(560, 150, 507, 560) + embed(L('logo-principal', 'colorida'), 590, 290, 447, 200)[0]
b += Pa(590, 640, ['Logo principal. No SVG, cada elemento é um grupo:', 'nome, simbolo (suspiro), descritor.'], 11, fill=MUTED)
page(b, title='Conceito: caderno de receitas', kicker='01 · Essência')

# 3 versions
VERS = [('logo-principal', 'Logo principal', 'Uso preferencial: embalagens, cardápio, site.'), ('logo-horizontal', 'Logo horizontal', 'Faixas, rodapés e espaços largos.'),
        ('monograma', 'Monograma', 'GB com suspiro: perfil, lacre, carimbo pequeno.'), ('carimbo', 'Carimbo', 'Adesivos, etiquetas, caixas, sacolas.'),
        ('suspiro', 'Símbolo suspiro', 'Ícone, padrão, detalhes.'), ('nome', 'Nome', 'Só o nome, quando o símbolo já aparece.')]
b = ''
for i, (v, n, u) in enumerate(VERS):
    x = 56 + (i % 3)*344; y = 150 + (i//3)*290
    b += card(x, y, 323, 268) + embed(L(v, 'colorida'), x+30, y+24, 263, 160)[0]
    b += Tx(x+20, y+212, f'{i+1}. {n}', 13, 700, C['chocolate']) + Tx(x+20, y+232, u, 10.5, 400, INK) + Tx(x+20, y+250, f'gabriela-barros_{v}_*', 9.5, 400, MUTED)
page(b, title='Versões da marca', kicker='02 · Versões')

# 4 colourways
CWS = [('colorida', 'Colorida', '#FFFDF8'), ('chocolate', 'Chocolate (1 cor)', '#FFFDF8'), ('preto', 'Preta', '#FFFDF8'), ('branco', 'Branca (fundo escuro)', C['chocolate'])]
b = ''
for j, (cw, cn, bg) in enumerate(CWS): b += Tx(176 + j*228 + 110, 150, cn, 11, 700, C['chocolate'], 'middle')
for i, (v, n, _) in enumerate(VERS):
    y = 162 + i*94
    b += Tx(56, y + 50, n, 10, 700, INK)
    for j, (cw, cn, bg) in enumerate(CWS):
        x = 176 + j*228
        b += f'<rect x="{x}" y="{y}" width="220" height="86" rx="6" fill="{bg}" stroke="{LINE}"/>' + embed(L(v, cw), x+12, y+8, 196, 70)[0]
page(b, title='Variações de cor', kicker='03 · Versões')

# 5 palette
PAL = [('chocolate', 'Chocolate amargo', ['Nome, textos e', 'fundos escuros.']), ('morango', 'Morango', ['Suspiro, carimbo,', 'fios e destaques.']),
       ('rosa', 'Rosa-morango', ['Fundos suaves,', 'monograma.']), ('creme', 'Creme de leite', ['Fundo principal,', 'papelaria.']), ('folha', 'Folha', ['Só detalhes: pontos,', 'etiquetas, fitas.'])]
b = ''
for i, (k, n, u) in enumerate(PAL):
    x = 56 + i*204; h = C[k]; r, g, bl = rgb(h); c, m, y_, kk = to_cmyk(h)
    b += f'<rect x="{x}" y="150" width="190" height="180" rx="10" fill="{h}" stroke="{LINE}"/>' + Tx(x, 360, n, 15, 700, C['chocolate'])
    b += Tx(x, 384, f'HEX  {h.upper()}', 11, 700, INK) + Tx(x, 402, f'RGB  {r} {g} {bl}', 11, 400, INK) + Tx(x, 420, f'CMYK {c} {m} {y_} {kk}', 11, 400, INK) + Pa(x, 446, u, 10.5, fill=MUTED)
b += f'<line x1="56" y1="510" x2="{W-56}" y2="510" stroke="{LINE}"/>' + Tx(56, 542, 'Sobre os valores CMYK', 12.5, 700, C['chocolate'])
b += Pa(56, 564, ['Conversão sRGB IEC61966-2.1 -> "Artifex CMYK SWOP Profile", intenção colorimétrica relativa (LittleCMS).',
                  'É uma referência inicial: peça à gráfica a conversão no perfil dela (ex.: FOGRA39) e aprove com prova de cor.'], 10.5, fill=INK)
pairs = [('chocolate', 'creme'), ('morango', 'creme'), ('folha', 'creme'), ('creme', 'chocolate'), ('chocolate', 'rosa')]
b += Tx(56, 628, 'Contraste (WCAG)', 12.5, 700, C['chocolate'])
b += Tx(56, 650, '   '.join(f'{a} / {c2}: {contrast(C[a], C[c2]):.1f}:1' for a, c2 in pairs), 10.5, 400, INK)
b += Tx(56, 672, 'Folha: no máximo 5% da área. Morango e folha nunca lado a lado em textos pequenos.', 10.5, 400, MUTED)
page(b, title='Paleta de cores', kicker='04 · Cor')

# 6 typography
b = card(56, 150, 500, 560) + Tx(80, 186, 'NOME E TÍTULOS', 11, 700, C['morango'], ls=2)
b += embed(L('nome', 'chocolate'), 80, 205, 440, 80)[0]
b += Tx(80, 330, 'Young Serif', 30, 700, C['chocolate'])
b += Pa(80, 358, ['Autor: Bastien Sozeau (Noirblancrouge).', 'Google Fonts. Licença SIL Open Font', 'License 1.1 — uso comercial livre.'], 11, fill=INK)
b += Pa(80, 430, ['Nome: Young Serif Regular, convertido em curvas.', 'Use o arquivo do logo, nunca o nome digitado.', '',
                  'Títulos e frases afetivas: Young Serif', 'em caixa-baixa, sempre menores que o logo.'], 11, fill=MUTED)
b += embed(M('frase-feito-com-amor'), 80, 560, 300, 60)[0]
b += card(580, 150, 487, 560) + Tx(604, 186, 'DATILOGRAFIA', 11, 700, C['morango'], ls=2)
b += Tx(604, 236, 'Courier Prime', 30, 700, C['chocolate'])
b += Pa(604, 266, ['Autor: Alan Dague-Greene. Google Fonts.', 'Licença: SIL Open Font License 1.1.'], 11, fill=INK)
b += Tx(604, 340, 'CONFEITARIA · RECEITAS', 15, 700, INK, ls=2.5) + Tx(604, 366, 'Bold: descritor, carimbo, etiquetas', 12, 700, INK) + Tx(604, 390, 'Regular: ingredientes, recados', 12, 400, INK)
b += embed(M('receita-n'), 604, 430, 170, 34)[0] + ''.join(embed(M(f'numero-{i}'), 604 + i*30, 490, 24, 36)[0] for i in range(10))
b += Pa(604, 580, ['A máquina de escrever das fichas de receita:', 'use em etiquetas ("RECEITA Nº 07"), dados', 'e descritores, sempre em caixa-alta espaçada.'], 11, fill=MUTED)
page(b, title='Tipografia', kicker='05 · Tipografia')

# 7 clear space + min sizes
b = card(56, 150, 520, 560)
e = embed(L('logo-principal', 'colorida'), 0, 0, w=380); pad = e[1]/1.12*0.06  # svg has 6% padding of max side
ox, oy = 56 + (520 - e[1])/2, 280
X = e[1]*0.05
b += f'<rect x="{ox+pad*1.0-X}" y="{oy+pad-X}" width="{e[1]-2*pad+2*X}" height="{e[2]-2*pad+2*X}" fill="{C["chantilly"]}" fill-opacity="0.5" stroke="{C["morango"]}" stroke-dasharray="4 3"/>'
b += embed(L('logo-principal', 'colorida'), ox, oy, w=380)[0]
b += Pa(80, 610, ['x = altura das minúsculas do nome (altura-x).', 'Mantenha esta margem livre em todas as versões;', 'no carimbo e no monograma, 1/8 do diâmetro.'], 11, fill=INK)
b += card(600, 150, 467, 560) + Tx(624, 186, 'TAMANHOS MÍNIMOS', 11, 700, C['morango'], ls=2)
MINS = [('logo-principal', 'Logo principal', '35 mm', '180 px'), ('logo-horizontal', 'Logo horizontal', '45 mm', '220 px'), ('monograma', 'Monograma', '12 mm', '40 px'),
        ('carimbo', 'Carimbo', '22 mm', '100 px'), ('suspiro', 'Suspiro', '6 mm', '20 px'), ('nome', 'Nome', '25 mm', '120 px')]
for i, (v, n, mm, px) in enumerate(MINS):
    y = 210 + i*70
    b += embed(L(v, 'colorida'), 624, y, 120, 52)[0] + Tx(764, y+22, n, 12.5, 700, C['chocolate']) + Tx(764, y+42, f'Impresso {mm} · Digital {px}', 11, 400, INK)
b += Pa(624, 650, ['Abaixo desses tamanhos o descritor some:', 'use o monograma ou o suspiro.'], 10.5, fill=MUTED)
page(b, title='Área de proteção e tamanhos mínimos', kicker='06 · Uso')

# 8 backgrounds
BGS = [('#FFFFFF', 'Branco', 'colorida'), (C['creme'], 'Creme', 'colorida'), (C['rosa'], 'Rosa-morango', 'chocolate'), (C['morango'], 'Morango', 'branco'),
       (C['chocolate'], 'Chocolate', 'branco'), (C['folha'], 'Folha', 'branco'), ('#000000', 'Preto', 'branco'), ('#FFFFFF', 'Impressão 1 cor', 'preto')]
b = ''
for i, (bg, bn, cw) in enumerate(BGS):
    x = 56 + (i % 4)*256; y = 150 + (i//4)*272
    b += f'<rect x="{x}" y="{y}" width="244" height="214" rx="8" fill="{bg}" stroke="{LINE}"/>' + embed(L('logo-principal', cw), x+16, y+40, 212, 134)[0]
    b += Tx(x, y+236, f'Fundo {bn}', 12, 700, C['chocolate']) + Tx(x, y+254, f'versão {cw}', 10.5, 400, MUTED)
page(b, title='Aplicações em fundos claros e escuros', kicker='07 · Uso')

# 9 incorrect
base = L('logo-principal', 'colorida'); b = ''
def wrong(i, mk, t1, t2):
    x = 56 + (i % 4)*256; y = 150 + (i//4)*272
    o = f'<rect x="{x}" y="{y}" width="244" height="214" rx="8" fill="#FFFDF8" stroke="{LINE}"/>' + mk(x, y)
    o += f'<circle cx="{x+222}" cy="{y+22}" r="12" fill="#B3261E"/><path d="M{x+217},{y+17} l10,10 M{x+227},{y+17} l-10,10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
    return o + Tx(x, y+236, t1, 12, 700, C['chocolate']) + Tx(x, y+254, t2, 10.5, 400, MUTED)
lg = lambda x, y, s=base, extra='': embed(s, x+16, y+40, 212, 134, extra=extra)[0]
b += wrong(0, lambda x, y: f'<g transform="translate({x+122},{y+107}) scale(1.2,0.7) translate({-x-122},{-y-107})">' + lg(x, y) + '</g>', 'Não distorça', 'Mantenha as proporções.')
b += wrong(1, lambda x, y: lg(x, y, base.replace(C['chocolate'], '#8E44AD').replace(C['morango'], '#27AE60')), 'Não troque as cores', 'Só as versões oficiais.')
b += wrong(2, lambda x, y: Tx(x+122, y+110, 'Gabriela Barros', 30, 400, C['chocolate'], 'middle', family='Grand Hotel') + Tx(x+122, y+140, 'CONFEITARIA', 11, 700, C['chocolate'], 'middle', ls=2), 'Não troque a fonte', 'O nome é sempre o arquivo em curvas.')
b += wrong(3, lambda x, y: f'<rect x="{x}" y="{y}" width="244" height="214" rx="8" fill="{C["azul"]}"/>' + lg(x, y), 'Sem contraste', 'Em fundo escuro, versão branca.')
b += wrong(4, lambda x, y: f'<g transform="rotate(-12 {x+122} {y+107})">' + lg(x, y) + '</g>', 'Não gire', 'O nome fica sempre na horizontal.')
b += wrong(5, lambda x, y: f'<g opacity="0.3" transform="translate(5,6)">' + lg(x, y, base.replace(C['chocolate'], '#000').replace(C['morango'], '#000').replace(C['chocolate'], '#000')) + '</g>' + lg(x, y), 'Sem sombras ou efeitos', 'Nada de sombra, brilho ou textura.')
b += wrong(6, lambda x, y: f'<rect x="{x}" y="{y}" width="244" height="214" rx="8" fill="url(#pp)"/>' + lg(x, y), 'Não aplique sobre o padrão', 'Use uma área lisa ou o carimbo.')
b += wrong(7, lambda x, y: lg(x, y, extra=f'fill-opacity="0" stroke="{C["chocolate"]}" stroke-width="1.6"'), 'Não use só contorno', 'O nome é sempre preenchido.')
pp = open(f'{OUT}/padrao/svg/gabriela-barros_padrao-suspiros.svg').read()
b = f'<defs><pattern id="pp" patternUnits="userSpaceOnUse" width="120" height="120">{embed(pp, 0, 0, 120, 120)[0]}</pattern></defs>' + b
page(b, title='Usos incorretos', kicker='08 · Uso')

# 10 patterns
b = ''
for i, (pn, label) in enumerate([('gabriela-barros_padrao-suspiros', 'Padrão suspiros'), ('gabriela-barros_padrao-caderno', 'Padrão caderno')]):
    x = 56 + i*290; ps = open(f'{OUT}/padrao/svg/{pn}.svg').read()
    b += f'<defs><pattern id="pt{i}" patternUnits="userSpaceOnUse" width="135" height="135" x="{x}" y="150">{embed(ps, 0, 0, 135, 135)[0]}</pattern></defs>'
    b += f'<rect x="{x}" y="150" width="270" height="270" rx="8" fill="url(#pt{i})" stroke="{LINE}"/>' + Tx(x, 446, label, 13, 700, C['chocolate']) + Tx(x, 464, 'tile 600 × 600 · encaixe contínuo', 10, 400, MUTED)
b += Pa(56, 520, ['Use em papel de seda, fundo de caixas, fitas, verso de cartões', 'e posts. Não aplique o logo direto sobre o padrão.'], 11.5, fill=INK)
b += card(680, 150, 387, 330) + Tx(704, 186, 'ELEMENTOS DE APOIO', 11, 700, C['morango'], ls=2)
b += embed(L('suspiro', 'colorida'), 704, 210, 120, 80)[0] + embed(M('frase-feito-com-amor'), 704, 320, 300, 56)[0]
b += embed(M('receita-n'), 704, 410, 160, 30)[0] + embed(M('numero-0'), 872, 406, 24, 36)[0] + embed(M('numero-7'), 900, 406, 24, 36)[0]
page(b, title='Padrões e elementos de apoio', kicker='09 · Elementos')

# 11 files
rows = [('svg/', 'SVG vetorial com tudo em curvas; grupos nomeados (nome, simbolo, descritor, moldura, fundo...).'),
        ('svg-texto-editavel/', 'Nome em Young Serif e textos em Courier Prime como texto ativo (instale as fontes).'),
        ('pdf/', 'PDF vetorial para gráfica (sem imagens rasterizadas).'), ('png/', 'PNG com fundo transparente, 3.000 px no maior lado.'),
        ('elementos/', 'Frases, palavras e números de apoio em 4 cores (SVG, PDF, PNG).'),
        ('padrao/', 'Padrões repetíveis em SVG, PDF e PNG + prévias 3 × 3.'), ('guia/', 'Este guia.'), ('fontes/', 'Young Serif e Courier Prime + licenças OFL.'),
        ('mockups/', 'Simulações ilustrativas.'), ('apresentacao/', 'Prancha de apresentação.')]
b = Tx(56, 168, 'ESTRUTURA', 11, 700, C['morango'], ls=2)
for i, (f, d) in enumerate(rows):
    y = 198 + i*32; b += Tx(56, y, f, 12, 700, C['chocolate']) + Tx(320, y, d, 10.5, 400, INK)
b += Tx(56, 545, 'NOMES', 11, 700, C['morango'], ls=2) + Tx(56, 570, 'gabriela-barros_[versão]_[cor].[formato]', 13, 700, INK)
b += Pa(56, 594, ['versão: logo-principal · logo-horizontal · monograma · carimbo · suspiro · nome', 'cor: colorida · chocolate · preto · branco'], 10.5, fill=MUTED)

page(b, title='Arquivos entregues', kicker='10 · Arquivos')

wr = PdfWriter()
for i, p in enumerate(pages):
    for pg in PdfReader(io.BytesIO(cairosvg.svg2pdf(bytestring=p.encode()))).pages: wr.add_page(pg)
    if '--png' in sys.argv: cairosvg.svg2png(bytestring=p.encode(), write_to=f'gp{i+1:02d}.png', output_width=1123)
wr.add_metadata({'/Title': 'Gabriela Barros — Caderno de receitas — Guia da marca'})
wr.write(OUTPDF); print(len(pages), 'pages')
