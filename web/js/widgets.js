import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

const MODEL_PRESET_TO_ID = {
  "doubao-seed-evolving": "doubao-seed-evolving",
  "doubao-seed-2-1-pro": "doubao-seed-2-1-pro-260628",
  "doubao-seed-2-1-turbo": "doubao-seed-2-1-turbo-260628",
  "doubao-seed-2-0-lite": "doubao-seed-2-0-lite-260428",
  "doubao-seed-2-0-mini": "doubao-seed-2-0-mini-260428",
  "自定义": "",
};
const MB = 1024 * 1024;
const NODE_TITLE_HEIGHT = 30;
const NODE_SIDE_PADDING = 20;
const NODE_BOTTOM_PADDING = 12;
const MEDIA_CARD_WIDTH = 152;
const MEDIA_CARD_GAP = 14;
const MEDIA_DEFAULT_COLUMNS = 3;
const DOUBAO_MIN_NODE_WIDTH = 360;
const DOUBAO_RUN_CORE_NODE_WIDTH = 440;
const DOUBAO_RUN_CORE_NODE_HEIGHT = 300;
const DOUBAO_RUN_CORE_MIN_WIDTH = 380;
const DOUBAO_RUN_CORE_MIN_HEIGHT = 240;
const DOUBAO_PROMPT_SPLIT_NODE_WIDTH = 560;
const DOUBAO_PROMPT_SPLIT_NODE_HEIGHT = 430;
const DOUBAO_PROMPT_SPLIT_MIN_WIDTH = 420;
const DOUBAO_PROMPT_SPLIT_MIN_HEIGHT = 320;
const DOUBAO_PROMPT_SPLIT_MAX_ITEMS = 1000;
const DOUBAO_SPLIT_PREVIEW_ITEM_HEIGHT = 34;
const DOUBAO_SPLIT_PREVIEW_VISIBLE_COUNT = 5;
const DOUBAO_SPLIT_PREVIEW_LIST_GAP = 4;
const DOUBAO_SPLIT_PREVIEW_LIST_PADDING = 10;
const DOUBAO_SPLIT_PREVIEW_LIST_HEIGHT =
  DOUBAO_SPLIT_PREVIEW_ITEM_HEIGHT * DOUBAO_SPLIT_PREVIEW_VISIBLE_COUNT +
  DOUBAO_SPLIT_PREVIEW_LIST_GAP * (DOUBAO_SPLIT_PREVIEW_VISIBLE_COUNT - 1) +
  DOUBAO_SPLIT_PREVIEW_LIST_PADDING;
const DOUBAO_SPLIT_PREVIEW_HEADER_HEIGHT = 40;
const DOUBAO_SPLIT_PREVIEW_WIDGET_HEIGHT =
  DOUBAO_SPLIT_PREVIEW_HEADER_HEIGHT + DOUBAO_SPLIT_PREVIEW_LIST_HEIGHT + 6;
const DOUBAO_MEDIA_NODE_WIDTH =
  MEDIA_CARD_WIDTH * MEDIA_DEFAULT_COLUMNS +
  MEDIA_CARD_GAP * (MEDIA_DEFAULT_COLUMNS - 1) +
  NODE_SIDE_PADDING +
  32;
const DOUBAO_MEDIA_NODE_HEIGHT = 420;
const DOUBAO_MEDIA_MIN_WIDGET_HEIGHT = 320;
const VIDEO_MODE_LOCAL = "本地上传（≤512MB）";
const VIDEO_MODE_TOS_BUCKET = "TOS 对象存储上传（≤2GB）";
const VIDEO_MODE_TOS_URL = "已有 TOS 视频地址";

const UI_STRINGS = {
  en: {
    clear: "Clear",
    pickImage: "Choose images",
    pickVideo: "Choose video",
    pickFile: "Choose file",
    dropImages: "Drop images here (max 9, total ≤512MB)",
    dropVideoLocal: "Drop a video here (single file, max 512MB)",
    dropVideoTos: "Drop a video here (stored on Volcengine TOS, max 2GB)",
    dropFile: "Drop a document here (single file, max 512MB)",
    fileN: (index) => `File ${index + 1}`,
    uploadFailed: "Upload to server failed.",
    uploadFailedComfy: "Upload to ComfyUI server failed.",
    uploadNetworkError: "Network error while uploading to ComfyUI server.",
    invalidServerPath: "Server did not return a valid path.",
    uploading: "Uploading...",
    uploadComplete: "Upload complete.",
    uploadProgress: (percent) => `Upload progress: ${percent}%`,
    cancelUpload: "Cancel",
    uploadCancelled: "Upload cancelled.",
    uploadTimeout: "Upload timed out. This batch was cancelled.",
    uploadInProgress: "An upload is already in progress. Cancel it first.",
    imageCountLimit: "Too many images. Maximum is 9.",
    imageTotalTooLarge: "Images exceed 512MB in total (Doubao API processing limit).",
    videoTooLarge: (name, limitLabel, hint) =>
      `Video ${name} exceeds the ${limitLabel} limit. ${hint}`,
    videoHintLocal:
      "For files over 512MB, switch Input Mode to TOS object storage upload (≤2GB) and fill in the Volcengine TOS Bucket.",
    videoHintTos: "TOS object storage supports videos up to 2GB.",
    fileTooLarge: (name) => `File ${name} exceeds 512MB.`,
    singleFileOnly: "This node accepts a single file.",
    pathUploadFailed: "Path-mode upload failed.",
    fileName: "Name",
    fileType: "Type",
    fileSize: "Size",
    inputText: "Input Text",
    delimiter: "Delimiter",
    trimWhitespace: "Trim Whitespace",
    splitPreview: "Split Preview",
    promptsTotal: (count) => `${count} prompts`,
    splitLimitHit: (limit) => `Only the first ${limit} prompts are kept.`,
  },
  zh: {
    clear: "清空",
    pickImage: "选择图片上传",
    pickVideo: "选择视频上传",
    pickFile: "选择文件上传",
    dropImages: "拖拽图片到此处（最多 9 张，合计不超过 512MB）",
    dropVideoLocal: "拖拽视频到此处（仅单个，最大 512MB）",
    dropVideoTos: "拖拽视频到此处（将存入火山引擎 TOS，最大 2GB）",
    dropFile: "拖拽文档到此处（仅单个，不超过 512MB）",
    fileN: (index) => `第 ${index + 1} 个文件`,
    uploadFailed: "上传到服务器失败。",
    uploadFailedComfy: "上传到 ComfyUI 服务器失败。",
    uploadNetworkError: "上传到 ComfyUI 服务器时发生网络错误。",
    invalidServerPath: "服务器未返回有效路径。",
    uploading: "上传中...",
    uploadComplete: "上传完成。",
    uploadProgress: (percent) => `上传进度：${percent}%`,
    cancelUpload: "取消",
    uploadCancelled: "已取消上传。",
    uploadTimeout: "上传超时，已取消本次任务。",
    uploadInProgress: "正在上传中，请先取消当前任务。",
    imageCountLimit: "图片数量超限，最多允许 9 张。",
    imageTotalTooLarge: "图片合计超过 512MB（豆包 API 单次处理上限）。",
    videoTooLarge: (name, limitLabel, hint) =>
      `视频 ${name} 超过 ${limitLabel} 上限。${hint}`,
    videoHintLocal:
      "超过 512MB 时请将输入方式改为「TOS 对象存储上传（≤2GB）」，并填写火山引擎 TOS Bucket。",
    videoHintTos: "TOS 对象存储最大支持 2GB 视频。",
    fileTooLarge: (name) => `文件 ${name} 超过 512MB。`,
    singleFileOnly: "该节点仅支持单个文件。",
    pathUploadFailed: "路径模式上传失败。",
    fileName: "文件名",
    fileType: "类型",
    fileSize: "大小",
    inputText: "输入文本",
    delimiter: "分隔符",
    trimWhitespace: "去除首尾空白",
    splitPreview: "分割预览",
    promptsTotal: (count) => `共 ${count} 份提示词`,
    splitLimitHit: (limit) => `仅保留前 ${limit} 份提示词。`,
  },
};

function getLocale() {
  try {
    const value =
      app.extensionManager?.setting?.get?.("Comfy.Locale") ||
      app.ui?.settings?.getSettingValue?.("Comfy.Locale") ||
      "";
    const locale = String(value || "en").toLowerCase();
    if (locale.startsWith("zh")) return "zh";
    return "en";
  } catch (error) {
    console.error(error);
    return "en";
  }
}

function ui() {
  return UI_STRINGS[getLocale()] || UI_STRINGS.en;
}

function findWidget(node, name) {
  return node.widgets?.find((widget) => widget.name === name);
}

function widgetRowHeight() {
  return globalThis.LiteGraph?.NODE_WIDGET_HEIGHT || 24;
}

function installWidgetVisibility(widget) {
  if (!widget || widget._doubaoVisibilityHook) return;
  widget._doubaoVisibilityHook = true;
  widget._doubaoOriginalComputeSize = widget.computeSize;
  widget.computeSize = function computeSizeGuarded(width) {
    if (this.hidden) return [0, -4];
    const original = this._doubaoOriginalComputeSize;
    if (typeof original === "function") {
      return original.call(this, width);
    }
    return [width || 200, widgetRowHeight()];
  };
}

