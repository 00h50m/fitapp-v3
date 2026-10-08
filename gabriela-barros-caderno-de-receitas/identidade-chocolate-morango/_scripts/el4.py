"""Gabriela Barros — Caderno de receitas (versão tipográfica): master elements."""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'build')); sys.path.insert(0, HERE)
from geo import *
from textpath import shape
from sus4 import suspiro_solid
FONTS = os.path.join(HERE, '..', 'fonts')
SERIF = os.path.join(FONTS, 'YoungSerif-Regular.ttf')
ITAL = SERIF  # Young Serif has no italic: supporting phrases use the same face
TYPEB = os.path.join(FONTS, 'CourierPrime-Bold.ttf'); TYPE = os.path.join(FONTS, 'CourierPrime-Regular.ttf')
C = dict(chocolate='#3B2220', morango='#C73446', rosa='#F6CDCB', creme='#FBF4EA', folha='#4F7A45')
# aliases used by the shared layout scripts: primary / light support / paper
C.update(azul=C['chocolate'], chantilly=C['rosa'], papel=C['creme'])

SUS = suspiro_solid()
_b = SUS.bounds; SUS = MOVE(SUS, -_b[0], -_b[1]); SUSW, SUSH = _b[2]-_b[0], _b[3]-_b[1]

def text(s, size, font=TYPEB, track=0):
    gl, adv, bb = shape(font, s, size, track)
    return U(*[P(d) for _, d in gl]), adv, bb

# ---- wordmark: "Gabriela Barros" with a dotless i; the dot becomes a suspiro ----
WM_SIZE = 100; WM_TRACK = 0
import pathops
def _wordmark():
    gl, adv, bb = shape(SERIF, 'Gabriela Barros', WM_SIZE, WM_TRACK)
    body = U(*[P(d) for _, d in gl])
    x0, y0, x1, y1 = body.bounds
    return MOVE(body, -x0, 0), pathops.Path(), -x0, adv
WM, WM_DOT, WM_OX, WM_ADV = _wordmark()
import pathops
_a = WM.bounds; WM_W = _a[2]; WM_TOP = _a[1]; WM_BOT = _a[3]

def monogram_gb():
    g, adv, bb = shape(SERIF, 'G', 160, 0); G = U(*[P(d) for _, d in g])
    b, adv2, bb2 = shape(SERIF, 'B', 160, 0); B = U(*[P(d) for _, d in b])
    gb = G.bounds; bbx = B.bounds
    B = MOVE(B, gb[2] - bbx[0] - 6, 0)
    m = U(G, B); x0, y0, x1, y1 = m.bounds
    return MOVE(m, -(x0+x1)/2, -(y0+y1)/2)
GB = monogram_gb()

def text_on_circle(s, size, r, font, track, top=True):
    x = 0; items = []
    for ch in s:
        g, a, _ = shape(font, ch, size)
        if g: items.append((x, a, U(*[P(d) for _, d in g])))
        x += a + track/1000*size
    total = x - track/1000*size; circ = 2*math.pi*r; out = []
    for gx, a, p in items:
        mid = gx + a/2
        if top:
            ang = (mid - total/2)/circ*360; rad = math.radians(ang); q = MOVE(p, -a/2, 0); c, s_ = math.cos(rad), math.sin(rad)
        else:
            ang = 180 - (mid - total/2)/circ*360; rad = math.radians(ang); q = MOVE(p, -a/2, size*0.36); c, s_ = math.cos(rad+math.pi), math.sin(rad+math.pi)
        q = T(q, c, s_, -s_, c, 0, 0); out.append(MOVE(q, r*math.sin(rad), -r*math.cos(rad)))
    return U(*out)
