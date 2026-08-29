"""图片上传节点。"""

from __future__ import annotations

from typing import Dict, List, Tuple

from ..utils.file_handler import (
    IMAGE_EXTENSIONS,
    ensure_extension,
    ensure_file_exists,
    ensure_max_size,
    file_size_bytes,
    guess_mime_type,
    parse_multiline_lines,
)
from ..utils.type_defs import ImageListType, MediaItem


IMAGE_MAX_COUNT = 9
IMAGE_MAX_PATH_BYTES = 512 * 1024 * 1024


class DoubaoImageUpload:
    """通过本地路径构建图片列表。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("IMAGE_LIST",)
    RETURN_NAMES = ("images",)
    FUNCTION = "build_images"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "图片路径列表": ("STRING", {"default": "", "multiline": True}),
            }
        }

    def build_images(
        self,
        图片路径列表: str,  # noqa: N803
    ) -> Tuple[ImageListType]:
        items = self._build_from_paths(图片路径列表)

        if len(items) > IMAGE_MAX_COUNT:
            raise ValueError(f"图片数量超限：当前 {len(items)} 张，最多允许 {IMAGE_MAX_COUNT} 张。")

        total_bytes = sum(item["file_size"] for item in items)
        return ({"items": items, "total_bytes": total_bytes},)

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
                    "path": str(file_path),
                    "mime_type": guess_mime_type(file_path, "image/png"),
                    "file_name": file_path.name,
                    "file_size": size,
                }
            )
        return items
