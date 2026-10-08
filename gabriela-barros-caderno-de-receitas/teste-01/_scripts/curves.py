import json
def catmull(pts):
    """Polyline -> smooth cubic Bezier path data (centripetal-ish Catmull-Rom, tension 1/6)."""
    if len(pts) < 3:
        return f"M{pts[0][0]:.2f},{pts[0][1]:.2f} " + ' '.join(f"L{x:.2f},{y:.2f}" for x, y in pts[1:])
    d = [f"M{pts[0][0]:.2f},{pts[0][1]:.2f}"]
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i-1], P[i], P[i+1], P[i+2]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
        c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        d.append(f"C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {p2[0]:.2f},{p2[1]:.2f}")
    return ' '.join(d)
def load(fn='strokes.json'): return json.load(open(fn))
