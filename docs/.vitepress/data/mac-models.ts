export type MacTask = 'llm' | 'video' | 'image' | 'audio'
export type Verification = '特定机器实践记录' | '社区方案' | '实验性' | '参考估算'

export interface MacModel {
  id: string
  title: string
  task: MacTask
  minMemoryGb: number
  engine: string
  verification: Verification
  description: string
  source: string
  guide: string
}

export const macModels: MacModel[] = [
  {
    id: 'ltx25-q4', title: 'LTX-2.5 · MLX Q4', task: 'video', minMemoryGb: 32,
    engine: 'ltx-2-mlx', verification: '特定机器实践记录',
    description: 'M4 / 32GB 的低负载短片记录，不适用于所有芯片与更高分辨率；须核对权重和运行时版本。',
    source: 'https://github.com/dgrauet/ltx-2-mlx', guide: '/mac/models/ltx25'
  },
  {
    id: 'wan22-q8', title: 'Wan2.2 TI2V-5B · MLX Q8', task: 'video', minMemoryGb: 32,
    engine: '兼容的 mlx-video 运行时', verification: '实验性',
    description: '32GB 只是低负载试验参考。目标机器尚需实际模型加载、生成和输出验证。',
    source: 'https://github.com/Blaizzy/mlx-video', guide: '/mac/models/wan22'
  },
  {
    id: 'qwen25-3b', title: 'Qwen2.5 3B · GGUF Q4', task: 'llm', minMemoryGb: 8,
    engine: 'Ollama / llama.cpp', verification: '参考估算',
    description: '适合先学习本地聊天与 HTTP API。上下文大小和量化精度会改变内存占用。',
    source: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF', guide: '/mac/models/ollama'
  },
  {
    id: 'qwen25-7b', title: 'Qwen2.5 7B · GGUF Q4', task: 'llm', minMemoryGb: 16,
    engine: 'Ollama / llama.cpp', verification: '参考估算',
    description: '比 3B 大的语言模型路线；上下文长度和 KV Cache 都会影响峰值内存。',
    source: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF', guide: '/mac/models/ollama'
  },
  {
    id: 'sd15', title: 'Stable Diffusion 1.5', task: 'image', minMemoryGb: 16,
    engine: 'ComfyUI · PyTorch MPS', verification: '参考估算',
    description: '以基础文生图理解工作流；需要确认当前 PyTorch MPS 与模型节点兼容。',
    source: 'https://github.com/Comfy-Org/ComfyUI', guide: '/comfyui/mac'
  },
  {
    id: 'whisper-small', title: 'Whisper Small', task: 'audio', minMemoryGb: 8,
    engine: 'whisper.cpp', verification: '社区方案',
    description: '语音转文字路线，可研究 CPU 和 Apple Silicon 后端；不是文本转语音模型。',
    source: 'https://github.com/ggml-org/whisper.cpp', guide: '/mac/03-runtime'
  }
]
