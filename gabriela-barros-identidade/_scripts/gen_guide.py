import sys, os, io, cairosvg
import common
from common import *
from brand import COL, heart
from geo import D, MOVE
from PIL import Image, ImageCms
from pypdf import PdfWriter, PdfReader
common.LOGODIR = sys.argv[1]; OUTPDF = sys.argv[2]; ICC = sys.argv[3]
W, H = 1123, 794
C = COL
INK = C['marrom']; MUTED = '#8A6A62'; LINE = '#E7D3CA'

# ---------- colour maths ----------
srgb = ImageCms.createProfile('sRGB'); cmyk = ImageCms.getOpenProfile(ICC)
xf = ImageCms.buildTransform(srgb, cmyk, 'RGB', 'CMYK', renderingIntent=1)
def rgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def to_cmyk(h):
    im = Image.new('RGB', (1, 1), rgb(h)); return [round(v/2.55) for v in ImageCms.applyTransform(im, xf).getpixel((0, 0))]
def lum(h):
    def ch(v):
        v /= 255; return v/12.92 if v <= 0.03928 else ((v+0.055)/1.055)**2.4
    r, g, b = rgb(h); return 0.2126*ch(r) + 0.7152*ch(g) + 0.0722*ch(b)
def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la+0.05)/(lb+0.05)

pages = []
def page(body, bg=C['creme'], num=True, title=None, kicker=None):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="{bg}"/>']
    if title:
        s.append(T(56, 70, kicker.upper(), 10, 600, C['terracota'], ls=2.5))
        s.append(T(56, 108, title, 30, 600, C['bordo']))
        s.append(f'<rect x="56" y="124" width="40" height="3" fill="{C["terracota"]}"/>')
    s.append(body)
    if num:
        s.append(T(56, H-30, 'Gabriela Barros Confeitaria · Guia da marca', 9, 500, MUTED, ls=0.5))
        s.append(T(W-56, H-30, f'{len(pages)+1:02d}', 9, 600, MUTED, anchor='end'))
    s.append('</svg>')
    pages.append(''.join(s))

def card(x, y, w, h, fill, stroke=True):
    st = f' stroke="{LINE}" stroke-width="1"' if stroke else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}"{st}/>'

# ---------- 1 cover ----------
m = embed(load('logo-principal', 'colorida'), 0, 0, h=430)
x = (W - m[1])/2
cov = embed(load('logo-principal', 'colorida'), x, 110, h=430)[0]
page(cov + T(W/2, 640, 'GUIA DA MARCA', 13, 600, C['terracota'], 'middle', ls=4)
     + T(W/2, 666, 'Identidade visual · versão 1.0 · outubro de 2026', 11, 500, MUTED, 'middle'), num=False)

# ---------- 2 essence + anatomy ----------
b = para(56, 170, ['Gabriela Barros Confeitaria faz doces artesanais com', 'cuidado de casa e acabamento de festa. A marca precisa',
                   'soar acolhedora, afetiva e caprichada — sem perder a', 'clareza de um negócio profissional.'], 13, fill=INK)
b += para(56, 280, ['Três elementos formam a identidade e são sempre os', 'mesmos desenhos em todas as versões:'], 12, fill=INK)
items = [('Lettering', 'Script de traço contínuo e arredondado, reforçado e', 'reespaçado para leitura em tamanhos pequenos.'),
         ('Símbolo', 'Brigadeiro com coração, granulados reduzidos a 7 peças', 'e forminha simplificada (5 pregas).'),
         ('Descritor', '"CONFEITARIA" em Montserrat SemiBold, caixa-alta,', 'espaçamento amplo, entre dois fios.'),
         ('Traço decorativo', 'Pincelada afinada nas pontas sob "Barros"; os raios', 'laterais da versão anterior foram retirados.')]
for i, (h1, l1, l2) in enumerate(items):
    yy = 350 + i*76
    b += f'<circle cx="64" cy="{yy-5}" r="5" fill="{C["terracota"]}"/>' + T(80, yy, h1, 13, 600, C['bordo'])
    b += T(80, yy+20, l1, 11, 500, INK) + T(80, yy+36, l2, 11, 500, INK)
