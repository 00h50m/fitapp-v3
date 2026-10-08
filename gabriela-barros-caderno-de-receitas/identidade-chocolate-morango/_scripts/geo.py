"""Boolean geometry helpers on top of skia-pathops; I/O as SVG path data."""
import math, pathops
from fontTools.svgLib.path import parse_path
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

def fmt(v):
    s = f"{v:.2f}".rstrip('0').rstrip('.')
    return '0' if s == '-0' else s

def P(d, transform=None):
    p = pathops.Path(); pen = p.getPen()
    if transform: pen = TransformPen(pen, transform)
    parse_path(d, pen)
    return p

def D(p):
    pen = SVGPathPen(None, fmt); p.draw(pen); return pen.getCommands()

def U(*ps):
    ps = [p for p in ps if p is not None]
    if not ps: return pathops.Path()
    if len(ps) == 1: return pathops.simplify(ps[0], fix_winding=True)
    return _fold(ps, pathops.PathOp.UNION)

def _fold(ps, op):
    acc = ps[0]
    for q in ps[1:]: acc = pathops.op(acc, q, op, fix_winding=True)
    return acc

def SUB(a, *bs):
    acc = a
    for b in bs: acc = pathops.op(acc, b, pathops.PathOp.DIFFERENCE, fix_winding=True)
    return acc

def INT(a, b): return pathops.op(a, b, pathops.PathOp.INTERSECTION, fix_winding=True)

def STROKE(p, w, cap='round', join='round'):
    q = pathops.Path(); q.addPath(p)
    caps = {'round': pathops.LineCap.ROUND_CAP, 'butt': pathops.LineCap.BUTT_CAP, 'square': pathops.LineCap.SQUARE_CAP}
    joins = {'round': pathops.LineJoin.ROUND_JOIN, 'miter': pathops.LineJoin.MITER_JOIN}
    q.stroke(w, caps[cap], joins[join], 4)
    q.convertConicsToQuads()
    return U(q)

def GROW(p, r):
    """Offset a filled shape outward by r."""
    return U(p, STROKE(p, 2*r))

def SHRINK(p, r):
    return SUB(p, STROKE(p, 2*r))

def T(p, a=1, b=0, c=0, d=1, e=0, f=0):
    q = pathops.Path(); pen = TransformPen(q.getPen(), (a,b,c,d,e,f)); p.draw(pen); return q

def MOVE(p, dx, dy): return T(p, 1,0,0,1,dx,dy)
def SCALE(p, s, cx=0, cy=0): return T(p, s,0,0,s, cx - s*cx, cy - s*cy)
def ROT(p, deg, cx=0, cy=0):
    r = math.radians(deg); c, s = math.cos(r), math.sin(r)
    return T(p, c, s, -s, c, cx - c*cx + s*cy, cy - s*cx - c*cy)

def circle(cx, cy, r):
    k = 0.5522847498*r
    return P(f"M{cx+r},{cy} C{cx+r},{cy+k} {cx+k},{cy+r} {cx},{cy+r} C{cx-k},{cy+r} {cx-r},{cy+k} {cx-r},{cy} "
             f"C{cx-r},{cy-k} {cx-k},{cy-r} {cx},{cy-r} C{cx+k},{cy-r} {cx+r},{cy-k} {cx+r},{cy} Z")

def capsule(cx, cy, length, w, deg):
    l = length/2
    line = P(f"M{cx-l+w/2},{cy} L{cx+l-w/2},{cy}")
    return ROT(STROKE(line, w), deg, cx, cy)

def bounds(p):
    return p.bounds if len(list(p.contours)) else (0,0,0,0)
