# ComfyUI-Doubao-API-Multimodal-Chat

一个可直接安装到 ComfyUI `custom_nodes` 的豆包多模态插件，支持文本、图片、视频、文档输入，并通过 Doubao Responses API 返回文本结果和 Token 使用信息。

## 功能概览

- 6 个节点：
  - `DoubaoModelConfig`（豆包模型配置）
  - `DoubaoTextInput`（豆包文本输入）
  - `DoubaoImageUpload`（Doubao Image）
  - `DoubaoVideoUpload`（Doubao Video）
  - `DoubaoFileUpload`（Doubao File）
  - `DoubaoRun`（核心运行节点）
- 响应模式：支持非流式 / 流式
- 文件输入：支持 Files API 上传与 Base64 输入
- 输出：
  - `output`：模型文本输出（`STRING`）
  - `usage`：Token 统计 JSON 字符串（`STRING`）

## 安装

1. 将本项目目录放入 ComfyUI 的 `custom_nodes` 目录中。
2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 重启 ComfyUI。

## 节点说明

### 1) DoubaoModelConfig

- `base_url`：默认 `https://ark.cn-beijing.volces.com/api/v3`
- `api_key`：豆包 API Key（密码输入）
- `模型预设`：用于快速填充 `model_id`
- `model_id`：最终生效模型 ID（运行时以此为准）
- `max_tokens`：1-4096
- `temperature`：0.0-2.0
- `top_p`：0.0-1.0

### 2) DoubaoTextInput

- `prompt`：多行文本输入

### 3) DoubaoImageUpload

- `传入方式`：
  - `本地文件路径（推荐）`：多行绝对路径，每行一个图片
  - `Base64 编码上传`：多行 Base64/Data URI，每行一个图片
- 交互能力：
  - 顶部按钮：`选择图片上传` / `清空`
  - 拖拽投放：支持拖入多张图片
  - 缩略图网格：每行 3 张，支持删除、拖拽排序、点击放大预览
- 校验规则：
  - 图片最多 9 张
  - 本地路径：单图 <= 512MB
  - Base64：单图 <= 10MB，总请求体 <= 64MB

### 4) DoubaoVideoUpload

- `传入方式`：
  - `本地文件路径（推荐）`
  - `Base64 编码上传`
- `TOS视频URL`：可选，支持 `tos://` URL
- `TOS_Bucket`：可选
- `TOS_Prefix`：可选
- `fps`：0.2-5.0
- 交互能力：
  - 顶部按钮：`选择视频上传` / `清空`
  - 拖拽投放：支持拖入单个视频
  - 预览卡片：首帧区域、删除、点击弹窗播放
- 校验规则：
  - 本地路径：默认 <= 512MB
  - 本地路径 + TOS 参数：<= 2GB
  - TOS URL：由方舟侧按 TOS 对象处理
  - Base64：<= 50MB，总请求体 <= 64MB

### 5) DoubaoFileUpload

- `传入方式`：
  - `本地文件路径（推荐）`
  - `Base64 编码上传`
- 支持扩展名：`pdf/txt/doc/docx/xls/xlsx/ppt/pptx/csv/md`
- 交互能力：
  - 顶部按钮：`选择文件上传` / `清空`
  - 拖拽投放：支持拖入单个文档
  - 文件卡片：显示文件信息、删除、点击查看基础信息
- 校验规则：
  - 本地路径：<= 512MB
  - Base64：<= 50MB，总请求体 <= 64MB

### 6) DoubaoRun

- 输入：
  - `config`（必填）
  - `text` / `images` / `video` / `file`（可选）
  - `system_prompt`（可选）
  - `stream`（是否流式）
- 行为：
  - 本地文件模式：先上传到 Files API，再在 Responses 请求中引用 `file_id`
  - 视频在路径模式下支持本地文件上传或 TOS URL 上传（通过 `TOS视频URL`）
  - Base64 模式：组装 Data URI 并直接写入请求

## 典型连接方式

### 文本 + 图片

`DoubaoModelConfig -> DoubaoRun(config)`  
`DoubaoTextInput -> DoubaoRun(text)`  
`DoubaoImageUpload -> DoubaoRun(images)`

### 文本 + 视频

`DoubaoModelConfig -> DoubaoRun(config)`  
`DoubaoTextInput -> DoubaoRun(text)`  
`DoubaoVideoUpload -> DoubaoRun(video)`

### 文本 + 文档

`DoubaoModelConfig -> DoubaoRun(config)`  
`DoubaoTextInput -> DoubaoRun(text)`  
`DoubaoFileUpload -> DoubaoRun(file)`

## 常见问题

- `API Key 不能为空`：请在 `DoubaoModelConfig` 填写有效密钥。
- `文件不存在`：检查本地绝对路径是否正确，确保 ComfyUI 运行用户有读取权限。
- `Base64 编码内容不合法`：请确认内容为完整 Data URI 或合法 Base64 字符串。
- `文件大小超限`：按节点错误提示缩小文件或改用推荐上传方式。

## 说明

- 本版本按 MVP 实现，保留了后续扩展空间（如分片上传、上传进度条、更多高级参数）。
- 前端已支持关键交互增强：
  - 三个上传节点均支持按钮上传 + 拖拽投放 + 卡片预览
  - 传入方式切换时动态显隐对应控件
  - 模型预设自动填充 `model_id`
