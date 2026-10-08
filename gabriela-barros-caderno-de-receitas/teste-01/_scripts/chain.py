import sys
SIG=float(sys.argv[1]); STEP=int(sys.argv[2])
import numpy as np, json, cv2
from PIL import Image
from skimage.morphology import skeletonize
from scipy.ndimage import gaussian_filter1d
from skan import Skeleton, summarize
im = np.asarray(Image.open('../../images/2.webp').convert('RGB')).astype(float)
x0, y0, x1, y1 = 280, 290, 1070, 600
S = 4
up = cv2.resize(im[y0:y1, x0:x1], None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
score = cv2.GaussianBlur(up[..., 2] - (up[..., 0] + up[..., 1])/2, (0, 0), 4.0)
mask = score > 17
n, lab, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
dots = []
for i in range(1, n):
    a = st[i, cv2.CC_STAT_AREA]
    if a < 300: mask[lab == i] = False
    elif a < 2500: dots.append(cen[i].tolist()); mask[lab == i] = False
sk = skeletonize(mask)

def branches(sk):
    s = Skeleton(sk); df = summarize(s, separator='_')
    return s, [(s.path_coordinates(i)[:, ::-1].astype(float), int(df['branch_type'][i]), float(df['branch_distance'][i])) for i in range(s.n_paths)]
for _ in range(4):
    s, bs = branches(sk); rem = 0
    for c, t, d in bs:
        if t == 1 and d < 45:
            # endpoint side: whichever end has 1 neighbour
            for x, y in c[1:-1]: sk[int(y), int(x)] = False
            for x, y in (c[0], c[-1]):
                yy, xx = int(y), int(x)
                nb = sk[max(yy-1,0):yy+2, max(xx-1,0):xx+2].sum() - 1
                if nb <= 1: sk[yy, xx] = False
            rem += 1
    sk = skeletonize(sk)
    if not rem: break
s, bs = branches(sk)
segs = [c for c, t, d in bs if d >= 4]
key = lambda p: (round(p[0]), round(p[1]))
# group segment ends by junction (ends within 3 px)
ends = []
for i, c in enumerate(segs):
    ends.append((i, 0, c[0], c[min(8, len(c)-1)] - c[0]))
    ends.append((i, 1, c[-1], c[max(-9, -len(c))] - c[-1]))
used = set(); pair = {}
for a in range(len(ends)):
    for b in range(a+1, len(ends)):
        ia, ea, pa, va = ends[a]; ib, eb, pb, vb = ends[b]
        if ia == ib: continue
        if np.hypot(*(pa - pb)) > 4: continue
        cos = np.dot(va, vb) / (np.linalg.norm(va)*np.linalg.norm(vb) + 1e-9)
        pair.setdefault(a, []).append((cos, b)); pair.setdefault(b, []).append((cos, a))
# greedy: most opposite (cos closest to -1) first
cands = sorted({(min(c, cc), tuple(sorted((a, b)))) for a, l in pair.items() for c, b in l for cc in [c]})
link = {}
for cos, (a, b) in cands:
    if cos > -0.5 or a in link or b in link: continue
    link[a] = b; link[b] = a
# walk chains
idx = {(i, e): k for k, (i, e, _, _) in enumerate(ends)}
seen = set(); chains = []
for i in range(len(segs)):
    if i in seen: continue
    # go to chain start
    cur, end_in = i, 0
    visited = {i}
    while True:
        k = idx[(cur, end_in)]
        if k not in link: break
        j, ej, _, _ = ends[link[k]]
        if j in visited: break
        visited.add(j); cur, end_in = j, 1 - ej
    start, start_end = cur, end_in
    pts = []; cur, e = start, start_end
    while True:
        seen.add(cur)
        c = segs[cur] if e == 0 else segs[cur][::-1]
        pts.extend(c.tolist() if not pts else c[1:].tolist())
        k = idx[(cur, 1 - e)]
        if k not in link: break
        j, ej, _, _ = ends[link[k]]
        if j in seen: break
        cur, e = j, ej
    chains.append(np.array(pts))
out = []
for c in chains:
    if len(c) > 12:
        closed = np.hypot(*(c[0] - c[-1])) < 4
        mode = 'wrap' if closed else 'nearest'
        sm = np.stack([gaussian_filter1d(c[:, k], SIG, mode=mode) for k in (0, 1)], 1)
        if not closed: sm[0], sm[-1] = c[0], c[-1]
        c = sm[::STEP] if not closed else np.vstack([sm[::STEP], sm[:1]])
        if not closed and not np.allclose(c[-1], sm[-1]): c = np.vstack([c, sm[-1]])
    out.append(c.round(2).tolist())
json.dump(dict(strokes=out, dots=dots), open('chains.json', 'w'))
print('segments', len(segs), 'chains', len(out), 'dots', dots)
