import sys
from collections import deque
from PIL import Image

def strip_bg(path, tolerance=30):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()

    from collections import Counter

    sample = Counter()
    for x in range(0, w, max(1, w // 50)):
        sample[px[x, 0][:3]] += 1
        sample[px[x, h - 1][:3]] += 1
    for y in range(0, h, max(1, h // 50)):
        sample[px[0, y][:3]] += 1
        sample[px[w - 1, y][:3]] += 1
    br, bg, bb = sample.most_common(1)[0][0]

    visited = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        idx = y * w + x
        if visited[idx]:
            continue
        visited[idx] = 1
        r, g, b, a = px[x, y]
        dist = ((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2) ** 0.5
        if dist > tolerance:
            continue
        px[x, y] = (r, g, b, 0)
        q.append((x - 1, y))
        q.append((x + 1, y))
        q.append((x, y - 1))
        q.append((x, y + 1))

    # Erode the opaque region by `erode` px to eat the anti-aliased halo ring
    # left behind between the removed background and the sprite's outline.
    erode = 1
    for _ in range(erode):
        boundary = []
        for y in range(h):
            for x in range(w):
                idx = y * w + x
                if px[x, y][3] == 0:
                    continue
                neighbors = [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
                for nx, ny in neighbors:
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        boundary.append((x, y))
                        break
        for x, y in boundary:
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 0)

    img.save(path)
    print(f"stripped {path}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        strip_bg(p)
