"""豆包 Responses / Files API 客户端封装。"""

from __future__ import annotations

import json
import logging
import time
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Iterable, Optional, Tuple

import requests

from .type_defs import StreamResult


LOGGER = logging.getLogger("comfyui_doubao.api_client")
LOCAL_FILE_ID_CACHE: Dict[str, Dict[str, Any]] = {}

# 方舟 Files API 官方枚举为 active / processing / failed（见 arkruntime file.Status*）。
# processed 等为文档或其它网关别名，一并视为就绪。
FILE_READY_STATUSES = frozenset({"active", "processed", "succeeded", "completed", "ready"})
FILE_PROCESSING_STATUSES = frozenset(
    {"processing", "pending", "queued", "uploaded", "in_progress", "in-progress"}
)
FILE_FAILED_STATUSES = frozenset({"failed", "error", "cancelled", "canceled", "deleted"})
DEFAULT_FILE_WAIT_SECONDS = 300


class DoubaoApiError(RuntimeError):
    """豆包 API 业务异常。"""


class DoubaoApiClient:
    """简化的豆包 API 客户端。"""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout_seconds: int = 60,
        max_retries: int = 3,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key.strip()
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.session = requests.Session()

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
        }

    def upload_file(
        self,
        file_path: Optional[str] = None,
        source_url: Optional[str] = None,
        purpose: str = "user_data",
        preprocess_configs: Optional[Dict[str, Any]] = None,
        tos: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        上传本地文件到 Files API。

        返回值包含 file_id 与原始响应：
        {
            "file_id": "file-xxx",
            "raw": {...}
        }
        """
        has_file_path = bool((file_path or "").strip())
        has_source_url = bool((source_url or "").strip())
        if has_file_path == has_source_url:
            raise DoubaoApiError("上传参数错误：必须二选一提供 file_path 或 source_url。")

        cache_key: Optional[str] = None
        if has_file_path:
            cache_key = build_local_file_cache_key(
                path_text=(file_path or "").strip(),
                purpose=purpose,
                preprocess_configs=preprocess_configs,
                tos=tos,
            )
            if cache_key:
                cached_file_id = get_cached_file_id(cache_key)
                if cached_file_id:
                    LOGGER.info("命中本地文件缓存: %s -> %s", (file_path or "").strip(), cached_file_id)
                    return {"file_id": cached_file_id, "raw": {"id": cached_file_id, "cached": True}}

        url = f"{self.base_url}/files"
        form_data: Dict[str, str] = {"purpose": purpose}
        if preprocess_configs:
            form_data.update(_flatten_form_data("preprocess_configs", preprocess_configs))
        if tos:
            filtered_tos = {key: value for key, value in tos.items() if (value or "").strip()}
            if filtered_tos:
                form_data.update(_flatten_form_data("tos", filtered_tos))
        if has_source_url:
            form_data["url"] = (source_url or "").strip()

        last_error: Optional[Exception] = None
        for retry_index in range(self.max_retries):
            try:
                if has_source_url:
                    response = self.session.post(
                        url,
                        headers=self.headers,
                        data=form_data,
                        timeout=self.timeout_seconds,
                    )
                else:
                    with open((file_path or "").strip(), "rb") as file_obj:
                        response = self.session.post(
                            url,
                            headers=self.headers,
                            data=form_data,
                            files={"file": file_obj},
                            timeout=self.timeout_seconds,
                        )
                data = self._parse_response_json(response)
                file_id = data.get("id")
                if not file_id:
                    raise DoubaoApiError(f"上传响应缺少 file_id：{data}")
                source_desc = (source_url or "").strip() if has_source_url else (file_path or "").strip()
                LOGGER.info("文件上传成功: %s -> %s", source_desc, file_id)
                if cache_key and not has_source_url:
                    set_cached_file_id(cache_key, file_id)
                return {"file_id": file_id, "raw": data}
            except Exception as error:  # pylint: disable=broad-except
                last_error = error
                LOGGER.warning("文件上传失败（第 %s 次）: %s", retry_index + 1, error)
                if retry_index < self.max_retries - 1:
                    time.sleep(2**retry_index)
        raise DoubaoApiError(f"文件上传失败，已重试 {self.max_retries} 次：{last_error}") from last_error

    def wait_for_file_ready(
        self,
        file_id: str,
        poll_interval_seconds: float = 2.0,
        max_wait_seconds: int = DEFAULT_FILE_WAIT_SECONDS,
        initial: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """轮询直到文件可被 Responses API 引用。

        官方就绪状态是 ``active``（不是 processing）。上传响应若已是就绪态则不再轮询。
        """
        if initial and not initial.get("cached"):
            ready = _file_status_or_raise(file_id, initial)
            if ready is not None:
                LOGGER.info("上传响应已就绪: %s -> %s", file_id, (initial.get("status") or "").lower())
                return initial

        deadline = time.time() + max(1, int(max_wait_seconds))
        url = f"{self.base_url}/files/{file_id}"
        last_status = "unknown"
        interval = max(0.5, float(poll_interval_seconds))
        while time.time() < deadline:
            response = self.session.get(url, headers=self.headers, timeout=self.timeout_seconds)
            data = self._parse_response_json(response)
            status = (data.get("status") or "").lower()
            last_status = status or last_status
            LOGGER.info("文件状态轮询: %s -> %s", file_id, status or "(empty)")
            ready = _file_status_or_raise(file_id, data)
            if ready is not None:
                return data
            if status and status not in FILE_PROCESSING_STATUSES:
                LOGGER.warning("未识别的文件状态，继续等待: %s -> %s", file_id, status)
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            time.sleep(min(interval, remaining))
            interval = min(interval * 1.5, 10.0)
        raise DoubaoApiError(
            f"等待文件处理超时：{file_id}，最后状态：{last_status}。"
            "仅 processing/pending 等表示仍在抽帧；active 表示已可用。"
            "若长期停留在 processing，请缩短视频、降低抽帧率，或改用 TOS 上传。"
        )

    def create_response(
        self,
        payload: Dict[str, Any],
        stream: bool = False,
    ) -> Tuple[str, Dict[str, Any]]:
        """调用 Responses API，返回 (文本, usage)。"""
        url = f"{self.base_url}/responses"
        request_payload = dict(payload)
        request_payload["stream"] = stream

        if stream:
            with self.session.post(
                url,
                headers={**self.headers, "Content-Type": "application/json"},
                json=request_payload,
                timeout=self.timeout_seconds,
                stream=True,
            ) as response:
                if response.status_code >= 400:
                    self._raise_response_error(response)
                stream_result = self._consume_sse_events(response.iter_lines(decode_unicode=True))
                return stream_result["text"], stream_result["usage"]

        response = self.session.post(
            url,
            headers={**self.headers, "Content-Type": "application/json"},
            json=request_payload,
            timeout=self.timeout_seconds,
        )
        data = self._parse_response_json(response)
        text = _extract_output_text(data)
        usage = data.get("usage") or {}
        return text, usage

    def _parse_response_json(self, response: requests.Response) -> Dict[str, Any]:
        """解析 JSON 响应，并处理错误码。"""
        if response.status_code >= 400:
            self._raise_response_error(response)
        try:
            return response.json()
        except ValueError as error:
            raise DoubaoApiError(f"响应非 JSON 格式：{response.text}") from error

    def _raise_response_error(self, response: requests.Response) -> None:
        """将 HTTP 错误转换为中文异常。"""
        try:
            payload = response.json()
        except ValueError:
            payload = {"message": response.text}
        error_obj = payload.get("error", payload)
        message = error_obj.get("message") if isinstance(error_obj, dict) else str(error_obj)
        code = error_obj.get("code") if isinstance(error_obj, dict) else None
        tip = f"调用失败（HTTP {response.status_code}）"
        if code:
            tip += f"，错误码：{code}"
        if message:
            tip += f"，详情：{message}"
        raise DoubaoApiError(tip)

    def _consume_sse_events(self, lines: Iterable[str]) -> StreamResult:
        """消费 SSE 事件流并聚合文本与 usage。"""
        chunks = []
        usage: Dict[str, Any] = {}
        for line in lines:
            if not line:
                continue
            stripped = line.strip()
            if stripped == "data: [DONE]":
                break
            if not stripped.startswith("data: "):
                continue
            raw_json = stripped[6:]
            try:
                event = json.loads(raw_json)
            except ValueError:
                LOGGER.debug("忽略非 JSON 事件：%s", raw_json)
                continue

            event_type = event.get("type", "")
            if event_type == "response.output_text.delta":
                delta = event.get("delta") or ""
                chunks.append(delta)
            elif event_type == "response.completed":
                response_obj = event.get("response") or {}
                usage = response_obj.get("usage") or usage
            elif event_type.endswith(".failed"):
                raise DoubaoApiError(f"流式请求失败：{event}")
        return {"text": "".join(chunks).strip(), "usage": usage}


def _file_status_or_raise(file_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """就绪返回 data；处理中返回 None；失败抛异常。"""
    status = (data.get("status") or "").lower()
    if status in FILE_READY_STATUSES:
        return data
    if status in FILE_FAILED_STATUSES:
        error_obj = data.get("error") or {}
        detail = ""
        if isinstance(error_obj, dict):
            detail = str(error_obj.get("message") or error_obj.get("code") or "").strip()
        suffix = f"，详情：{detail}" if detail else ""
        raise DoubaoApiError(f"文件处理失败：{file_id}，状态：{status}{suffix}")
    return None


def _flatten_form_data(prefix: str, value: Any) -> Dict[str, str]:
    """将嵌套字典展开为 multipart 表单字段。"""
    flattened: Dict[str, str] = {}
    if isinstance(value, dict):
        for key, nested in value.items():
            nested_prefix = f"{prefix}[{key}]"
            flattened.update(_flatten_form_data(nested_prefix, nested))
    else:
        flattened[prefix] = str(value)
    return flattened


def build_local_file_cache_key(
    path_text: str,
    purpose: str,
    preprocess_configs: Optional[Dict[str, Any]] = None,
    tos: Optional[Dict[str, str]] = None,
) -> Optional[str]:
    """根据本地路径与元信息构建稳定缓存 key。"""
    try:
        path = Path(path_text).expanduser().resolve()
        stat = path.stat()
    except OSError:
        return None

    signature = {
        "path": str(path),
        "size": int(stat.st_size),
        "mtime_ns": int(getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1e9))),
        "purpose": (purpose or "").strip(),
        "preprocess_configs": preprocess_configs or {},
        "tos": {key: value for key, value in (tos or {}).items() if (value or "").strip()},
    }
    payload = json.dumps(signature, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256(payload.encode("utf-8")).hexdigest()


def get_cached_file_id(cache_key: str) -> Optional[str]:
    """读取缓存 file_id。"""
    entry = LOCAL_FILE_ID_CACHE.get(cache_key)
    if not entry:
        return None
    file_id = entry.get("file_id")
    if not isinstance(file_id, str) or not file_id.strip():
        return None
    return file_id.strip()


def set_cached_file_id(cache_key: str, file_id: str) -> None:
    """写入缓存 file_id。"""
    LOCAL_FILE_ID_CACHE[cache_key] = {
        "file_id": file_id.strip(),
        "updated_at": time.time(),
    }


def _extract_output_text(response_json: Dict[str, Any]) -> str:
    """从 Responses API 响应中提取可读文本。"""
    text_chunks = []
    for item in response_json.get("output", []):
        if item.get("type") == "message":
            for content_item in item.get("content", []):
                if content_item.get("type") == "output_text":
                    text_chunks.append(content_item.get("text", ""))
        elif item.get("type") == "output_text":
            text_chunks.append(item.get("text", ""))
    if not text_chunks:
        fallback = response_json.get("output_text")
        if isinstance(fallback, str):
            return fallback
    return "".join(text_chunks).strip()
