"""提示词分割批处理节点。"""

from __future__ import annotations

import codecs
from typing import Dict, List, Tuple


class DoubaoPromptSplitBatcher:
    """将长文本按分隔符切分为提示词列表，输出给 ComfyUI 批处理机制。"""

    CATEGORY = "Doubao API/Tools"
    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("prompts", "count")
    OUTPUT_IS_LIST = (True, False)
    FUNCTION = "split_prompts"

    MAX_PROMPTS = 1000
    PREVIEW_CHARS = 60

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "input_text": ("STRING", {"forceInput": True}),
                "delimiter": ("STRING", {"default": "---", "multiline": False}),
                "trim_each": ("BOOLEAN", {"default": True}),
            }
        }

    def split_prompts(self, input_text: str, delimiter: str, trim_each: bool):
        normalized_delimiter = self._decode_escaped_delimiter(delimiter)
        source_text = input_text or ""

        # 空分隔符时退化为单条输入，避免 split("") 抛异常。
        if not normalized_delimiter:
            parts = [source_text]
        else:
            parts = source_text.split(normalized_delimiter)

        prompts: List[str] = []
        total_before_limit = 0
        for part in parts:
            value = part.strip() if trim_each else part
            if value != "":
                total_before_limit += 1
                if len(prompts) < self.MAX_PROMPTS:
                    prompts.append(value)
            # 保持与 UI 一致的上限，避免超大批次拖慢执行。
            if len(prompts) >= self.MAX_PROMPTS:
                continue

        count = len(prompts)
        preview = [self._to_preview_text(text) for text in prompts]
        limit_hit = total_before_limit > self.MAX_PROMPTS
        return {
            "ui": {
                "split_preview": preview,
                "split_full": prompts,
                "split_count": [count],
                "split_limit_hit": [limit_hit],
            },
            "result": (prompts, count),
        }

    @staticmethod
    def _decode_escaped_delimiter(delimiter: str) -> str:
        raw = str(delimiter or "")
        if raw == "":
            return ""
        try:
            return codecs.decode(raw, "unicode_escape")
        except Exception:
            return raw

    @classmethod
    def _to_preview_text(cls, text: str) -> str:
        if len(text) <= cls.PREVIEW_CHARS:
            return text
        return f"{text[:cls.PREVIEW_CHARS]}..."
