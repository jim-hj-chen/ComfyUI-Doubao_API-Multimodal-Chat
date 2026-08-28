import { app } from "/scripts/app.js";

const IMAGE_MODE_PATH = "本地文件路径（推荐）";
const VIDEO_MODE_FILES_API = "Files API 上传（推荐）";
const FILE_MODE_FILES_API = "Files API 上传（推荐）";

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

function installModeToggle(node, modeWidgetName, rules) {
  const modeWidget = findWidget(node, modeWidgetName);
  if (!modeWidget) return;
  const applyMode = (modeValue) => {
    for (const [widgetName, shouldShow] of rules(modeValue)) {
      const targetWidget = findWidget(node, widgetName);
      toggleWidgetVisibility(targetWidget, shouldShow);
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

function installModelPresetBinding(node) {
  const presetWidget = findWidget(node, "模型预设");
  const modelIdWidget = findWidget(node, "model_id");
  if (!presetWidget || !modelIdWidget) return;

  const updateModelId = (value) => {
    modelIdWidget.value = String(value || "");
    node.setDirtyCanvas(true, true);
  };
  const originalCallback = presetWidget.callback;
  presetWidget.callback = (value, ...args) => {
    updateModelId(value);
    if (originalCallback) {
      originalCallback.call(presetWidget, value, ...args);
    }
  };
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
        installModeToggle(this, "传入方式", (modeValue) => [
          ["图片路径列表", modeValue === IMAGE_MODE_PATH],
          ["图片Base64列表", modeValue !== IMAGE_MODE_PATH],
        ]);
      }
      if (nodeData.name === "DoubaoVideoUpload") {
        installModeToggle(this, "传入方式", (modeValue) => [
          ["视频文件路径", modeValue === VIDEO_MODE_FILES_API],
          ["视频Base64内容", modeValue !== VIDEO_MODE_FILES_API],
        ]);
      }
      if (nodeData.name === "DoubaoFileUpload") {
        installModeToggle(this, "传入方式", (modeValue) => [
          ["文件路径", modeValue === FILE_MODE_FILES_API],
          ["文件Base64内容", modeValue !== FILE_MODE_FILES_API],
          ["Base64文件名", modeValue !== FILE_MODE_FILES_API],
        ]);
      }

      return result;
    };
  },
});
