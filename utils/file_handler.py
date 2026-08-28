"""文件处理、校验、Base64/DataURI 工具。"""

from __future__ import annotations

import base64
import binascii
import mimetypes
import os
from pathlib import Path
from typing import Iterable, List, Optional, Tuple


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


def ensure_total_max_size(total_bytes: int, max_size_bytes: int, label: str) -> None:
    """校验总大小上限。"""
    if total_bytes > max_size_bytes:
        raise ValueError(
            f"{label}总大小超限：{format_bytes(total_bytes)}，最大允许 {format_bytes(max_size_bytes)}"
        )


def encode_file_to_base64(path: Path) -> str:
    """读取文件并编码为 Base64 字符串。"""
    with path.open("rb") as file_obj:
        return base64.b64encode(file_obj.read()).decode("utf-8")


def guess_mime_type(path: Optional[Path], fallback: str = "application/octet-stream") -> str:
    """根据路径猜测 MIME 类型。"""
    if path is None:
        return fallback
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or fallback


def build_data_uri(mime_type: str, base64_data: str) -> str:
    """按标准格式拼接 Data URI。"""
    return f"data:{mime_type};base64,{base64_data}"


def decode_data_uri(data_uri_or_base64: str) -> Tuple[Optional[str], str]:
    """
    将输入拆解为 (mime_type, base64_data)。

    支持两种输入：
    1. 完整 data URI：data:image/png;base64,xxxx
    2. 纯 base64 字符串
    """
    raw = data_uri_or_base64.strip()
    if raw.lower().startswith("data:") and ";base64," in raw:
        header, data = raw.split(",", 1)
        mime_type = header[5:].split(";", 1)[0]
        return mime_type, data.strip()
    return None, raw


def base64_size_bytes(base64_data: str) -> int:
    """计算 Base64 内容解码后的字节数。"""
    try:
        decoded = base64.b64decode(base64_data, validate=True)
        return len(decoded)
    except binascii.Error as error:
        raise ValueError("Base64 编码内容不合法，请检查输入。") from error


def ensure_base64_content(
    data_uri_or_base64: str,
    max_size_bytes: int,
    default_mime: str,
    label: str,
) -> Tuple[str, int]:
    """校验 Base64 内容并返回标准 data URI 与字节大小。"""
    mime_type, base64_data = decode_data_uri(data_uri_or_base64)
    actual_mime = mime_type or default_mime
    size = base64_size_bytes(base64_data)
    ensure_max_size(size, max_size_bytes, label)
    return build_data_uri(actual_mime, base64_data), size


def format_bytes(size_bytes: int) -> str:
    """将字节转为易读字符串。"""
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(size_bytes)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.2f} {unit}"
        value /= 1024
    return f"{size_bytes} B"
