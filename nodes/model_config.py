"""模型配置节点。"""

from __future__ import annotations

from typing import Dict, Tuple

from ..utils.type_defs import MODEL_PRESET_TO_ID, MODEL_PRESETS


class DoubaoModelConfig:
    """集中管理 API 与模型参数。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("CONFIG",)
    RETURN_NAMES = ("config",)
    FUNCTION = "build"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "base_url": (
                    "STRING",
                    {"default": "https://ark.cn-beijing.volces.com/api/v3"},
                ),
                "api_key": ("STRING", {"default": "", "multiline": False, "password": True}),
                "模型预设": (MODEL_PRESETS, {"default": "doubao-seed-evolving"}),
                "model_id": ("STRING", {"default": "doubao-seed-evolving"}),
                "max_tokens": ("INT", {"default": 1024, "min": 1, "max": 4096, "step": 1}),
                "temperature": ("FLOAT", {"default": 0.7, "min": 0.0, "max": 2.0, "step": 0.01}),
                "top_p": ("FLOAT", {"default": 0.9, "min": 0.0, "max": 1.0, "step": 0.01}),
                "timeout_seconds": ("INT", {"default": 180, "min": 60, "max": 600, "step": 1}),
            }
        }

    def build(
        self,
        base_url: str,
        api_key: str,
        模型预设: str,  # noqa: N803
        model_id: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
        timeout_seconds: int,
    ) -> Tuple[dict]:
        _ = MODEL_PRESET_TO_ID.get(模型预设, "doubao-seed-evolving")
        if not api_key.strip():
            raise ValueError("API Key 不能为空，请在模型配置节点填写。")
        if not model_id.strip():
            raise ValueError("model_id 不能为空，请填写有效模型 ID。")

        config = {
            "base_url": base_url.strip().rstrip("/"),
            "api_key": api_key.strip(),
            "model_id": model_id.strip(),
            "max_tokens": int(max_tokens),
            "temperature": float(temperature),
            "top_p": float(top_p),
            "timeout_seconds": int(timeout_seconds),
        }
        return (config,)