function widgetHostElement(widget) {
  if (!widget) return null;
  if (widget.element) return widget.element;
  if (widget.inputEl?.closest) {
    return (
      widget.inputEl.closest(".lg-node-widget, [data-testid='node-widget']") ||
      widget.inputEl
    );
  }
  return widget.inputEl || null;
}

function toggleWidgetVisibility(widget, visible) {
  if (!widget) return;
  installWidgetVisibility(widget);
  widget.hidden = !visible;
  widget.computedHeight = visible ? widgetRowHeight() : 0;
  const host = widgetHostElement(widget);
  if (host) {
    host.hidden = !visible;
    if (host.style) {
      host.style.display = visible ? "" : "none";
    }
  }
}

function hideDoubaoRunCoreTextWidgets(node) {
  for (const name of ["stream", "system_prompt", "user_prompt", "text", "last_response_id"]) {
    const widget = findWidget(node, name);
    if (!widget) continue;
    const hasInput = node.inputs?.some((input) => input.name === name);
    if (!["stream", "last_response_id"].includes(name) && !hasInput && typeof node.convertWidgetToInput === "function") {
      node.convertWidgetToInput(widget);
    }
    toggleWidgetVisibility(findWidget(node, name), false);
  }
}

function installDoubaoRunCoreContextCache(node) {
  const cacheWidget = findWidget(node, "context_cache");
  const lastIdWidget = findWidget(node, "last_response_id");
  toggleWidgetVisibility(lastIdWidget, false);

  if (cacheWidget && !cacheWidget._doubaoCacheGuard) {
    cacheWidget._doubaoCacheGuard = true;
    const originalCallback = cacheWidget.callback;
    cacheWidget.callback = function contextCacheCallback(value, ...args) {
      if (!value && lastIdWidget) {
        lastIdWidget.value = "";
      }
      if (originalCallback) {
        originalCallback.call(this, value, ...args);
      }
    };
  }

  if (node._doubaoCacheExecutedGuard) return;
  node._doubaoCacheExecutedGuard = true;
  const originalOnExecuted = node.onExecuted;
  node.onExecuted = function onExecutedContextCache(message) {
    if (originalOnExecuted) originalOnExecuted.apply(this, arguments);
    const widget = findWidget(this, "last_response_id");
    if (!widget) return;
    const ids = message?.last_response_id;
    const nextId = Array.isArray(ids) ? ids[0] : ids;
    if (nextId == null) return;
    widget.value = String(nextId);
  };
}

