import os, sys, cairosvg
from el4 import *
from xml.sax.saxutils import escape
OUT = sys.argv[1] if len(sys.argv) > 1 else 'o3'

def pal(cw):
    if cw == 'colorida':
        return dict(sig=C['chocolate'], sus=C['morango'], desc=C['chocolate'], fio=C['morango'], ring=C['chocolate'], bg=C['creme'], bgm=C['rosa'], stamp=C['morango'])
    col = {'chocolate': C['chocolate'], 'preto': '#000000', 'branco': '#FFFFFF'}[cw]
    return dict(sig=col, sus=col, desc=col, fio=col, ring=col, stamp=col)

def Tm(s, dx, dy): return (s, 0, 0, s, dx, dy)
def ap(p, m): return T(p, *m)
def mat(m): return f'matrix({",".join(fmt(v) for v in m)})'
WMFVS = None

def wm_items(dx, dy, s=1.0):
    m = Tm(s, dx, dy)
    meta = dict(text='Gabr\u0131ela Barros', x=WM_OX*s + dx, y=dy, size=WM_SIZE*s, track=WM_TRACK, font='Young Serif', weight=400)
    return [('gabriela-barros', 'sig', ap(WM, m), ('text', meta))], [('pingo-do-i', 'sus', ap(WM_DOT, m), None)]

DESC = 'CONFEITARIA \u00b7 RECEITAS DE FAM\u00cdLIA'
def desc_group(cx, y, size=17, track=170, align='center'):
    t, adv, bb = text(DESC, size, TYPEB, track)
    x = cx - adv/2 if align == 'center' else cx
    t = MOVE(t, x, y)
    rule = P(f"M{x},{y+size*0.7} L{x+adv},{y+size*0.7} L{x+adv},{y+size*0.7+1.6} L{x},{y+size*0.7+1.6} Z")
    meta = dict(text=DESC, x=x, y=y, size=size, track=track, font='Courier Prime', weight=700)
    return [('confeitaria-receitas-de-familia', 'desc', t, ('text', meta)), ('fio', 'fio', rule, None)]

def principal(cw):
    w, d = wm_items(0, 0)
    return [('nome', 'Nome', w + d), ('descritor', 'Descritor', desc_group(WM_W/2, 46))]

def horizontal(cw):
    sh = 92; s = sh/SUSH
    sus = T(SUS, s, 0, 0, s, 0, -sh + 32)
    ox = SUSW*s + 30
    w, d = wm_items(ox, 0)
    return [('simbolo', 'Suspiro', [('suspiro', 'sus', sus, None)]), ('nome', 'Nome', w + d),
            ('descritor', 'Descritor', desc_group(ox + 2, 40, 15, 200, align='left'))]

def monograma(cw):
    R = 150
    ring = SUB(circle(0, 0, R), circle(0, 0, R-5))
    inner = SUB(circle(0, 0, R-14), circle(0, 0, R-16))
    gbp = MOVE(GB, 0, 10)
    s = 30/SUSW; sus = T(SUS, s, 0, 0, s, -15, -R + 34)
    g = [('moldura', 'Moldura', [('anel', 'ring', U(ring, inner), None)]), ('monograma', 'Monograma GB', [('gb', 'sig', gbp, None)]),
         ('simbolo', 'Suspiro', [('suspiro', 'sus', sus, None)])]
    if cw == 'colorida': g.insert(0, ('fundo', 'Fundo', [('disco', 'bgm', circle(0, 0, R-5), None)]))
    return g

def carimbo(cw):
    R = 150
    outer = SUB(circle(0, 0, R), circle(0, 0, R-5)); inner = SUB(circle(0, 0, R-46), circle(0, 0, R-48.5))
    top = text_on_circle('GABRIELA BARROS', 22, R-34, TYPEB, 180, True)
    bot = text_on_circle('RECEITAS DE FAM\u00cdLIA', 17, R-25, TYPEB, 160, False)
    dots = U(circle(-(R-25), 0, 3.4), circle(R-25, 0, 3.4))
    s = 96/SUSH; sus = T(SUS, s, 0, 0, s, -SUSW*s/2, -96/2 + 4)
    g = [('moldura', 'Moldura', [('aneis', 'stamp', U(outer, inner), None)]),
         ('texto-circular', 'Texto circular', [('gabriela-barros', 'stamp', top, ('textcircle', dict(text='GABRIELA BARROS', r=R-34, size=22, track=180, top=True))),
                                                ('receitas-de-familia', 'stamp', bot, ('textcircle', dict(text='RECEITAS DE FAM\u00cdLIA', r=R-25, size=17, track=160, top=False))),
                                                ('pontos', 'stamp', dots, None)]),
         ('simbolo', 'Suspiro', [('suspiro', 'stamp', sus, None)])]
    if cw == 'colorida': g.insert(0, ('fundo', 'Fundo', [('disco', 'bg', circle(0, 0, R-5), None)]))
    return g

def simbolo(cw): return [('simbolo', 'Suspiro', [('suspiro', 'sus', SUS, None)])]
def nome(cw):
    w, d = wm_items(0, 0)
    return [('nome', 'Nome', w + d)]

VERSIONS = [('logo-principal', 'Logo principal', principal), ('logo-horizontal', 'Logo horizontal', horizontal),
            ('monograma', 'Monograma', monograma), ('carimbo', 'Carimbo', carimbo),
            ('suspiro', 'Símbolo suspiro', simbolo), ('nome', 'Nome', nome)]
COLORWAYS = [('colorida', 'colorida'), ('chocolate', 'monocromática chocolate'), ('preto', 'preta'), ('branco', 'branca')]

def bbox(groups):
    xs, ys = [], []
    for _, _, items in groups:
        for _, _, p, _ in items:
            if len(list(p.contours)):
                b = p.bounds; xs += [b[0], b[2]]; ys += [b[1], b[3]]
    return min(xs), min(ys), max(xs), max(ys)

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
                    o.append(f'<text id="{gid}-{name}" x="{fmt(t["x"])}" y="{fmt(t["y"])}" font-family="\'{t["font"]}\'" font-weight="{t["weight"]}"{(' style="font-variation-settings:' + t['fvs'] + '"') if t.get('fvs') else ''} font-size="{fmt(t["size"])}" letter-spacing="{fmt(t["track"]/1000*t["size"])}" fill="{col}">{escape(t["text"])}</text>')
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
    for d in ['svg', 'svg-texto-editavel', 'pdf', 'png']: os.makedirs(f'{OUT}/{d}', exist_ok=True)
    for vid, vname, fn in VERSIONS:
        for cw, cwn in COLORWAYS:
            g = fn(cw); base = f'gabriela-barros_{vid}_{cw}'
            title = f'Gabriela Barros \u2014 {vname} ({cwn})'
            svg, W, H = render(g, cw, title)
            open(f'{OUT}/svg/{base}.svg', 'w').write(svg)
            cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{OUT}/pdf/{base}.pdf')
            sc = 3000/max(W, H)
            cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/png/{base}.png', output_width=round(W*sc), output_height=round(H*sc))
            if any(ed for _, _, its in g for *_, ed in its):
                esvg, _, _ = render(g, cw, title + ' \u2014 texto edit\u00e1vel', editable=True)
                open(f'{OUT}/svg-texto-editavel/{base}_texto-editavel.svg', 'w').write(esvg)
    print('ok')
