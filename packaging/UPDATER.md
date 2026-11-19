# Opc WorkBench 自动更新

## 当前客户端配置（v0.3.5+）

- 检查地址：`https://github.com/lianyinging/workbench-desktop/releases/latest/download/latest.json`
- 公钥：已写入 `surfaces/gui/src-tauri/tauri.conf.json` → `plugins.updater.pubkey`
- 私钥：本机 `~/.opc-workbench/tauri-updater.key`（**勿提交仓库**）

## GitHub Actions 必配 Secret

1. `TAURI_SIGNING_PRIVATE_KEY`：私钥文件全文  
2. （可选）`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：若生成密钥时设了密码

未配置时，Release 仍有安装包，但**没有** `.sig` / `latest.json`，检查更新无效。

打 tag `v0.3.5`（须与 `tauri.conf.json` 的 `version` 一致）触发 release 流水线后，有签名才会生成并上传 `latest.json`。

## 改用阿里云 OSS

1. 把下列文件上传到同一前缀（公网可读），例如  
   `https://<bucket>.oss-cn-hangzhou.aliyuncs.com/opc-workbench/`  
   - `latest.json`  
   - `OpcWorkbench-windows-setup.exe` + `.sig`  
   - （Mac）`OpcWorkbench-macos-arm64.app.tar.gz` + `.sig`
2. CI Secret 增加 `OPC_UPDATE_PUBLIC_BASE=https://<bucket>.../opc-workbench`（无末尾 `/`）
3. 把 `tauri.conf.json` 的 `endpoints` 改成  
   `["https://<bucket>.../opc-workbench/latest.json"]` 后重新发包

本地生成指向 OSS 的 manifest：

```bash
python3 packaging/make_update_manifest.py \
  --version 0.3.5 --tag v0.3.5 \
  --repo lianyinging/workbench-desktop \
  --dist dist --out dist/latest.json \
  --base-url https://<bucket>.oss-cn-hangzhou.aliyuncs.com/opc-workbench
```
