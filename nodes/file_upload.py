"""文档上传节点。"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

from ..utils.file_handler import (
    FILE_EXTENSIONS,
    ensure_base64_content,
    ensure_extension,
    ensure_file_exists,
    ensure_max_size,
    ensure_total_max_size,
    file_size_bytes,
    guess_mime_type,
)
from ..utils.type_defs import FileType


FILE_MODE_FILES_API = "本地文件路径（推荐）"
FILE_MODE_BASE64 = "Base64 编码上传"
FILE_MAX_FILES_API_BYTES = 512 * 1024 * 1024
FILE_MAX_BASE64_BYTES = 50 * 1024 * 1024
REQUEST_MAX_BYTES = 64 * 1024 * 1024


class DoubaoFileUpload:
    """支持 Files API 与 Base64 两种文档输入。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("FILE",)
    RETURN_NAMES = ("file",)
    FUNCTION = "build_file"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "传入方式": (
                    [FILE_MODE_FILES_API, FILE_MODE_BASE64],
                    {"default": FILE_MODE_FILES_API},
                ),
                "文件路径": ("STRING", {"default": "", "multiline": False}),
                "文件Base64内容": ("STRING", {"default": "", "multiline": True}),
                "Base64文件名": ("STRING", {"default": "document.pdf", "multiline": False}),
            }
        }

    def build_file(
        self,
        传入方式: str,  # noqa: N803
        文件路径: str,  # noqa: N803
        文件Base64内容: str,  # noqa: N803
        Base64文件名: str,  # noqa: N803,N802
    ) -> Tuple[FileType]:
        if 传入方式 == FILE_MODE_FILES_API:
            item = self._build_files_api_item(文件路径)
        else:
            item = self._build_base64_item(文件Base64内容, Base64文件名)
            ensure_total_max_size(item["file_size"], REQUEST_MAX_BYTES, "文档请求体")
        return ({"mode": 传入方式, "item": item},)

    def _build_files_api_item(self, path_text: str) -> dict:
        if not path_text.strip():
            raise ValueError("请填写“文件路径”。")
        file_path = ensure_file_exists(path_text)
        ensure_extension(file_path, FILE_EXTENSIONS, "文档")
        size = file_size_bytes(file_path)
        ensure_max_size(size, FILE_MAX_FILES_API_BYTES, "文档")
        return {
            "mode": FILE_MODE_FILES_API,
            "path": str(file_path),
            "mime_type": guess_mime_type(file_path, "application/octet-stream"),
            "file_name": file_path.name,
            "file_size": size,
        }

    def _build_base64_item(self, raw_base64: str, file_name: str) -> dict:
        if not raw_base64.strip():
            raise ValueError("请填写“文件Base64内容”。")
        effective_name = file_name.strip() or "document.pdf"
        suffix = Path(effective_name).suffix.lower()
        if suffix not in FILE_EXTENSIONS:
            raise ValueError("Base64文件名扩展名不支持，请使用需求文档中的受支持格式。")
        default_mime = guess_mime_type(Path(effective_name), "application/octet-stream")
        data_uri, size = ensure_base64_content(
            raw_base64,
            max_size_bytes=FILE_MAX_BASE64_BYTES,
            default_mime=default_mime,
            label="文档",
        )
        return {
            "mode": FILE_MODE_BASE64,
            "data_uri": data_uri,
            "mime_type": _extract_mime_from_data_uri(data_uri),
            "file_name": effective_name,
            "file_size": size,
        }


def _extract_mime_from_data_uri(data_uri: str) -> str:
    header = data_uri.split(",", 1)[0]
    return header[5:].split(";", 1)[0]
