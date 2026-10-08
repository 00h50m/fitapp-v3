"""Gabriela Barros — Caderno de receitas (versão tipográfica): master elements."""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'build')); sys.path.insert(0, HERE)
from geo import *
from textpath import shape
from sus4 import suspiro_solid
FONTS = os.path.join(HERE, '..', 'fonts')
SERIF = os.path.join(FONTS, 'Fraunces-SoftSemiBold.ttf')     # Fraunces wght 600, opsz 144, SOFT 100, WONK 0
ITAL = os.path.join(FONTS, 'Fraunces-SoftItalic.ttf')        # Fraunces Italic wght 500, opsz 144, SOFT 100, WONK 1
TYPEB = os.path.join(FONTS, 'CourierPrime-Bold.ttf'); TYPE = os.path.join(FONTS, 'CourierPrime-Regular.ttf')
C = dict(azul='#2D3E8F', morango='#C8423E', chocolate='#4A2C24', chantilly='#F2CFC6', papel='#F4EADB')

SUS = suspiro_solid()
_b = SUS.bounds; SUS = MOVE(SUS, -_b[0], -_b[1]); SUSW, SUSH = _b[2]-_b[0], _b[3]-_b[1]

def text(s, size, font=TYPEB, track=0):
    gl, adv, bb = shape(font, s, size, track)
    return U(*[P(d) for _, d in gl]), adv, bb

# ---- wordmark: "Gabriela Barros" with a dotless i; the dot becomes a suspiro ----
WM_SIZE = 100; WM_TRACK = -10
def _wordmark():
    gl, adv, bb = shape(SERIF, 'Gabrıela Barros', WM_SIZE, WM_TRACK)
    paths = [(n, P(d)) for n, d in gl]
    body = U(*[p for _, p in paths])
    i_glyph = [p for n, p in paths if n in ('dotlessi', 'uni0131', 'idotless')][0]
    ix0, iy0, ix1, iy1 = i_glyph.bounds
    x0, y0, x1, y1 = body.bounds
    w = 24.0; s = w/SUSW
    cx = (ix0+ix1)/2 + 1.5; top = iy0 - 7
    dot = T(SUS, s, 0, 0, s, cx - w/2, top - SUSH*s)
    return MOVE(body, -x0, 0), MOVE(dot, -x0, 0), -x0, adv
WM, WM_DOT, WM_OX, WM_ADV = _wordmark()
_a = U(WM, WM_DOT).bounds; WM_W = _a[2]; WM_TOP = _a[1]; WM_BOT = _a[3]

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
