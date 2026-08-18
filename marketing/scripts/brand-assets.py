"""Derives the web brand assets from the masters in public/.

    public/logo.png      2000×2000  mark + wordmark, opaque navy canvas
    public/app-icon.png  2000×2000  mark alone, opaque navy canvas
        ↓
    public/brand/logo-lockup.png   258×112  transparent, trimmed
    public/brand/logo-mark.png      83×112  transparent, trimmed

Run it after replacing either master:

    python3 scripts/brand-assets.py

Why this exists rather than a one-off edit in an image tool: the derived files
are 25 kB and 14 kB against 370 kB and 268 kB, and the difference is not
compression — it is that the masters have an opaque background. The navbar is
transparent over the hero's halo, so a master dropped straight in would show as
a dark rectangle sitting on the light.

The background is removed by flood-filling inward from the four edges rather
than by keying the colour globally. The mark contains its own near-black
regions; a global key would punch holes through them.

Requires Pillow (`pip install --break-system-packages pillow`). It is not a
project dependency: this runs by hand when the artwork changes, not on every
build, and the output is committed.
"""

from collections import deque
from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / 'public'

# Height in CSS pixels of the largest place each asset is used, doubled for
# high-density screens. The lockup is 56px tall in the closing block; the
# navbar renders the same file at 28px, which is not worth a second request.
TARGET_HEIGHT = 112

# How far a pixel may drift from the corner colour and still count as canvas.
# The masters are flat behind the artwork, so this only needs to absorb PNG
# quantisation.
TOLERANCE = 26


def strip_background(path: Path) -> Image.Image:
    """Return the artwork, cropped, with the surrounding canvas transparent."""
    image = Image.open(path).convert('RGBA')
    width, height = image.size
    pixels = image.load()
    canvas = pixels[0, 0][:3]

    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        index = y * width + x
        if seen[index]:
            continue
        seen[index] = 1

        r, g, b, _ = pixels[x, y]
        drift = max(abs(r - canvas[0]), abs(g - canvas[1]), abs(b - canvas[2]))
        if drift > TOLERANCE:
            continue

        pixels[x, y] = (r, g, b, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not seen[ny * width + nx]:
                queue.append((nx, ny))

    box = image.getbbox()
    if box is None:
        raise SystemExit(f'{path.name}: nothing left after removing the background')
    return image.crop(box)


def main() -> None:
    out_dir = PUBLIC / 'brand'
    out_dir.mkdir(exist_ok=True)

    for source, target in (('logo.png', 'logo-lockup.png'), ('app-icon.png', 'logo-mark.png')):
        src = PUBLIC / source
        if not src.exists():
            raise SystemExit(f'missing master: {src}')

        art = strip_background(src)
        width = round(art.size[0] * TARGET_HEIGHT / art.size[1])
        art.resize((width, TARGET_HEIGHT), Image.LANCZOS).save(out_dir / target, optimize=True)

        size_kb = (out_dir / target).stat().st_size / 1024
        print(f'{source:>14}  ->  brand/{target:<18} {width}×{TARGET_HEIGHT}  {size_kb:.1f} kB')

    print(
        '\nIf the aspect ratio changed, update the width/height constants in\n'
        'src/components/marketing/Logo.tsx — they are what stops the header\n'
        'jumping while the image loads.'
    )


if __name__ == '__main__':
    main()
