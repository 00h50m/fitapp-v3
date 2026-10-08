import sys; sys.path.insert(0, '../build')
from geo import *
import cairosvg
def suspiro_solid():
    # low, wide meringue with scalloped foot (star nozzle), spiral ridges and a peak curling over
    foot = "M-120,0 Q-110,-10 -96,-2 Q-82,-12 -66,-3 Q-50,-13 -33,-4 Q-16,-14 0,-4 Q16,-14 33,-4 Q50,-13 66,-3 Q82,-12 96,-2 Q110,-10 120,0"
    body = P("M-120,0 C-128,-34 -100,-66 -62,-86 C-30,-102 -6,-114 6,-134 C14,-148 30,-160 48,-154 "
             "C60,-150 62,-138 54,-132 C50,-142 36,-142 32,-130 C28,-114 48,-100 74,-84 "
             "C110,-62 126,-30 120,0 L-120,0 Z")
    body = GROW(SHRINK(body, 5), 5)
    notch = U(*[circle(x, 4, 9) for x in (-96, -66, -33, 0, 33, 66, 96)])
    ridges = [P("M-92,-14 C-86,-46 -50,-68 -16,-96"), P("M-33,-16 C-20,-50 10,-70 22,-110"), P("M36,-16 C52,-38 62,-56 54,-80")]
    cut = U(*[STROKE(r, 8) for r in ridges])
    return SUB(body, cut)
if __name__ == '__main__':
    p = suspiro_solid()
    open('suspiro.d', 'w').write(D(p))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -190 600 220" width="1200" height="440"><rect x="-150" y="-190" width="600" height="220" fill="#F5EBDD"/><path d="{D(p)}" fill="#2B3A8C"/><path transform="translate(300,0)" d="{D(p)}" fill="#C8423E"/></svg>'
    cairosvg.svg2png(bytestring=svg.encode(), write_to='sus.png')