function injectDoubaoRunCoreStyles() {
  const styleId = "doubao-run-layout-v1";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .doubao-run-core :has(> .lg-slot),
    [data-node-type="DoubaoRunCore"] :has(> .lg-slot) {
      justify-content: space-evenly !important;
      align-self: stretch;
      height: 100%;
      flex: 1 1 auto;
      min-height: 0;
    }
    .doubao-run-core .lg-slot,
    [data-node-type="DoubaoRunCore"] .lg-slot {
      flex: 1 1 auto;
      min-height: 20px;
    }
  `;
  document.head.appendChild(style);
}

function markDoubaoRunCoreDom(node) {
  const id = node?.id;
  if (id == null) return;
  const el = document.querySelector(`[data-node-id="${CSS.escape(String(id))}"]`);
  if (el) el.classList.add("doubao-run-core");
}

function usesVueNodeSlots() {
  return Boolean(document.querySelector(".lg-slot"));
}

function visibleNodeSlots(slots) {
  return (slots || []).filter((slot) => slot && slot.type !== -1 && !slot.hidden);
}

function layoutDoubaoRunCoreSlots(node) {
  if (!node || usesVueNodeSlots()) return;
  const LiteGraph = globalThis.LiteGraph || {};
  const titleH = LiteGraph.NODE_TITLE_HEIGHT ?? NODE_TITLE_HEIGHT;
  const slotH = LiteGraph.NODE_SLOT_HEIGHT ?? 20;
  const inset = slotH * 0.5;
  const width = Math.max(Number(node.size?.[0]) || 0, DOUBAO_RUN_CORE_MIN_WIDTH);
  const height = Math.max(Number(node.size?.[1]) || 0, DOUBAO_RUN_CORE_MIN_HEIGHT);
  const top = titleH + slotH * 0.25;
  const usable = Math.max(slotH, height - top - NODE_BOTTOM_PADDING);

  const place = (slots, isInput) => {
    const items = visibleNodeSlots(slots);
    if (!items.length) return;
    const step = usable / items.length;
    for (let i = 0; i < items.length; i += 1) {
      const y = top + step * i + step * 0.5;
      items[i].pos = isInput ? [inset, y] : [width + 1 - inset, y];
    }
  };

  place(node.inputs, true);
  place(node.outputs, false);
}

function applyDoubaoRunCoreSize(node, { preferDefault = false } = {}) {
  if (!node) return;
  node._doubaoMinWidth = Math.max(Number(node._doubaoMinWidth) || 0, DOUBAO_RUN_CORE_MIN_WIDTH);
  node._doubaoMinHeight = Math.max(Number(node._doubaoMinHeight) || 0, DOUBAO_RUN_CORE_MIN_HEIGHT);
  const currentW = Number(node.size?.[0]) || 0;
  const currentH = Number(node.size?.[1]) || 0;
  const nextW = Math.max(
    currentW,
    preferDefault || currentW < DOUBAO_RUN_CORE_MIN_WIDTH ? DOUBAO_RUN_CORE_NODE_WIDTH : DOUBAO_RUN_CORE_MIN_WIDTH
  );
  const nextH = Math.max(
    currentH,
    preferDefault || currentH < DOUBAO_RUN_CORE_MIN_HEIGHT ? DOUBAO_RUN_CORE_NODE_HEIGHT : DOUBAO_RUN_CORE_MIN_HEIGHT
  );
  if (currentW !== nextW || currentH !== nextH) {
    if (typeof node.setSize === "function") {
      node.setSize([nextW, nextH]);
    } else {
      node.size = [nextW, nextH];
    }
  }
  layoutDoubaoRunCoreSlots(node);
}

function installDoubaoRunCoreLayout(node) {
  if (!node) return;
  injectDoubaoRunCoreStyles();
  applyDoubaoRunCoreSize(node, { preferDefault: true });
  if (node._doubaoRunCoreLayout) {
    layoutDoubaoRunCoreSlots(node);
    return;
  }
  node._doubaoRunCoreLayout = true;
  const originalOnResize = node.onResize;
  node.onResize = function onResizeDoubaoRunCore(size) {
    if (size?.[0] < DOUBAO_RUN_CORE_MIN_WIDTH) size[0] = DOUBAO_RUN_CORE_MIN_WIDTH;
    if (size?.[1] < DOUBAO_RUN_CORE_MIN_HEIGHT) size[1] = DOUBAO_RUN_CORE_MIN_HEIGHT;
    if (this.size?.[0] < DOUBAO_RUN_CORE_MIN_WIDTH) this.size[0] = DOUBAO_RUN_CORE_MIN_WIDTH;
    if (this.size?.[1] < DOUBAO_RUN_CORE_MIN_HEIGHT) this.size[1] = DOUBAO_RUN_CORE_MIN_HEIGHT;
    if (originalOnResize) originalOnResize.apply(this, arguments);
    markDoubaoRunCoreDom(this);
    layoutDoubaoRunCoreSlots(this);
  };
  const originalOnDrawForeground = node.onDrawForeground;
  node.onDrawForeground = function onDrawForegroundDoubaoRunCore() {
    markDoubaoRunCoreDom(this);
    layoutDoubaoRunCoreSlots(this);
    if (originalOnDrawForeground) {
      return originalOnDrawForeground.apply(this, arguments);
    }
    return undefined;
  };
  layoutDoubaoRunCoreSlots(node);
  markDoubaoRunCoreDom(node);
}

function installDoubaoRunCoreSizeDefaults(nodeType) {
  nodeType.prototype._doubaoMinWidth = DOUBAO_RUN_CORE_MIN_WIDTH;
  nodeType.prototype._doubaoMinHeight = DOUBAO_RUN_CORE_MIN_HEIGHT;
  if (!Array.isArray(nodeType.size) || nodeType.size[0] < DOUBAO_RUN_CORE_NODE_WIDTH) {
    nodeType.size = [DOUBAO_RUN_CORE_NODE_WIDTH, DOUBAO_RUN_CORE_NODE_HEIGHT];
  }
  if (nodeType.prototype._doubaoRunCoreComputeSizeGuard) return;
  nodeType.prototype._doubaoRunCoreComputeSizeGuard = true;
  const originalComputeSize = nodeType.prototype.computeSize;
  nodeType.prototype.computeSize = function doubaoRunComputeSize(out) {
    const size = originalComputeSize
      ? originalComputeSize.apply(this, arguments)
      : [DOUBAO_RUN_CORE_NODE_WIDTH, DOUBAO_RUN_CORE_NODE_HEIGHT];
    const minWidth = Number(this._doubaoMinWidth) || DOUBAO_RUN_CORE_MIN_WIDTH;
    const minHeight = Number(this._doubaoMinHeight) || DOUBAO_RUN_CORE_MIN_HEIGHT;
    if (Array.isArray(size) && size.length >= 2) {
      size[0] = Math.max(Number(size[0]) || 0, minWidth);
      size[1] = Math.max(Number(size[1]) || 0, minHeight);
    }
    if (Array.isArray(out) && out.length >= 2 && Array.isArray(size)) {
      out[0] = size[0];
      out[1] = size[1];
    }
    return size;
  };
}

function formatBytes(sizeBytes) {
  if (!sizeBytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = sizeBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function notifyError(message) {
  if (app?.ui?.dialog?.show) {
    app.ui.dialog.show(message);
  } else {
    console.error(message);
    alert(message);
  }
}

function injectStyles() {
  const styleId = "doubao-media-style-v5";
  document.getElementById("doubao-media-style")?.remove();
  document.getElementById("doubao-media-style-v2")?.remove();
  document.getElementById("doubao-media-style-v3")?.remove();
  document.getElementById("doubao-media-style-v4")?.remove();
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .doubao-media-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      overflow: hidden;
    }
    .doubao-toolbar {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      width: 100%;
      min-width: 0;
    }
    .doubao-btn {
      flex: 1;
      min-width: 0;
      padding: 4px 8px;
      border: 1px solid #556;
      background: #2e3440;
      color: #f5f5f5;
      border-radius: 4px;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .doubao-dropzone {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      flex-shrink: 0;
      border: 1px dashed #5f6b7a;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      font-size: 12px;
      line-height: 1.45;
      color: #d8dee9;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .doubao-dropzone.active { border-color: #7aa2f7; background: rgba(122, 162, 247, 0.08); }
    .doubao-hint {
      flex-shrink: 0;
      font-size: 11px;
      line-height: 1.4;
      color: #aeb6c2;
    }
    .doubao-progress {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      min-height: 40px;
    }
    .doubao-progress:not(.is-active) {
      visibility: hidden;
    }
    .doubao-progress-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .doubao-progress-outer {
      flex: 1;
      min-width: 0;
      width: auto;
      height: 8px;
      border-radius: 999px;
      background: #2d3443;
      overflow: hidden;
    }
    .doubao-cancel {
      flex: 0 0 auto;
      padding: 2px 10px;
      border: 1px solid #556;
      background: #3b4252;
      color: #eceff4;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      line-height: 1.4;
    }
    .doubao-cancel:hover:not(:disabled) { background: #4c566a; }
    .doubao-cancel:disabled { opacity: 0.45; cursor: default; }
    .doubao-progress-inner {
      width: 0;
      height: 100%;
      background: #7aa2f7;
      transition: width 120ms ease-out;
    }
    .doubao-progress-text {
      min-height: 1.3em;
      font-size: 11px;
      line-height: 1.3;
      color: #aeb6c2;
    }
    /* Vue / DOM widgets: keep the title column, clip the value instead of overlapping. */
    .lg-node-widget,
    [data-testid="node-widget"] {
      min-width: 0;
    }
    .lg-node-widget input,
    .lg-node-widget textarea,
    .lg-node-widget .p-inputtext,
    [data-testid="node-widget"] input,
    [data-testid="node-widget"] textarea,
    [data-testid="node-widget"] .p-inputtext {
      min-width: 0 !important;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .doubao-grid {
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      align-content: start;
    }
    .doubao-grid-1 { grid-template-columns: 1fr; }
    .doubao-grid-cards {
      grid-template-columns: repeat(auto-fill, 152px);
      justify-content: start;
      gap: 14px;
    }
    .doubao-card {
      position: relative;
      border: 1px solid #4c566a;
      border-radius: 6px;
      overflow: hidden;
      background: #1f2430;
      min-height: 80px;
      min-width: 0;
      cursor: pointer;
    }
    .doubao-card > img,
    .doubao-card > video {
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      display: block;
    }
    .doubao-grid-cards .doubao-card {
      width: 152px;
      max-width: 152px;
      height: 200px;
      min-height: 200px;
      max-height: 200px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .doubao-thumb {
      position: relative;
      flex: 0 0 120px;
      width: 100%;
      height: 120px;
      max-height: 120px;
      overflow: hidden;
      background: #161b26;
    }
    .doubao-thumb-file {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #d8dee9;
    }
    .doubao-grid-cards .doubao-thumb img,
    .doubao-grid-cards .doubao-thumb video {
      width: 100% !important;
      height: 120px !important;
      max-height: 120px !important;
      aspect-ratio: unset !important;
      object-fit: cover !important;
      object-position: center;
      display: block;
    }
    .doubao-card-body {
      flex: 0 0 60px;
      width: 100%;
      height: 60px;
      min-width: 0;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      text-align: left;
      box-sizing: border-box;
      overflow: hidden;
    }
    .doubao-card-title { padding: 8px; font-size: 12px; color: #eceff4; word-break: break-all; }
    .doubao-grid-cards .doubao-card-body .doubao-card-title {
      padding: 0;
      max-width: 100%;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: keep-all;
    }
    .doubao-card-sub { padding: 0 8px 8px; font-size: 11px; color: #aeb6c2; }
    .doubao-grid-cards .doubao-card-body .doubao-card-sub {
      padding: 0;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .doubao-remove {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 2;
      box-sizing: border-box;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 50%;
      appearance: none;
      -webkit-appearance: none;
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      font-size: 14px;
      line-height: 22px;
      padding: 0;
      cursor: pointer;
      opacity: 0.78;
      transition: background 120ms ease, opacity 120ms ease;
    }
    .doubao-grid-cards .doubao-remove {
      background: rgba(0, 0, 0, 0.55) !important;
      color: #fff !important;
    }
    .doubao-remove:hover {
      background: rgba(0, 0, 0, 0.85) !important;
      opacity: 1;
    }
    .doubao-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    .doubao-modal-content {
      max-width: 92vw;
      max-height: 92vh;
      background: #111722;
      border: 1px solid #444f61;
      border-radius: 8px;
      padding: 10px;
      color: #e5e9f0;
      overflow: auto;
    }
    .doubao-modal-content img,.doubao-modal-content video { max-width: 88vw; max-height: 80vh; display: block; }
    .doubao-split-wrap {
      display: flex;
      flex-direction: column;
      gap: 5px;
      width: 100%;
      flex: 0 0 auto;
      min-width: 0;
      box-sizing: border-box;
      overflow: hidden;
      padding-top: 2px;
    }
    .doubao-split-title {
      flex: 0 0 auto;
      font-size: 12px;
      color: #d6dded;
      font-weight: 600;
      line-height: 1.25;
      letter-spacing: 0.01em;
    }
    .doubao-split-summary {
      flex: 0 0 auto;
      font-size: 11px;
      color: #aab5c7;
      line-height: 1.2;
    }
    .doubao-split-warning {
      color: #f6c177;
    }
    .doubao-split-list {
      flex: 0 0 auto;
      overflow-x: hidden;
      overflow-y: auto;
      border: 1px solid #46516a;
      border-radius: 8px;
      background: linear-gradient(180deg, #242b3b 0%, #202737 100%);
      padding: 5px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
    }
    .doubao-split-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 7px;
      box-sizing: border-box;
      min-height: 34px;
      max-height: 34px;
      border: 1px solid #3b455d;
      border-radius: 7px;
      padding: 0 8px;
      font-size: 12px;
      line-height: 1.3;
      color: #e7ecf7;
      background: #2a3245;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 120ms ease, background 120ms ease;
    }
    .doubao-split-item:hover {
      border-color: #7b8fb8;
      background: #313a4f;
    }
    .doubao-split-item-index {
      flex: 0 0 32px;
      width: 32px;
      min-width: 32px;
      max-width: 32px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #c7d4ed;
      font-size: 10px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      user-select: none;
      border-radius: 999px;
      background: #1f2634;
      border: 1px solid #3c4962;
    }
    .doubao-split-item-body {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #dce4f5;
    }
    .doubao-split-modal-text {
      width: min(640px, 82vw);
      height: min(420px, 60vh);
      resize: none;
      border: 1px solid #4c566a;
      border-radius: 6px;
      background: #1d2432;
      color: #edf2fb;
      padding: 10px 12px;
      box-sizing: border-box;
      font-size: 13px;
      line-height: 1.55;
      font-family: inherit;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
    }
  `;
  document.head.appendChild(style);
}

function parseMultiline(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function decodeEscapedText(raw) {
  const source = String(raw || "");
  const placeholder = "\u0000";
  const preserved = source.replace(/\\\\/g, placeholder);
  return preserved
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\f/g, "\f")
    .replace(/\\v/g, "\v")
    .replace(new RegExp(placeholder, "g"), "\\");
}

