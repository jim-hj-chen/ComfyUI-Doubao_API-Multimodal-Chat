"""VIDEO 转标准 IMAGE 与 AUDIO 节点。"""

from __future__ import annotations

import io
import json
import subprocess
from typing import Any, Dict, Optional, Tuple

import numpy as np
import torch
from PIL import Image

from ..utils.type_defs import VideoType


DEFAULT_PLACEHOLDER_WIDTH = 512
DEFAULT_PLACEHOLDER_HEIGHT = 512
DEFAULT_SAMPLE_RATE = 44100
DEFAULT_SILENCE_SECONDS = 1


class DoubaoVideoToImageAudio:
    """将 VIDEO 转换成 ComfyUI 标准 IMAGE + AUDIO。"""

    CATEGORY = "Doubao API/Tools"
    RETURN_TYPES = ("IMAGE", "AUDIO")
    RETURN_NAMES = ("image", "audio")
    FUNCTION = "convert"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Dict[str, tuple]]:
        return {
            "required": {
                "video": ("VIDEO",),
            }
        }

    def convert(self, video: VideoType) -> Tuple[torch.Tensor, dict]:
        item = video.get("item", {})
        video_path = str(item.get("path", "")).strip()
        if not video_path:
            source_url = str(item.get("source_url", "")).strip()
            if source_url:
                raise ValueError("当前视频为 TOS 地址模式，无法在本地解码为 IMAGE/AUDIO。请使用本地上传模式。")
            raise ValueError("未找到本地视频路径，无法执行转换。")

        video_meta = self._probe_video_meta(video_path)
        width = self._safe_int(video_meta.get("width"), DEFAULT_PLACEHOLDER_WIDTH, min_value=64)
        height = self._safe_int(video_meta.get("height"), DEFAULT_PLACEHOLDER_HEIGHT, min_value=64)
        sample_rate = self._safe_int(video_meta.get("sample_rate"), DEFAULT_SAMPLE_RATE, min_value=8000)
        silence_seconds = self._safe_int(video_meta.get("duration_seconds"), DEFAULT_SILENCE_SECONDS, min_value=1)

        image_tensor = self._extract_first_frame(video_path, width=width, height=height)
        audio_data = self._extract_audio_or_silence(
            video_path=video_path,
            sample_rate=sample_rate,
            silence_seconds=silence_seconds,
        )
        return (image_tensor, audio_data)

    def _probe_video_meta(self, video_path: str) -> Dict[str, Optional[float]]:
        command = [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_streams",
            "-show_format",
            video_path,
        ]
        try:
            result = subprocess.run(command, capture_output=True, check=False)
        except FileNotFoundError:
            return {}

        if result.returncode != 0 or not result.stdout:
            return {}

        try:
            payload = json.loads(result.stdout.decode("utf-8", errors="ignore"))
        except Exception:
            return {}

        streams = payload.get("streams", [])
        format_data = payload.get("format", {})
        video_stream = self._first_stream(streams, "video")
        audio_stream = self._first_stream(streams, "audio")
        duration_seconds = self._to_float(format_data.get("duration"))
        if duration_seconds is None or duration_seconds <= 0:
            duration_seconds = self._to_float(video_stream.get("duration") if video_stream else None)
        if duration_seconds is not None and duration_seconds > 0:
            duration_seconds = float(np.ceil(duration_seconds))
        else:
            duration_seconds = None

        sample_rate = self._to_float(audio_stream.get("sample_rate") if audio_stream else None)
        return {
            "width": self._to_float(video_stream.get("width") if video_stream else None),
            "height": self._to_float(video_stream.get("height") if video_stream else None),
            "sample_rate": sample_rate,
            "duration_seconds": duration_seconds,
        }

    def _extract_first_frame(self, video_path: str, width: int, height: int) -> torch.Tensor:
        command = [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            video_path,
            "-frames:v",
            "1",
            "-f",
            "image2pipe",
            "-vcodec",
            "png",
            "pipe:1",
        ]
        try:
            result = subprocess.run(command, capture_output=True, check=False)
        except FileNotFoundError:
            return self._build_placeholder_image(width=width, height=height)

        if result.returncode != 0 or not result.stdout:
            return self._build_placeholder_image(width=width, height=height)

        with Image.open(io.BytesIO(result.stdout)) as image:
            rgb_image = image.convert("RGB")
            np_image = np.asarray(rgb_image, dtype=np.float32) / 255.0

        if np_image.shape[0] <= 0 or np_image.shape[1] <= 0:
            return self._build_placeholder_image(width=width, height=height)
        return torch.from_numpy(np_image)[None, ...]

    def _extract_audio_or_silence(self, video_path: str, sample_rate: int, silence_seconds: int) -> dict:
        command = [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            video_path,
            "-vn",
            "-ac",
            "2",
            "-ar",
            str(sample_rate),
            "-f",
            "f32le",
            "pipe:1",
        ]
        try:
            result = subprocess.run(command, capture_output=True, check=False)
        except FileNotFoundError:
            return self._build_silence_audio(sample_rate=sample_rate, silence_seconds=silence_seconds)

        if result.returncode != 0 or not result.stdout:
            return self._build_silence_audio(sample_rate=sample_rate, silence_seconds=silence_seconds)

        raw = np.frombuffer(result.stdout, dtype=np.float32)
        if raw.size < 2:
            return self._build_silence_audio(sample_rate=sample_rate, silence_seconds=silence_seconds)

        sample_count = raw.size // 2
        if sample_count <= 0:
            return self._build_silence_audio(sample_rate=sample_rate, silence_seconds=silence_seconds)

        trimmed = raw[: sample_count * 2].reshape(sample_count, 2)
        waveform = torch.from_numpy(trimmed.T).unsqueeze(0)
        return {"waveform": waveform, "sample_rate": sample_rate}

    @staticmethod
    def _build_placeholder_image(width: int, height: int) -> torch.Tensor:
        return torch.zeros((1, height, width, 3), dtype=torch.float32)

    @staticmethod
    def _build_silence_audio(sample_rate: int, silence_seconds: int) -> dict:
        samples = max(1, int(sample_rate * silence_seconds))
        waveform = torch.zeros((1, 2, samples), dtype=torch.float32)
        return {"waveform": waveform, "sample_rate": sample_rate}

    @staticmethod
    def _to_float(value: Any) -> Optional[float]:
        try:
            if value is None or value == "":
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_int(value: Optional[float], default_value: int, min_value: int) -> int:
        if value is None:
            return default_value
        try:
            number = int(value)
        except (TypeError, ValueError):
            return default_value
        return max(min_value, number)

    @staticmethod
    def _first_stream(streams: Any, codec_type: str) -> Dict[str, Any]:
        if not isinstance(streams, list):
            return {}
        for stream in streams:
            if isinstance(stream, dict) and stream.get("codec_type") == codec_type:
                return stream
        return {}
