from PIL import Image
import os

os.makedirs('icons', exist_ok=True)
src = os.path.join('icons', 'icon-512.png')
if not os.path.exists(src):
    raise SystemExit(f"Source icon not found: {src}")

im = Image.open(src).convert('RGBA')
for s, name in [(144, 'icon-144.png'), (72, 'icon-72.png'), (48, 'icon-48.png')]:
    im2 = im.resize((s, s), Image.LANCZOS)
    out_path = os.path.join('icons', name)
    im2.save(out_path)
    print('Saved', out_path)

print('Done generating icons')