function splitPromptText(inputText, delimiter, trimEach) {
  const text = String(inputText || "");
  const decodedDelimiter = decodeEscapedText(delimiter);
  const chunks = decodedDelimiter ? text.split(decodedDelimiter) : [text];
  const prompts = [];

  for (const chunk of chunks) {
    const value = trimEach ? chunk.trim() : chunk;
    if (!value) continue;
    prompts.push(value);
  }

  const limited = prompts.slice(0, DOUBAO_PROMPT_SPLIT_MAX_ITEMS);
  return {
    prompts: limited,
    totalBeforeLimit: prompts.length,
    limitHit: prompts.length > DOUBAO_PROMPT_SPLIT_MAX_ITEMS,
  };
}

function filenameFromPath(path) {
  return String(path || "").split(/[\\/]/).pop() || "unknown";
}

function fileExtensionLabel(name) {
  const filename = filenameFromPath(name);
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return "FILE";
  return filename.slice(dot + 1).toUpperCase();
}

function formatExtAndSize(name, sizeBytes) {
  return `${fileExtensionLabel(name)} · ${formatBytes(sizeBytes || 0)}`;
}

function mediaTypeForKind(kind) {
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  return "file";
}

const UPLOAD_STALL_MS = 60 * 1000;
const UPLOAD_MIN_TIMEOUT_MS = 90 * 1000;
const UPLOAD_OVERHEAD_MS = 45 * 1000;
const UPLOAD_MAX_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const UPLOAD_MIN_BYTES_PER_SEC = 64 * 1024;

function uploadTimeoutMs(sizeBytes) {
  const transferMs = Math.ceil((Math.max(Number(sizeBytes) || 0, 1) / UPLOAD_MIN_BYTES_PER_SEC) * 1000);
  return Math.min(UPLOAD_MAX_TIMEOUT_MS, Math.max(UPLOAD_MIN_TIMEOUT_MS, UPLOAD_OVERHEAD_MS + transferMs));
}

function makeUploadError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function uploadPathModeFile(file, kind, handlers = {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("media_type", mediaTypeForKind(kind));

    const request = new XMLHttpRequest();
    request.open("POST", api.apiURL("/doubao/upload"), true);

    let settled = false;
    let lastProgressAt = Date.now();
    let watchStall = true;
    const timeoutMs =
      Number(handlers.timeoutMs) > 0 ? Number(handlers.timeoutMs) : uploadTimeoutMs(file.size);

    const finish = (ok, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      clearInterval(stallTimer);
      if (ok) resolve(value);
      else reject(value);
    };

    const abortWith = (code) => {
      if (settled) return;
      const message = code === "timeout" ? ui().uploadTimeout : ui().uploadCancelled;
      finish(false, makeUploadError(message, code));
      try {
        request.abort();
      } catch (error) {
        console.error(error);
      }
    };

    const hardTimer = setTimeout(() => abortWith("timeout"), timeoutMs);
    const stallTimer = setInterval(() => {
      if (settled || !watchStall) return;
      if (Date.now() - lastProgressAt >= UPLOAD_STALL_MS) {
        abortWith("timeout");
      }
    }, 1000);

    request.timeout = timeoutMs;
    request.ontimeout = () => abortWith("timeout");

    if (typeof handlers.onProgress === "function") {
      request.upload.onprogress = (event) => {
        lastProgressAt = Date.now();
        if (!event.lengthComputable || event.total <= 0) return;
        const percent = Math.max(
          0,
          Math.min(100, Math.round((event.loaded / event.total) * 100))
        );
        handlers.onProgress(percent);
      };
    } else {
      request.upload.onprogress = () => {
        lastProgressAt = Date.now();
      };
    }

    request.upload.onload = () => {
      watchStall = false;
      lastProgressAt = Date.now();
    };

    request.onabort = () => {
      if (!settled) abortWith("cancelled");
    };

    request.onerror = () => {
      finish(false, new Error(ui().uploadNetworkError));
    };

    request.onload = () => {
      let payload = null;
      try {
        payload = request.responseText ? JSON.parse(request.responseText) : null;
      } catch (error) {
        console.error(error);
      }

      if (request.status < 200 || request.status >= 300) {
        const detail = payload?.error ? ` ${payload.error}` : "";
        finish(false, new Error(`${ui().uploadFailedComfy}${detail}`));
        return;
      }

      if (!payload?.ok || !payload?.path) {
        finish(false, new Error(payload?.error || ui().invalidServerPath));
        return;
      }

      if (typeof handlers.onProgress === "function") {
        handlers.onProgress(100);
      }
      finish(true, payload);
    };

    if (typeof handlers.onAbort === "function") {
      handlers.onAbort(() => abortWith("cancelled"));
    }

    request.send(formData);
  });
}

function showModal(contentNode) {
  const modal = document.createElement("div");
  modal.className = "doubao-modal";
  const content = document.createElement("div");
  content.className = "doubao-modal-content";
  content.appendChild(contentNode);
  modal.appendChild(content);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
  document.body.appendChild(modal);
}

function showPromptDetailModal(index, text) {
  const labels = ui();
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "8px";

  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.textContent = `${labels.splitPreview} #${index + 1}`;

  const textarea = document.createElement("textarea");
  textarea.className = "doubao-split-modal-text";
  textarea.readOnly = true;
  textarea.value = text;

  wrapper.appendChild(title);
  wrapper.appendChild(textarea);
  showModal(wrapper);
}

function extraVideoWidgetRows(node) {
  return ["TOS视频URL", "TOS_Bucket", "TOS_Prefix"].filter((name) => {
    const widget = findWidget(node, name);
    return Boolean(widget && !widget.hidden);
  }).length;
}

function syncMediaMinHeight(node) {
  if (!node?._doubaoMinHeight && !node?._doubaoMinWidth) return;
  node._doubaoMinWidth = Math.max(
    Number(node._doubaoMinWidth) || 0,
    DOUBAO_MEDIA_NODE_WIDTH
  );
  node._doubaoMinHeight =
    DOUBAO_MEDIA_NODE_HEIGHT + extraVideoWidgetRows(node) * (widgetRowHeight() + 4);
}

function refreshNodeLayout(node) {
  syncMediaMinHeight(node);
  if (typeof node.computeSize === "function") {
    const nextSize = node.computeSize(node.size);
    if (Array.isArray(nextSize) && nextSize.length >= 2) {
      const minWidth = getNodeMinWidth(node);
      const minHeight = getNodeMinHeight(node);
      const width = Math.max(node.size?.[0] || 0, nextSize[0] || 0, minWidth);
      const height = Math.max(node.size?.[1] || 0, nextSize[1] || 0, minHeight);
      if (typeof node.setSize === "function") {
        node.setSize([width, height]);
      } else {
        node.size = [width, height];
      }
    }
  } else {
    ensureNodeMinSize(node);
  }
  if (typeof node.onResize === "function") {
    node.onResize(node.size);
  }
  padOverlayInputs(node);
  node.setDirtyCanvas(true, true);
}

function installMediaNodeSizeDefaults(nodeType) {
  nodeType.prototype._doubaoMinWidth = DOUBAO_MEDIA_NODE_WIDTH;
  nodeType.prototype._doubaoMinHeight = DOUBAO_MEDIA_NODE_HEIGHT;
  if (!Array.isArray(nodeType.size) || nodeType.size[0] < DOUBAO_MEDIA_NODE_WIDTH) {
    nodeType.size = [DOUBAO_MEDIA_NODE_WIDTH, DOUBAO_MEDIA_NODE_HEIGHT];
  }
  if (nodeType.prototype._doubaoComputeSizeGuard) return;
  nodeType.prototype._doubaoComputeSizeGuard = true;
  const originalComputeSize = nodeType.prototype.computeSize;
  nodeType.prototype.computeSize = function doubaoMediaComputeSize(out) {
    const size = originalComputeSize
      ? originalComputeSize.apply(this, arguments)
      : [DOUBAO_MEDIA_NODE_WIDTH, DOUBAO_MEDIA_NODE_HEIGHT];
    const minWidth = Number(this._doubaoMinWidth) || DOUBAO_MEDIA_NODE_WIDTH;
    const minHeight = Number(this._doubaoMinHeight) || DOUBAO_MEDIA_NODE_HEIGHT;
    if (Array.isArray(size) && size.length >= 2) {
      size[0] = Math.max(Number(size[0]) || 0, minWidth);
      size[1] = Math.max(Number(size[1]) || 0, minHeight);
    }
    if (Array.isArray(out) && out.length >= 2 && Array.isArray(size)) {
      out[0] = size[0];
      out[1] = size[1];
    }
    return size;
  };
}

