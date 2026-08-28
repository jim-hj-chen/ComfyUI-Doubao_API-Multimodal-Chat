"""视频上传节点。"""

from __future__ import annotations

from typing import Dict, Tuple

from ..utils.file_handler import (
    VIDEO_EXTENSIONS,
    ensure_base64_content,
    ensure_extension,
    ensure_file_exists,
    ensure_max_size,
    ensure_total_max_size,
    file_size_bytes,
    guess_mime_type,
)
from ..utils.type_defs import VideoType


VIDEO_MODE_FILES_API = "Files API 上传（推荐）"
VIDEO_MODE_BASE64 = "Base64 编码上传"
VIDEO_MAX_FILES_API_BYTES = 512 * 1024 * 1024
VIDEO_MAX_BASE64_BYTES = 50 * 1024 * 1024
REQUEST_MAX_BYTES = 64 * 1024 * 1024


class DoubaoVideoUpload:
    """支持 Files API 与 Base64 两种视频输入方式。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("VIDEO",)
    RETURN_NAMES = ("video",)
    FUNCTION = "build_video"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "传入方式": (
                    [VIDEO_MODE_FILES_API, VIDEO_MODE_BASE64],
                    {"default": VIDEO_MODE_FILES_API},
                ),
                "视频文件路径": ("STRING", {"default": "", "multiline": False}),
                "视频Base64内容": ("STRING", {"default": "", "multiline": True}),
                "fps": ("FLOAT", {"default": 1.0, "min": 0.2, "max": 5.0, "step": 0.1}),
            }
        }

    def build_video(
        self,
        传入方式: str,  # noqa: N803
        视频文件路径: str,  # noqa: N803
        视频Base64内容: str,  # noqa: N803
        fps: float,
    ) -> Tuple[VideoType]:
        if 传入方式 == VIDEO_MODE_FILES_API:
            item = self._build_files_api_video(视频文件路径, fps)
        else:
            item = self._build_base64_video(视频Base64内容, fps)
        ensure_total_max_size(item["file_size"], REQUEST_MAX_BYTES, "视频请求体")
        return ({"mode": 传入方式, "item": item},)

    def _build_files_api_video(self, path_text: str, fps: float) -> dict:
        if not path_text.strip():
            raise ValueError("请填写“视频文件路径”。")
        file_path = ensure_file_exists(path_text)
        ensure_extension(file_path, VIDEO_EXTENSIONS, "视频")
        size = file_size_bytes(file_path)
        ensure_max_size(size, VIDEO_MAX_FILES_API_BYTES, "视频")
        return {
            "mode": VIDEO_MODE_FILES_API,
            "path": str(file_path),
            "mime_type": guess_mime_type(file_path, "video/mp4"),
            "file_name": file_path.name,
            "file_size": size,
            "fps": float(fps),
        }

    def _build_base64_video(self, raw_base64: str, fps: float) -> dict:
        if not raw_base64.strip():
            raise ValueError("请填写“视频Base64内容”。")
        data_uri, size = ensure_base64_content(
            raw_base64,
            max_size_bytes=VIDEO_MAX_BASE64_BYTES,
            default_mime="video/mp4",
            label="视频",
        )
        return {
            "mode": VIDEO_MODE_BASE64,
            "data_uri": data_uri,
            "mime_type": _extract_mime_from_data_uri(data_uri),
            "file_name": "video.mp4",
            "file_size": size,
            "fps": float(fps),
        }


def _extract_mime_from_data_uri(data_uri: str) -> str:
    header = data_uri.split(",", 1)[0]
    return header[5:].split(";", 1)[0]
