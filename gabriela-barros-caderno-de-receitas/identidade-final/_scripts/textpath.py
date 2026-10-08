"""Shape text with HarfBuzz and emit SVG path data (y-down) for each glyph."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

_cache = {}
def _load(path):
    if path not in _cache:
        blob = hb.Blob.from_file_path(path)
        face = hb.Face(blob)
        tt = TTFont(path)
        _cache[path] = (hb.Font(face), tt, tt['head'].unitsPerEm)
    return _cache[path]

def shape(path, text, size, tracking=0.0, features=None, adjust=None):
    """Return list of (glyphname, path_d) and advance width + bounds.
    tracking in em/1000. adjust: dict index->extra x shift (units of em/1000)."""
    font, tt, upem = _load(path)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, features or {"kern": True, "liga": True, "calt": True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    s = size / upem
    x = 0.0; out = []
    bp = BoundsPen(None); 
    xmin=ymin=1e9; xmax=ymax=-1e9
    for i,(info,pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        if adjust and i in adjust: x += adjust[i]*upem/1000
        name = order[info.codepoint]
        pen = SVGPathPen(gs, lambda v: f"{v:.2f}".rstrip('0').rstrip('.'))
        ox = (x + pos.x_offset)*s; oy = pos.y_offset*s
        tp = TransformPen(pen, (s,0,0,-s,ox,-oy))
        gs[name].draw(tp)
        b = BoundsPen(gs); gs[name].draw(b)
        if b.bounds:
            x0,y0,x1,y1=b.bounds
            xmin=min(xmin,ox+x0*s); xmax=max(xmax,ox+x1*s)
            ymin=min(ymin,-oy-y1*s); ymax=max(ymax,-oy-y0*s)
        d = pen.getCommands()
        if d: out.append((name, d))
        x += pos.x_advance + tracking*upem/1000
    if text and tracking: x -= tracking*upem/1000
    return out, x*s, (xmin,ymin,xmax,ymax)
