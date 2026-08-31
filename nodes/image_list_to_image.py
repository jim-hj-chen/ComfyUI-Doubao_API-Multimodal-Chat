"""IMAGE_LIST 转标准 IMAGE 节点。"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import torch
from PIL import Image

from ..utils.type_defs import ImageListType


MAX_OUTPUT_IMAGES = 9
DEFAULT_PLACEHOLDER_WIDTH = 512
DEFAULT_PLACEHOLDER_HEIGHT = 512


class DoubaoImageListToImage:
    """将 IMAGE_LIST 拆成 9 路 ComfyUI 标准 IMAGE。"""

    CATEGORY = "Doubao API/Tools"
    RETURN_TYPES = ("IMAGE",) * MAX_OUTPUT_IMAGES
    RETURN_NAMES = tuple(f"image_{index}" for index in range(1, MAX_OUTPUT_IMAGES + 1))
    FUNCTION = "convert"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "images": ("IMAGE_LIST",),
                "default_width": (
                    "INT",
                    {"default": DEFAULT_PLACEHOLDER_WIDTH, "min": 64, "max": 8192, "step": 64},
                ),
                "default_height": (
                    "INT",
                    {"default": DEFAULT_PLACEHOLDER_HEIGHT, "min": 64, "max": 8192, "step": 64},
                ),
            }
        }

    def convert(
        self,
        images: ImageListType,
        default_width: int,
        default_height: int,
    ) -> Tuple[torch.Tensor, ...]:
        output_images: List[torch.Tensor] = []
        items = list(images.get("items", []))[:MAX_OUTPUT_IMAGES]

        for item in items:
            path = str(item.get("path", "")).strip()
            if not path:
                continue
            output_images.append(self._load_image_tensor(path))

        # 输出口固定为 9 路，不足时补占位图，便于与下游固定连线配合。
        width = max(64, int(default_width))
        height = max(64, int(default_height))
        while len(output_images) < MAX_OUTPUT_IMAGES:
            output_images.append(self._build_placeholder(width=width, height=height))

        return tuple(output_images)

    @staticmethod
    def _load_image_tensor(path_text: str) -> torch.Tensor:
        image_path = Path(path_text)
        if not image_path.exists():
            raise ValueError(f"图片不存在：{image_path}")
        with Image.open(image_path) as image:
            rgb_image = image.convert("RGB")
            np_image = np.asarray(rgb_image, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(np_image)[None, ...]
        return tensor

    @staticmethod
    def _build_placeholder(width: int, height: int) -> torch.Tensor:
        return torch.zeros((1, height, width, 3), dtype=torch.float32)
