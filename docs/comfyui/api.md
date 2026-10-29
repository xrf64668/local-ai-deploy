# ComfyUI API：提交工作流与查询结果

本指南面向已经成功启动 ComfyUI、并完成过一次图像生成的用户。你可以通过 HTTP API 把工作流作为任务提交，随后轮询任务状态，或通过 WebSocket 订阅进度。

::: warning 先确保安全
下面全部使用本机 `127.0.0.1`。不要直接将未经身份验证的 ComfyUI 原生端口开放到公网；若需要对外提供 API，应在受保护的网关后增加鉴权、授权、速率限制、任务配额及输出访问控制。
:::

## 01 · 检查 API 是否可用

Mac / Linux 终端：

```bash
curl -f http://127.0.0.1:8188/system_stats
curl -f http://127.0.0.1:8188/queue
```

Windows PowerShell：

```powershell
curl.exe -f http://127.0.0.1:8188/system_stats
curl.exe -f http://127.0.0.1:8188/queue
```

**通过标准：** 两个接口都返回 JSON 而不是连接错误。如果 Desktop 未监听 8188，以实际服务地址为准。

## 02 · 导出 API 格式工作流

**不要直接将编辑器普通保存的工作流 JSON 作为 `/prompt` 的请求体。** 必须导出可执行的 **API Format** 工作流；相关菜单在不同前端版本中可能位于保存/导出菜单或开发者选项中。

1. 先在 ComfyUI 画布中运行该工作流，确保生成成功。
2. 找到导出 **API Format** 功能，将文件保存为 `workflow_api.json`。
3. 打开文件检查内容：通常是以节点 ID 为键、以 `class_type`、`inputs` 为主体的对象，而不是只包含 `nodes`、`links` 的编辑器画布格式。
4. 如果使用自定义节点，还需要确认这些节点已在目标服务安装且版本兼容。

## 03 · 一份可执行的 Python 提交脚本

本站提供无需额外第三方 Python 库的示例程序：

[查看完整脚本：submit_workflow.py](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/comfyui/submit_workflow.py)

下载或保存脚本到同一个文件夹，然后执行：

```bash
python3 submit_workflow.py workflow_api.json
```

Windows 若使用 Python Launcher：

```powershell
py submit_workflow.py workflow_api.json
```

程序会完成：

- 读取并校验工作流的基础 JSON 结构；
- 向 `POST /prompt` 提交节点图，输出 `prompt_id`；
- 轮询 `GET /history/{prompt_id}`，报告成功、失败或超时；
- 返回任务对应的输出元数据（**不等于自动下载图片/视频文件**）。

::: tip 为什么脚本没有内置固定的生成工作流？
不同模型（SD1.5、FLUX、Wan、LTX 等）的节点和权重依赖不同。只有你自己的工作流先在 UI 中运行成功，导出的 API 格式 JSON 才能真实反映目标机器和模型配置。
:::

## 04 · 常用 API 速查

| 端点 | 方法 | 用途 |
| --- | --- | --- |
| `/system_stats` | GET | 系统与设备信息 |
| `/object_info` | GET | 现有节点类型 |
| `/prompt` | POST | 验证并提交 API 工作流，返回任务 ID 或错误 |
| `/queue` | GET | 查询待执行和运行中队列 |
| `/history/{prompt_id}` | GET | 查询指定任务结果 |
| `/view` | GET | 读取输出文件（需传对应参数） |
| `/ws` | WebSocket | 获取执行进度与事件 |

**理解边界：** 取得 `prompt_id` 只表示服务接受了任务，不意味着已经生成成功。应进一步检查执行历史、错误状态和实际输出文件。

## 05 · 常见失败原因

| 错误 | 原因 |
| --- | --- |
| HTTP 400 或返回 `node_errors` | 节点参数无效、节点缺失或模型名称不匹配 |
| `workflow_api.json` 无法提交 | 导出了普通画布 JSON，而非 API 格式 |
| 一直等不到结果 | 队列拥堵、耗时工作流、服务终止或任务执行失败 |
| 图片/视频文件不存在 | 任务未完成，或输出位于不同目录、输出节点未配置 |
| 本机调用成功，其他电脑失败 | 服务只监听本机地址；不要为省事直接暴露公网 |

参考：[ComfyUI 官方 Server Routes](https://docs.comfy.org/development/comfyui-server/comms_routes)。
