# ComfyUI 本地 API 示例

此目录提供基于 Python 标准库的 HTTP 客户端，不需要安装额外包。

## 先准备

在 ComfyUI 中启动并实际运行成功一个工作流，随后导出 **API Format**，保存为 `workflow_api.json`。

## 执行

```bash
python3 examples/comfyui/submit_workflow.py /path/to/workflow_api.json
```

默认连接 `http://127.0.0.1:8188`。若使用非默认端口，可以加 `--url http://127.0.0.1:8189`。

程序通过 `/system_stats` 检查服务，使用 `POST /prompt` 取得任务 ID，再调用 `/history/{prompt_id}` 查询执行情况。输出是元数据，不会自动下载成品文件。

## 注意事项

- 本脚本不会安装模型，也不会伪造一个“通用”视频工作流。
- 有效 API 格式与普通画布保存的 JSON 不同。
- 命令运行于你自己的电脑；不可把未认证的本地 ComfyUI 端口直接公开至公网。
- 若提示节点错误，请检查 ComfyUI 终端日志和 API 返回信息。

教程：[ComfyUI API](/comfyui/api/)
