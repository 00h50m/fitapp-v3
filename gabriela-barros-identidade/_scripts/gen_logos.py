import os, sys, cairosvg
from svgout import *
OUT = sys.argv[1]
for d in ['svg', 'svg-texto-editavel', 'pdf', 'png']:
    os.makedirs(os.path.join(OUT, d), exist_ok=True)
CW_NAMES = dict(COLORWAYS)
manifest = []
for vid, vname, fn in VERSIONS:
    for cw, cwname in COLORWAYS:
        groups = fn(cw)
        title = f'Gabriela Barros Confeitaria — {vname} ({cwname})'
        base = f'gabriela-barros_{vid}_{cw}'
        svg, (W, H) = render_svg(groups, cw, title)
        open(f'{OUT}/svg/{base}.svg', 'w').write(svg)
        cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f'{OUT}/pdf/{base}.pdf')
        scale = 3000 / max(W, H)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=f'{OUT}/png/{base}.png',
                         output_width=round(W*scale), output_height=round(H*scale))
        if any(g['meta'] for g in groups):
            # same artboard as the curves version so both overlay exactly
            box = bbox(groups); pad = 0.06*max(box[2]-box[0], box[3]-box[1])
            esvg, _ = render_svg(groups, cw, title + ' — texto editável', editable=True,
                                 fixed_box=(box[0]-pad, box[1]-pad, box[2]+pad, box[3]+pad))
            open(f'{OUT}/svg-texto-editavel/{base}_texto-editavel.svg', 'w').write(esvg)
        manifest.append((vid, cw, W, H))
print(len(manifest), 'versions')
