"""插件内部类型定义。"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, TypedDict

ModelPreset = Literal[
    "doubao-seed-evolving",
    "doubao-seed-2-1-pro",
    "doubao-seed-2-1-turbo",
    "doubao-seed-2-0-lite",
    "doubao-seed-2-0-mini",
    "自定义",
]

MODEL_PRESETS: List[ModelPreset] = [
    "doubao-seed-evolving",
    "doubao-seed-2-1-pro",
    "doubao-seed-2-1-turbo",
    "doubao-seed-2-0-lite",
    "doubao-seed-2-0-mini",
    "自定义",
]

MODEL_PRESET_TO_ID: Dict[ModelPreset, str] = {
    "doubao-seed-evolving": "doubao-seed-evolving",
    "doubao-seed-2-1-pro": "doubao-seed-2-1-pro-260628",
    "doubao-seed-2-1-turbo": "doubao-seed-2-1-turbo-260628",
    "doubao-seed-2-0-lite": "doubao-seed-2-0-lite-260428",
    "doubao-seed-2-0-mini": "doubao-seed-2-0-mini-260428",
    "自定义": "",
}


class ConfigType(TypedDict):
    """模型配置对象。"""

    base_url: str
    api_key: str
    model_id: str
    max_tokens: int
    temperature: float
    top_p: float
    timeout_seconds: int


class MediaItem(TypedDict, total=False):
    """图片/视频/文件统一媒体条目。"""

    path: str
    mime_type: str
    file_name: str
    file_size: int
    fps: float
    source_url: str
    tos_bucket: str
    tos_prefix: str


class ImageListType(TypedDict):
    """图片列表结构。"""

    items: List[MediaItem]
    total_bytes: int


class VideoType(TypedDict):
    """视频结构。"""

    item: MediaItem


class FileType(TypedDict):
    """文档结构。"""

    item: MediaItem


class StreamResult(TypedDict):
    """流式响应聚合结果。"""

    text: str
    usage: Dict[str, Any]