function installPromptSplitNodeSizeDefaults(nodeType) {
  nodeType.prototype._doubaoMinWidth = DOUBAO_PROMPT_SPLIT_MIN_WIDTH;
  nodeType.prototype._doubaoMinHeight = DOUBAO_PROMPT_SPLIT_MIN_HEIGHT;
  nodeType.prototype._doubaoMaxHeight = DOUBAO_PROMPT_SPLIT_NODE_HEIGHT;
  if (!Array.isArray(nodeType.size) || nodeType.size[0] < DOUBAO_PROMPT_SPLIT_NODE_WIDTH) {
    nodeType.size = [DOUBAO_PROMPT_SPLIT_NODE_WIDTH, DOUBAO_PROMPT_SPLIT_NODE_HEIGHT];
  }
  if (nodeType.prototype._doubaoSplitComputeSizeGuard) return;
  nodeType.prototype._doubaoSplitComputeSizeGuard = true;
  const originalComputeSize = nodeType.prototype.computeSize;
  nodeType.prototype.computeSize = function doubaoSplitComputeSize(out) {
    const size = originalComputeSize
      ? originalComputeSize.apply(this, arguments)
      : [DOUBAO_PROMPT_SPLIT_NODE_WIDTH, DOUBAO_PROMPT_SPLIT_NODE_HEIGHT];
    const minWidth = Number(this._doubaoMinWidth) || DOUBAO_PROMPT_SPLIT_MIN_WIDTH;
    const minHeight = Number(this._doubaoMinHeight) || DOUBAO_PROMPT_SPLIT_MIN_HEIGHT;
    const maxHeight = Number(this._doubaoMaxHeight) || DOUBAO_PROMPT_SPLIT_NODE_HEIGHT;
    if (Array.isArray(size) && size.length >= 2) {
      size[0] = Math.max(Number(size[0]) || 0, minWidth);
      size[1] = Math.min(Math.max(Number(size[1]) || 0, minHeight), maxHeight);
    }
    if (Array.isArray(out) && out.length >= 2 && Array.isArray(size)) {
      out[0] = size[0];
      out[1] = size[1];
    }
    return size;
  };
}

const DOUBAO_NODE_NAMES = new Set([
  "DoubaoModelConfig",
  "DoubaoTextInput",
  "DoubaoImageUpload",
  "DoubaoVideoUpload",
  "DoubaoFileUpload",
  "DoubaoRunCore",
  "DoubaoPromptSplitBatcher",
]);

function getNodeMinWidth(node) {
  return Number(node?._doubaoMinWidth) || DOUBAO_MIN_NODE_WIDTH;
}

function getNodeMinHeight(node) {
  return Number(node?._doubaoMinHeight) || 0;
}

function ensureNodeMinSize(node) {
  if (!Array.isArray(node.size) || node.size.length < 2) return;
  const minWidth = getNodeMinWidth(node);
  const minHeight = getNodeMinHeight(node);
  const width = Math.max(node.size[0] || 0, minWidth);
  const height = minHeight ? Math.max(node.size[1] || 0, minHeight) : node.size[1];
  if (width === node.size[0] && height === node.size[1]) return;
  node.size[0] = width;
  node.size[1] = height;
  if (typeof node.setSize === "function") {
    node.setSize([width, height]);
  }
}

function ensureNodeMinWidth(node, minWidth = getNodeMinWidth(node)) {
  if (minWidth) node._doubaoMinWidth = Math.max(Number(node._doubaoMinWidth) || 0, minWidth);
  ensureNodeMinSize(node);
}

function setTruncateWidgetValuesFirst(enabled) {
  const lg = globalThis.LiteGraph;
  if (!lg || !("truncateWidgetValuesFirst" in lg)) return undefined;
  const previous = lg.truncateWidgetValuesFirst;
  lg.truncateWidgetValuesFirst = enabled;
  return previous;
}

function padOverlayInputs(node) {
  for (const widget of node.widgets || []) {
    const el =
      widget.inputEl ||
      (widget.element?.tagName === "INPUT" || widget.element?.tagName === "TEXTAREA"
        ? widget.element
        : widget.element?.querySelector?.("input, textarea"));
    if (!el || !el.style) continue;
    if (widget.hidden) continue;
    const label = String(widget.label || widget.name || "");
    if (!label || widget.type === "customtext" || widget.type === "doubao_media") continue;
    const labelPx = Math.min(140, Math.max(56, label.length * 12 + 12));
    el.style.boxSizing = "border-box";
    el.style.paddingLeft = `${labelPx}px`;
    el.style.textOverflow = "ellipsis";
    el.style.overflow = "hidden";
    el.style.minWidth = "0";
  }
}

function wrapWidgetDrawForLabels(widget) {
  if (!widget || widget._doubaoLabelGuard) return;
  widget._doubaoLabelGuard = true;
  const originalDrawWidget = widget.drawWidget;
  if (typeof originalDrawWidget === "function") {
    widget.drawWidget = function drawWidgetGuarded(ctx, options) {
      const previous = setTruncateWidgetValuesFirst(true);
      try {
        return originalDrawWidget.call(this, ctx, options);
      } finally {
        if (previous !== undefined) setTruncateWidgetValuesFirst(previous);
      }
    };
  }
  const originalDraw = widget.draw;
  if (typeof originalDraw === "function") {
    widget.draw = function drawGuarded() {
      const previous = setTruncateWidgetValuesFirst(true);
      try {
        return originalDraw.apply(this, arguments);
      } finally {
        if (previous !== undefined) setTruncateWidgetValuesFirst(previous);
      }
    };
  }
}

function installLabelSafeWidgets(node) {
  ensureNodeMinWidth(node);
  if (!node._doubaoLabelSafe) {
    node._doubaoLabelSafe = true;
    const originalOnResize = node.onResize;
    node.onResize = function onResizeGuarded(size) {
      const minWidth = getNodeMinWidth(this);
      const minHeight = getNodeMinHeight(this);
      if (size?.[0] < minWidth) size[0] = minWidth;
      if (minHeight && size?.[1] < minHeight) size[1] = minHeight;
      if (this.size?.[0] < minWidth) this.size[0] = minWidth;
      if (minHeight && this.size?.[1] < minHeight) this.size[1] = minHeight;
      if (originalOnResize) originalOnResize.apply(this, arguments);
      padOverlayInputs(this);
    };
    const originalOnConfigure = node.onConfigure;
    node.onConfigure = function onConfigureGuarded() {
      const result = originalOnConfigure ? originalOnConfigure.apply(this, arguments) : undefined;
      ensureNodeMinSize(this);
      padOverlayInputs(this);
      return result;
    };
  }
  for (const widget of node.widgets || []) {
    wrapWidgetDrawForLabels(widget);
  }
  padOverlayInputs(node);
}

function applyHostWidth(element, innerWidth) {
  if (!element?.style) return;
  element.style.boxSizing = "border-box";
  element.style.width = `${innerWidth}px`;
  element.style.maxWidth = `${innerWidth}px`;
  element.style.minWidth = "0";
  element.style.overflow = "hidden";
}

