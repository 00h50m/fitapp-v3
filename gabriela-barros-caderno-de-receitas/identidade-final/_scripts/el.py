"""Gabriela Barros — Caderno de receitas: master elements (single source for every file)."""
import sys, os, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'build')); sys.path.insert(0, HERE)
from geo import *
from textpath import shape
from curves import catmull
from sus4 import suspiro_solid
FONTS = os.path.join(HERE, '..', 'fonts')
TYPE = os.path.join(FONTS, 'CourierPrime-Regular.ttf'); TYPEB = os.path.join(FONTS, 'CourierPrime-Bold.ttf')
C = dict(azul='#2D3E8F', morango='#C8423E', chocolate='#4A2C24', chantilly='#F2CFC6', papel='#F4EADB')
PEN = 6.0  # pen width in source-photo pixels (the same pen for every handwritten piece)

class Hand:
    """A handwritten piece: centreline strokes (editable) + outlined geometry, normalised to origin (0,0)."""
    def __init__(self, strokes, dots=(), scale=0.25, pen=PEN, dot_r=None):
        self.k = scale
        L = lambda s: sum(math.hypot(s[i+1][0]-s[i][0], s[i+1][1]-s[i][1]) for i in range(len(s)-1))
        pts = [[(x*scale, y*scale) for x, y in s] for s in strokes if L(s)*scale > 3*pen]
        dts = [(x*scale, y*scale) for x, y in dots]
        allp = [p for s in pts for p in s] + list(dts)
        x0 = min(p[0] for p in allp); y0 = min(p[1] for p in allp)
        self.pts = [[(x-x0+pen/2, y-y0+pen/2) for x, y in s] for s in pts]
        self.dots = [(x-x0+pen/2, y-y0+pen/2) for x, y in dts]
        self.pen = pen; self.dot_r = dot_r or pen*0.85
        self.d = [catmull([list(p) for p in s]) for s in self.pts]
        self.path = U(*[STROKE(P(d), pen) for d in self.d] + [circle(x, y, self.dot_r) for x, y in self.dots])
        b = self.path.bounds; self.w, self.h = b[2], b[3]
    def nodot(self):
        return U(*[STROKE(P(d), self.pen) for d in self.d])

J = json.load(open(os.path.join(HERE, 'sig4.json')))
SIG = Hand(J['strokes'], J['dots'])
W = json.load(open(os.path.join(HERE, 'words.json')))
def word(key):
    w = W[key]; strokes = w['strokes']
    xs = min(p[0] for s in strokes for p in s)
    dots = [d for d in w['dots'] if d[0] > xs]  # drop stray pen dots before the word
    return Hand(strokes, dots)
WORDS = {k: word(v) for k, v in dict(confeitaria='confeitaria', suspiro='suspiro-maiusc', feito='feito-com-amor', receita='receita-n').items()}
N = json.load(open(os.path.join(HERE, 'nums.json')))
_groups = [g for g in N['groups'] if sum(len(s) for s in g) > 10]
DIGITS = {str(i): Hand(g, []) for i, g in enumerate(_groups[:10])}

SUS = suspiro_solid()
_b = SUS.bounds; SUS = MOVE(SUS, -_b[0], -_b[1]); SUSW, SUSH = _b[2]-_b[0], _b[3]-_b[1]

def mono_g():
    """The 'G' of the signature (everything left of the first 'a')."""
    H = SIG.h
    inside = lambda x, y: x < SIG.w*0.088 or (y > H*0.42 and x < SIG.w*0.2)
    runs = []
    for s in SIG.pts:
        cur = []
        for x, y in s:
            if inside(x, y): cur.append([x, y])
            elif cur: runs.append(cur); cur = []
        if cur: runs.append(cur)
    runs = [r for r in runs if len(r) > 2]
    return U(*[STROKE(P(catmull(r)), SIG.pen) for r in runs]), [catmull(r) for r in runs]
G, G_D = mono_g()

def text(s, size, font=TYPEB, track=0):
    gl, adv, bb = shape(font, s, size, track)
    return U(*[P(d) for _, d in gl]), adv, bb

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
            ang = (mid - total/2)/circ*360; rad = math.radians(ang)
            q = MOVE(p, -a/2, 0); c, s_ = math.cos(rad), math.sin(rad)
        else:
            ang = 180 - (mid - total/2)/circ*360; rad = math.radians(ang)
            q = MOVE(p, -a/2, size*0.36); c, s_ = math.cos(rad+math.pi), math.sin(rad+math.pi)
        q = T(q, c, s_, -s_, c, 0, 0)
        out.append(MOVE(q, r*math.sin(rad), -r*math.cos(rad)))
    return U(*out)
