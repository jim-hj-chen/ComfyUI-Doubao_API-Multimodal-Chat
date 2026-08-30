"""提示词分割批处理节点。"""

from __future__ import annotations

import codecs
from typing import Dict, List, Tuple


class DoubaoPromptSplitBatcher:
    """将长文本按分隔符切分为提示词列表，输出给 ComfyUI 批处理机制。"""

    CATEGORY = "doubao/text"
    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("prompts", "count")
    OUTPUT_IS_LIST = (True, False)
    FUNCTION = "split_prompts"

    MAX_PROMPTS = 1000

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "input_text": ("STRING", {"default": "", "multiline": True}),
                "delimiter": ("STRING", {"default": "---", "multiline": False}),
                "trim_each": ("BOOLEAN", {"default": True}),
            }
        }

    def split_prompts(self, input_text: str, delimiter: str, trim_each: bool) -> Tuple[List[str], int]:
        normalized_delimiter = self._decode_escaped_delimiter(delimiter)
        source_text = input_text or ""

        # 空分隔符时退化为单条输入，避免 split("") 抛异常。
        if not normalized_delimiter:
            parts = [source_text]
        else:
            parts = source_text.split(normalized_delimiter)

        prompts: List[str] = []
        for part in parts:
            value = part.strip() if trim_each else part
            if value != "":
                prompts.append(value)
            # 保持与 UI 一致的上限，避免超大批次拖慢执行。
            if len(prompts) >= self.MAX_PROMPTS:
                break

        return prompts, len(prompts)

    @staticmethod
    def _decode_escaped_delimiter(delimiter: str) -> str:
        raw = str(delimiter or "")
        if raw == "":
            return ""
        try:
            return codecs.decode(raw, "unicode_escape")
        except Exception:
            return raw
