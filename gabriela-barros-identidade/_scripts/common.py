import re, os
from xml.sax.saxutils import escape
LOGODIR = None
def load(vid, cw, editable=False):
    if editable:
        return open(f'{LOGODIR}/svg-texto-editavel/gabriela-barros_{vid}_{cw}_texto-editavel.svg').read()
    return open(f'{LOGODIR}/svg/gabriela-barros_{vid}_{cw}.svg').read()

def vb(svg):
    return [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]

_uid = [0]
def embed(svg, x, y, w=None, h=None, extra='', align='xMidYMid'):
    """Inline a logo SVG as a nested <svg>. Fits inside w x h (keeps proportions). Returns (markup, real_w, real_h)."""
    vx, vy, W, H = vb(svg)
    inner = re.sub(r'^.*?<svg[^>]*>', '', svg, flags=re.S).rsplit('</svg>', 1)[0]
    inner = re.sub(r'<title>.*?</title>', '', inner)
    inner = re.sub(r' inkscape:\w+="[^"]*"', '', inner)
    _uid[0] += 1
    inner = re.sub(r'id="([^"]+)"', lambda m: f'id="e{_uid[0]}-{m.group(1)}"', inner)
    if w and h: s = min(w/W, h/H)
    elif w: s = w/W
    else: s = h/H
    rw, rh = W*s, H*s
    bx = x + ((w - rw)/2 if (w and h and align.startswith('xMid')) else 0)
    by = y + ((h - rh)/2 if (w and h) else 0)
    return (f'<svg x="{bx:.2f}" y="{by:.2f}" width="{rw:.2f}" height="{rh:.2f}" viewBox="{vx} {vy} {W} {H}" overflow="visible" {extra}>{inner}</svg>', rw, rh, bx, by)

def T(x, y, s, size=12, weight=500, fill='#45211A', anchor='start', family='Montserrat', ls=0, extra=''):
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-weight="{weight}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}" {extra}>{escape(s)}</text>')

def para(x, y, lines, size=11, lh=1.55, **kw):
    return ''.join(T(x, y + i*size*lh, l, size=size, **kw) for i, l in enumerate(lines))
