#!/usr/bin/env python3
"""SVGと同じミナトのブランドマークをPNGへ書き出す。"""

import math
from pathlib import Path

from PIL import Image, ImageDraw


HERE = Path(__file__).resolve().parent


def render(size: int, output: Path) -> None:
    scale = 4
    canvas = size * scale
    image = Image.new("RGB", (canvas, canvas), "#111827")
    draw = ImageDraw.Draw(image)
    radius = round(canvas * 15 / 64)
    draw.rounded_rectangle((0, 0, canvas - 1, canvas - 1), radius=radius, fill="#1F3B93")

    def point(x: float, y: float) -> tuple[float, float]:
        return x * canvas / 64, y * canvas / 64

    draw.line(
        [point(15, 42), point(15, 21), point(32, 37), point(49, 21), point(49, 42)],
        fill="#FFFFFF",
        width=round(canvas * 6 / 64),
        joint="curve",
    )
    line_width = round(canvas * 3.5 / 64)
    wave = []
    for step in range(61):
        x = 17 + 30 * step / 60
        y = 48 - 2.5 * math.sin(step / 60 * math.pi * 4)
        wave.append(point(x, y))
    draw.line(wave, fill="#7DD3FC", width=line_width, joint="curve")
    image.resize((size, size), Image.Resampling.LANCZOS).save(output, "PNG")


def main() -> None:
    for size in (32, 180, 512):
        render(size, HERE / f"minato-mark-{size}.png")


if __name__ == "__main__":
    main()
