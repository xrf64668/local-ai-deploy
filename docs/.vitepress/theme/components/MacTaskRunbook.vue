<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
const props = defineProps<{ task:'image'|'video'|'audio'; modelId:string; phase:'install'|'verify' }>()
const feedback=ref('')
const recipes: Record<string,{title:string;source:string;steps:{title:string;text:string;command?:string}[];verify:{text:string;command?:string}[];warning:string}> = {
  'image-starter':{
    title:'ComfyUI Desktop · 基础文生图',source:'https://www.comfy.org/download',
    warning:'图像工作流依赖准确匹配的 checkpoint、VAE、文本编码器及版本。无法仅凭内存数值推断可生成任何图像。',
    steps:[
      {title:'安装官方桌面应用',text:'打开 ComfyUI 官方下载页，选择 macOS 版本，完成安装并启动。'},
      {title:'从应用内选择基础文生图模板',text:'优先使用当前 ComfyUI 版本提供的基础模板，核对模型来源、许可证和权重要求。避免盲目使用大型工作流。'},
      {title:'下载模板对应的模型',text:'按照模板的缺失权重提示下载；模型名称、VAE 和文本编码器必须与该工作流一致。'},
      {title:'第一次出图',text:'使用模板推荐分辨率，提示词可用「一艘纸船漂浮在清晨的湖面」。点击执行队列，保存实际图片。'}
    ],
    verify:[{text:'实际保存一张可打开的图片，确认不是只有节点执行或界面成功提示。'}]
  },
  'audio-starter':{
    title:'whisper.cpp · 多语言 base 识别',source:'https://github.com/ggml-org/whisper.cpp',
    warning:'需预先安装 Git、CMake 和 FFmpeg；下面命令在自选空文件夹的同一终端会话中逐步运行。不要运行在其他项目根目录。',
    steps:[
      {title:'在自选项目目录打开终端并检查依赖',text:'先用 Finder 创建空文件夹并在文件夹中打开终端。',command:'PROJECT_ROOT="$(pwd -P)"\nuname -m\ngit --version\ncmake --version\nffmpeg -version'},
      {title:'下载源代码与项目内编译',text:'首次编译需要 CMake，运行后通过帮助命令确认可执行文件存在。',command:'git clone https://github.com/ggml-org/whisper.cpp.git "$PROJECT_ROOT/src"\ncmake -S "$PROJECT_ROOT/src" -B "$PROJECT_ROOT/build" -DCMAKE_BUILD_TYPE=Release\ncmake --build "$PROJECT_ROOT/build" --config Release -j 4\n"$PROJECT_ROOT/build/bin/whisper-cli" --help'},
      {title:'下载多语言 GGML base 模型',text:'使用上游自带下载工具，确认得到 ggml-base.bin。',command:'mkdir -p "$PROJECT_ROOT/models"\nbash "$PROJECT_ROOT/src/models/download-ggml-model.sh" base "$PROJECT_ROOT/models"\nls -lh "$PROJECT_ROOT/models/ggml-base.bin"'},
      {title:'识别录音',text:'将自己的 input.mp3 放到项目的 audio 文件夹，再在同一个终端执行。',command:'mkdir -p "$PROJECT_ROOT/audio" "$PROJECT_ROOT/outputs"\nffmpeg -y -i "$PROJECT_ROOT/audio/input.mp3" -ar 16000 -ac 1 -c:a pcm_s16le "$PROJECT_ROOT/audio/input.wav"\n"$PROJECT_ROOT/build/bin/whisper-cli" -m "$PROJECT_ROOT/models/ggml-base.bin" -f "$PROJECT_ROOT/audio/input.wav" -otxt -of "$PROJECT_ROOT/outputs/transcript"'}
    ],
    verify:[{text:'打开 outputs/transcript.txt，核对其中包含对输入录音的实际转写内容。',command:'test -s "$PROJECT_ROOT/outputs/transcript.txt" && cat "$PROJECT_ROOT/outputs/transcript.txt"'}]
  },
  'ltx23-mlx-q4':{
    title:'LTX-2.3 · MLX Q4',source:'https://huggingface.co/dgrauet/ltx-2.3-mlx-q4',
    warning:'仅是上游 MLX 命令参考，不代表在当前 Mac 实机验证。需要 Python 3.11+、Git、FFmpeg，初次生成使用 25 帧短片。',
    steps:[
      {title:'选择单独的空项目目录并检查',text:'在 Finder 中创建空文件夹，从此文件夹打开终端。',command:'PROJECT_ROOT="$(pwd -P)"\nuname -m\npython3 --version\ngit --version\nffmpeg -version\ndf -h "$PROJECT_ROOT"'},
      {title:'项目内下载环境和缓存',text:'所有缓存与虚拟环境均放在当前项目文件夹内。',command:'mkdir -p "$PROJECT_ROOT/models" "$PROJECT_ROOT/outputs" "$PROJECT_ROOT/.cache/huggingface" "$PROJECT_ROOT/.cache/pip" "$PROJECT_ROOT/.cache/uv"\nexport HF_HOME="$PROJECT_ROOT/.cache/huggingface" PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip" UV_CACHE_DIR="$PROJECT_ROOT/.cache/uv" UV_PYTHON_INSTALL_DIR="$PROJECT_ROOT/.cache/uv/python" UV_PYTHON_DOWNLOADS=never\npython3 -m venv "$PROJECT_ROOT/.tools"\n"$PROJECT_ROOT/.tools/bin/python" -m pip install -U pip uv huggingface_hub'},
      {title:'从 Hugging Face 下载匹配的 Q4 权重',text:'核对上游文件、许可证、revision。首次下载前确保磁盘容量充足。',command:'"$PROJECT_ROOT/.tools/bin/hf" download dgrauet/ltx-2.3-mlx-q4 --local-dir "$PROJECT_ROOT/models/ltx23-q4"'},
      {title:'安装独立 LTX-MLX 运行时',text:'确认 CLI 帮助；不要在 Wan 或 ComfyUI 项目中执行。',command:'git clone https://github.com/dgrauet/ltx-2-mlx.git "$PROJECT_ROOT/src"\ncd "$PROJECT_ROOT/src"\ngit rev-parse HEAD\n"$PROJECT_ROOT/.tools/bin/uv" sync --all-extras\n"$PROJECT_ROOT/.tools/bin/uv" run --no-sync ltx-2-mlx generate --help'},
      {title:'生成 25 帧短视频',text:'最低负载试验，不保证在所有 16GB 设备上完成。',command:'cd "$PROJECT_ROOT/src"\n"$PROJECT_ROOT/.tools/bin/uv" run --no-sync ltx-2-mlx generate --distilled --low-ram --model "$PROJECT_ROOT/models/ltx23-q4" --prompt "A paper boat drifting on a calm lake" -H 320 -W 512 -f 25 --frame-rate 24 -o "$PROJECT_ROOT/outputs/ltx23-first.mp4"'}
    ],
    verify:[{text:'检查真正生成的 MP4 能播放，ffprobe 能解析。',command:'ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/ltx23-first.mp4"'}]
  },
  'ltx25-mlx-q4':{
    title:'LTX-2.5 · MLX Q4',source:'https://huggingface.co/dgrauet/ltx-2.5-mlx-q4',
    warning:'这是上游参考部署方案，权重下载量大。显存/统一内存与实际视频生成速度、峰值内存不能单靠文件大小判断。',
    steps:[
      {title:'选择空目录并检查基础工具',text:'在选定的项目空文件夹中打开终端。',command:'PROJECT_ROOT="$(pwd -P)"\nuname -m\npython3 --version\ngit --version\nffmpeg -version\ndf -h "$PROJECT_ROOT"'},
      {title:'创建项目隔离环境',text:'缓存放在项目内部，避免污染其他模型。',command:'mkdir -p "$PROJECT_ROOT/models" "$PROJECT_ROOT/outputs" "$PROJECT_ROOT/.cache/huggingface" "$PROJECT_ROOT/.cache/pip" "$PROJECT_ROOT/.cache/uv"\nexport HF_HOME="$PROJECT_ROOT/.cache/huggingface" PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip" UV_CACHE_DIR="$PROJECT_ROOT/.cache/uv" UV_PYTHON_INSTALL_DIR="$PROJECT_ROOT/.cache/uv/python" UV_PYTHON_DOWNLOADS=never\npython3 -m venv "$PROJECT_ROOT/.tools"\n"$PROJECT_ROOT/.tools/bin/python" -m pip install -U pip uv huggingface_hub'},
      {title:'下载 LTX-2.5 Q4 模型包',text:'须核对 dev、distilled、VAE、text encoder 与配置。',command:'"$PROJECT_ROOT/.tools/bin/hf" download dgrauet/ltx-2.5-mlx-q4 --local-dir "$PROJECT_ROOT/models/ltx25-q4"'},
      {title:'配置 LTX MLX 运行时',text:'先检查 CLI 参数，再运行低负载生成。',command:'git clone https://github.com/dgrauet/ltx-2-mlx.git "$PROJECT_ROOT/src"\ncd "$PROJECT_ROOT/src"\ngit rev-parse HEAD\n"$PROJECT_ROOT/.tools/bin/uv" sync --all-extras\n"$PROJECT_ROOT/.tools/bin/uv" run ltx-2-mlx generate --help'},
      {title:'实际生成视频',text:'轻负载参考：512×320、25 帧。',command:'cd "$PROJECT_ROOT/src"\n"$PROJECT_ROOT/.tools/bin/uv" run ltx-2-mlx generate --distilled --low-ram --model "$PROJECT_ROOT/models/ltx25-q4" --prompt "A small paper boat drifting on a calm lake" -H 320 -W 512 -f 25 --frame-rate 24 -o "$PROJECT_ROOT/outputs/ltx-first.mp4"'}
    ],
    verify:[{text:'实际视频文件能播放且 ffprobe 可读取时长。',command:'ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/ltx-first.mp4"'}]
  },
  'wan22-mlx-q8':{
    title:'Wan2.2 TI2V-5B · MLX Q8',source:'https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8',
    warning:'32GB 仅实验性起点；这是另一套独立 mlx-video 运行时，不能使用 LTX 命令或互换权重。',
    steps:[
      {title:'创建独立目录并检查基础工具',text:'在空 Wan 项目文件夹打开终端。',command:'PROJECT_ROOT="$(pwd -P)"\nuname -m\npython3 --version\ngit --version\nffmpeg -version'},
      {title:'创建项目虚拟环境',text:'全部环境、模型、缓存放在当前项目内。',command:'mkdir -p "$PROJECT_ROOT/models" "$PROJECT_ROOT/outputs" "$PROJECT_ROOT/.cache/huggingface" "$PROJECT_ROOT/.cache/pip"\nexport HF_HOME="$PROJECT_ROOT/.cache/huggingface" PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip" XDG_CACHE_HOME="$PROJECT_ROOT/.cache"\npython3 -m venv "$PROJECT_ROOT/.venv"\nsource "$PROJECT_ROOT/.venv/bin/activate"\npython -m pip install -U pip huggingface_hub'},
      {title:'下载 MLX Q8 权重',text:'必须包含 T5、VAE 及转换权重。',command:'hf download Anes1032/Wan2.2-TI2V-5B-mlx-q8 --local-dir "$PROJECT_ROOT/models/wan22-q8"'},
      {title:'安装 Wan 专用 mlx-video 运行时',text:'检查 CLI 可用性，上游参数可能随版本变化。',command:'python -m pip install "git+https://github.com/Blaizzy/mlx-video.git"\npython -m mlx_video.models.wan_2.generate --help'},
      {title:'生成第一次低负载视频',text:'512×320，17 帧，20 步。',command:'python -m mlx_video.models.wan_2.generate --model-dir "$PROJECT_ROOT/models/wan22-q8" --prompt "A small bird turns its head gently on a branch" --width 512 --height 320 --num-frames 17 --steps 20 --output-path "$PROJECT_ROOT/outputs/wan-first.mp4"'}
    ],
    verify:[{text:'检查视频文件存在、可解码且能实际播放。',command:'ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/wan-first.mp4"'}]
  }
}
const recipe=computed(()=>recipes[props.modelId])
const items=computed(()=>props.phase==='install'?recipe.value?.steps:recipe.value?.verify)
function copy(s:string){if(!navigator.clipboard){feedback.value='当前浏览器无法自动复制，请手动复制';return}navigator.clipboard.writeText(s).then(()=>feedback.value='已复制命令').catch(()=>feedback.value='复制失败，请手动复制')}
const advanced=computed(()=>withBase(props.task==='video'?'/mac/video':props.task==='image'?'/mac/image':'/mac/audio'))
</script>
<template>
  <div v-if="recipe" class="runbook">
    <p class="muted"><strong>{{recipe.title}}</strong> · <a :href="recipe.source" target="_blank" rel="noopener noreferrer">核对上游来源与许可证 ↗</a></p>
    <p class="runbook-warning">{{recipe.warning}}</p>
    <div v-for="(item,index) in items" :key="index" class="operation">
      <h4>{{index+1}}. {{phase==='install' && 'title' in item ? item.title : '真实产物验收'}}</h4>
      <p>{{item.text}}</p>
      <div v-if="item.command" class="runbook-command"><pre><code>{{item.command}}</code></pre><button type="button" @click="copy(item.command!)">复制命令</button></div>
    </div>
    <p v-if="feedback" role="status" class="muted">{{feedback}}</p>
    <details><summary>需要完整背景、故障排查或进阶说明？</summary><p><a :href="advanced">阅读专项技术文档</a>。此链接不属于必经部署步骤。</p></details>
  </div>
  <p v-else class="runbook-warning">当前选型缺少经核对的部署配方；请返回上一步更换模型，不应猜测运行命令。</p>
</template>
<style scoped>
.runbook{display:grid;gap:.7rem}.muted{color:var(--vp-c-text-2);font-size:.86rem}.runbook-warning{border-left:3px solid var(--vp-c-warning-1);padding:.8rem;background:var(--vp-c-bg-soft);font-size:.88rem}.operation{border-top:1px solid var(--vp-c-divider);padding-top:.7rem}.operation h4{font-size:1rem;margin:0}.operation p{font-size:.9rem}.runbook-command{background:var(--vp-code-block-bg);border-radius:9px;padding:.7rem}.runbook-command pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem;line-height:1.6;margin:0}.runbook-command button{border:1px solid var(--vp-c-divider);border-radius:7px;padding:.35rem .65rem;font-weight:600;margin-top:.5rem;color:var(--vp-c-brand-1)}
</style>