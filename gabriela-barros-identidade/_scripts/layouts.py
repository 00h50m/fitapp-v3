"""Compositions. Every layout reuses the same master lettering / symbol / descriptor geometry."""
from brand import *

# ---- colourways -----------------------------------------------------------
def palette(cw):
    c = COL
    if cw == 'colorida':
        return dict(letter=c['bordo'], swash=c['terracota'], desc=c['terracota'], cup_fill=c['rosa'],
                    cup_line=c['bordo'], ball=c['marrom'], sprinkle=c['rosa'], heart=c['rosa'],
                    bg=c['creme'], ring=c['bordo'], accent=c['terracota'])
    col = {'bordo': c['bordo'], 'preto': '#000000', 'branco': '#FFFFFF'}[cw]
    return {k: col for k in ['letter','swash','desc','cup_line','ball','heart','ring','accent']}

MONO = lambda cw: cw != 'colorida'

# ---- master parts (computed once) ----------------------------------------
_S = symbol(); _L = lettering()
_SYM_ALL = U(_S['cup_outer'], _S['ball'], _S['heart'])
SX0, SY0, SX1, SY1 = _SYM_ALL.bounds

def sym_pieces(cw):
    """Symbol pieces normalised so the bounding box starts at (0,0). Mono: sprinkles become knock-outs."""
    m = lambda p: MOVE(p, -SX0, -SY0)
    if MONO(cw):
        return [('forminha', 'cup_line', m(_S['cup_line'])),
                ('brigadeiro', 'ball', m(SUB(_S['ball'], _S['sprinkles']))),
                ('coracao', 'heart', m(_S['heart']))]
    return [('forminha-preenchimento', 'cup_fill', m(_S['cup_fill'])),
            ('forminha-contorno', 'cup_line', m(_S['cup_line'])),
            ('brigadeiro', 'ball', m(_S['ball'])),
            ('granulados', 'sprinkle', m(_S['sprinkles'])),
            ('coracao', 'heart', m(_S['heart']))]
SYM_W, SYM_H = SX1 - SX0, SY1 - SY0

def place(pieces, s, dx, dy):
    return [(n, r, T(p, s, 0, 0, s, dx, dy)) for n, r, p in pieces]

def place_text(meta, s, dx, dy):
    return [dict(m, x=m['x']*s+dx, y=m['y']*s+dy, size=m['size']*s, stroke=m.get('stroke', 0)*s) for m in meta]

def bbox(groups):
    xs = []; ys = []
    for g in groups:
        for _, _, p in g['pieces']:
            if len(list(p.contours)):
                x0, y0, x1, y1 = p.bounds; xs += [x0, x1]; ys += [y0, y1]
    return min(xs), min(ys), max(xs), max(ys)

def let_meta(L):
    return [dict(text=t, x=x, y=y, size=LET_SIZE, track=tr, font='Grand Hotel', weight=400, stroke=2*BOLD, role='letter')
            for t, x, y, tr in L['text']]

def desc_group(size, tracking=300, dashes=True):
    d = descriptor(size, tracking, dashes)
    pcs = [('confeitaria', 'desc', d['text'])]
    if dashes: pcs.append(('fios', 'desc', d['dashes']))
    t, x, y, tr, sz = d['src']
    meta = [dict(text=t, x=x, y=y, size=sz, track=tr, font='Montserrat', weight=600, stroke=0, role='desc')]
    return pcs, meta

def G(gid, label, pieces, meta=None):
    return dict(id=gid, label=label, pieces=pieces, meta=meta or [])

# ---- layouts --------------------------------------------------------------
def principal(cw):
    L = _L
    lx0, ly0, lx1, ly1 = U(L['line1'], L['line2']).bounds
    sh = LET_SIZE*0.78; ss = sh/SYM_H
    sym = place(sym_pieces(cw), ss, -SYM_W*ss/2, ly0 - 26 - sh)
    sy1 = L['swash'].bounds[3]
    dp, dm = desc_group(30, 320)
    dy = sy1 + 70
    return [G('simbolo', 'Símbolo', sym),
            G('lettering', 'Lettering', [('gabriela', 'letter', L['line1']), ('barros', 'letter', L['line2'])], let_meta(L)),
            G('descritor', 'Descritor', place(dp, 1, 0, dy), place_text(dm, 1, 0, dy)),
            G('elementos-decorativos', 'Elementos decorativos', [('traco-sob-barros', 'swash', L['swash'])])]

