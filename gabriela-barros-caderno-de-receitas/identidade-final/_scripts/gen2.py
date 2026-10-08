import os, sys, cairosvg
from el import *
from xml.sax.saxutils import escape
OUT = sys.argv[1]
for d in ['svg', 'svg-traco-e-texto-editaveis', 'pdf', 'png']: os.makedirs(f'{OUT}/{d}', exist_ok=True)

def pal(cw):
    if cw == 'colorida':
        return dict(sig=C['azul'], sus=C['morango'], desc=C['chocolate'], fio=C['morango'], ring=C['azul'], bg=C['papel'], bgm=C['chantilly'], stamp=C['morango'])
    col = {'azul': C['azul'], 'preto': '#000000', 'branco': '#FFFFFF'}[cw]
    return dict(sig=col, sus=col, desc=col, fio=col, ring=col, stamp=col)

# A layout returns a list of groups: (id, label, [(name, role, path, editable)]) where editable is
# ('stroke', [d...], transform, width) | ('text', dict) | ('dots', [(x,y,r)], transform) | None
def Tm(s, dx, dy): return (s, 0, 0, s, dx, dy)
def ap(p, m): return T(p, *m)

def sig_group(m, with_dot=True):
    items = [('assinatura', 'sig', ap(SIG.nodot(), m), ('stroke', SIG.d, m, SIG.pen))]
    if with_dot:
        items.append(('pingo-do-i', 'sig', ap(U(*[circle(x, y, SIG.dot_r) for x, y in SIG.dots]), m), ('dots', [(x, y, SIG.dot_r) for x, y in SIG.dots], m)))
    return items

def pingo_suspiro(m, w=27):
    x, y = SIG.dots[0]; s = w/SUSW
    p = T(SUS, s, 0, 0, s, x - w/2, y - SUSH*s*0.7)
    return ap(p, m)

DESC = 'CONFEITARIA · RECEITAS DE FAMÍLIA'
def desc_group(x, y, size=26, track=160):
    t, adv, bb = text(DESC, size, TYPEB, track)
    t = MOVE(t, x, y)
    rule = P(f"M{x},{y+size*0.62} L{x+adv},{y+size*0.62} L{x+adv},{y+size*0.62+2} L{x},{y+size*0.62+2} Z")
    meta = dict(text=DESC, x=x, y=y, size=size, track=track, font='Courier Prime', weight=700)
    return [('confeitaria-receitas-de-familia', 'desc', t, ('text', meta)), ('fio', 'fio', rule, None)]

def principal(cw):
    m = Tm(1, 0, 0)
    return [('assinatura', 'Assinatura', sig_group(m, with_dot=False)),
            ('simbolo', 'Suspiro (pingo do i)', [('suspiro', 'sus', pingo_suspiro(m), None)]),
            ('descritor', 'Descritor', desc_group(SIG.w*0.135, SIG.h*0.70))]

def horizontal(cw):
    sh = SIG.h*0.62; s = sh/SUSH
    sus = T(SUS, s, 0, 0, s, 0, SIG.h*0.03)
    gap = 54; ox = SUSW*s + gap
    m = Tm(1, ox, 0)
    return [('simbolo', 'Suspiro', [('suspiro', 'sus', sus, None)]),
            ('assinatura', 'Assinatura', sig_group(m, with_dot=False)),
            ('pingo', 'Suspiro (pingo do i)', [('suspiro-pingo', 'sus', pingo_suspiro(m), None)]),
            ('descritor', 'Descritor', desc_group(ox + SIG.w*0.135, SIG.h*0.70))]

def monograma(cw):
    R = 150; gb = G.bounds; gs = 230/(gb[3]-gb[1])
    dx = -(gb[0]+gb[2])/2*gs; dy = -(gb[1]+gb[3])/2*gs
    m = Tm(gs, dx, dy)
    ring = SUB(circle(0, 0, R), circle(0, 0, R-5))
    g = [('moldura', 'Moldura', [('anel', 'ring', ring, None)]),
         ('monograma', 'Monograma G', [('g', 'sig', ap(G, m), ('stroke', G_D, m, SIG.pen))])]
    if cw == 'colorida': g.insert(0, ('fundo', 'Fundo', [('disco', 'bgm', circle(0, 0, R-5), None)]))
    return g

def carimbo(cw):
    R = 150
    outer = SUB(circle(0, 0, R), circle(0, 0, R-5)); inner = SUB(circle(0, 0, R-46), circle(0, 0, R-48.5))
    top = text_on_circle('GABRIELA BARROS', 22, R-34, TYPEB, 180, True)
    bot = text_on_circle('RECEITAS DE FAMÍLIA', 17, R-25, TYPEB, 160, False)
    dots = U(circle(-(R-25), 0, 3.4), circle(R-25, 0, 3.4))
    s = 96/SUSH; sus = T(SUS, s, 0, 0, s, -SUSW*s/2, -96/2 + 4)
    g = [('moldura', 'Moldura', [('aneis', 'stamp', U(outer, inner), None)]),
         ('texto-circular', 'Texto circular', [('gabriela-barros', 'stamp', top, ('textcircle', dict(text='GABRIELA BARROS', r=R-34, size=22, track=180, top=True))),
                                                ('receitas-de-familia', 'stamp', bot, ('textcircle', dict(text='RECEITAS DE FAMÍLIA', r=R-25, size=17, track=160, top=False))),
                                                ('pontos', 'stamp', dots, None)]),
         ('simbolo', 'Suspiro', [('suspiro', 'stamp', sus, None)])]
    if cw == 'colorida': g.insert(0, ('fundo', 'Fundo', [('disco', 'bg', circle(0, 0, R-5), None)]))
    return g

