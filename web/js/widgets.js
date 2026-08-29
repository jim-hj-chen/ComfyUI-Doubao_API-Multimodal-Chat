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
const DOUBAO_MIN_NODE_WIDTH = 360;
const DOUBAO_MEDIA_MIN_WIDTH = {
  image: 360,
  video: 400,
  file: 360,
};
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

function toggleWidgetVisibility(widget, visible) {
  if (!widget) return;
  if (!widget._doubaoOriginalComputeSize) {
    widget._doubaoOriginalComputeSize = widget.computeSize;
  }
  widget.hidden = !visible;
  widget.computeSize = visible
    ? widget._doubaoOriginalComputeSize
    : () => [0, -4];
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
  const styleId = "doubao-media-style-v2";
  const previous = document.getElementById("doubao-media-style");
  if (previous) previous.remove();
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
      gap: 4px;
    }
    .doubao-progress-outer {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: #2d3443;
      overflow: hidden;
    }
    .doubao-progress-inner {
      width: 0;
      height: 100%;
      background: #7aa2f7;
      transition: width 120ms ease-out;
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
    .doubao-grid-images {
      grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
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
    .doubao-card img,.doubao-card video {
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      display: block;
    }
    .doubao-grid-images .doubao-card {
      height: 200px;
      min-height: 200px;
      max-height: 200px;
      display: flex;
      flex-direction: column;
    }
    .doubao-thumb {
      position: relative;
      flex: 0 0 120px;
      width: 100%;
      height: 120px;
      overflow: hidden;
      background: #161b26;
    }
    .doubao-grid-images .doubao-thumb img {
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .doubao-card-body {
      flex: 0 0 60px;
      height: 60px;
      min-width: 0;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      text-align: left;
      box-sizing: border-box;
    }
    .doubao-card-title { padding: 8px; font-size: 12px; color: #eceff4; word-break: break-all; }
    .doubao-grid-images .doubao-card-title {
      padding: 0;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: normal;
    }
    .doubao-card-sub { padding: 0 8px 8px; font-size: 11px; color: #aeb6c2; }
    .doubao-grid-images .doubao-card-sub {
      padding: 0;
      line-height: 1.25;
    }
    .doubao-remove {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      color: rgba(255, 255, 255, 0.88);
      font-size: 14px;
      line-height: 20px;
      padding: 0;
      cursor: pointer;
      opacity: 0.72;
      transition: background 120ms ease, opacity 120ms ease, color 120ms ease;
    }
    .doubao-remove:hover {
      background: rgba(0, 0, 0, 0.78);
      color: #fff;
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
  `;
  document.head.appendChild(style);
}

function parseMultiline(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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

function uploadPathModeFile(file, kind, handlers = {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("media_type", mediaTypeForKind(kind));

    const request = new XMLHttpRequest();
    request.open("POST", api.apiURL("/doubao/upload"), true);

    if (typeof handlers.onProgress === "function") {
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable || event.total <= 0) return;
        const percent = Math.max(
          0,
          Math.min(100, Math.round((event.loaded / event.total) * 100))
        );
        handlers.onProgress(percent);
      };
    }

    request.onerror = () => {
      reject(new Error(ui().uploadNetworkError));
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
        reject(new Error(`${ui().uploadFailedComfy}${detail}`));
        return;
      }

      if (!payload?.ok || !payload?.path) {
        reject(new Error(payload?.error || ui().invalidServerPath));
        return;
      }

      if (typeof handlers.onProgress === "function") {
        handlers.onProgress(100);
      }
      resolve(payload);
    };

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

function refreshNodeLayout(node) {
  if (typeof node.computeSize === "function") {
    const nextSize = node.computeSize(node.size);
    if (Array.isArray(nextSize) && nextSize.length >= 2) {
      node.setSize([node.size?.[0] ?? nextSize[0], nextSize[1]]);
    }
  }
  node.setDirtyCanvas(true, true);
}

const DOUBAO_NODE_NAMES = new Set([
  "DoubaoModelConfig",
  "DoubaoTextInput",
  "DoubaoImageUpload",
  "DoubaoVideoUpload",
  "DoubaoFileUpload",
  "DoubaoRun",
]);

function getNodeMinWidth(node) {
  return Number(node?._doubaoMinWidth) || DOUBAO_MIN_NODE_WIDTH;
}

function ensureNodeMinWidth(node, minWidth = getNodeMinWidth(node)) {
  if (!Array.isArray(node.size) || node.size.length < 2) return;
  if (node.size[0] >= minWidth) return;
  node.size[0] = minWidth;
  if (typeof node.setSize === "function") {
    node.setSize([minWidth, node.size[1]]);
  }
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
      if (size?.[0] < minWidth) size[0] = minWidth;
      if (this.size?.[0] < minWidth) this.size[0] = minWidth;
      if (originalOnResize) originalOnResize.apply(this, arguments);
      padOverlayInputs(this);
    };
    const originalOnConfigure = node.onConfigure;
    node.onConfigure = function onConfigureGuarded() {
      const result = originalOnConfigure ? originalOnConfigure.apply(this, arguments) : undefined;
      ensureNodeMinWidth(this);
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
  node._doubaoMinWidth = options.minNodeWidth || DOUBAO_MEDIA_MIN_WIDTH[options.kind] || DOUBAO_MIN_NODE_WIDTH;
  ensureNodeMinWidth(node);

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
  progressWrap.style.display = "none";
  const progressBarOuter = document.createElement("div");
  progressBarOuter.className = "doubao-progress-outer";
  const progressBarInner = document.createElement("div");
  progressBarInner.className = "doubao-progress-inner";
  progressBarInner.style.width = "0%";
  progressBarOuter.appendChild(progressBarInner);
  const progressText = document.createElement("div");
  progressText.className = "doubao-card-sub";
  progressWrap.appendChild(progressBarOuter);
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
    ensureNodeMinWidth(node, minWidth);
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

  function setUploadProgress(percent, statusText = "") {
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
      progressHideTimer = null;
    }
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    progressBarInner.style.width = `${safePercent}%`;
    progressText.textContent = statusText || ui().uploadProgress(safePercent);
    progressWrap.style.display = "block";
  }

  function hideUploadProgress() {
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
      progressHideTimer = null;
    }
    progressWrap.style.display = "none";
    progressBarInner.style.width = "0%";
    progressText.textContent = "";
  }

  function scheduleHideUploadProgress(delayMs = 2000) {
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
    }
    progressHideTimer = setTimeout(() => {
      progressHideTimer = null;
      hideUploadProgress();
      refreshNodeLayout(node);
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
      const isImageCard = options.kind === "image";
      if (isImageCard) {
        card.title = displayName;
      }

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

      if (isImageCard) {
        const thumb = document.createElement("div");
        thumb.className = "doubao-thumb";
        if (item.previewUrl) {
          const img = document.createElement("img");
          img.src = item.previewUrl;
          img.alt = displayName;
          thumb.appendChild(img);
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
      } else {
        if (options.kind === "video" && item.previewUrl) {
          const video = document.createElement("video");
          video.src = item.previewUrl;
          video.muted = true;
          video.playsInline = true;
          video.preload = "metadata";
          card.appendChild(video);
        }

        const title = document.createElement("div");
        title.className = "doubao-card-title";
        title.textContent = displayName;
        card.appendChild(title);
        const sub = document.createElement("div");
        sub.className = "doubao-card-sub";
        sub.textContent = `${item.mime || "unknown"} | ${formatBytes(item.size || 0)}`;
        card.appendChild(sub);
        card.appendChild(removeBtn);
      }

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
    setUploadProgress(0, ui().uploading);
    for (const [index, file] of incoming.entries()) {
      const item = {
        name: file.name,
        size: file.size || 0,
        mime: file.type || options.fallbackMime,
      };
      let uploadResult;
      try {
        uploadResult = await uploadPathModeFile(file, options.kind, {
          onProgress: (filePercent) => {
            const overall = ((index + filePercent / 100) / totalFiles) * 100;
            setUploadProgress(overall);
          },
        });
      } catch (error) {
        setUploadProgress(0, error.message || ui().pathUploadFailed);
        notifyError(error.message || ui().pathUploadFailed);
        syncWidgets();
        renderCards();
        scheduleHideUploadProgress();
        return;
      }
      item.path = uploadResult.path;
      item.name = uploadResult.filename || file.name;
      item.size = uploadResult.size || file.size || 0;
      item.previewUrl = URL.createObjectURL(file);
      item.objectUrl = item.previewUrl;
      current.push(item);
    }

    setUploadProgress(100, ui().uploadComplete);
    syncWidgets();
    renderCards();
    scheduleHideUploadProgress();
  }

  function clearCurrent() {
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
  applyMediaLayout();
  requestAnimationFrame(() => applyMediaLayout());

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

    mediaCtl.applyMediaLayout();
    refreshNodeLayout(node);
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
          gridClass: "doubao-grid doubao-grid-images",
          minWidgetHeight: 280,
          minNodeWidth: DOUBAO_MEDIA_MIN_WIDTH.image,
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
          gridClass: "doubao-grid doubao-grid-1",
          minWidgetHeight: 160,
          minNodeWidth: DOUBAO_MEDIA_MIN_WIDTH.video,
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
          gridClass: "doubao-grid doubao-grid-1",
          minWidgetHeight: 160,
          minNodeWidth: DOUBAO_MEDIA_MIN_WIDTH.file,
        });
      }

      if (DOUBAO_NODE_NAMES.has(nodeData.name)) {
        installLabelSafeWidgets(this);
      }

      return result;
    };
  },
});
