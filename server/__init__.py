"""插件后端路由注册。"""

from __future__ import annotations

import logging

LOGGER = logging.getLogger("comfyui_doubao.server")
_ROUTES_REGISTERED = False


def register_routes() -> None:
    """注册插件所需的 HTTP 路由。"""
    global _ROUTES_REGISTERED
    if _ROUTES_REGISTERED:
        return
    try:
        from . import upload_routes  # noqa: F401
    except Exception as error:  # pylint: disable=broad-except
        LOGGER.exception("注册 Doubao 上传路由失败: %s", error)
        return
    _ROUTES_REGISTERED = True
