#!/usr/bin/env python3
"""chroma_key.py — Scalable sprite processing pipeline.

Usage:
  python chroma_key.py <input_image> <output_dir> [options]

Options:
  --frames N        Total number of frames to extract (default: auto-detect)
  --cols N          Number of columns in the spritesheet grid (default: auto-detect)
  --rows N          Number of rows in the spritesheet grid (default: 1)
  --prefix NAME     Output filename prefix (default: derived from input filename)
  --size WxH        Output frame size, e.g. 128x128 (default: auto from content)
  --pad N           Padding around content in output frames, in pixels (default: 4)
  --anchor POSITION Where to anchor the sprite in the frame: center, bottom (default: bottom)

Handles:
  - Green (#00FF00) chroma key backgrounds
  - Gray/checkerboard baked-in transparency backgrounds
  - Arbitrary grid layouts (1xN, Nx1, NxM)
  - Auto-detects frame count and layout from content
  - Bottom-anchors sprites for consistent ground alignment
  - Outputs clean RGBA PNGs ready for animation

This script is designed to work with ANY character sprite — egg, hatchling,
or any future evolution. Just provide the spritesheet and options.
"""

import sys
import os
import argparse
from PIL import Image
import numpy as np


def detect_background_type(arr: np.ndarray) -> str:
    """Detect whether the background is green chroma, gray, or transparent."""
    if arr.shape[2] == 4:
        alpha = arr[:, :, 3]
        transparent_ratio = np.sum(alpha < 10) / alpha.size
        if transparent_ratio > 0.3:
            # Check if there's a gray background baked in with the transparency
            opaque = alpha > 200
            if opaque.any():
                r, g, b = arr[opaque, 0].mean(), arr[opaque, 1].mean(), arr[opaque, 2].mean()
                if abs(r - g) < 10 and abs(g - b) < 10 and 70 < r < 110:
                    return "gray"
            return "transparent"

    r, g, b = arr[:, :, 0].astype(float), arr[:, :, 1].astype(float), arr[:, :, 2].astype(float)
    green_ratio = np.sum((g > 150) & (g > r * 1.4) & (g > b * 1.4)) / r.size
    if green_ratio > 0.2:
        return "green"

    # Check for solid gray background
    gray_ratio = np.sum((np.abs(r - 89) < 20) & (np.abs(g - 91) < 20) & (np.abs(b - 88) < 20)) / r.size
    if gray_ratio > 0.3:
        return "gray"

    return "unknown"


def remove_green_chroma(arr: np.ndarray) -> np.ndarray:
    """Remove green chroma key background, return RGBA array."""
    if arr.shape[2] == 3:
        alpha = np.full((*arr.shape[:2], 1), 255, dtype=np.uint8)
        arr = np.concatenate([arr, alpha], axis=2)

    arr = arr.copy()
    r, g, b = arr[:, :, 0].astype(float), arr[:, :, 1].astype(float), arr[:, :, 2].astype(float)

    # Primary green detection
    is_green = (g > 150) & (g > r * 1.4) & (g > b * 1.4)
    arr[is_green, 3] = 0

    # Anti-alias: reduce green fringing on edge pixels
    semi_green = (g > 120) & (g > r * 1.1) & (g > b * 1.1) & (~is_green)
    arr[semi_green, 1] = np.minimum(
        arr[semi_green, 1],
        np.maximum(arr[semi_green, 0], arr[semi_green, 2])
    )

    return arr


def remove_gray_background(arr: np.ndarray) -> np.ndarray:
    """Remove gray/checkerboard baked-in background, return RGBA array."""
    if arr.shape[2] == 3:
        alpha = np.full((*arr.shape[:2], 1), 255, dtype=np.uint8)
        arr = np.concatenate([arr, alpha], axis=2)

    arr = arr.copy()
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)

    # Detect gray background pixels: uniform grayish color
    is_gray = (
        (np.abs(r - g) < 8) &
        (np.abs(g - b) < 8) &
        (r > 60) & (r < 110) &
        (arr[:, :, 3] > 200)
    )

    arr[is_gray, 3] = 0

    return arr


