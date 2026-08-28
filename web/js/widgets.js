import { app } from "/scripts/app.js";

const IMAGE_MODE_PATH = "本地文件路径（推荐）";
const VIDEO_MODE_PATH = "本地文件路径（推荐）";
const FILE_MODE_PATH = "本地文件路径（推荐）";
const BASE64_MODE = "Base64 编码上传";
const MODEL_PRESET_TO_ID = {
  "doubao-seed-evolving": "doubao-seed-evolving",
  "doubao-seed-2-1-pro": "doubao-seed-2-1-pro-260628",
  "doubao-seed-2-1-turbo": "doubao-seed-2-1-turbo-260628",
  "doubao-seed-2-0-lite": "doubao-seed-2-0-lite-260428",
  "doubao-seed-2-0-mini": "doubao-seed-2-0-mini-260428",
  "自定义": "",
};
const MB = 1024 * 1024;

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

function installModeToggle(node, modeWidgetName, rules, onModeChange) {
  const modeWidget = findWidget(node, modeWidgetName);
  if (!modeWidget) return;
  const applyMode = (modeValue) => {
    for (const [widgetName, shouldShow] of rules(modeValue)) {
      const targetWidget = findWidget(node, widgetName);
      toggleWidgetVisibility(targetWidget, shouldShow);
    }
    if (onModeChange) {
      onModeChange(modeValue);
    }
    node.setDirtyCanvas(true, true);
  };
  const originalCallback = modeWidget.callback;
  modeWidget.callback = (value, ...args) => {
    applyMode(value);
    if (originalCallback) {
      originalCallback.call(modeWidget, value, ...args);
    }
  };
  applyMode(modeWidget.value);
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
    .doubao-media-wrap { display: flex; flex-direction: column; gap: 8px; }
    .doubao-toolbar { display: flex; gap: 8px; }
    .doubao-btn { padding: 4px 8px; border: 1px solid #556; background: #2e3440; color: #f5f5f5; border-radius: 4px; cursor: pointer; }
    .doubao-dropzone { border: 1px dashed #5f6b7a; border-radius: 6px; padding: 10px; text-align: center; font-size: 12px; color: #d8dee9; }
    .doubao-dropzone.active { border-color: #7aa2f7; background: rgba(122, 162, 247, 0.08); }
    .doubao-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .doubao-grid-1 { display: grid; grid-template-columns: 1fr; gap: 8px; }
    .doubao-card { position: relative; border: 1px solid #4c566a; border-radius: 6px; overflow: hidden; background: #1f2430; min-height: 80px; cursor: pointer; }
    .doubao-card img,.doubao-card video { width: 100%; height: 90px; object-fit: cover; display: block; }
    .doubao-card-title { padding: 8px; font-size: 12px; color: #eceff4; word-break: break-all; }
    .doubao-card-sub { padding: 0 8px 8px; font-size: 11px; color: #aeb6c2; }
    .doubao-remove { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border: none; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; cursor: pointer; }
    .doubao-empty { font-size: 12px; color: #8b93a2; padding: 4px; }
    .doubao-modal { position: fixed; inset: 0; background: rgba(0,0,0,.75); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .doubao-modal-content { max-width: 92vw; max-height: 92vh; background: #111722; border: 1px solid #444f61; border-radius: 8px; padding: 10px; color: #e5e9f0; overflow: auto; }
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

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function filenameFromPath(path) {
  return String(path || "").split(/[\\/]/).pop() || "unknown";
}

function getLocalPath(file) {
  return String(file?.path || "");
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

function installMediaWidget(node, options) {
  injectStyles();
  const modeWidget = findWidget(node, "传入方式");
  const pathWidget = findWidget(node, options.pathField);
  const base64Widget = findWidget(node, options.base64Field);
  const base64NameWidget = options.base64NameField ? findWidget(node, options.base64NameField) : null;
  if (!modeWidget || !pathWidget || !base64Widget) return;

  const state = {
    mode: modeWidget.value || options.pathModeValue,
    pathItems: [],
    base64Items: [],
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
  clearBtn.textContent = "清空";
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
  domWidget.computeSize = () => [320, options.widgetHeight];

  function activeItems() {
    return state.mode === options.base64ModeValue ? state.base64Items : state.pathItems;
  }

  function revokeItemUrl(item) {
    if (item.objectUrl) {
      URL.revokeObjectURL(item.objectUrl);
    }
  }

  function syncWidgets() {
    if (state.mode === options.base64ModeValue) {
      const lines = state.base64Items.map((item) => item.dataUri || "");
      base64Widget.value = options.multiple ? lines.join("\n") : lines[0] || "";
      pathWidget.value = options.multiple ? "" : "";
      if (base64NameWidget) {
        base64NameWidget.value = state.base64Items[0]?.name || "document.pdf";
      }
    } else {
      const lines = state.pathItems.map((item) => item.path || "");
      pathWidget.value = options.multiple ? lines.join("\n") : lines[0] || "";
      base64Widget.value = options.multiple ? "" : "";
      if (base64NameWidget) {
        base64NameWidget.value = "document.pdf";
      }
    }
    node.setDirtyCanvas(true, true);
  }

  function renderCards() {
    previewGrid.innerHTML = "";
    const items = activeItems();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "doubao-empty";
      empty.textContent = "暂无内容，请选择文件或拖拽到此区域。";
      previewGrid.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "doubao-card";

      if (options.kind === "image" && (item.previewUrl || item.dataUri)) {
        const img = document.createElement("img");
        img.src = item.previewUrl || item.dataUri;
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
      title.textContent = item.name || `第 ${index + 1} 个文件`;
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
        if (options.kind === "image" && (item.previewUrl || item.dataUri)) {
          const img = document.createElement("img");
          img.src = item.previewUrl || item.dataUri;
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
        info.innerHTML = `
          <div>文件名：${item.name || "-"}</div>
          <div>类型：${item.mime || "-"}</div>
          <div>大小：${formatBytes(item.size || 0)}</div>
        `;
        showModal(info);
      });

      previewGrid.appendChild(card);
    });
  }

  function validateFile(file, isBase64Mode, currentItems) {
    const size = file.size || 0;
    if (options.kind === "image") {
      if (currentItems.length + 1 > 9) {
        throw new Error("图片数量超限，最多允许 9 张。");
      }
      if (isBase64Mode && size > 10 * MB) {
        throw new Error(`图片 ${file.name} 超过 10MB（Base64 模式）。`);
      }
      if (!isBase64Mode && size > 512 * MB) {
        throw new Error(`图片 ${file.name} 超过 512MB（路径模式）。`);
      }
    } else if (options.kind === "video") {
      if (isBase64Mode && size > 50 * MB) {
        throw new Error(`视频 ${file.name} 超过 50MB（Base64 模式）。`);
      }
      if (!isBase64Mode && size > 2 * 1024 * MB) {
        throw new Error(`视频 ${file.name} 超过 2GB 上限。`);
      }
    } else if (options.kind === "file") {
      if (isBase64Mode && size > 50 * MB) {
        throw new Error(`文件 ${file.name} 超过 50MB（Base64 模式）。`);
      }
      if (!isBase64Mode && size > 512 * MB) {
        throw new Error(`文件 ${file.name} 超过 512MB（路径模式）。`);
      }
    }
  }

  function validateTotalBase64(items) {
    const total = items.reduce((sum, item) => sum + (item.size || 0), 0);
    if (total > 64 * MB) {
      throw new Error(`Base64 请求体总量超限：${formatBytes(total)}，最大 64MB。`);
    }
  }

  async function processFiles(files) {
    const isBase64Mode = state.mode === options.base64ModeValue;
    const current = activeItems();
    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    if (!options.multiple && incoming.length > 1) {
      notifyError("该节点仅支持单个文件。");
      return;
    }

    for (const file of incoming) {
      try {
        validateFile(file, isBase64Mode, current);
      } catch (error) {
        notifyError(error.message);
        return;
      }
    }

    if (!options.multiple) {
      current.splice(0, current.length);
    }

    for (const file of incoming) {
      const item = {
        name: file.name,
        size: file.size || 0,
        mime: file.type || options.fallbackMime,
      };
      if (isBase64Mode) {
        item.dataUri = await fileToDataURL(file);
        item.previewUrl = item.dataUri;
      } else {
        const localPath = getLocalPath(file);
        if (!localPath) {
          notifyError("当前环境无法读取本地绝对路径，请改用 Base64 模式或手动填写路径。");
          return;
        }
        item.path = localPath;
        item.previewUrl = URL.createObjectURL(file);
        item.objectUrl = item.previewUrl;
      }
      current.push(item);
    }

    if (isBase64Mode) {
      try {
        validateTotalBase64(current);
      } catch (error) {
        notifyError(error.message);
        return;
      }
    }
    syncWidgets();
    renderCards();
  }

  function clearCurrent() {
    activeItems().forEach(revokeItemUrl);
    activeItems().splice(0, activeItems().length);
    syncWidgets();
    renderCards();
  }

  function hydrateFromWidgets() {
    state.pathItems.forEach(revokeItemUrl);
    state.base64Items.forEach(revokeItemUrl);
    state.pathItems = parseMultiline(pathWidget.value).map((line) => ({
      path: line,
      name: filenameFromPath(line),
      size: 0,
      mime: options.fallbackMime,
    }));
    state.base64Items = parseMultiline(base64Widget.value).map((line, index) => ({
      dataUri: line,
      previewUrl: line.startsWith("data:") ? line : "",
      name: base64NameWidget?.value || `${options.kind}_${index + 1}`,
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

  installModeToggle(
    node,
    "传入方式",
    (modeValue) => options.modeRules(modeValue),
    (modeValue) => {
      state.mode = modeValue;
      renderCards();
    }
  );

  toggleWidgetVisibility(pathWidget, false);
  toggleWidgetVisibility(base64Widget, false);
  if (base64NameWidget) {
    toggleWidgetVisibility(base64NameWidget, false);
  }
  hydrateFromWidgets();
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
          pathModeValue: IMAGE_MODE_PATH,
          base64ModeValue: BASE64_MODE,
          pathField: "图片路径列表",
          base64Field: "图片Base64列表",
          base64NameField: null,
          pickButtonText: "选择图片上传",
          dropText: "拖拽图片到此处（支持多张）",
          gridClass: "doubao-grid-3",
          widgetHeight: 270,
          modeRules: () => [],
        });
      }
      if (nodeData.name === "DoubaoVideoUpload") {
        installMediaWidget(this, {
          kind: "video",
          multiple: false,
          accept: ".mp4,.avi,.mov,.mkv",
          fallbackMime: "video/mp4",
          pathModeValue: VIDEO_MODE_PATH,
          base64ModeValue: BASE64_MODE,
          pathField: "视频文件路径",
          base64Field: "视频Base64内容",
          base64NameField: null,
          pickButtonText: "选择视频上传",
          dropText: "拖拽视频到此处（仅单个）",
          gridClass: "doubao-grid-1",
          widgetHeight: 220,
          modeRules: (modeValue) => [
            ["TOS视频URL", modeValue === VIDEO_MODE_PATH],
            ["TOS_Bucket", modeValue === VIDEO_MODE_PATH],
            ["TOS_Prefix", modeValue === VIDEO_MODE_PATH],
          ],
        });
      }
      if (nodeData.name === "DoubaoFileUpload") {
        installMediaWidget(this, {
          kind: "file",
          multiple: false,
          accept: ".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.md",
          fallbackMime: "application/octet-stream",
          pathModeValue: FILE_MODE_PATH,
          base64ModeValue: BASE64_MODE,
          pathField: "文件路径",
          base64Field: "文件Base64内容",
          base64NameField: "Base64文件名",
          pickButtonText: "选择文件上传",
          dropText: "拖拽文档到此处（仅单个）",
          gridClass: "doubao-grid-1",
          widgetHeight: 220,
          modeRules: () => [],
        });
      }

      return result;
    };
  },
});
