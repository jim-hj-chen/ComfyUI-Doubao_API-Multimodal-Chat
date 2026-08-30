# ComfyUI-Doubao-API-Multimodal-Chat

一个可直接安装到 ComfyUI `custom_nodes` 的豆包多模态插件，支持文本、图片、视频、文档输入，并通过 Doubao Responses API 返回文本结果和 Token 使用信息。

## 功能概览

- 6 个节点：
  - `DoubaoModelConfig`（豆包模型配置）
  - `DoubaoTextInput`（豆包文本输入）
  - `DoubaoImageUpload`（豆包图片上传）
  - `DoubaoVideoUpload`（豆包视频上传）
  - `DoubaoFileUpload`（豆包文件上传）
  - `DoubaoRunCore`（豆包运行核心）
- 响应模式：支持非流式 / 流式
- 文件输入：通过本地路径上传到 Files API（浏览器选择或拖拽会先写入 ComfyUI 服务器，再回填绝对路径）
- 输出：
  - `output`：模型文本输出（`STRING`）
  - `usage`：Token 统计 JSON 字符串（`STRING`）
- 语言支持：简体中文、English（跟随 ComfyUI 界面语言）

## 安装

1. 将本项目目录放入 ComfyUI 的 `custom_nodes` 目录中。
2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 重启 ComfyUI。

## 节点说明

### 1) DoubaoModelConfig

- `base_url`：填火山引擎 OpenAI SDK 示例中的 `base_url`，默认 `https://ark.cn-beijing.volces.com/api/v3`
- `api_key`：豆包 API Key（密码输入）
- `模型预设`：用于快速填充 `model_id`
- `model_id`：最终生效模型 ID（运行时以此为准）
- `max_tokens`：1-128000（128k），默认 128000（最大输出 token）
- `temperature`：0.0-2.0，默认 0.4（偏稳定，适合视频反推与长系统提示词）
- `top_p`：0.0-1.0，默认 0.9

### 2) DoubaoTextInput

- `prompt`：多行文本输入；输出可接到豆包运行核心的「系统提示词」或「用户提示词」

### 3) DoubaoImageUpload

- 本地文件路径：多行绝对路径，每行一个图片（也可通过按钮/拖拽上传后自动回填）
- 交互能力：
  - 顶部按钮：`选择图片上传` / `清空`
  - 拖拽投放：支持拖入多张图片
  - 缩略图网格：自适应列数，支持删除、拖拽排序、点击放大预览
- 校验规则：
  - 图片最多 9 张
  - 合计 <= 512MB（豆包 API 单次处理上限）
- 远程部署说明（AutoDL 等）：
  - 点击上传会先把浏览器选中的文件上传到 ComfyUI 服务器
  - 服务器端保存目录：`ComfyUI/input/doubao_image`
  - 节点内部自动回填服务器绝对路径，再参与后续推理

### 4) DoubaoVideoUpload

默认只需本地选择或拖拽视频，不必填写 TOS。TOS（火山引擎对象存储）是大文件或已有对象时的可选项，通过 **`输入方式`** 展开。

- `输入方式`：
  - `本地上传（≤512MB）`：默认。选择/拖拽视频，走 Files API
  - `TOS 对象存储上传（≤2GB）`：本地大文件先落到火山引擎 TOS Bucket（Bucket 必填，Prefix 可选），最大 2GB
  - `已有 TOS 视频地址`：填写已有 `tos://` 地址，无需再选本地文件
- 抽帧率固定为 `1.0`（Files API `preprocess_configs.video.fps`），界面不展示、不可改
- 交互能力：
  - 顶部按钮：`选择视频上传` / `清空`（TOS 地址模式不显示上传区）
  - 拖拽投放：支持拖入单个视频
  - 预览卡片：首帧区域、删除、点击弹窗播放
- 校验规则：
  - 本地上传：<= 512MB
  - TOS 对象存储上传：<= 2GB
  - TOS 视频地址：由方舟侧按 TOS 对象处理
- 远程部署说明（AutoDL 等）：
  - 上传会先保存到 `ComfyUI/input/doubao_video`，再回填服务器路径

### 5) DoubaoFileUpload

- 本地文件路径：单个文档绝对路径（也可通过按钮/拖拽上传后自动回填）
- 支持扩展名：`pdf/txt/doc/docx/xls/xlsx/ppt/pptx/csv/md`
- 交互能力：
  - 顶部按钮：`选择文件上传` / `清空`
  - 拖拽投放：支持拖入单个文档
  - 文件卡片：显示文件信息、删除、点击查看基础信息
- 校验规则：
  - 本地路径：<= 512MB
- 远程部署说明（AutoDL 等）：
  - 上传会先保存到 `ComfyUI/input/doubao_file`，再回填服务器路径

### 6) DoubaoRunCore（豆包运行核心）

- 输入：
  - `config`（必填）
  - `system_prompt` / `user_prompt`（可选，仅支持从豆包文本输入节点接入，本节点不可编辑）
  - `images` / `video` / `file`（可选）
- 行为：
  - 本地文件：先上传到 Files API，再在 Responses 请求中引用 `file_id`
  - 视频默认本地上传；大文件可选 TOS Bucket（≤2GB），或直接使用已有 `tos://` 地址

## 典型连接方式

### 文本 + 图片

`DoubaoModelConfig -> DoubaoRunCore(config)`  
`DoubaoTextInput -> DoubaoRunCore(user_prompt)`（系统提示词同理接到 `system_prompt`）  
`DoubaoImageUpload -> DoubaoRunCore(images)`

### 文本 + 视频

`DoubaoModelConfig -> DoubaoRunCore(config)`  
`DoubaoTextInput -> DoubaoRunCore(user_prompt)`  
`DoubaoVideoUpload -> DoubaoRunCore(video)`

### 文本 + 文档

`DoubaoModelConfig -> DoubaoRunCore(config)`  
`DoubaoTextInput -> DoubaoRunCore(user_prompt)`  
`DoubaoFileUpload -> DoubaoRunCore(file)`

## 常见问题

- `API Key 不能为空`：请在 `DoubaoModelConfig` 填写有效密钥。
- `文件不存在`：检查本地绝对路径是否正确，确保 ComfyUI 运行用户有读取权限。
- `文件大小超限`：按节点错误提示缩小文件。
- `远程实例读取不到本机文件`：请通过节点上传按钮/拖拽上传，插件会自动写入服务器 `input/doubao_*` 目录并回填可读路径。

## 说明

- 本版本按 MVP 实现，保留了后续扩展空间（如分片上传、上传进度条、更多高级参数）。
- 前端已支持关键交互增强：
  - 三个上传节点均支持按钮上传 + 拖拽投放 + 卡片预览
  - 上传区域会跟随节点宽高缩放
  - 模型预设自动填充 `model_id`
