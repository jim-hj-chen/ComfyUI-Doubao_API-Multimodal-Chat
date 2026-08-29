"""视频上传节点。"""

from __future__ import annotations

from typing import Dict, Tuple

from ..utils.file_handler import (
    VIDEO_EXTENSIONS,
    ensure_extension,
    ensure_file_exists,
    ensure_max_size,
    file_size_bytes,
    guess_mime_type,
)
from ..utils.type_defs import VideoType


VIDEO_MAX_FILES_API_BYTES = 512 * 1024 * 1024
VIDEO_MAX_TOS_BYTES = 2 * 1024 * 1024 * 1024

VIDEO_MODE_LOCAL = "本地上传（≤512MB）"
VIDEO_MODE_TOS_BUCKET = "TOS 对象存储上传（≤2GB）"
VIDEO_MODE_TOS_URL = "已有 TOS 视频地址"


class DoubaoVideoUpload:
    """通过本地路径或 TOS 参数构建视频输入。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("VIDEO",)
    RETURN_NAMES = ("video",)
    FUNCTION = "build_video"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "输入方式": (
                    [VIDEO_MODE_LOCAL, VIDEO_MODE_TOS_BUCKET, VIDEO_MODE_TOS_URL],
                    {"default": VIDEO_MODE_LOCAL},
                ),
                "视频文件路径": ("STRING", {"default": "", "multiline": False}),
                "TOS视频URL": (
                    "STRING",
                    {
                        "default": "",
                        "multiline": False,
                        "placeholder": "tos://bucket/object.mp4",
                    },
                ),
                "TOS_Bucket": (
                    "STRING",
                    {
                        "default": "",
                        "multiline": False,
                        "placeholder": "火山引擎 TOS 桶名",
                    },
                ),
                "TOS_Prefix": (
                    "STRING",
                    {
                        "default": "",
                        "multiline": False,
                        "placeholder": "可选对象前缀",
                    },
                ),
                "fps": ("FLOAT", {"default": 1.0, "min": 0.2, "max": 5.0, "step": 0.1}),
            }
        }

    def build_video(
        self,
        输入方式: str = VIDEO_MODE_LOCAL,  # noqa: N803
        视频文件路径: str = "",  # noqa: N803
        TOS视频URL: str = "",  # noqa: N803
        TOS_Bucket: str = "",  # noqa: N803,N802
        TOS_Prefix: str = "",  # noqa: N803,N802
        fps: float = 1.0,
    ) -> Tuple[VideoType]:
        item = self._build_video_item(
            mode=输入方式,
            path_text=视频文件路径,
            tos_video_url=TOS视频URL,
            tos_bucket=TOS_Bucket,
            tos_prefix=TOS_Prefix,
            fps=fps,
        )
        return ({"item": item},)

    def _build_video_item(
        self,
        mode: str,
        path_text: str,
        tos_video_url: str,
        tos_bucket: str,
        tos_prefix: str,
        fps: float,
    ) -> dict:
        mode_text = (mode or VIDEO_MODE_LOCAL).strip()
        if mode_text == VIDEO_MODE_TOS_URL:
            return self._build_tos_url_item(tos_video_url, fps)
        if mode_text == VIDEO_MODE_TOS_BUCKET:
            return self._build_local_file_item(
                path_text=path_text,
                tos_bucket=tos_bucket,
                tos_prefix=tos_prefix,
                fps=fps,
                require_bucket=True,
                max_bytes=VIDEO_MAX_TOS_BYTES,
            )
        return self._build_local_file_item(
            path_text=path_text,
            tos_bucket="",
            tos_prefix="",
            fps=fps,
            require_bucket=False,
            max_bytes=VIDEO_MAX_FILES_API_BYTES,
        )

    def _build_tos_url_item(self, tos_video_url: str, fps: float) -> dict:
        url = tos_video_url.strip()
        if not url:
            raise ValueError("请填写“TOS 视频地址”，须以 tos:// 开头。")
        if not url.lower().startswith("tos://"):
            raise ValueError("TOS 视频地址必须以 tos:// 开头。")
        return {
            "source_url": url,
            "mime_type": "video/mp4",
            "file_name": url.rsplit("/", 1)[-1] or "video.mp4",
            "file_size": 0,
            "fps": float(fps),
        }

    def _build_local_file_item(
        self,
        path_text: str,
        tos_bucket: str,
        tos_prefix: str,
        fps: float,
        require_bucket: bool,
        max_bytes: int,
    ) -> dict:
        if not path_text.strip():
            raise ValueError("请选择或填写视频文件。")
        if require_bucket and not tos_bucket.strip():
            raise ValueError("TOS 对象存储上传需要填写对象存储 Bucket（火山引擎 TOS 桶名）。")

        file_path = ensure_file_exists(path_text)
        ensure_extension(file_path, VIDEO_EXTENSIONS, "视频")
        size = file_size_bytes(file_path)
        ensure_max_size(size, max_bytes, "视频")
        item = {
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
