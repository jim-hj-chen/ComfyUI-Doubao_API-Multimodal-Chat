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


VIDEO_MODE_BASE64 = "Base64 编码上传"
VIDEO_MODE_PATH = "本地文件路径（推荐）"
VIDEO_MAX_FILES_API_BYTES = 512 * 1024 * 1024
VIDEO_MAX_TOS_BYTES = 2 * 1024 * 1024 * 1024
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
                    [VIDEO_MODE_PATH, VIDEO_MODE_BASE64],
                    {"default": VIDEO_MODE_PATH},
                ),
                "视频文件路径": ("STRING", {"default": "", "multiline": False}),
                "视频Base64内容": ("STRING", {"default": "", "multiline": True}),
                "TOS视频URL": ("STRING", {"default": "", "multiline": False}),
                "TOS_Bucket": ("STRING", {"default": "", "multiline": False}),
                "TOS_Prefix": ("STRING", {"default": "", "multiline": False}),
                "fps": ("FLOAT", {"default": 1.0, "min": 0.2, "max": 5.0, "step": 0.1}),
            }
        }

    def build_video(
        self,
        传入方式: str,  # noqa: N803
        视频文件路径: str,  # noqa: N803
        视频Base64内容: str,  # noqa: N803
        TOS视频URL: str,  # noqa: N803
        TOS_Bucket: str,  # noqa: N803,N802
        TOS_Prefix: str,  # noqa: N803,N802
        fps: float,
    ) -> Tuple[VideoType]:
        if 传入方式 == VIDEO_MODE_PATH:
            item = self._build_path_mode_video(
                path_text=视频文件路径,
                tos_video_url=TOS视频URL,
                tos_bucket=TOS_Bucket,
                tos_prefix=TOS_Prefix,
                fps=fps,
            )
        else:
            item = self._build_base64_video(视频Base64内容, fps)
            ensure_total_max_size(item["file_size"], REQUEST_MAX_BYTES, "视频请求体")
        return ({"mode": 传入方式, "item": item},)

    def _build_path_mode_video(
        self,
        path_text: str,
        tos_video_url: str,
        tos_bucket: str,
        tos_prefix: str,
        fps: float,
    ) -> dict:
        if tos_video_url.strip():
            if not tos_video_url.strip().lower().startswith("tos://"):
                raise ValueError("TOS视频URL 必须以 tos:// 开头。")
            item = {
                "mode": VIDEO_MODE_PATH,
                "source_url": tos_video_url.strip(),
                "mime_type": "video/mp4",
                "file_name": tos_video_url.strip().rsplit("/", 1)[-1] or "video.mp4",
                "file_size": 0,
                "fps": float(fps),
            }
            if tos_bucket.strip():
                item["tos_bucket"] = tos_bucket.strip()
            if tos_prefix.strip():
                item["tos_prefix"] = tos_prefix.strip()
            return item

        if not path_text.strip():
            raise ValueError("请填写“视频文件路径”。")
        file_path = ensure_file_exists(path_text)
        ensure_extension(file_path, VIDEO_EXTENSIONS, "视频")
        size = file_size_bytes(file_path)
        path_limit = VIDEO_MAX_TOS_BYTES if (tos_bucket.strip() or tos_prefix.strip()) else VIDEO_MAX_FILES_API_BYTES
        ensure_max_size(size, path_limit, "视频")
        item = {
            "mode": VIDEO_MODE_PATH,
            "path": str(file_path),
            "mime_type": guess_mime_type(file_path, "video/mp4"),
            "file_name": file_path.name,
            "file_size": size,
            "fps": float(fps),
        }
        if tos_bucket.strip():
            item["tos_bucket"] = tos_bucket.strip()
        if tos_prefix.strip():
            item["tos_prefix"] = tos_prefix.strip()
        return item

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
