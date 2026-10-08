"""Gabriela Barros — Confeitaria: master geometry (single source for every version)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from geo import *
from textpath import shape

FONTS = os.path.join(os.path.dirname(__file__), '..', 'fontes')
SCRIPT = os.path.join(FONTS, 'GrandHotel-Regular.ttf')  # fonte original, inalterada
SANS = os.path.join(FONTS, 'Montserrat-SemiBold.ttf')  # gerar: fonttools varLib.instancer 'Montserrat[wght].ttf' wght=600 -o Montserrat-SemiBold.ttf

COL = dict(
    bordo='#621B28', rosa='#F2B5B0', terracota='#C1603F', marrom='#45211A', creme='#FBF1EA', branco='#FFFFFF', preto='#1A1A1A')

# ---------------- lettering ----------------
LET_SIZE = 200
BOLD = 2.6  # outward offset in px at LET_SIZE: gives the script a sturdier, more legible stroke

def _text_path(fontpath, text, size, tracking=0, adjust=None):
    glyphs, adv, bb = shape(fontpath, text, size, tracking, adjust=adjust)
    return U(*[P(d) for _, d in glyphs]), adv

def lettering():
    """Two-line lettering. Returns dict(line1, line2, swash) in a local frame; baseline of line1 at y=0."""
    g, wg = _text_path(SCRIPT, 'Gabriela', LET_SIZE, tracking=6)
    b, wb = _text_path(SCRIPT, 'Barros', LET_SIZE, tracking=10)
    g = GROW(g, BOLD); b = GROW(b, BOLD)
    gx0, gy0, gx1, gy1 = g.bounds; bx0, by0, bx1, by1 = b.bounds
    # centre line 1 on x=0, line 2 shifted right a touch for a rhythmic, offset stack
    g_ox = -(gx0+gx1)/2; g = MOVE(g, g_ox, 0)
    lead = LET_SIZE*0.84
    b_ox = -(bx0+bx1)/2 + LET_SIZE*0.12; b = MOVE(b, b_ox, lead)
    bx0, by0, bx1, by1 = b.bounds
    # swash: tapered stroke below 'Barros', thick in the middle, lifting at the right end
    y = lead + LET_SIZE*0.19
    x0 = bx0 + LET_SIZE*0.26; x1 = bx1 + LET_SIZE*0.06
    L = x1 - x0; t = LET_SIZE*0.065; lift = LET_SIZE*0.12
    top = f"M{x0},{y} C{x0+L*0.35},{y+t*0.6} {x0+L*0.72},{y+t*0.2} {x1},{y-lift}"
    bot = f"C{x0+L*0.70},{y+t*1.5} {x0+L*0.32},{y+t*2.1} {x0},{y} Z"
    sw = GROW(P(top + ' ' + bot), 1.2)
    return dict(line1=g, line2=b, swash=sw, text=[('Gabriela', g_ox, 0, 6), ('Barros', b_ox, lead, 10)])

def lettering_one_line():
    t, w = _text_path(SCRIPT, 'Gabriela Barros', LET_SIZE, tracking=8)
    t = GROW(t, BOLD)
    x0, y0, x1, y1 = t.bounds
    return MOVE(t, -x0, 0), [('Gabriela Barros', -x0, 0, 8)]

def descriptor(size, tracking=300, dashes=True, dash_len=None, gap=None):
    """'CONFEITARIA' in Montserrat SemiBold converted to curves, centred on x=0, baseline y=0."""
    t, w = _text_path(SANS, 'CONFEITARIA', size, tracking=tracking)
    x0, y0, x1, y1 = t.bounds
    t = MOVE(t, -(x0+x1)/2, 0)
    parts = dict(text=t, src=('CONFEITARIA', -(x0+x1)/2, 0, tracking, size))
    if dashes:
        dash_len = dash_len or size*1.6; gap = gap or size*1.1
        hw = (x1-x0)/2; yc = -size*0.36; th = max(size*0.085, 1.0)
        def dash(xa, xb): return P(f"M{xa},{yc-th/2} L{xb},{yc-th/2} L{xb},{yc+th/2} L{xa},{yc+th/2} Z")
        parts['dashes'] = U(dash(-hw-gap-dash_len, -hw-gap), dash(hw+gap, hw+gap+dash_len))
    return parts

# ---------------- symbol ----------------
# local frame: roughly 200 x 210, origin top-left
def heart(cx, cy, w):
    s = w/100.0
    d = ("M50,92 C50,92 4,62 4,32 C4,14 17,3 31,3 C40,3 47,8 50,16 C53,8 60,3 69,3 "
         "C83,3 96,14 96,32 C96,62 50,92 50,92 Z")
    h = P(d)
    # round off the bottom point slightly (friendlier, survives small sizes)
    h = U(SHRINK(h, 3*1.0), )
    h = GROW(h, 3)
    return T(h, s, 0, 0, s, cx - 50*s, cy - 47*s)

def symbol():
    """Returns dict of parts (paths) for the brigadeiro + heart."""
    gap = 5.0  # knockout gap between parts (transparent, works on any background)
    ball = circle(100, 94, 70)
    # cup: scalloped rim, tapering body
    rim_y = 140; bot_y = 198; xl, xr = 24, 176; bl, br = 48, 152
    n = 6; seg = (xr-xl)/n
    rim = f"M{xl},{rim_y}"
    for i in range(n):
        a = xl + i*seg; m = a + seg/2; b = a + seg
        rim += f" Q{m},{rim_y-14} {b},{rim_y}"
    body = rim + f" L{br},{bot_y} Q{100},{bot_y+5} {bl},{bot_y} Z"
    cup = U(P(body))
    cup = GROW(SHRINK(cup, 3), 3)  # soften corners
    # pleats: lines from rim valleys toward bottom, converging
    pleats = []
    for i in range(1, n):
        xa = xl + i*seg; xb = bl + (br-bl)*i/n
        pleats.append(P(f"M{xa},{rim_y+9} L{xb},{bot_y-9}"))
    # heart topping
    hrt = heart(100, 30, 46)
    # sprinkles: few, bold, well spaced (they must survive at ~24 px)
    spr_spec = [(66, 62, 35), (134, 60, -40), (100, 76, 8), (52, 98, -62), (80, 106, 28),
                (120, 104, -25), (150, 96, 62)]
    sprinkles = [capsule(x, y, 17, 7, a) for x, y, a in spr_spec]
    spr = U(*sprinkles)
    spr = INT(spr, SHRINK(ball, 4))
    # knockouts
    cup_zone = GROW(cup, gap)
    heart_zone = GROW(hrt, gap)
    ball_vis = SUB(ball, cup_zone, heart_zone)
    spr = SUB(spr, cup_zone, heart_zone)
    stroke_w = 6.5
    cup_outline = STROKE(cup, stroke_w, join='round')
    cup_inner = SHRINK(cup, stroke_w/2)
    pleat_lines = INT(STROKE(U(*[STROKE(p, 0.01) for p in pleats]) if False else _lines(pleats), 5.0), cup_inner)
    cup_line = U(SUB(cup_outline, SUB(cup_outline, GROW(cup, stroke_w/2))), pleat_lines)  # outline+pleats
    cup_fill = cup
    return dict(ball=ball_vis, sprinkles=spr, heart=hrt, cup_fill=cup_fill, cup_line=cup_line,
                cup_outer=GROW(cup, stroke_w/2))

def _lines(ps):
    acc = pathops.Path()
    for p in ps: acc.addPath(p)
    return acc

import pathops
