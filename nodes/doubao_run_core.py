"""豆包运行核心：汇总会话输入并调用 Doubao Responses API。"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from ..utils.api_client import DoubaoApiClient, DoubaoApiError
from ..utils.type_defs import ConfigType, FileType, ImageListType, VideoType


LOGGER = logging.getLogger("comfyui_doubao.doubao_run_core")
DEFAULT_TIMEOUT_SECONDS = 180


class DoubaoRunCore:
    """工作流运行核心：汇聚配置、提示词与多模态输入并调用 Doubao Responses API。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("output", "usage")
    FUNCTION = "run"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "config": ("CONFIG",),
            },
            "optional": {
                "system_prompt": ("STRING", {"forceInput": True, "default": "", "multiline": True}),
                "user_prompt": ("STRING", {"forceInput": True, "default": "", "multiline": True}),
                "images": ("IMAGE_LIST",),
                "video": ("VIDEO",),
                "file": ("FILE",),
            },
        }

    def run(
        self,
        config: ConfigType,
        system_prompt: str = "",
        user_prompt: Optional[str] = None,
        images: Optional[ImageListType] = None,
        video: Optional[VideoType] = None,
        file: Optional[FileType] = None,
    ) -> Tuple[str, str]:
        self._validate_config(config)
        client = DoubaoApiClient(
            base_url=config["base_url"],
            api_key=config["api_key"],
            timeout_seconds=int(config.get("timeout_seconds", DEFAULT_TIMEOUT_SECONDS)),
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
        user_text = user_prompt or ""
        if user_text.strip():
            user_content.append({"type": "input_text", "text": user_text.strip()})

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

        LOGGER.info("请求模型: %s, stream=%s", config["model_id"], False)
        output_text, usage = client.create_response(payload=payload, stream=False)
        usage_text = json.dumps(usage or {}, ensure_ascii=False)
        return output_text or "", usage_text

    def _build_image_contents(
        self,
        images: ImageListType,
        client: DoubaoApiClient,
    ) -> List[Dict[str, Any]]:
        contents: List[Dict[str, Any]] = []
        for item in images.get("items", []):
            try:
                uploaded = client.upload_file(item["path"])
            except DoubaoApiError as error:
                raise ValueError(f"上传到 Doubao Files API 失败（图片）：{error}") from error
            contents.append({"type": "input_image", "file_id": uploaded["file_id"]})
        return contents

    def _build_video_contents(
        self,
        video: VideoType,
        client: DoubaoApiClient,
    ) -> List[Dict[str, Any]]:
        item = video.get("item", {})
        try:
            uploaded = client.upload_file(**self._build_video_upload_kwargs(item))
        except DoubaoApiError as error:
            raise ValueError(f"上传到 Doubao Files API 失败（视频）：{error}") from error
        try:
            client.wait_for_file_ready(uploaded["file_id"])
        except DoubaoApiError as error:
            raise ValueError(f"等待 Doubao 文件处理失败（视频）：{error}") from error
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
        try:
            uploaded = client.upload_file(item["path"])
        except DoubaoApiError as error:
            raise ValueError(f"上传到 Doubao Files API 失败（文档）：{error}") from error
        try:
            client.wait_for_file_ready(uploaded["file_id"])
        except DoubaoApiError as error:
            raise ValueError(f"等待 Doubao 文件处理失败（文档）：{error}") from error
        return [{"type": "input_file", "file_id": uploaded["file_id"]}]

    def _validate_config(self, config: ConfigType) -> None:
        required_keys = ["base_url", "api_key", "model_id", "max_tokens", "temperature", "top_p"]
        for key in required_keys:
            if key not in config:
                raise ValueError(f"配置缺少必要字段：{key}")
        if not config["api_key"].strip():
            raise ValueError("API Key 不能为空。")
        timeout_seconds = int(config.get("timeout_seconds", DEFAULT_TIMEOUT_SECONDS))
        if timeout_seconds < 1:
            raise ValueError("timeout_seconds 必须为正整数。")