b += card(560, 150, 507, 560, '#FFFFFF')
e = embed(load('logo-principal', 'colorida'), 600, 180, 427, 430)
b += e[0]
# callouts
lx = 1052
for yy, label in [(e[4]+e[2]*0.12, 'símbolo'), (e[4]+e[2]*0.45, 'lettering'), (e[4]+e[2]*0.80, 'traço decorativo'), (e[4]+e[2]*0.93, 'descritor')]:
    b += f'<line x1="{e[3]+e[1]+4}" y1="{yy}" x2="{lx-70}" y2="{yy}" stroke="{C["terracota"]}" stroke-width="1" stroke-dasharray="3 3"/>'
    b += T(lx-66, yy+4, label, 10, 600, C['terracota'])
b += para(590, 650, ['Logo principal, versão colorida. Cada elemento é um grupo nomeado', 'nos arquivos SVG (simbolo, lettering, descritor, elementos-decorativos).'], 10, fill=MUTED)
page(b, title='A marca e seus elementos', kicker='01 · Essência')

# ---------- 3 versions ----------
VERS = [('logo-principal', 'Logo principal', 'Uso preferencial: embalagens, cardápio, site.'),
        ('logo-horizontal', 'Logo horizontal', 'Espaços largos: faixas, rodapés, cabeçalhos.'),
        ('logo-compacta', 'Logo compacta', 'Espaços menores, sem o descritor.'),
        ('selo-circular', 'Selo circular', 'Etiquetas, adesivos e foto de perfil.'),
        ('simbolo', 'Símbolo', 'Ícone, favicon, carimbo, detalhes.'),
        ('lettering', 'Lettering', 'Assinatura quando o símbolo já está presente.')]
