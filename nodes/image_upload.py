"""图片上传节点。"""

from __future__ import annotations

from typing import Dict, List, Tuple

from ..utils.file_handler import (
    IMAGE_EXTENSIONS,
    ensure_base64_content,
    ensure_extension,
    ensure_file_exists,
    ensure_max_size,
    ensure_total_max_size,
    file_size_bytes,
    guess_mime_type,
    parse_multiline_lines,
)
from ..utils.type_defs import ImageListType, MediaItem


IMAGE_MODE_PATH = "本地文件路径（推荐）"
IMAGE_MODE_BASE64 = "Base64 编码上传"
IMAGE_MAX_PATH_BYTES = 512 * 1024 * 1024
IMAGE_MAX_BASE64_SINGLE_BYTES = 10 * 1024 * 1024
REQUEST_MAX_BYTES = 64 * 1024 * 1024


class DoubaoImageUpload:
    """支持本地路径与 Base64 两种图片输入方式。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("IMAGE_LIST",)
    RETURN_NAMES = ("images",)
    FUNCTION = "build_images"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "传入方式": (
                    [IMAGE_MODE_PATH, IMAGE_MODE_BASE64],
                    {"default": IMAGE_MODE_PATH},
                ),
                "图片路径列表": ("STRING", {"default": "", "multiline": True}),
                "图片Base64列表": ("STRING", {"default": "", "multiline": True}),
            }
        }

    def build_images(
        self,
        传入方式: str,  # noqa: N803
        图片路径列表: str,  # noqa: N803
        图片Base64列表: str,  # noqa: N803
    ) -> Tuple[ImageListType]:
        if 传入方式 == IMAGE_MODE_PATH:
            items = self._build_from_paths(图片路径列表)
        else:
            items = self._build_from_base64_lines(图片Base64列表)

        total_bytes = sum(item["file_size"] for item in items)
        ensure_total_max_size(total_bytes, REQUEST_MAX_BYTES, "图片请求体")
        return ({"mode": 传入方式, "items": items, "total_bytes": total_bytes},)

    def _build_from_paths(self, raw_paths: str) -> List[MediaItem]:
        lines = parse_multiline_lines(raw_paths)
        if not lines:
            raise ValueError("请在“图片路径列表”中至少填写一条图片绝对路径。")
        items: List[MediaItem] = []
        for path_text in lines:
            file_path = ensure_file_exists(path_text)
            ensure_extension(file_path, IMAGE_EXTENSIONS, "图片")
            size = file_size_bytes(file_path)
            ensure_max_size(size, IMAGE_MAX_PATH_BYTES, "图片")
            items.append(
                {
                    "mode": IMAGE_MODE_PATH,
                    "path": str(file_path),
                    "mime_type": guess_mime_type(file_path, "image/png"),
                    "file_name": file_path.name,
                    "file_size": size,
                }
            )
        return items

    def _build_from_base64_lines(self, raw_base64_lines: str) -> List[MediaItem]:
        lines = parse_multiline_lines(raw_base64_lines)
        if not lines:
            raise ValueError("请在“图片Base64列表”中至少输入一行 Data URI 或 Base64 内容。")
        items: List[MediaItem] = []
        for index, line in enumerate(lines, start=1):
            data_uri, size = ensure_base64_content(
                line,
                max_size_bytes=IMAGE_MAX_BASE64_SINGLE_BYTES,
                default_mime="image/png",
                label=f"第 {index} 张图片",
            )
            items.append(
                {
                    "mode": IMAGE_MODE_BASE64,
                    "data_uri": data_uri,
                    "mime_type": _extract_mime_from_data_uri(data_uri),
                    "file_name": f"image_{index}.png",
                    "file_size": size,
                }
            )
        return items


def _extract_mime_from_data_uri(data_uri: str) -> str:
    header = data_uri.split(",", 1)[0]
    return header[5:].split(";", 1)[0]
