"""文档上传节点。"""

from __future__ import annotations

from typing import Dict, Tuple

from ..utils.file_handler import (
    FILE_EXTENSIONS,
    ensure_extension,
    ensure_file_exists,
    ensure_max_size,
    file_size_bytes,
    guess_mime_type,
)
from ..utils.type_defs import FileType


FILE_MAX_FILES_API_BYTES = 512 * 1024 * 1024


class DoubaoFileUpload:
    """通过本地路径构建文档输入。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("FILE",)
    RETURN_NAMES = ("file",)
    FUNCTION = "build_file"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "文件路径": ("STRING", {"default": "", "multiline": False}),
            }
        }

    def build_file(
        self,
        文件路径: str,  # noqa: N803
    ) -> Tuple[FileType]:
        item = self._build_files_api_item(文件路径)
        return ({"item": item},)

    def _build_files_api_item(self, path_text: str) -> dict:
        if not path_text.strip():
            raise ValueError("请填写“文件路径”。")
        file_path = ensure_file_exists(path_text)
        ensure_extension(file_path, FILE_EXTENSIONS, "文档")
        size = file_size_bytes(file_path)
        ensure_max_size(size, FILE_MAX_FILES_API_BYTES, "文档")
        return {
            "path": str(file_path),
            "mime_type": guess_mime_type(file_path, "application/octet-stream"),
            "file_name": file_path.name,
            "file_size": size,
        }