def find_content_bbox(arr: np.ndarray, alpha_threshold: int = 30) -> tuple:
    """Find bounding box of non-transparent content. Returns (y_min, y_max, x_min, x_max)."""
    alpha = arr[:, :, 3]
    rows_with = np.any(alpha > alpha_threshold, axis=1)
    cols_with = np.any(alpha > alpha_threshold, axis=0)

    if not rows_with.any():
        return None

    y_min, y_max = np.where(rows_with)[0][[0, -1]]
    x_min, x_max = np.where(cols_with)[0][[0, -1]]
    return (int(y_min), int(y_max), int(x_min), int(x_max))


def detect_grid_layout(arr: np.ndarray, bg_type: str) -> tuple:
    """Auto-detect grid layout (rows, cols) from spritesheet content patterns."""
    h, w = arr.shape[:2]

    if bg_type == "green":
        r, g, b = arr[:, :, 0].astype(float), arr[:, :, 1].astype(float), arr[:, :, 2].astype(float)
        is_bg = (g > 150) & (g > r * 1.4) & (g > b * 1.4)
    elif bg_type == "gray":
        r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
        is_bg = (np.abs(r - g) < 8) & (np.abs(g - b) < 8) & (r > 60) & (r < 110)
    else:
        is_bg = arr[:, :, 3] < 30

    is_content = ~is_bg

    # Find content density per column and per row
    col_density = np.sum(is_content, axis=0) / h
    row_density = np.sum(is_content, axis=1) / w

    # Detect columns: find gaps of low density
    def find_segments(density, size, min_gap_ratio=0.05):
        threshold = 0.01
        min_gap = max(int(size * min_gap_ratio), 4)

        in_gap = density < threshold
        segments = []
        seg_start = None

        for i in range(size):
            if not in_gap[i]:
                if seg_start is None:
                    seg_start = i
            else:
                if seg_start is not None:
                    segments.append((seg_start, i - 1))
                    seg_start = None
        if seg_start is not None:
            segments.append((seg_start, size - 1))

        return segments

    col_segments = find_segments(col_density, w)
    row_segments = find_segments(row_density, h)

    # Infer grid
    n_cols = max(len(col_segments), 1)
    n_rows = max(len(row_segments), 1)

    # Validate: if segments are roughly equal width, it's a grid
    if n_cols > 1:
        widths = [s[1] - s[0] for s in col_segments]
        avg_w = np.mean(widths)
        if max(widths) > avg_w * 1.5:
            # Segments are too irregular, fall back to dividing evenly
            # Try common frame counts
            for try_cols in [8, 4, 2]:
                if w % try_cols == 0:
                    n_cols = try_cols
                    break
            else:
                n_cols = 4

    if n_rows > 1:
        heights = [s[1] - s[0] for s in row_segments]
        avg_h = np.mean(heights)
        if max(heights) > avg_h * 1.5:
            for try_rows in [4, 2]:
                if h % try_rows == 0:
                    n_rows = try_rows
                    break
            else:
                n_rows = 2

    return n_rows, n_cols


def extract_frames(arr: np.ndarray, n_rows: int, n_cols: int) -> list:
    """Extract individual frames from a grid-layout spritesheet."""
    h, w = arr.shape[:2]
    frame_w = w // n_cols
    frame_h = h // n_rows

    frames = []
    for row in range(n_rows):
        for col in range(n_cols):
            y0 = row * frame_h
            x0 = col * frame_w
            frame = arr[y0:y0 + frame_h, x0:x0 + frame_w].copy()
            frames.append(frame)

    return frames


