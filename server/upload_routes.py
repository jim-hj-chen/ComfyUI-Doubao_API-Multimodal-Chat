"""上传路由：接收浏览器文件并写入 ComfyUI input 子目录。"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Dict, Set

from aiohttp import web

import folder_paths
from server import PromptServer

ALLOWED_EXTENSIONS: Dict[str, Set[str]] = {
    "image": {".jpg", ".jpeg", ".png", ".webp", ".bmp"},
    "video": {".mp4", ".avi", ".mov", ".mkv"},
    "file": {".pdf", ".txt", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".md"},
}
SUBDIR_MAP = {
    "image": "doubao_image",
    "video": "doubao_video",
    "file": "doubao_file",
}


def _safe_filename(file_name: str) -> str:
    raw_name = Path(file_name or "").name.strip() or "upload.bin"
    # 保留基础可读字符，避免特殊符号导致路径问题。
    sanitized = re.sub(r"[^A-Za-z0-9._\-\u4e00-\u9fff]", "_", raw_name)
    return sanitized or "upload.bin"


def _unique_target_path(base_dir: Path, file_name: str) -> Path:
    target = base_dir / file_name
    if not target.exists():
        return target
    stem = target.stem
    suffix = target.suffix
    unique_name = f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"
    return base_dir / unique_name


@PromptServer.instance.routes.post("/doubao/upload")
async def doubao_upload(request: web.Request) -> web.Response:
    form = await request.post()
    upload = form.get("file")
    media_type = str(form.get("media_type", "")).strip().lower()

    if upload is None:
        return web.json_response({"ok": False, "error": "未检测到上传文件。"}, status=400)
    if media_type not in ALLOWED_EXTENSIONS:
        return web.json_response({"ok": False, "error": "media_type 无效，请使用 image/video/file。"}, status=400)

    file_name = _safe_filename(getattr(upload, "filename", "") or "upload.bin")
    suffix = Path(file_name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS[media_type]:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS[media_type]))
        return web.json_response(
            {"ok": False, "error": f"文件扩展名不支持：{suffix}，支持：{allowed}"},
            status=400,
        )

    input_dir = Path(folder_paths.get_input_directory())
    target_dir = input_dir / SUBDIR_MAP[media_type]
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = _unique_target_path(target_dir, file_name)

    payload = upload.file.read()
    if not isinstance(payload, (bytes, bytearray)):
        return web.json_response({"ok": False, "error": "上传内容读取失败。"}, status=400)

    with target_path.open("wb") as output_file:
        output_file.write(payload)

    abs_path = str(target_path.resolve())
    return web.json_response(
        {
            "ok": True,
            "path": abs_path,
            "filename": target_path.name,
            "size": len(payload),
            "media_type": media_type,
        }
    )