def simbolo(cw):
    return [('simbolo', 'Suspiro', [('suspiro', 'sus', SUS, None)])]

def assinatura(cw):
    return [('assinatura', 'Assinatura', sig_group(Tm(1, 0, 0)))]

VERSIONS = [('logo-principal', 'Logo principal', principal), ('logo-horizontal', 'Logo horizontal', horizontal),
            ('monograma', 'Monograma', monograma), ('carimbo', 'Carimbo', carimbo),
            ('suspiro', 'Símbolo suspiro', simbolo), ('assinatura', 'Assinatura', assinatura)]
COLORWAYS = [('colorida', 'colorida'), ('azul', 'monocromática azul'), ('preto', 'preta'), ('branco', 'branca')]

def bbox(groups):
    xs, ys = [], []
    for _, _, items in groups:
        for _, _, p, _ in items:
            if len(list(p.contours)):
                b = p.bounds; xs += [b[0], b[2]]; ys += [b[1], b[3]]
    return min(xs), min(ys), max(xs), max(ys)

def mat(m): return f'matrix({",".join(fmt(v) for v in m)})'

def render(groups, cw, title, editable=False):
    P_ = pal(cw)
    x0, y0, x1, y1 = bbox(groups); pad = 0.06*max(x1-x0, y1-y0)
    vx, vy, W, H = x0-pad, y0-pad, x1-x0+2*pad, y1-y0+2*pad
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{fmt(vx)} {fmt(vy)} {fmt(W)} {fmt(H)}" width="{fmt(W)}" height="{fmt(H)}">',
         f'<title>{escape(title)}</title>']
    for gid, label, items in groups:
        o.append(f'<g id="{gid}" inkscape:label="{escape(label)}" inkscape:groupmode="layer">')
        for name, role, p, ed in items:
            col = P_.get(role)
            if col is None: continue
            if editable and ed:
                kind = ed[0]
                if kind == 'stroke':
                    _, ds, m, w = ed
                    o.append(f'<g id="{gid}-{name}" inkscape:label="{name} (traço editável)" transform="{mat(m)}" fill="none" stroke="{col}" stroke-width="{fmt(w)}" stroke-linecap="round" stroke-linejoin="round">'
                             + ''.join(f'<path d="{d}"/>' for d in ds) + '</g>')
                    continue
                if kind == 'dots':
                    _, ds, m = ed
                    o.append(f'<g id="{gid}-{name}" transform="{mat(m)}" fill="{col}">' + ''.join(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}"/>' for x, y, r in ds) + '</g>')
                    continue
                if kind == 'text':
                    t = ed[1]
                    o.append(f'<text id="{gid}-{name}" x="{fmt(t["x"])}" y="{fmt(t["y"])}" font-family="\'{t["font"]}\'" font-weight="{t["weight"]}" font-size="{fmt(t["size"])}" letter-spacing="{fmt(t["track"]/1000*t["size"])}" fill="{col}">{escape(t["text"])}</text>')
                    continue
                if kind == 'textcircle':
                    t = ed[1]; r = t['r']; pid = f'{gid}-{name}-guia'
                    if t['top']:
                        d = f"M{-r},0 A{r},{r} 0 0 1 {r},0"
                        o.append(f'<path id="{pid}" d="{d}" fill="none"/><text id="{gid}-{name}" font-family="\'Courier Prime\'" font-weight="700" font-size="{t["size"]}" letter-spacing="{fmt(t["track"]/1000*t["size"])}" fill="{col}" text-anchor="middle"><textPath xlink:href="#{pid}" href="#{pid}" startOffset="50%">{escape(t["text"])}</textPath></text>')
                    else:
                        rr = r + t['size']*0.36
                        d = f"M{-rr},0 A{rr},{rr} 0 0 0 {rr},0"
                        o.append(f'<path id="{pid}" d="{d}" fill="none"/><text id="{gid}-{name}" font-family="\'Courier Prime\'" font-weight="700" font-size="{t["size"]}" letter-spacing="{fmt(t["track"]/1000*t["size"])}" fill="{col}" text-anchor="middle"><textPath xlink:href="#{pid}" href="#{pid}" startOffset="50%">{escape(t["text"])}</textPath></text>')
                    continue
            o.append(f'<path id="{gid}-{name}" inkscape:label="{name}" d="{D(p)}" fill="{col}"/>')
        o.append('</g>')
    o.append('</svg>')
    return '\n'.join(o), W, H

if __name__ == '__main__':
    for vid, vname, fn in VERSIONS:
        for cw, cwn in COLORWAYS:
            g = fn(cw); base = f'gabriela-barros_{vid}_{cw}'
            title = f'Gabriela Barros — {vname} ({cwn})'
            svg, W, H = render(g, cw, title)
            open(f'{OUT}/svg/{base}.svg', 'w').write(svg)
            cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{OUT}/pdf/{base}.pdf')
            sc = 3000/max(W, H)
            cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/png/{base}.png', output_width=round(W*sc), output_height=round(H*sc))
            if vid != 'suspiro':
                esvg, _, _ = render(g, cw, title + ' — traço e texto editáveis', editable=True)
                open(f'{OUT}/svg-traco-e-texto-editaveis/{base}_editavel.svg', 'w').write(esvg)
    print('ok')