def clean_stray_pixels(arr: np.ndarray, min_cluster_pixels: int = 20) -> np.ndarray:
    """Remove small isolated pixel clusters that are far from the main content.
    
    Uses row-gap analysis: if there's a gap of 20+ empty rows between content clusters,
    only keep the largest cluster. This handles stray pixels at the bottom of frames
    without needing full flood-fill connected component analysis.
    """
    arr = arr.copy()
    alpha = arr[:, :, 3]
    row_has_content = np.any(alpha > 30, axis=1)
    
    if not row_has_content.any():
        return arr
    
    # Find contiguous row-clusters of content
    clusters = []
    in_cluster = False
    for r in range(len(row_has_content)):
        if row_has_content[r] and not in_cluster:
            start = r
            in_cluster = True
        elif not row_has_content[r] and in_cluster:
            clusters.append((start, r - 1))
            in_cluster = False
    if in_cluster:
        clusters.append((start, len(row_has_content) - 1))
    
    if len(clusters) <= 1:
        return arr
    
    # Find the largest cluster by pixel count
    cluster_sizes = []
    for c_start, c_end in clusters:
        pixel_count = np.sum(alpha[c_start:c_end + 1] > 30)
        cluster_sizes.append(pixel_count)
    
    # Merge clusters that are close together (gap < 20 rows)
    merged = [clusters[0]]
    merged_sizes = [cluster_sizes[0]]
    for i in range(1, len(clusters)):
        gap = clusters[i][0] - merged[-1][1]
        if gap < 20:
            # Merge with previous
            merged[-1] = (merged[-1][0], clusters[i][1])
            merged_sizes[-1] += cluster_sizes[i]
        else:
            merged.append(clusters[i])
            merged_sizes.append(cluster_sizes[i])
    
    if len(merged) <= 1:
        return arr
    
    # Keep only the largest merged cluster
    largest_idx = np.argmax(merged_sizes)
    largest_start, largest_end = merged[largest_idx]
    
    # Clear pixels outside the largest cluster
    for c_start, c_end in merged:
        if (c_start, c_end) != (largest_start, largest_end):
            arr[c_start:c_end + 1, :, 3] = 0
    
    return arr


def crop_and_center_frame(frame_arr: np.ndarray, target_size: tuple,
                          padding: int = 4, anchor: str = "bottom") -> Image.Image:
    """Crop to content bounding box, then place in a target_size canvas with anchoring."""
    # Clean stray pixels first
    frame_arr = clean_stray_pixels(frame_arr)
    bbox = find_content_bbox(frame_arr)
    if bbox is None:
        # Empty frame — return transparent canvas
        return Image.new("RGBA", target_size, (0, 0, 0, 0))

    y_min, y_max, x_min, x_max = bbox
    content = Image.fromarray(frame_arr[y_min:y_max + 1, x_min:x_max + 1])

    target_w, target_h = target_size
    content_w, content_h = content.size

    # Scale content to fit within target minus padding, preserving aspect ratio
    available_w = target_w - padding * 2
    available_h = target_h - padding * 2

    scale = min(available_w / content_w, available_h / content_h, 1.0)
    if scale < 1.0:
        new_w = max(1, int(content_w * scale))
        new_h = max(1, int(content_h * scale))
        content = content.resize((new_w, new_h), Image.NEAREST)
        content_w, content_h = content.size

    # Create output canvas
    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))

    # Center horizontally
    x_offset = (target_w - content_w) // 2

    # Anchor vertically
    if anchor == "bottom":
        y_offset = target_h - content_h - padding
    elif anchor == "center":
        y_offset = (target_h - content_h) // 2
    else:  # top
        y_offset = padding

    canvas.paste(content, (x_offset, y_offset))
    return canvas


