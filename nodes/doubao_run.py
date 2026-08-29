"""Doubao Run 核心执行节点。"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from ..utils.api_client import DoubaoApiClient
from ..utils.type_defs import ConfigType, FileType, ImageListType, VideoType


LOGGER = logging.getLogger("comfyui_doubao.doubao_run")


class DoubaoRun:
    """整合文本、图片、视频、文档并调用 Doubao Responses API。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("output", "usage")
    FUNCTION = "run"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "config": ("CONFIG",),
                "stream": ("BOOLEAN", {"default": False}),
                "system_prompt": ("STRING", {"default": "", "multiline": True}),
            },
            "optional": {
                "text": ("STRING",),
                "images": ("IMAGE_LIST",),
                "video": ("VIDEO",),
                "file": ("FILE",),
            },
        }

    def run(
        self,
        config: ConfigType,
        stream: bool = False,
        system_prompt: str = "",
        text: Optional[str] = None,
        images: Optional[ImageListType] = None,
        video: Optional[VideoType] = None,
        file: Optional[FileType] = None,
    ) -> Tuple[str, str]:
        self._validate_config(config)
        client = DoubaoApiClient(
            base_url=config["base_url"],
            api_key=config["api_key"],
            timeout_seconds=60,
            max_retries=3,
        )

        input_messages: List[Dict[str, Any]] = []
        if (system_prompt or "").strip():
            input_messages.append(
                {
                    "role": "system",
                    "content": [{"type": "input_text", "text": system_prompt.strip()}],
                }
            )

        user_content: List[Dict[str, Any]] = []
        if images:
            user_content.extend(self._build_image_contents(images, client))
        if video:
            user_content.extend(self._build_video_contents(video, client))
        if file:
            user_content.extend(self._build_file_contents(file, client))
        if (text or "").strip():
            user_content.append({"type": "input_text", "text": (text or "").strip()})

        if not user_content:
            raise ValueError("请至少提供一种输入：文本、图片、视频或文档。")

        input_messages.append({"role": "user", "content": user_content})
        payload = {
            "model": config["model_id"],
            "input": input_messages,
            "max_output_tokens": int(config["max_tokens"]),
            "temperature": float(config["temperature"]),
            "top_p": float(config["top_p"]),
        }

        LOGGER.info("请求模型: %s, stream=%s", config["model_id"], stream)
        output_text, usage = client.create_response(payload=payload, stream=bool(stream))
        usage_text = json.dumps(usage or {}, ensure_ascii=False)
        return output_text or "", usage_text

    def _build_image_contents(
        self,
        images: ImageListType,
        client: DoubaoApiClient,
    ) -> List[Dict[str, Any]]:
        contents: List[Dict[str, Any]] = []
        for item in images.get("items", []):
            uploaded = client.upload_file(item["path"])
            contents.append({"type": "input_image", "file_id": uploaded["file_id"]})
        return contents

    def _build_video_contents(
        self,
        video: VideoType,
        client: DoubaoApiClient,
    ) -> List[Dict[str, Any]]:
        item = video.get("item", {})
        uploaded = client.upload_file(**self._build_video_upload_kwargs(item))
        client.wait_for_file_ready(uploaded["file_id"])
        return [{"type": "input_video", "file_id": uploaded["file_id"]}]

    def _build_video_upload_kwargs(self, item: Dict[str, Any]) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {
            "preprocess_configs": {"video": {"fps": float(item.get("fps", 1.0))}},
        }
        if item.get("source_url"):
            kwargs["source_url"] = item["source_url"]
        else:
            kwargs["file_path"] = item["path"]

        tos: Dict[str, str] = {}
        if item.get("tos_bucket"):
            tos["bucket"] = item["tos_bucket"]
        if item.get("tos_prefix"):
            tos["prefix"] = item["tos_prefix"]
        if tos:
            kwargs["tos"] = tos
        return kwargs

    def _build_file_contents(
        self,
        file_data: FileType,
        client: DoubaoApiClient,
    ) -> List[Dict[str, Any]]:
        item = file_data.get("item", {})
        uploaded = client.upload_file(item["path"])
        client.wait_for_file_ready(uploaded["file_id"])
        return [{"type": "input_file", "file_id": uploaded["file_id"]}]

    def _validate_config(self, config: ConfigType) -> None:
        required_keys = ["base_url", "api_key", "model_id", "max_tokens", "temperature", "top_p"]
        for key in required_keys:
            if key not in config:
                raise ValueError(f"配置缺少必要字段：{key}")
        if not config["api_key"].strip():
            raise ValueError("API Key 不能为空。")
