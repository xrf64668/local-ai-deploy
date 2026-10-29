// 初始模型目录：门槛是文档维护者提供的保守参考值，不是官方最低要求。
// 不同权重、量化、上下文长度、分辨率、推理框架会显著改变资源需求。
export type Platform = 'mac' | 'ubuntu' | 'windows'
export type Task = 'llm' | 'video' | 'image' | 'audio'

export interface ModelCandidate {
  id: string
  name: string
  task: Task
  platform: Platform
  engine: string
  minimumMemoryGb: number
  minimumVramGb?: number
  confidence: '参考估算' | '实验性方案'
  detail: string
  source: string
}

export const modelCatalog: ModelCandidate[] = [
  ...(['mac', 'ubuntu', 'windows'] as const).map(platform => ({
    id: `qwen3b-${platform}`, name: 'Qwen2.5 3B Instruct · GGUF Q4', task: 'llm' as const, platform,
    engine: 'llama.cpp / Ollama', minimumMemoryGb: 8,
    minimumVramGb: platform === 'mac' ? undefined : 4,
    confidence: '参考估算' as const,
    detail: '适合小规模本地对话；也可使用 CPU，但速度受设备影响。',
    source: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF'
  })),
  ...(['mac', 'ubuntu', 'windows'] as const).map(platform => ({
    id: `qwen7b-${platform}`, name: 'Qwen2.5 7B Instruct · GGUF Q4', task: 'llm' as const,
    platform, engine: 'llama.cpp / Ollama', minimumMemoryGb: 16,
    minimumVramGb: platform === 'mac' ? undefined : 8,
    confidence: '参考估算' as const,
    detail: 'GPU 显存阈值按优先完整卸载到 GPU 估算；可用 CPU 混合推理，但速度不同。',
    source: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF'
  })),
  {
    id: 'wan-mac', name: 'Wan2.2 TI2V-5B · MLX Q8', task: 'video', platform: 'mac',
    engine: 'mlx-video', minimumMemoryGb: 32, confidence: '实验性方案',
    detail: '32GB 仅作为低分辨率短片测试起点，未保证稳定或速度；必须使用 MLX 兼容权重。',
    source: 'https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8'
  },
  {
    id: 'ltx-mac', name: 'LTX-2.5 · MLX Q4', task: 'video', platform: 'mac',
    engine: 'ltx-2-mlx', minimumMemoryGb: 32, confidence: '实验性方案',
    detail: '依赖特定社区转换权重与推理实现，需在目标机器完成实际生成测试。',
    source: 'https://huggingface.co/dgrauet/ltx-2.5-mlx-q4'
  },
  ...(['ubuntu', 'windows'] as const).map(platform => ({
    id: `wan-cuda-${platform}`, name: 'Wan2.2 TI2V-5B · PyTorch', task: 'video' as const,
    platform, engine: 'PyTorch / CUDA', minimumMemoryGb: 32, minimumVramGb: 24,
    confidence: '实验性方案' as const,
    detail: '仅供较大显存配置的初筛，具体峰值内存取决于 offload、模型精度和生成参数。',
    source: 'https://github.com/Wan-Video/Wan2.2'
  })),
  ...(['mac', 'ubuntu', 'windows'] as const).map(platform => ({
    id: `sd15-${platform}`, name: 'Stable Diffusion 1.5', task: 'image' as const,
    platform, engine: 'Diffusers / ComfyUI', minimumMemoryGb: platform === 'mac' ? 16 : 16,
    minimumVramGb: platform === 'mac' ? undefined : 8,
    confidence: '参考估算' as const,
    detail: '参考值为较宽裕的体验配置；低显存优化可能降低实际门槛。',
    source: 'https://github.com/huggingface/diffusers'
  })),
  ...(['mac', 'ubuntu', 'windows'] as const).map(platform => ({
    id: `whisper-${platform}`, name: 'Whisper Small · whisper.cpp', task: 'audio' as const,
    platform, engine: 'whisper.cpp', minimumMemoryGb: 8,
    confidence: '参考估算' as const,
    detail: '支持 CPU 路线，因此无需独立显存；实际速度取决于 CPU、音频长度及模型大小。',
    source: 'https://github.com/ggml-org/whisper.cpp'
  }))
]
