"""文件处理、校验与 MIME 工具。"""

from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Iterable, List, Optional


IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".bmp",
}
VIDEO_EXTENSIONS = {
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
}
FILE_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".csv",
    ".md",
}


def parse_multiline_lines(raw_text: str) -> List[str]:
    """将多行输入按行拆分并去空。"""
    if not raw_text:
        return []
    return [line.strip() for line in raw_text.splitlines() if line.strip()]


def ensure_file_exists(path_text: str) -> Path:
    """校验文件路径存在并返回 Path。"""
    path = Path(path_text).expanduser()
    if not path.exists():
        raise ValueError(f"文件不存在：{path}")
    if not path.is_file():
        raise ValueError(f"不是有效文件：{path}")
    return path


def file_size_bytes(path: Path) -> int:
    """读取文件大小（字节）。"""
    return path.stat().st_size


def ensure_extension(path: Path, allowed_extensions: Iterable[str], label: str) -> None:
    """校验文件扩展名。"""
    ext = path.suffix.lower()
    if ext not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions))
        raise ValueError(f"{label}格式不支持：{ext}，支持格式：{allowed}")


def ensure_max_size(size_bytes: int, max_size_bytes: int, label: str) -> None:
    """校验文件大小上限。"""
    if size_bytes > max_size_bytes:
        raise ValueError(
            f"{label}大小超限：{format_bytes(size_bytes)}，最大允许 {format_bytes(max_size_bytes)}"
        )


def guess_mime_type(path: Optional[Path], fallback: str = "application/octet-stream") -> str:
    """根据路径猜测 MIME 类型。"""
    if path is None:
        return fallback
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or fallback


def format_bytes(size_bytes: int) -> str:
    """将字节转为易读字符串。"""
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(size_bytes)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.2f} {unit}"
        value /= 1024
    return f"{size_bytes} B"
