"""文本输入节点。"""

from __future__ import annotations

from typing import Dict, Tuple


class DoubaoTextInput:
    """提供多行文本输入。"""

    CATEGORY = "Doubao API"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "output_text"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "prompt": ("STRING", {"default": "", "multiline": True}),
            }
        }

    def output_text(self, prompt: str) -> Tuple[str]:
        return (prompt or "",)
