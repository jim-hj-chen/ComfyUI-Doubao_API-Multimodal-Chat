"""节点注册。"""

from .model_config import DoubaoModelConfig
from .text_input import DoubaoTextInput
from .image_upload import DoubaoImageUpload
from .video_upload import DoubaoVideoUpload
from .file_upload import DoubaoFileUpload
from .doubao_run import DoubaoRun

NODE_CLASS_MAPPINGS = {
    "DoubaoModelConfig": DoubaoModelConfig,
    "DoubaoTextInput": DoubaoTextInput,
    "DoubaoImageUpload": DoubaoImageUpload,
    "DoubaoVideoUpload": DoubaoVideoUpload,
    "DoubaoFileUpload": DoubaoFileUpload,
    "DoubaoRun": DoubaoRun,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DoubaoModelConfig": "豆包模型配置",
    "DoubaoTextInput": "豆包文本输入",
    "DoubaoImageUpload": "豆包图片上传",
    "DoubaoVideoUpload": "豆包视频上传",
    "DoubaoFileUpload": "豆包文件上传",
    "DoubaoRun": "豆包运行",
}
