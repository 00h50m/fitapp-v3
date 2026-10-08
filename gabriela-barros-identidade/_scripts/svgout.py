from layouts import *
from xml.sax.saxutils import escape

def render_svg(groups, cw, title, pad_ratio=0.06, editable=False, fixed_box=None):
    pal = palette(cw)
    x0, y0, x1, y1 = fixed_box or bbox(groups)
    pad = pad_ratio*max(x1-x0, y1-y0)
    if fixed_box: pad = 0
    vx, vy, W, H = x0-pad, y0-pad, (x1-x0)+2*pad, (y1-y0)+2*pad
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" '
           f'viewBox="{fmt(vx)} {fmt(vy)} {fmt(W)} {fmt(H)}" width="{fmt(W)}" height="{fmt(H)}">',
           f'<title>{escape(title)}</title>']
    for g in groups:
        out.append(f'<g id="{g["id"]}" inkscape:label="{escape(g["label"])}" inkscape:groupmode="layer">')
        if editable and g['meta']:
            for i, m in enumerate(g['meta']):
                col = pal[m['role']]
                st = f' stroke="{col}" stroke-width="{fmt(m["stroke"])}" stroke-linejoin="round"' if m['stroke'] else ''
                ls = fmt(m['track']/1000*m['size'])
                out.append(f'<text id="{g["id"]}-texto-{i+1}" x="{fmt(m["x"])}" y="{fmt(m["y"])}" '
                           f'font-family="\'{m["font"]}\'" font-weight="{m["weight"]}" font-size="{fmt(m["size"])}" '
                           f'letter-spacing="{ls}" fill="{col}"{st} xml:space="preserve">{escape(m["text"])}</text>')
            # keep non-text pieces of the group (e.g. dashes)
            for n, r, p in g['pieces']:
                if n == 'fios':
                    out.append(f'<path id="{g["id"]}-{n}" d="{D(p)}" fill="{pal[r]}"/>')
        else:
            for n, r, p in g['pieces']:
                if r not in pal: continue
                out.append(f'<path id="{g["id"]}-{n}" inkscape:label="{n}" d="{D(p)}" fill="{pal[r]}"/>')
        out.append('</g>')
    out.append('</svg>')
    return '\n'.join(out), (W, H)
