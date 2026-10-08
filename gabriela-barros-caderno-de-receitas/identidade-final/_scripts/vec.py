"""Handwriting photo -> smooth centreline strokes (list of point lists), in source-pixel units."""
import numpy as np, cv2, json
from PIL import Image
from skimage.morphology import skeletonize
from scipy.ndimage import gaussian_filter1d
from skan import Skeleton, summarize

def ink_mask(img, box, S=4, thr=None, blur=3.0, min_area=300):
    a = np.asarray(img.convert('L').crop(box)).astype(float)
    up = cv2.resize(a, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
    bg = cv2.GaussianBlur(up, (0, 0), 25*S/4)
    bg = np.maximum(bg, cv2.dilate(up, np.ones((9*S, 9*S))))  # paper level
    diff = cv2.GaussianBlur(bg - up, (0, 0), blur)
    if thr is None:
        thr = max(18, np.percentile(diff, 99.0)*0.35)
    m = diff > thr
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    dots = []
    for i in range(1, n):
        ar = st[i, cv2.CC_STAT_AREA]
        if ar < min_area: m[lab == i] = False
    return m, dots

def chains_from_mask(mask, sig=12.0, step=8, spur=40, dot_max=2500):
    n, lab, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
    dots = []
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < dot_max and max(st[i, cv2.CC_STAT_WIDTH], st[i, cv2.CC_STAT_HEIGHT]) < 70:
            dots.append(cen[i].tolist()); mask = mask.copy(); mask[lab == i] = False
    sk = skeletonize(mask)
    def branches(sk):
        s = Skeleton(sk); df = summarize(s, separator='_')
        return [(s.path_coordinates(i)[:, ::-1].astype(float), int(df['branch_type'][i]), float(df['branch_distance'][i])) for i in range(s.n_paths)]
    for _ in range(4):
        rem = 0
        for c, t, d in branches(sk):
            if t == 1 and d < spur:
                for x, y in c[1:-1]: sk[int(y), int(x)] = False
                for x, y in (c[0], c[-1]):
                    yy, xx = int(y), int(x)
                    if sk[max(yy-1,0):yy+2, max(xx-1,0):xx+2].sum() - 1 <= 1: sk[yy, xx] = False
                rem += 1
        sk = skeletonize(sk)
        if not rem: break
    segs = [c for c, t, d in branches(sk) if d >= 4]
    ends = []
    for i, c in enumerate(segs):
        ends.append((i, 0, c[0], c[min(8, len(c)-1)] - c[0]))
        ends.append((i, 1, c[-1], c[max(-9, -len(c))] - c[-1]))
    cands = []
    for a in range(len(ends)):
        for b in range(a+1, len(ends)):
            ia, ea, pa, va = ends[a]; ib, eb, pb, vb = ends[b]
            if ia == ib or np.hypot(*(pa - pb)) > 4: continue
            cos = np.dot(va, vb)/(np.linalg.norm(va)*np.linalg.norm(vb) + 1e-9)
            cands.append((cos, a, b))
    link = {}
    for cos, a, b in sorted(cands):
        if cos > -0.5 or a in link or b in link: continue
        link[a] = b; link[b] = a
    idx = {(i, e): k for k, (i, e, _, _) in enumerate(ends)}
    seen = set(); chains = []
    for i in range(len(segs)):
        if i in seen: continue
        cur, end_in, visited = i, 0, {i}
        while True:
            k = idx[(cur, end_in)]
            if k not in link: break
            j, ej, _, _ = ends[link[k]]
            if j in visited: break
            visited.add(j); cur, end_in = j, 1 - ej
        pts = []; e = end_in
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
            sm = np.stack([gaussian_filter1d(c[:, k], sig, mode=mode) for k in (0, 1)], 1)
            if not closed: sm[0], sm[-1] = c[0], c[-1]
            c2 = sm[::step]
            if closed: c2 = np.vstack([c2, c2[:1]])
            elif not np.allclose(c2[-1], sm[-1]): c2 = np.vstack([c2, sm[-1]])
            c = c2
        out.append(c.round(2).tolist())
    return out, dots

def preview(strokes, dots, W, H, fn, w=14, col='#2D3E8F'):
    import cairosvg, sys
    sys.path.insert(0, '../sig'); from curves import catmull
    ds = ' '.join(catmull(s) for s in strokes)
    dd = ''.join(f'<circle cx="{x}" cy="{y}" r="{w*0.8}" fill="{col}"/>' for x, y in dots)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{min(1600, W)}" height="{min(1600, W)*H/W}"><rect width="{W}" height="{H}" fill="#F4EADB"/><path d="{ds}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>{dd}</svg>'
    cairosvg.svg2png(bytestring=svg.encode(), write_to=fn)