function installMediaWidget(node, options) {
  injectStyles();
  const pathWidget = findWidget(node, options.pathField);
  if (!pathWidget) return null;
  node._doubaoMinWidth = options.minNodeWidth || DOUBAO_MEDIA_NODE_WIDTH;
  node._doubaoMinHeight = options.minNodeHeight || DOUBAO_MEDIA_NODE_HEIGHT;
  ensureNodeMinSize(node);

  const state = {
    pathItems: [],
  };
  node._doubaoMediaState = state;

  const container = document.createElement("div");
  container.className = "doubao-media-wrap";
  const toolbar = document.createElement("div");
  toolbar.className = "doubao-toolbar";
  const pickBtn = document.createElement("button");
  pickBtn.className = "doubao-btn";
  pickBtn.type = "button";
  pickBtn.textContent = options.pickButtonText;
  const clearBtn = document.createElement("button");
  clearBtn.className = "doubao-btn";
  clearBtn.type = "button";
  clearBtn.textContent = ui().clear;
  toolbar.appendChild(pickBtn);
  toolbar.appendChild(clearBtn);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.style.display = "none";
  fileInput.multiple = options.multiple;
  fileInput.accept = options.accept;

  const dropZone = document.createElement("div");
  dropZone.className = "doubao-dropzone";
  dropZone.textContent = options.dropText;

  const progressWrap = document.createElement("div");
  progressWrap.className = "doubao-progress";
  const progressRow = document.createElement("div");
  progressRow.className = "doubao-progress-row";
  const progressBarOuter = document.createElement("div");
  progressBarOuter.className = "doubao-progress-outer";
  const progressBarInner = document.createElement("div");
  progressBarInner.className = "doubao-progress-inner";
  progressBarInner.style.width = "0%";
  progressBarOuter.appendChild(progressBarInner);
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "doubao-cancel";
  cancelBtn.type = "button";
  cancelBtn.textContent = ui().cancelUpload;
  cancelBtn.disabled = true;
  progressRow.appendChild(progressBarOuter);
  progressRow.appendChild(cancelBtn);
  const progressText = document.createElement("div");
  progressText.className = "doubao-progress-text";
  progressWrap.appendChild(progressRow);
  progressWrap.appendChild(progressText);

  const hint = document.createElement("div");
  hint.className = "doubao-hint";
  if (options.hintText) {
    hint.textContent = options.hintText;
  } else {
    hint.style.display = "none";
  }

  const previewGrid = document.createElement("div");
  previewGrid.className = options.gridClass;

  container.appendChild(toolbar);
  container.appendChild(fileInput);
  container.appendChild(dropZone);
  container.appendChild(progressWrap);
  if (options.hintText) {
    container.appendChild(hint);
  }
  container.appendChild(previewGrid);

  const domWidget = node.addDOMWidget(`${options.kind}_uploader`, "doubao_media", container, {
    serialize: false,
    hideOnZoom: false,
  });

  function measureOtherWidgetsHeight() {
    let height = 0;
    for (const widget of node.widgets || []) {
      if (widget === domWidget) continue;
      const size = widget.computeSize ? widget.computeSize(node.size?.[0] || 280) : [0, 24];
      const widgetHeight = Array.isArray(size) ? size[1] : 24;
      if (widget.hidden || widgetHeight <= 0) continue;
      height += widgetHeight + 4;
    }
    return height;
  }

  function computeMediaSize(width) {
    const minWidth = getNodeMinWidth(node);
    const nodeWidth = node.size?.[0] ?? width ?? minWidth;
    const widgetWidth = Math.max(160, Math.min(nodeWidth, width ?? nodeWidth) - NODE_SIDE_PADDING);
    const otherHeight = measureOtherWidgetsHeight();
    const nodeHeight = node.size?.[1] ?? NODE_TITLE_HEIGHT + otherHeight + options.minWidgetHeight;
    const available = nodeHeight - NODE_TITLE_HEIGHT - otherHeight - NODE_BOTTOM_PADDING;
    return [widgetWidth, Math.max(options.minWidgetHeight, available)];
  }

  function applyMediaLayout() {
    const minWidth = getNodeMinWidth(node);
    ensureNodeMinSize(node);
    const nodeWidth = node.size?.[0] ?? minWidth;
    const innerWidth = Math.max(0, nodeWidth - NODE_SIDE_PADDING);
    const [, height] = computeMediaSize(nodeWidth);
    applyHostWidth(container, innerWidth);
    container.style.height = `${height}px`;
    if (domWidget.element && domWidget.element !== container) {
      applyHostWidth(domWidget.element, innerWidth);
      domWidget.element.style.height = `${height}px`;
    }
  }

  domWidget.computeSize = (width) => computeMediaSize(width);

  const originalOnResize = node.onResize;
  node.onResize = function onResize(size) {
    if (originalOnResize) {
      originalOnResize.apply(this, arguments);
    }
    applyMediaLayout(size);
  };

  function revokeItemUrl(item) {
    if (item.objectUrl) {
      URL.revokeObjectURL(item.objectUrl);
    }
  }

  function syncWidgets() {
    const lines = state.pathItems.map((item) => item.path || "");
    pathWidget.value = options.multiple ? lines.join("\n") : lines[0] || "";
    node.setDirtyCanvas(true, true);
  }

  let progressHideTimer = null;
  let uploadSession = null;

  function setUploadProgress(percent, statusText = "", canCancel = true) {
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
      progressHideTimer = null;
    }
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    progressBarInner.style.width = `${safePercent}%`;
    progressText.textContent = statusText || ui().uploadProgress(safePercent);
    progressWrap.classList.add("is-active");
    cancelBtn.disabled = !canCancel;
  }

  function hideUploadProgress() {
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
      progressHideTimer = null;
    }
    progressWrap.classList.remove("is-active");
    progressBarInner.style.width = "0%";
    progressText.textContent = "";
    cancelBtn.disabled = true;
  }

  function scheduleHideUploadProgress(delayMs = 2000) {
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
    }
    progressHideTimer = setTimeout(() => {
      progressHideTimer = null;
      hideUploadProgress();
    }, delayMs);
  }

  function renderCards() {
    previewGrid.innerHTML = "";
    const items = state.pathItems;
    if (!items.length) {
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "doubao-card";
      const displayName = item.name || ui().fileN(index);
      card.title = displayName;

      const removeBtn = document.createElement("button");
      removeBtn.className = "doubao-remove";
      removeBtn.type = "button";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        revokeItemUrl(item);
        items.splice(index, 1);
        syncWidgets();
        renderCards();
      });

      const thumb = document.createElement("div");
      thumb.className = "doubao-thumb";
      if (options.kind === "image" && item.previewUrl) {
        const img = document.createElement("img");
        img.src = item.previewUrl;
        img.alt = displayName;
        thumb.appendChild(img);
      } else if (options.kind === "video" && item.previewUrl) {
        const video = document.createElement("video");
        video.src = item.previewUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        thumb.appendChild(video);
      } else {
        const badge = document.createElement("div");
        badge.className = "doubao-thumb-file";
        badge.textContent = fileExtensionLabel(displayName);
        thumb.appendChild(badge);
      }
      thumb.appendChild(removeBtn);
      card.appendChild(thumb);

      const body = document.createElement("div");
      body.className = "doubao-card-body";
      const title = document.createElement("div");
      title.className = "doubao-card-title";
      title.textContent = displayName;
      const sub = document.createElement("div");
      sub.className = "doubao-card-sub";
      sub.textContent = formatExtAndSize(displayName, item.size || 0);
      body.appendChild(title);
      body.appendChild(sub);
      card.appendChild(body);

      if (options.kind === "image") {
        card.draggable = true;
        card.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text/plain", String(index));
        });
        card.addEventListener("dragover", (event) => {
          event.preventDefault();
        });
        card.addEventListener("drop", (event) => {
          event.preventDefault();
          const from = Number(event.dataTransfer.getData("text/plain"));
          const to = index;
          if (Number.isNaN(from) || from === to) return;
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          syncWidgets();
          renderCards();
        });
      }

      card.addEventListener("click", () => {
        if (options.kind === "image" && item.previewUrl) {
          const img = document.createElement("img");
          img.src = item.previewUrl;
          showModal(img);
          return;
        }
        if (options.kind === "video" && item.previewUrl) {
          const video = document.createElement("video");
          video.src = item.previewUrl;
          video.controls = true;
          video.autoplay = true;
          showModal(video);
          return;
        }
        const info = document.createElement("div");
        const labels = ui();
        info.innerHTML = `
          <div>${labels.fileName}: ${item.name || "-"}</div>
          <div>${labels.fileType}: ${item.mime || "-"}</div>
          <div>${labels.fileSize}: ${formatBytes(item.size || 0)}</div>
        `;
        showModal(info);
      });

      previewGrid.appendChild(card);
    });
  }

  function validateFile(file, currentItems) {
    const size = file.size || 0;
    if (options.kind === "image") {
      if (currentItems.length + 1 > 9) {
        throw new Error(ui().imageCountLimit);
      }
    } else if (options.kind === "video") {
      const maxBytes = typeof options.getMaxBytes === "function" ? options.getMaxBytes() : 512 * MB;
      if (size > maxBytes) {
        const strings = ui();
        const limitLabel = maxBytes > 512 * MB ? "2GB" : "512MB";
        const hint = maxBytes <= 512 * MB ? strings.videoHintLocal : strings.videoHintTos;
        throw new Error(strings.videoTooLarge(file.name, limitLabel, hint));
      }
    } else if (options.kind === "file") {
      if (size > 512 * MB) {
        throw new Error(ui().fileTooLarge(file.name));
      }
    }
  }

  async function processFiles(files) {
    if (uploadSession) {
      notifyError(ui().uploadInProgress);
      return;
    }
    const current = state.pathItems;
    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    if (!options.multiple && incoming.length > 1) {
      notifyError(ui().singleFileOnly);
      return;
    }

    if (options.kind === "image") {
      if (current.length + incoming.length > 9) {
        notifyError(ui().imageCountLimit);
        return;
      }
      const existingBytes = current.reduce((sum, item) => sum + (item.size || 0), 0);
      const incomingBytes = incoming.reduce((sum, file) => sum + (file.size || 0), 0);
      if (existingBytes + incomingBytes > 512 * MB) {
        notifyError(ui().imageTotalTooLarge);
        return;
      }
    }

    for (const file of incoming) {
      try {
        validateFile(file, current);
      } catch (error) {
        notifyError(error.message);
        return;
      }
    }

    if (!options.multiple) {
      current.forEach(revokeItemUrl);
      current.splice(0, current.length);
    }

    const totalFiles = incoming.length;
    const session = { aborted: false, abortCurrent: null };
    uploadSession = session;
    setUploadProgress(0, ui().uploading, true);
    for (const [index, file] of incoming.entries()) {
      if (session.aborted) break;
      const item = {
        name: file.name,
        size: file.size || 0,
        mime: file.type || options.fallbackMime,
      };
      let uploadResult;
      try {
        uploadResult = await uploadPathModeFile(file, options.kind, {
          timeoutMs: uploadTimeoutMs(file.size),
          onAbort: (abortFn) => {
            session.abortCurrent = abortFn;
          },
          onProgress: (filePercent) => {
            const overall = ((index + filePercent / 100) / totalFiles) * 100;
            setUploadProgress(overall, ui().uploadProgress(Math.round(overall)), true);
          },
        });
      } catch (error) {
        const code = error?.code;
        const message = error?.message || ui().pathUploadFailed;
        setUploadProgress(0, message, false);
        if (code !== "cancelled") {
          notifyError(message);
        }
        syncWidgets();
        renderCards();
        scheduleHideUploadProgress();
        uploadSession = null;
        return;
      }
      item.path = uploadResult.path;
      item.name = uploadResult.filename || file.name;
      item.size = uploadResult.size || file.size || 0;
      item.previewUrl = URL.createObjectURL(file);
      item.objectUrl = item.previewUrl;
      current.push(item);
    }

    uploadSession = null;
    if (session.aborted) {
      setUploadProgress(0, ui().uploadCancelled, false);
      syncWidgets();
      renderCards();
      scheduleHideUploadProgress();
      return;
    }
    setUploadProgress(100, ui().uploadComplete, false);
    syncWidgets();
    renderCards();
    scheduleHideUploadProgress();
  }

  function abortActiveUpload() {
    if (!uploadSession) return;
    uploadSession.aborted = true;
    uploadSession.abortCurrent?.();
  }

  function clearCurrent() {
    abortActiveUpload();
    state.pathItems.forEach(revokeItemUrl);
    state.pathItems.splice(0, state.pathItems.length);
    syncWidgets();
    renderCards();
    hideUploadProgress();
  }

  function hydrateFromWidgets() {
    state.pathItems.forEach(revokeItemUrl);
    state.pathItems = parseMultiline(pathWidget.value).map((line) => ({
      path: line,
      name: filenameFromPath(line),
      size: 0,
      mime: options.fallbackMime,
    }));
    hideUploadProgress();
    renderCards();
  }

  pickBtn.addEventListener("click", () => fileInput.click());
  clearBtn.addEventListener("click", clearCurrent);
  cancelBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    abortActiveUpload();
  });
  fileInput.addEventListener("change", async (event) => {
    await processFiles(event.target.files);
    fileInput.value = "";
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.add("active");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
  });
  dropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove("active");
    await processFiles(event.dataTransfer?.files || []);
  });

  toggleWidgetVisibility(pathWidget, false);
  hydrateFromWidgets();
  ensureNodeMinSize(node);
  applyMediaLayout();
  requestAnimationFrame(() => {
    ensureNodeMinSize(node);
    applyMediaLayout();
  });

  return {
    applyMediaLayout,
    setDropText(text) {
      dropZone.textContent = text;
    },
    setUploaderVisible(visible) {
      toggleWidgetVisibility(domWidget, visible);
      container.style.display = visible ? "flex" : "none";
      if (visible) {
        applyMediaLayout();
      }
    },
  };
}