def process_spritesheet(input_path: str, output_dir: str,
                        num_frames: int = None,
                        n_cols: int = None,
                        n_rows: int = None,
                        prefix: str = None,
                        target_size: tuple = None,
                        padding: int = 4,
                        anchor: str = "bottom") -> list:
    """Main processing pipeline: load → detect → clean → split → center → save."""
    # Load image
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img, dtype=np.uint8)
    print(f"  Input: {input_path} ({img.size[0]}x{img.size[1]}, {img.mode})")

    # Detect and remove background
    bg_type = detect_background_type(arr)
    print(f"  Background type: {bg_type}")

    if bg_type == "green":
        arr = remove_green_chroma(arr)
    elif bg_type == "gray":
        arr = remove_gray_background(arr)
    # If transparent or unknown, use as-is

    # Detect or use specified grid layout
    if n_rows is None or n_cols is None:
        det_rows, det_cols = detect_grid_layout(np.array(img, dtype=np.uint8), bg_type)
        if n_rows is None:
            n_rows = det_rows
        if n_cols is None:
            n_cols = det_cols
    print(f"  Grid layout: {n_rows} rows × {n_cols} cols = {n_rows * n_cols} frames")

    # Extract frames
    frames = extract_frames(arr, n_rows, n_cols)

    # Limit to requested frame count
    total_frames = n_rows * n_cols
    if num_frames is not None and num_frames < total_frames:
        frames = frames[:num_frames]
    elif num_frames is not None and num_frames > total_frames:
        print(f"  Warning: requested {num_frames} frames but only {total_frames} available")

    # Filter out empty frames
    non_empty_frames = []
    for i, f in enumerate(frames):
        bbox = find_content_bbox(f)
        if bbox is not None:
            non_empty_frames.append((i, f))
        else:
            print(f"  Frame {i}: empty, skipping")
    frames = non_empty_frames

    if not frames:
        print("  ERROR: No frames with content found!")
        return []

    # Determine target size if not specified
    if target_size is None:
        # Find the maximum content size across all frames
        max_content_w = 0
        max_content_h = 0
        for _, f in frames:
            bbox = find_content_bbox(f)
            if bbox:
                y_min, y_max, x_min, x_max = bbox
                cw = x_max - x_min + 1
                ch = y_max - y_min + 1
                max_content_w = max(max_content_w, cw)
                max_content_h = max(max_content_h, ch)

        # Add padding and round up to nearest power of 2 or nice number
        raw_size = max(max_content_w, max_content_h) + padding * 2
        # Round to nearest multiple of 8 for clean pixel art
        target_dim = ((raw_size + 7) // 8) * 8
        target_size = (target_dim, target_dim)
        print(f"  Auto target size: {target_size[0]}x{target_size[1]} (max content: {max_content_w}x{max_content_h})")

    # Process and save each frame
    if prefix is None:
        basename = os.path.splitext(os.path.basename(input_path))[0]
        # Strip common suffixes
        for suffix in ["_sprite_frames", "_spritesheet", "_frames", "_sheet"]:
            if basename.endswith(suffix):
                basename = basename[: -len(suffix)]
                break
        # Strip numeric timestamps (e.g., _1777308692152)
        import re
        basename = re.sub(r"_\d{10,}$", "", basename)
        prefix = basename

    os.makedirs(output_dir, exist_ok=True)
    paths = []

    for idx, (orig_idx, frame_arr) in enumerate(frames):
        result = crop_and_center_frame(frame_arr, target_size, padding, anchor)
        out_path = os.path.join(output_dir, f"{prefix}_frame_{idx}.png")
        result.save(out_path, "PNG")
        paths.append(out_path)

        # Report content bounds for debugging
        bbox = find_content_bbox(frame_arr)
        if bbox:
            y_min, y_max, x_min, x_max = bbox
            print(f"  Frame {idx} (grid pos {orig_idx}): "
                  f"content {x_max - x_min + 1}x{y_max - y_min + 1} → "
                  f"{target_size[0]}x{target_size[1]} @ {out_path}")

    print(f"  Output: {len(paths)} frames, {target_size[0]}x{target_size[1]}px each")
    return paths


def main():
    parser = argparse.ArgumentParser(
        description="Scalable sprite processing pipeline for pixel art spritesheets."
    )
    parser.add_argument("input", help="Path to the input spritesheet image")
    parser.add_argument("output_dir", help="Directory for output frame PNGs")
    parser.add_argument("--frames", type=int, default=None,
                        help="Total number of frames to extract (default: auto)")
    parser.add_argument("--cols", type=int, default=None,
                        help="Number of columns in the grid (default: auto)")
    parser.add_argument("--rows", type=int, default=None,
                        help="Number of rows in the grid (default: auto)")
    parser.add_argument("--prefix", type=str, default=None,
                        help="Output filename prefix (default: from input name)")
    parser.add_argument("--size", type=str, default=None,
                        help="Output frame size WxH, e.g. 128x128 (default: auto)")
    parser.add_argument("--pad", type=int, default=4,
                        help="Padding around content in pixels (default: 4)")
    parser.add_argument("--anchor", type=str, default="bottom",
                        choices=["center", "bottom", "top"],
                        help="Vertical anchor position (default: bottom)")

    args = parser.parse_args()

    target_size = None
    if args.size:
        w, h = args.size.lower().split("x")
        target_size = (int(w), int(h))

    print(f"Sprite Processing Pipeline")
    print(f"{'=' * 50}")
    process_spritesheet(
        input_path=args.input,
        output_dir=args.output_dir,
        num_frames=args.frames,
        n_cols=args.cols,
        n_rows=args.rows,
        prefix=args.prefix,
        target_size=target_size,
        padding=args.pad,
        anchor=args.anchor,
    )
    print(f"{'=' * 50}")
    print("Done!")


if __name__ == "__main__":
    main()
