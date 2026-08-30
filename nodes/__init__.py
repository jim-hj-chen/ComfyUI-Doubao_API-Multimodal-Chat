"""节点注册。"""

from .model_config import DoubaoModelConfig
from .text_input import DoubaoTextInput
from .image_upload import DoubaoImageUpload
from .video_upload import DoubaoVideoUpload
from .file_upload import DoubaoFileUpload
from .doubao_run_core import DoubaoRunCore
from .prompt_split_batcher import DoubaoPromptSplitBatcher

NODE_CLASS_MAPPINGS = {
    "DoubaoModelConfig": DoubaoModelConfig,
    "DoubaoTextInput": DoubaoTextInput,
    "DoubaoImageUpload": DoubaoImageUpload,
    "DoubaoVideoUpload": DoubaoVideoUpload,
    "DoubaoFileUpload": DoubaoFileUpload,
    "DoubaoRunCore": DoubaoRunCore,
    "DoubaoPromptSplitBatcher": DoubaoPromptSplitBatcher,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DoubaoModelConfig": "豆包模型配置",
    "DoubaoTextInput": "豆包文本输入",
    "DoubaoImageUpload": "豆包图片上传",
    "DoubaoVideoUpload": "豆包视频上传",
    "DoubaoFileUpload": "豆包文件上传",
    "DoubaoRunCore": "豆包运行核心",
    "DoubaoPromptSplitBatcher": "豆包提示词分割批处理器",
}