function installPromptSplitPreview(node) {
  injectStyles();
  const delimiterWidget = findWidget(node, "delimiter");
  const trimWidget = findWidget(node, "trim_each");
  if (!delimiterWidget || !trimWidget) return;

  node._doubaoMinWidth = Math.max(Number(node._doubaoMinWidth) || 0, DOUBAO_PROMPT_SPLIT_MIN_WIDTH);
  node._doubaoMinHeight = Math.max(
    Number(node._doubaoMinHeight) || 0,
    DOUBAO_PROMPT_SPLIT_MIN_HEIGHT
  );
  node._doubaoMaxHeight = DOUBAO_PROMPT_SPLIT_NODE_HEIGHT;
  ensureNodeMinSize(node);

  const container = document.createElement("div");
  container.className = "doubao-split-wrap";

  const title = document.createElement("div");
  title.className = "doubao-split-title";
  container.appendChild(title);

  const summary = document.createElement("div");
  summary.className = "doubao-split-summary";
  container.appendChild(summary);

  const list = document.createElement("div");
  list.className = "doubao-split-list";
  list.style.height = `${DOUBAO_SPLIT_PREVIEW_LIST_HEIGHT}px`;
  list.style.maxHeight = `${DOUBAO_SPLIT_PREVIEW_LIST_HEIGHT}px`;
  container.appendChild(list);

  const state = {
    previewPrompts: [],
    fullPrompts: [],
    count: 0,
    limitHit: false,
  };

  const domWidget = node.addDOMWidget("split_preview", "doubao_split_preview", container, {
    serialize: false,
    hideOnZoom: false,
  });

  function computeWidgetSize(width) {
    const nodeWidth = node.size?.[0] ?? width ?? DOUBAO_PROMPT_SPLIT_NODE_WIDTH;
    const widgetWidth = Math.max(180, Math.min(nodeWidth, width ?? nodeWidth) - NODE_SIDE_PADDING);
    return [widgetWidth, DOUBAO_SPLIT_PREVIEW_WIDGET_HEIGHT];
  }

  function applyPreviewLayout() {
    ensureNodeMinSize(node);
    const nodeWidth = node.size?.[0] ?? getNodeMinWidth(node);
    const innerWidth = Math.max(0, nodeWidth - NODE_SIDE_PADDING);
    const fixedHeight = DOUBAO_SPLIT_PREVIEW_WIDGET_HEIGHT;
    applyHostWidth(container, innerWidth);
    container.style.height = `${fixedHeight}px`;
    container.style.maxHeight = `${fixedHeight}px`;
    if (domWidget.element && domWidget.element !== container) {
      applyHostWidth(domWidget.element, innerWidth);
      domWidget.element.style.height = `${fixedHeight}px`;
      domWidget.element.style.maxHeight = `${fixedHeight}px`;
    }
  }

  domWidget.computeSize = (width) => computeWidgetSize(width);

  const originalOnResize = node.onResize;
  node.onResize = function onResize(size) {
    if (originalOnResize) {
      originalOnResize.apply(this, arguments);
    }
    applyPreviewLayout(size);
  };

  function excerpt(text, maxLen = 60) {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}...`;
  }

  function formatIndexLabel(index) {
    return String(index + 1);
  }

  function renderPreview() {
    const labels = ui();
    const previewPrompts = state.previewPrompts;
    const fullPrompts = state.fullPrompts;
    title.textContent = labels.splitPreview;
    summary.classList.toggle("doubao-split-warning", state.limitHit);
    const baseText = labels.promptsTotal(state.count || fullPrompts.length || previewPrompts.length);
    summary.textContent = state.limitHit
      ? `${baseText} · ${labels.splitLimitHit(DOUBAO_PROMPT_SPLIT_MAX_ITEMS)}`
      : baseText;

    list.innerHTML = "";
    if (!fullPrompts.length && !previewPrompts.length) {
      const empty = document.createElement("div");
      empty.className = "doubao-split-item";
      empty.style.cursor = "default";

      const emptyIndex = document.createElement("div");
      emptyIndex.className = "doubao-split-item-index";
      emptyIndex.textContent = "-";
      empty.appendChild(emptyIndex);

      const emptyBody = document.createElement("div");
      emptyBody.className = "doubao-split-item-body";
      emptyBody.textContent = "-";
      empty.appendChild(emptyBody);

      list.appendChild(empty);
      return;
    }

    const total = Math.max(fullPrompts.length, previewPrompts.length);
    for (let index = 0; index < total; index += 1) {
      const fullText = fullPrompts[index] ?? previewPrompts[index] ?? "";
      const summaryText = previewPrompts[index] ?? excerpt(fullText, 60);
      const item = document.createElement("div");
      item.className = "doubao-split-item";

      const indexEl = document.createElement("div");
      indexEl.className = "doubao-split-item-index";
      indexEl.textContent = formatIndexLabel(index);
      item.appendChild(indexEl);

      const body = document.createElement("div");
      body.className = "doubao-split-item-body";
      body.textContent = summaryText;
      item.appendChild(body);

      item.addEventListener("click", (event) => {
        event.stopPropagation();
        showPromptDetailModal(index, fullText);
      });
      list.appendChild(item);
    }
  }

  function syncPreviewFromExecution(previewPrompts, fullPrompts, count, limitHit) {
    state.previewPrompts = Array.isArray(previewPrompts)
      ? previewPrompts.map((item) => String(item ?? ""))
      : [];
    state.fullPrompts = Array.isArray(fullPrompts) ? fullPrompts.map((item) => String(item ?? "")) : [];
    state.count = Number.isFinite(Number(count))
      ? Number(count)
      : state.fullPrompts.length || state.previewPrompts.length;
    state.limitHit = Boolean(limitHit);
    renderPreview();
  }

  const originalOnExecuted = node.onExecuted;
  node.onExecuted = function onExecutedPromptSplit(message) {
    const previewPrompts = message?.split_preview || [];
    const fullPrompts = message?.split_full || [];
    const count = Array.isArray(message?.split_count) ? message.split_count[0] : fullPrompts.length;
    const limitHit = Array.isArray(message?.split_limit_hit) ? message.split_limit_hit[0] : false;
    syncPreviewFromExecution(previewPrompts, fullPrompts, count, limitHit);
    if (originalOnExecuted) {
      return originalOnExecuted.apply(this, arguments);
    }
    return undefined;
  };

  syncPreviewFromExecution([], [], 0, false);
  applyPreviewLayout();
  requestAnimationFrame(() => {
    ensureNodeMinSize(node);
    applyPreviewLayout();
  });
}

function isKnownVideoMode(value) {
  return value === VIDEO_MODE_LOCAL || value === VIDEO_MODE_TOS_BUCKET || value === VIDEO_MODE_TOS_URL;
}

function inferVideoMode(node) {
  const modeWidget = findWidget(node, "输入方式");
  const url = String(findWidget(node, "TOS视频URL")?.value || "").trim();
  const bucket = String(findWidget(node, "TOS_Bucket")?.value || "").trim();
  const current = String(modeWidget?.value || "");

  if (isKnownVideoMode(current)) {
    if (current === VIDEO_MODE_LOCAL) {
      if (url.toLowerCase().startsWith("tos://")) {
        return VIDEO_MODE_TOS_URL;
      }
      if (bucket) {
        return VIDEO_MODE_TOS_BUCKET;
      }
    }
    return current;
  }

  if (url.toLowerCase().startsWith("tos://")) {
    return VIDEO_MODE_TOS_URL;
  }
  if (bucket) {
    return VIDEO_MODE_TOS_BUCKET;
  }
  return VIDEO_MODE_LOCAL;
}

function installVideoInputMode(node, mediaCtl) {
  const modeWidget = findWidget(node, "输入方式");
  const urlWidget = findWidget(node, "TOS视频URL");
  const bucketWidget = findWidget(node, "TOS_Bucket");
  const prefixWidget = findWidget(node, "TOS_Prefix");
  if (!modeWidget || !mediaCtl) return;

  toggleWidgetVisibility(findWidget(node, "fps"), false);
  const fpsWidget = findWidget(node, "fps");
  if (fpsWidget) fpsWidget.value = 1.0;

  node._doubaoVideoMaxBytes = 512 * MB;

  function applyVideoMode(options = {}) {
    const inferLegacy = Boolean(options.inferLegacy);
    let mode = String(modeWidget.value || VIDEO_MODE_LOCAL);
    if (inferLegacy) {
      mode = inferVideoMode(node);
      if (modeWidget.value !== mode) {
        modeWidget.value = mode;
      }
    }
    if (!isKnownVideoMode(mode)) {
      mode = VIDEO_MODE_LOCAL;
      modeWidget.value = mode;
    }

    const showUploader = mode !== VIDEO_MODE_TOS_URL;
    const showUrl = mode === VIDEO_MODE_TOS_URL;
    const showBucket = mode === VIDEO_MODE_TOS_BUCKET;
    node._doubaoVideoMaxBytes = showBucket ? 2 * 1024 * MB : 512 * MB;

    toggleWidgetVisibility(urlWidget, showUrl);
    toggleWidgetVisibility(bucketWidget, showBucket);
    toggleWidgetVisibility(prefixWidget, showBucket);
    toggleWidgetVisibility(findWidget(node, "fps"), false);
    mediaCtl.setUploaderVisible(showUploader);

    if (mode === VIDEO_MODE_TOS_BUCKET) {
      mediaCtl.setDropText(ui().dropVideoTos);
    } else if (mode === VIDEO_MODE_LOCAL) {
      mediaCtl.setDropText(ui().dropVideoLocal);
    }

    syncMediaMinHeight(node);
    refreshNodeLayout(node);
    requestAnimationFrame(() => {
      syncMediaMinHeight(node);
      refreshNodeLayout(node);
      mediaCtl.applyMediaLayout();
    });
  }

  node._doubaoApplyVideoMode = applyVideoMode;

  const originalCallback = modeWidget.callback;
  modeWidget.callback = (value, ...args) => {
    if (value !== undefined) {
      modeWidget.value = value;
    }
    applyVideoMode({ inferLegacy: false });
    if (originalCallback) {
      originalCallback.call(modeWidget, value, ...args);
    }
  };

  applyVideoMode({ inferLegacy: true });
}

function installModelPresetBinding(node) {
  const presetWidget = findWidget(node, "模型预设");
  const modelIdWidget = findWidget(node, "model_id");
  if (!presetWidget || !modelIdWidget) return;

  const updateModelId = (value) => {
    const fullModelId = MODEL_PRESET_TO_ID[String(value || "")] || String(value || "");
    modelIdWidget.value = fullModelId;
    node.setDirtyCanvas(true, true);
  };
  const originalCallback = presetWidget.callback;
  presetWidget.callback = (value, ...args) => {
    updateModelId(value);
    if (originalCallback) {
      originalCallback.call(presetWidget, value, ...args);
    }
  };
  updateModelId(presetWidget.value);
}

app.registerExtension({
  name: "comfyui.doubao.api.multimodal.widgets",
  setup() {
    setTruncateWidgetValuesFirst(true);
  },
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name === "DoubaoRunCore") {
      installDoubaoRunCoreSizeDefaults(nodeType);
      const forcePromptInputs = (group) => {
        if (!group) return;
        for (const key of ["system_prompt", "user_prompt", "text", "previous_response_id"]) {
          if (!group[key]) continue;
          group[key][1] = { ...(group[key][1] || {}), forceInput: true, multiline: true };
        }
      };
      forcePromptInputs(nodeData.input?.required);
      forcePromptInputs(nodeData.input?.optional);

      const originalOnConfigure = nodeType.prototype.onConfigure;
      nodeType.prototype.onConfigure = function onConfigure() {
        const result = originalOnConfigure ? originalOnConfigure.apply(this, arguments) : undefined;
        hideDoubaoRunCoreTextWidgets(this);
        installDoubaoRunCoreContextCache(this);
        applyDoubaoRunCoreSize(this, { preferDefault: false });
        return result;
      };
    }

    if (["DoubaoImageUpload", "DoubaoVideoUpload", "DoubaoFileUpload"].includes(nodeData.name)) {
      installMediaNodeSizeDefaults(nodeType);
    }
    if (nodeData.name === "DoubaoPromptSplitBatcher") {
      installPromptSplitNodeSizeDefaults(nodeType);
    }

    if (nodeData.name === "DoubaoVideoUpload") {
      const originalOnConfigure = nodeType.prototype.onConfigure;
      nodeType.prototype.onConfigure = function onConfigure() {
        const result = originalOnConfigure ? originalOnConfigure.apply(this, arguments) : undefined;
        if (typeof this._doubaoApplyVideoMode === "function") {
          this._doubaoApplyVideoMode({ inferLegacy: true });
        }
        return result;
      };
    }

    const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function onNodeCreated() {
      const result = originalOnNodeCreated ? originalOnNodeCreated.apply(this, arguments) : undefined;

      if (DOUBAO_NODE_NAMES.has(nodeData.name)) {
        injectStyles();
      }
      if (nodeData.name === "DoubaoRunCore") {
        hideDoubaoRunCoreTextWidgets(this);
        installDoubaoRunCoreContextCache(this);
      }
      if (nodeData.name === "DoubaoModelConfig") {
        installModelPresetBinding(this);
      }
      if (nodeData.name === "DoubaoImageUpload") {
        installMediaWidget(this, {
          kind: "image",
          multiple: true,
          accept: ".jpg,.jpeg,.png,.webp,.bmp",
          fallbackMime: "image/png",
          pathField: "图片路径列表",
          pickButtonText: ui().pickImage,
          dropText: ui().dropImages,
          gridClass: "doubao-grid doubao-grid-cards",
          minWidgetHeight: DOUBAO_MEDIA_MIN_WIDGET_HEIGHT,
          minNodeWidth: DOUBAO_MEDIA_NODE_WIDTH,
          minNodeHeight: DOUBAO_MEDIA_NODE_HEIGHT,
        });
      }
      if (nodeData.name === "DoubaoVideoUpload") {
        const mediaCtl = installMediaWidget(this, {
          kind: "video",
          multiple: false,
          accept: ".mp4,.avi,.mov,.mkv",
          fallbackMime: "video/mp4",
          pathField: "视频文件路径",
          pickButtonText: ui().pickVideo,
          dropText: ui().dropVideoLocal,
          gridClass: "doubao-grid doubao-grid-cards",
          minWidgetHeight: DOUBAO_MEDIA_MIN_WIDGET_HEIGHT,
          minNodeWidth: DOUBAO_MEDIA_NODE_WIDTH,
          minNodeHeight: DOUBAO_MEDIA_NODE_HEIGHT,
          getMaxBytes: () => this._doubaoVideoMaxBytes || 512 * MB,
        });
        installVideoInputMode(this, mediaCtl);
      }
      if (nodeData.name === "DoubaoFileUpload") {
        installMediaWidget(this, {
          kind: "file",
          multiple: false,
          accept: ".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.md",
          fallbackMime: "application/octet-stream",
          pathField: "文件路径",
          pickButtonText: ui().pickFile,
          dropText: ui().dropFile,
          gridClass: "doubao-grid doubao-grid-cards",
          minWidgetHeight: DOUBAO_MEDIA_MIN_WIDGET_HEIGHT,
          minNodeWidth: DOUBAO_MEDIA_NODE_WIDTH,
          minNodeHeight: DOUBAO_MEDIA_NODE_HEIGHT,
        });
      }
      if (nodeData.name === "DoubaoPromptSplitBatcher") {
        installPromptSplitPreview(this);
      }
      if (DOUBAO_NODE_NAMES.has(nodeData.name)) {
        installLabelSafeWidgets(this);
        ensureNodeMinSize(this);
      }
      if (nodeData.name === "DoubaoRunCore") {
        installDoubaoRunCoreLayout(this);
      }

      return result;
    };
  },
});
