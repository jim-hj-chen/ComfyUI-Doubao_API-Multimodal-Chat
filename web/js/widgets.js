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
const VIDEO_MODE_LOCAL = "本地上传（≤512MB）";
const VIDEO_MODE_TOS_BUCKET = "TOS 对象存储上传（≤2GB）";
const VIDEO_MODE_TOS_URL = "已有 TOS 视频地址";

const UI_STRINGS = {
  en: {
    clear: "Clear",
    pickImage: "Choose images",
    pickVideo: "Choose video",
    pickFile: "Choose file",
    dropImages: "Drop images here (multiple allowed)",
    dropVideoLocal: "Drop a video here (single file, max 512MB)",
    dropVideoTos: "Drop a video here (stored on Volcengine TOS, max 2GB)",
    dropFile: "Drop a document here (single file)",
    fileN: (index) => `File ${index + 1}`,
    uploadFailed: "Upload to server failed.",
    invalidServerPath: "Server did not return a valid path.",
    imageCountLimit: "Too many images. Maximum is 9.",
    imageTooLarge: (name) => `Image ${name} exceeds 512MB.`,
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
    dropImages: "拖拽图片到此处（支持多张）",
    dropVideoLocal: "拖拽视频到此处（仅单个，最大 512MB）",
    dropVideoTos: "拖拽视频到此处（将存入火山引擎 TOS，最大 2GB）",
    dropFile: "拖拽文档到此处（仅单个）",
    fileN: (index) => `第 ${index + 1} 个文件`,
    uploadFailed: "上传到服务器失败。",
    invalidServerPath: "服务器未返回有效路径。",
    imageCountLimit: "图片数量超限，最多允许 9 张。",
    imageTooLarge: (name) => `图片 ${name} 超过 512MB。`,
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
  if (document.getElementById("doubao-media-style")) return;
  const style = document.createElement("style");
  style.id = "doubao-media-style";
  style.textContent = `
    .doubao-media-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      overflow: hidden;
    }
    .doubao-toolbar { display: flex; gap: 8px; flex-shrink: 0; }
    .doubao-btn {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #556;
      background: #2e3440;
      color: #f5f5f5;
      border-radius: 4px;
      cursor: pointer;
    }
    .doubao-dropzone {
      width: 100%;
      box-sizing: border-box;
      flex-shrink: 0;
      border: 1px dashed #5f6b7a;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      color: #d8dee9;
    }
    .doubao-dropzone.active { border-color: #7aa2f7; background: rgba(122, 162, 247, 0.08); }
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
    .doubao-card-title { padding: 8px; font-size: 12px; color: #eceff4; word-break: break-all; }
    .doubao-card-sub { padding: 0 8px 8px; font-size: 11px; color: #aeb6c2; }
    .doubao-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 50%;
      background: rgba(0,0,0,.6);
      color: #fff;
      cursor: pointer;
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

function mediaTypeForKind(kind) {
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  return "file";
}

async function uploadPathModeFile(file, kind) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("media_type", mediaTypeForKind(kind));

  const response = await api.fetchApi("/doubao/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    let message = ui().uploadFailed;
    try {
      const payload = await response.json();
      message = payload?.error || message;
    } catch (error) {
      console.error(error);
    }
    throw new Error(message);
  }
  const payload = await response.json();
  if (!payload?.ok || !payload?.path) {
    throw new Error(payload?.error || ui().invalidServerPath);
  }
  return payload;
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

function installMediaWidget(node, options) {
  injectStyles();
  const pathWidget = findWidget(node, options.pathField);
  if (!pathWidget) return null;

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

  const previewGrid = document.createElement("div");
  previewGrid.className = options.gridClass;

  container.appendChild(toolbar);
  container.appendChild(fileInput);
  container.appendChild(dropZone);
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
    const nodeWidth = node.size?.[0] ?? width ?? 280;
    const widgetWidth = Math.max(160, (width ?? nodeWidth) - 0);
    const otherHeight = measureOtherWidgetsHeight();
    const nodeHeight = node.size?.[1] ?? NODE_TITLE_HEIGHT + otherHeight + options.minWidgetHeight;
    const available = nodeHeight - NODE_TITLE_HEIGHT - otherHeight - NODE_BOTTOM_PADDING;
    return [widgetWidth, Math.max(options.minWidgetHeight, available)];
  }

  function applyMediaLayout() {
    const nodeWidth = node.size?.[0] ?? 280;
    const innerWidth = Math.max(0, nodeWidth - NODE_SIDE_PADDING);
    const [, height] = computeMediaSize(nodeWidth);
    container.style.width = `${innerWidth}px`;
    container.style.height = `${height}px`;
    if (domWidget.element && domWidget.element !== container) {
      domWidget.element.style.width = `${innerWidth}px`;
      domWidget.element.style.height = `${height}px`;
      domWidget.element.style.overflow = "hidden";
      domWidget.element.style.boxSizing = "border-box";
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

  function renderCards() {
    previewGrid.innerHTML = "";
    const items = state.pathItems;
    if (!items.length) {
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "doubao-card";

      if (options.kind === "image" && item.previewUrl) {
        const img = document.createElement("img");
        img.src = item.previewUrl;
        card.appendChild(img);
      } else if (options.kind === "video" && item.previewUrl) {
        const video = document.createElement("video");
        video.src = item.previewUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        card.appendChild(video);
      }

      const title = document.createElement("div");
      title.className = "doubao-card-title";
      title.textContent = item.name || ui().fileN(index);
      card.appendChild(title);
      const sub = document.createElement("div");
      sub.className = "doubao-card-sub";
      sub.textContent = `${item.mime || "unknown"} | ${formatBytes(item.size || 0)}`;
      card.appendChild(sub);

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
      card.appendChild(removeBtn);

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
      if (size > 512 * MB) {
        throw new Error(ui().imageTooLarge(file.name));
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

    for (const file of incoming) {
      const item = {
        name: file.name,
        size: file.size || 0,
        mime: file.type || options.fallbackMime,
      };
      let uploadResult;
      try {
        uploadResult = await uploadPathModeFile(file, options.kind);
      } catch (error) {
        notifyError(error.message || ui().pathUploadFailed);
        return;
      }
      item.path = uploadResult.path;
      item.name = uploadResult.filename || file.name;
      item.size = uploadResult.size || file.size || 0;
      item.previewUrl = URL.createObjectURL(file);
      item.objectUrl = item.previewUrl;
      current.push(item);
    }

    syncWidgets();
    renderCards();
  }

  function clearCurrent() {
    state.pathItems.forEach(revokeItemUrl);
    state.pathItems.splice(0, state.pathItems.length);
    syncWidgets();
    renderCards();
  }

  function hydrateFromWidgets() {
    state.pathItems.forEach(revokeItemUrl);
    state.pathItems = parseMultiline(pathWidget.value).map((line) => ({
      path: line,
      name: filenameFromPath(line),
      size: 0,
      mime: options.fallbackMime,
    }));
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
          gridClass: "doubao-grid",
          minWidgetHeight: 180,
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
        });
      }

      return result;
    };
  },
});