def horizontal(cw):
    t, meta = lettering_one_line()
    tx0, ty0, tx1, ty1 = t.bounds
    sh = LET_SIZE*1.30; ss = sh/SYM_H
    gap = 56
    lx = SYM_W*ss + gap
    let = T(t, 1, 0, 0, 1, lx, 0)
    lm = [dict(text=a, x=x+lx, y=y, size=LET_SIZE, track=tr, font='Grand Hotel', weight=400, stroke=2*BOLD, role='letter') for a, x, y, tr in meta]
    cx = lx + (tx1 - tx0)/2
    dp, dm = desc_group(40, 420)
    dy = ty1 + 72
    # vertically centre symbol on the text block
    top, bot = ty0, dy
    sym = place(sym_pieces(cw), ss, 0, (top + bot)/2 - sh/2)
    return [G('simbolo', 'Símbolo', sym),
            G('lettering', 'Lettering', [('gabriela-barros', 'letter', let)], lm),
            G('descritor', 'Descritor', place(dp, 1, cx, dy), place_text(dm, 1, cx, dy))]

def compacta(cw):
    L = _L
    blk = U(L['line1'], L['line2'])
    lx0, ly0, lx1, ly1 = blk.bounds
    sh = (ly1 - ly0)*0.62; ss = sh/SYM_H
    gap = 34
    sx = lx0 - gap - SYM_W*ss
    sym = place(sym_pieces(cw), ss, sx, (ly0+ly1)/2 - sh/2 - 6)
    return [G('simbolo', 'Símbolo', sym),
            G('lettering', 'Lettering', [('gabriela', 'letter', L['line1']), ('barros', 'letter', L['line2'])], let_meta(L))]

SELO_R = 330
def selo(cw):
    L = _L; R = SELO_R
    pal_mono = MONO(cw)
    ring_w = 10
    outer = circle(0, 0, R)
    ring = SUB(outer, circle(0, 0, R - ring_w))
    inner_ring = SUB(circle(0, 0, R - ring_w - 12), circle(0, 0, R - ring_w - 15))
    blk = U(L['line1'], L['line2'], L['swash'])
    lx0, ly0, lx1, ly1 = blk.bounds
    ls = 420/(lx1 - lx0)
    let_cy = 10
    ldy = let_cy - (ly0+ly1)/2*ls
    let_pieces = place([('gabriela', 'letter', L['line1']), ('barros', 'letter', L['line2'])], ls, 0, ldy)
    sw = place([('traco-sob-barros', 'swash', L['swash'])], ls, 0, ldy)
    top_let = ly0*ls + ldy
    sh = 112; ss = sh/SYM_H
    sym = place(sym_pieces(cw), ss, -SYM_W*ss/2, top_let - 16 - sh)
    dp, dm = desc_group(23, 330)
    dy = ly1*ls + ldy + 52
    hr = heart(0, 0, 26)
    hr = MOVE(hr, 0, dy + 40)
    groups = []
    if not pal_mono:
        groups.append(G('fundo', 'Fundo', [('disco', 'bg', SUB(outer, ring))]))
    groups += [G('moldura', 'Moldura', [('anel-externo', 'ring', ring), ('anel-interno', 'accent', inner_ring)]),
               G('simbolo', 'Símbolo', sym),
               G('lettering', 'Lettering', let_pieces, place_text(let_meta(L), ls, 0, ldy)),
               G('descritor', 'Descritor', place(dp, 1, 0, dy), place_text(dm, 1, 0, dy)),
               G('elementos-decorativos', 'Elementos decorativos', sw + [('coracao-base', 'accent', hr)])]
    return groups

def simbolo(cw):
    return [G('simbolo', 'Símbolo', sym_pieces(cw))]

def lettering_iso(cw):
    L = _L
    return [G('lettering', 'Lettering', [('gabriela', 'letter', L['line1']), ('barros', 'letter', L['line2'])], let_meta(L)),
            G('elementos-decorativos', 'Elementos decorativos', [('traco-sob-barros', 'swash', L['swash'])])]

VERSIONS = [
    ('logo-principal', 'Logo principal', principal),
    ('logo-horizontal', 'Logo horizontal', horizontal),
    ('logo-compacta', 'Logo compacta', compacta),
    ('selo-circular', 'Selo circular', selo),
    ('simbolo', 'Símbolo', simbolo),
    ('lettering', 'Lettering', lettering_iso),
]
COLORWAYS = [('colorida', 'colorida'), ('bordo', 'monocromática bordô'), ('preto', 'preta'), ('branco', 'branca')]
