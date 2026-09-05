# ComfyUI Doubao API Multimodal Chat

[English](README.md) | [中文](README.zh-CN.md)

ComfyUI custom nodes for [Doubao](https://www.volcengine.com/product/doubao) (Volcengine Ark). Send text, images, video, and documents through the Responses API and get model text plus token usage.

Requires a Volcengine Ark API key. Node labels follow the ComfyUI UI language (Simplified Chinese / English).

## Features

- Multimodal input: text, up to 9 images, one video, one document
- Model presets plus a custom `model_id`
- Optional context cache so the same Run Core node continues a session
- Local upload with drag-and-drop (files land on the ComfyUI server, then paths are filled in)
- Large video via Volcengine TOS (up to 2 GB) or an existing `tos://` URL
- Outputs: `output` (text) and `usage` (token JSON)

## Nodes

Category **Doubao API**:

| Node | Role |
|------|------|
| Doubao Model Config | Base URL, API key, model, sampling, timeout |
| Doubao Text Input | Multiline prompt → system or user prompt |
| Doubao Image Upload | Local images → `IMAGE_LIST` |
| Doubao Video Upload | Local file, TOS upload, or `tos://` URL |
| Doubao File Upload | One document (`pdf` / `txt` / Office / `csv` / `md`) |
| Doubao Run Core | Calls the API and returns `output` + `usage` |

Category **Doubao API / Tools**:

| Node | Role |
|------|------|
| Image List to Image | Split `IMAGE_LIST` into 9 ComfyUI `IMAGE` outputs |
| Doubao Prompt Split Batcher | Split a long string by delimiter for native batch runs |

## Install

1. Clone or copy this folder into ComfyUI `custom_nodes`.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Restart ComfyUI.

## Quick start

1. Add **Doubao Model Config**. Set `api_key` and pick a model (or type `model_id`).
2. Connect Config → **Doubao Run Core**.
3. Connect **Doubao Text Input** to `user_prompt` (and optionally `system_prompt`).
4. Optionally connect images / video / file.
5. Queue the workflow. Read `output` and `usage`.

Typical graphs:

```
Doubao Model Config ──────────────► Doubao Run Core
Doubao Text Input ──► user_prompt ─┘
Doubao Image Upload ─► images ─────┘
```

```
Doubao Image Upload ─► Image List to Image ─► native IMAGE nodes
```

```
Doubao Text Input ─► Prompt Split Batcher ─► batch → Doubao Text Input / Run Core
```

Turn **Context Cache** on to keep the session on that Run Core node. Turn it off to clear memory.

## Limits

| Input | Limit |
|-------|--------|
| Images | Max 9, 512 MB total |
| Video (local / Files API) | 512 MB |
| Video (TOS bucket upload) | 2 GB |
| Document | One file, 512 MB |

Remote ComfyUI (for example AutoDL): use the node upload buttons or drop files. The plugin writes them under `ComfyUI/input/doubao_image`, `doubao_video`, or `doubao_file` and fills server paths. Do not paste a path that only exists on your laptop.

Default API base URL: `https://ark.cn-beijing.volces.com/api/v3`.

## FAQ

**API Key cannot be empty** — Fill a valid key on Doubao Model Config.

**File not found** — Use an absolute path the ComfyUI process can read, or upload through the node.

**File too large** — Stay within the limits above.

**Need at least one input** — Provide text, images, video, or a document.

## License

Use this plugin with your own Ark credentials and Doubao / Volcengine terms of service.