b = ''
cw_, ch_ = 323, 270
for i, (vid, name, use) in enumerate(VERS):
    x = 56 + (i % 3)*(cw_+21); y = 150 + (i//3)*(ch_+22)
    b += card(x, y, cw_, ch_, '#FFFFFF')
    b += embed(load(vid, 'colorida'), x+30, y+22, cw_-60, ch_-100)[0]
    b += T(x+20, y+ch_-50, f'{i+1}. {name}', 12, 600, C['bordo'])
    b += T(x+20, y+ch_-33, use, 9.5, 500, INK)
    b += T(x+20, y+ch_-16, f'gabriela-barros_{vid}_*.svg', 8.5, 500, MUTED)
page(b, title='Versões da marca', kicker='02 · Versões')

# ---------- 4 colourways ----------
b = ''
CWS = [('colorida', 'Colorida', '#FFFFFF'), ('bordo', 'Monocromática bordô', '#FFFFFF'), ('preto', 'Preta', '#FFFFFF'), ('branco', 'Branca (fundos escuros)', C['bordo'])]
colw = 240; rowh = 92; x0 = 150; y0 = 160
for j, (cw, cn, bg) in enumerate(CWS):
    b += T(x0 + j*(colw+8) + colw/2, y0-12, cn, 10.5, 600, C['bordo'], 'middle')
for i, (vid, name, _) in enumerate(VERS):
    y = y0 + i*(rowh+6)
    b += T(56, y + rowh/2 + 4, name, 10.5, 600, INK)
    for j, (cw, cn, bg) in enumerate(CWS):
        x = x0 + j*(colw+8)
        b += f'<rect x="{x}" y="{y}" width="{colw}" height="{rowh}" rx="6" fill="{bg}" stroke="{LINE}"/>'
        b += embed(load(vid, cw), x+14, y+10, colw-28, rowh-20)[0]
page(b, title='Variações de cor', kicker='03 · Versões')

# ---------- 5 palette ----------
b = ''
PAL = [('bordo', 'Bordô', ['Cor principal: lettering,', 'contornos, fundos institucionais.']),
       ('rosa', 'Rosa claro', ['Forminha, coração, granulados,', 'fundos suaves.']),
       ('terracota', 'Terracota', ['Acentos: descritor, traço,', 'etiquetas.']),
       ('marrom', 'Marrom', ['Chocolate do brigadeiro,', 'textos longos.']),
       ('creme', 'Creme', ['Fundo de apoio, papelaria,', 'respiro.'])]
for i, (k, n, use) in enumerate(PAL):
    x = 56 + i*204; y = 150; h = C[k]
    b += f'<rect x="{x}" y="{y}" width="190" height="190" rx="12" fill="{h}" stroke="{LINE}"/>'
    r, g, bl = rgb(h); c, mm, yy, kk = to_cmyk(h)
    b += T(x, y+222, n, 15, 600, C['bordo'])
    b += T(x, y+246, f'HEX  {h.upper()}', 10.5, 600, INK)
    b += T(x, y+264, f'RGB  {r} · {g} · {bl}', 10.5, 500, INK)
    b += T(x, y+282, f'CMYK  {c} · {mm} · {yy} · {kk}', 10.5, 500, INK)
    b += para(x, y+308, use, 9.5, fill=MUTED)
b += f'<line x1="56" y1="520" x2="{W-56}" y2="520" stroke="{LINE}"/>'
b += T(56, 552, 'Sobre os valores CMYK', 12, 600, C['bordo'])
b += para(56, 574, ['Convertidos de sRGB IEC61966-2.1 para o perfil "Artifex CMYK SWOP Profile" (caracterização de offset em papel couché, padrão SWOP),',
                    'com intenção colorimétrica relativa, via LittleCMS. São uma referência de partida: para impressão no Brasil peça à gráfica a conversão',
                    'no perfil do processo dela (ex.: Coated FOGRA39 / ISO Coated v2 / PSO Coated v3) e aprove com prova de cor.'], 10.5, fill=INK)
b += T(56, 650, 'Contraste (WCAG)', 12, 600, C['bordo'])
pairs = [('bordo', 'creme'), ('bordo', 'rosa'), ('terracota', 'creme'), ('branco', 'bordo'), ('branco', 'terracota')]
s = '   ·   '.join(f'{a.capitalize()} sobre {b_}: {contrast(C[a], C[b_]):.1f}:1' for a, b_ in pairs)
b += T(56, 672, s.replace('Bordo', 'Bordô'), 10.5, 500, INK)
b += T(56, 692, 'Terracota sobre creme fica abaixo de 4,5:1 — use-a apenas em textos grandes ou elementos gráficos, nunca em textos corridos.', 10, 500, MUTED)
page(b, title='Paleta de cores', kicker='04 · Cor')

# ---------- 6 typography ----------
b = card(56, 150, 490, 540, '#FFFFFF') + card(577, 150, 490, 540, '#FFFFFF')
b += T(80, 186, 'LETTERING · BASE', 10, 600, C['terracota'], ls=2)
b += T(80, 270, 'Gabriela Barros', 64, 400, C['bordo'], family='Grand Hotel')
b += T(80, 330, 'Grand Hotel', 20, 600, C['bordo'])
b += para(80, 356, ['Autores: Brian J. Bonislawsky e Jim Lyles (Astigmatic).', 'Origem: Google Fonts — fonts.google.com/specimen/Grand+Hotel',
                    'Licença: SIL Open Font License 1.1 (uso comercial livre;', 'redistribuição permitida com a licença).'], 10.5, fill=INK)
b += para(80, 450, ['No logo, o nome foi convertido em curvas e ajustado:', '• traço engrossado 2,6 un. (≈1,3% do corpo) para robustez;',
                    '• espaçamento +6/1000 em "Gabriela" e +10/1000 em "Barros";', '• entrelinha 0,84 do corpo, 2ª linha deslocada à direita;',
                    '• traço decorativo desenhado à parte.', '', 'Use Grand Hotel só para títulos curtos e afetivos', '(ex.: "Feito com amor"). Nunca para redigitar o logo.'], 10.5, fill=INK)
b += T(601, 186, 'TIPOGRAFIA DE APOIO', 10, 600, C['terracota'], ls=2)
b += T(601, 252, 'CONFEITARIA', 34, 600, C['terracota'], ls=10)
b += T(601, 310, 'Montserrat', 20, 600, C['bordo'])
b += para(601, 336, ['Autores: Julieta Ulanovsky e colaboradores.', 'Origem: Google Fonts — fonts.google.com/specimen/Montserrat',
                     'Licença: SIL Open Font License 1.1.'], 10.5, fill=INK)
b += T(601, 420, 'SemiBold 600 — descritor e títulos', 14, 600, INK)
b += T(601, 446, 'Medium 500 — subtítulos e destaques', 14, 500, INK)
b += T(601, 472, 'Regular 400 — textos corridos e informações', 14, 400, INK)
b += para(601, 520, ['Descritor: caixa-alta, espaçamento 300–420/1000,', 'sempre centralizado sob o nome.',
                     'Textos: caixa-baixa, entrelinha 1,4–1,6, cor Marrom.', '', 'As fontes originais e as licenças estão na pasta /fontes.'], 10.5, fill=INK)
page(b, title='Tipografia', kicker='05 · Tipografia')

# ---------- 7 clear space & minimum sizes ----------
b = card(56, 150, 520, 540, '#FFFFFF')
svg = load('logo-principal', 'colorida')
xh = 803/2048*200 + 2*2.6  # x-height of the lettering in logo units
vx, vy, VW, VH = vb(svg)
pad = 0.06*max(VW/1.12, VH/1.12)
e = embed(svg, 0, 0, h=300)
s_ = e[2]/VH
X = xh*s_
lw, lh = e[1] - 2*pad*s_, e[2] - 2*pad*s_
ox = 56 + (520 - (lw + 2*X))/2; oy = 190
b += f'<rect x="{ox}" y="{oy}" width="{lw+2*X}" height="{lh+2*X}" fill="{C["rosa"]}" fill-opacity="0.35" stroke="{C["terracota"]}" stroke-dasharray="4 3"/>'
b += f'<rect x="{ox+X}" y="{oy+X}" width="{lw}" height="{lh}" fill="none" stroke="{C["terracota"]}" stroke-width="0.6"/>'
b += embed(svg, ox+X - pad*s_, oy+X - pad*s_, h=300)[0]
cy_ = oy + X + lh/2; cx_ = ox + X + lw/2
b += f'<rect x="{ox}" y="{cy_-8}" width="{X}" height="16" fill="{C["terracota"]}"/>' + T(ox+X/2, cy_+4, 'x', 11, 700, '#fff', 'middle')
b += f'<rect x="{ox+X+lw}" y="{cy_-8}" width="{X}" height="16" fill="{C["terracota"]}"/>' + T(ox+X+lw+X/2, cy_+4, 'x', 11, 700, '#fff', 'middle')
b += f'<rect x="{cx_-8}" y="{oy}" width="16" height="{X}" fill="{C["terracota"]}"/>' + T(cx_, oy+X/2+4, 'x', 11, 700, '#fff', 'middle')
b += f'<rect x="{cx_-8}" y="{oy+X+lh}" width="16" height="{X}" fill="{C["terracota"]}"/>' + T(cx_, oy+X+lh+X/2+4, 'x', 11, 700, '#fff', 'middle')
b += para(80, 620, ['x = altura das letras minúsculas do lettering (altura-x).', 'Mantenha esta margem livre ao redor de todas as versões;',
                    'no símbolo isolado, x = ¼ da altura do símbolo.'], 10.5, fill=INK)
b += card(600, 150, 467, 540, '#FFFFFF')
b += T(624, 186, 'TAMANHOS MÍNIMOS', 10, 600, C['terracota'], ls=2)
MINS = [('logo-principal', 'Logo principal', '30 mm', '160 px', 'largura'), ('logo-horizontal', 'Logo horizontal', '40 mm', '200 px', 'largura'),
        ('logo-compacta', 'Logo compacta', '25 mm', '120 px', 'largura'), ('selo-circular', 'Selo circular', '25 mm', '120 px', 'diâmetro'),
        ('simbolo', 'Símbolo', '8 mm', '24 px', 'altura'), ('lettering', 'Lettering', '20 mm', '100 px', 'largura')]
for i, (vid, n, mm_, px, dim) in enumerate(MINS):
    y = 210 + i*68
    b += embed(load(vid, 'colorida'), 624, y, 120, 52)[0]
    b += T(770, y+20, n, 12, 600, C['bordo'])
    b += T(770, y+40, f'Impresso: {mm_} · Digital: {px} ({dim})', 10.5, 500, INK)
b += para(624, 640, ['Abaixo de 25 mm o descritor deixa de ser legível:', 'use a logo compacta ou o símbolo. Em avatares menores que', '64 px, prefira o símbolo.'], 10, fill=MUTED)
page(b, title='Área de proteção e tamanhos mínimos', kicker='06 · Uso')

# ---------- 8 backgrounds ----------
b = ''
BGS = [('#FFFFFF', 'Branco', 'colorida', 'Colorida'), (C['creme'], 'Creme', 'colorida', 'Colorida'), (C['rosa'], 'Rosa claro', 'bordo', 'Bordô'),
       (C['terracota'], 'Terracota', 'branco', 'Branca'), (C['bordo'], 'Bordô', 'branco', 'Branca'), (C['marrom'], 'Marrom', 'branco', 'Branca'),
       ('#000000', 'Preto', 'branco', 'Branca'), ('#FFFFFF', 'Impressão 1 cor', 'preto', 'Preta')]
for i, (bg, bn, cw, cn) in enumerate(BGS):
    x = 56 + (i % 4)*256; y = 150 + (i//4)*270
    b += f'<rect x="{x}" y="{y}" width="244" height="220" rx="10" fill="{bg}" stroke="{LINE}"/>'
    b += embed(load('logo-principal', cw), x+20, y+16, 204, 188)[0]
    b += T(x, y+240, f'Fundo {bn}', 11, 600, C['bordo']) + T(x, y+256, f'Versão {cn}', 10, 500, MUTED)
b += T(56, 712, 'Sobre fotos ou fundos com textura, use a versão branca ou a bordô somente se a área atrás do logo for lisa e com contraste; caso contrário, aplique o selo circular.', 10, 500, INK)
page(b, title='Aplicações em fundos claros e escuros', kicker='07 · Uso')

# ---------- 9 incorrect ----------
b = ''
base = load('logo-principal', 'colorida')
def wrong(i, inner_markup, label):
    x = 56 + (i % 4)*256; y = 150 + (i//4)*272
    out = f'<rect x="{x}" y="{y}" width="244" height="214" rx="10" fill="#FFFFFF" stroke="{LINE}"/>'
    out += inner_markup(x, y)
    out += f'<circle cx="{x+222}" cy="{y+22}" r="12" fill="#B3261E"/><path d="M{x+217},{y+17} l10,10 M{x+227},{y+17} l-10,10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
    out += T(x, y+236, label[0], 11, 600, C['bordo']) + T(x, y+252, label[1], 10, 500, MUTED)
    return out
def logo_at(x, y, svg=base, w=204, h=180, extra=''): return embed(svg, x+20, y+18, w, h, extra=extra)[0]
b += wrong(0, lambda x, y: f'<g transform="translate({x+122},{y+107}) scale(1.45,0.75) translate({-x-122},{-y-107})">' + logo_at(x, y) + '</g>', ('Não distorça', 'Mantenha sempre as proporções.'))
b += wrong(1, lambda x, y: f'<g transform="rotate(-14 {x+122} {y+107})">' + logo_at(x, y, w=170, h=160) + '</g>', ('Não gire', 'O logo é sempre aplicado na horizontal.'))
recol = base.replace(C['bordo'], '#2E7D6B').replace(C['terracota'], '#E0A100').replace(C['rosa'], '#9FD3E6')
b += wrong(2, lambda x, y: logo_at(x, y, recol), ('Não troque as cores', 'Use só as versões oficiais.'))
def refont(x, y):
    e2 = embed(base, x+20, y+18, 204, 180)
    sym = embed(load('simbolo', 'colorida'), x+100, y+18, 44, 40)[0]
    return sym + T(x+122, y+108, 'Gabriela', 42, 400, C['bordo'], 'middle', family='Montserrat') + T(x+122, y+150, 'Barros', 42, 400, C['bordo'], 'middle', family='Montserrat') + T(x+122, y+185, 'CONFEITARIA', 10, 600, C['terracota'], 'middle', ls=3)
b += wrong(3, refont, ('Não redigite o nome', 'Use sempre os arquivos em curvas.'))
b += wrong(4, lambda x, y: f'<rect x="{x}" y="{y}" width="244" height="214" rx="10" fill="{C["bordo"]}"/>' + logo_at(x, y), ('Sem contraste', 'Em fundo escuro, use a versão branca.'))
shadow = base.replace('<svg ', '<svg ')
b += wrong(5, lambda x, y: f'<g opacity="0.35" transform="translate(6,7)">' + logo_at(x, y, base.replace(C['bordo'], '#000').replace(C['terracota'], '#000').replace(C['rosa'], '#000').replace(C['marrom'], '#000')) + '</g>' + logo_at(x, y), ('Sem sombras e efeitos', 'Nada de sombra, degradê ou textura.'))
def moved(x, y):
    return embed(load('logo-compacta', 'colorida').replace('', ''), x+20, y+18, 204, 180)[0].replace('', '') if False else (
        embed(load('lettering', 'colorida'), x+20, y+40, 180, 150)[0] + f'<g transform="rotate(18 {x+200} {y+50})">' + embed(load('simbolo', 'colorida'), x+175, y+22, 54, 54)[0] + '</g>')
b += wrong(6, moved, ('Não reorganize', 'Não mova, gire ou redimensione o símbolo.'))
def outline(x, y):
    return f'<g fill-opacity="0" stroke="{C["bordo"]}" stroke-width="3">' + logo_at(x, y).replace('fill="', 'data-f="') + '</g>'
b += wrong(7, outline, ('Não use só contorno', 'Os elementos são sempre preenchidos.'))
page(b, title='Usos incorretos', kicker='08 · Uso')

# ---------- 10 patterns & stationery ----------
b = ''
PAT = os.path.join(common.LOGODIR, 'padrao')
for i, (pn, label) in enumerate([('gabriela-barros_padrao-ondas', 'Padrão ondas'), ('gabriela-barros_padrao-claro', 'Padrão claro')]):
    x = 56 + i*270; y = 150
    psvg = open(f'{PAT}/{pn}.svg').read()
    b += f'<defs><pattern id="pt{i}" patternUnits="userSpaceOnUse" width="130" height="130" x="{x}" y="{y}">' + embed(psvg, 0, 0, 130, 130)[0] + '</pattern></defs>'
    b += f'<rect x="{x}" y="{y}" width="250" height="250" rx="10" fill="url(#pt{i})" stroke="{LINE}"/>'
    b += T(x, y+272, label, 12, 600, C['bordo']) + T(x, y+290, f'{pn}.svg', 8.5, 500, MUTED) + T(x, y+305, 'tile 800 × 800 · encaixe contínuo', 8.5, 500, MUTED)
b += para(56, 470, ['Os padrões são módulos quadrados que se repetem nos dois', 'sentidos sem emendas aparentes. Use-os em papel de seda,', 'fundo de caixas, fitas, verso de cartões e fundos de posts.',
                    'Nunca aplique o logo diretamente sobre o padrão: coloque-o', 'sobre uma área lisa ou use o selo.'], 11, fill=INK)
b += card(610, 150, 457, 360, '#FFFFFF')
b += T(634, 186, 'ELEMENTOS DE APOIO', 10, 600, C['terracota'], ls=2)
hp = heart(0, 0, 60)
b += f'<path d="{D(MOVE(hp, 680, 250))}" fill="{C["terracota"]}"/>' + T(680, 310, 'Coração', 10.5, 600, INK, 'middle')
from geo import capsule, U as UU
sp = UU(capsule(780, 240, 30, 11, 35), capsule(812, 262, 30, 11, -30), capsule(800, 228, 30, 11, 80))
b += f'<path d="{D(sp)}" fill="{C["rosa"]}"/>' + T(800, 310, 'Granulados', 10.5, 600, INK, 'middle')
b += f'<path d="M880,260 C920,240 960,240 1000,250" stroke="{C["terracota"]}" stroke-width="7" stroke-linecap="round" fill="none"/>' + T(940, 310, 'Fios e traços', 10.5, 600, INK, 'middle')
b += T(634, 360, 'Feito com amor', 34, 400, C['bordo'], family='Grand Hotel')
b += para(634, 392, ['Frases curtas em Grand Hotel podem acompanhar a marca', 'em etiquetas e tags, sempre em uma única linha e menores', 'que o logo.'], 10.5, fill=INK)
page(b, title='Padrões e elementos de apoio', kicker='09 · Elementos')

# ---------- 11 files ----------
b = para(56, 170, ['ESTRUTURA DOS ARQUIVOS'], 10, weight=600, fill=C['terracota'], ls=2)
rows = [('svg/', 'SVG vetorial, letras em curvas, grupos nomeados: fundo, moldura, simbolo, lettering, descritor, elementos-decorativos.'),
        ('svg-texto-editavel/', 'Mesmo desenho com "Gabriela Barros" e "CONFEITARIA" como texto ativo (requer as fontes instaladas).'),
        ('pdf/', 'PDF vetorial para gráfica, um arquivo por versão e cor (sem imagens rasterizadas).'),
        ('png/', 'PNG com fundo transparente, 3.000 px no maior lado.'),
        ('padrao/', 'Padrões repetíveis em SVG, PDF e PNG + prévia de repetição 3 × 3.'),
        ('guia/', 'Este guia.'), ('fontes/', 'Grand Hotel e Montserrat originais + licenças OFL.'),
        ('mockups/', 'Simulações de adesivo, caixa, tag, cartão e perfil (ilustrativas).'), ('apresentacao/', 'Prancha de apresentação (prévia).')]
for i, (f, d) in enumerate(rows):
    y = 200 + i*34
    b += T(56, y, f, 11.5, 600, C['bordo']) + T(240, y, d, 10.5, 500, INK)
b += T(56, 530, 'NOMENCLATURA', 10, 600, C['terracota'], ls=2)
b += T(56, 556, 'gabriela-barros_[versão]_[cor].[formato]', 13, 600, INK)
b += para(56, 580, ['versão: logo-principal · logo-horizontal · logo-compacta · selo-circular · simbolo · lettering',
                    'cor: colorida · bordo · preto · branco'], 10.5, fill=MUTED)
b += para(56, 650, ['Observação: o lettering parte da fonte Grand Hotel (OFL), convertida em curvas e ajustada. Para exclusividade total do desenho,',
                    'recomenda-se, numa etapa futura, um redesenho manual das letras por um letrista — a estrutura de grupos destes arquivos já está pronta para isso.'], 10, fill=MUTED)
page(b, title='Arquivos entregues', kicker='10 · Arquivos')

# ---------- render ----------
wr = PdfWriter()
for i, p in enumerate(pages):
    data = cairosvg.svg2pdf(bytestring=p.encode())
    for pg in PdfReader(io.BytesIO(data)).pages: wr.add_page(pg)
    if '--png' in sys.argv: cairosvg.svg2png(bytestring=p.encode(), write_to=f'guide_p{i+1:02d}.png', output_width=1123)
wr.add_metadata({'/Title': 'Gabriela Barros Confeitaria — Guia da marca', '/Author': 'Gabriela Barros Confeitaria'})
wr.write(OUTPDF)
print(len(pages), 'pages')
