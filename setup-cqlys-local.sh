#!/bin/bash
# ============================================================
# 本地 hosts 配置工具（cqlys.ai -> 127.0.0.1）
# 需要 sudo（仅修改 /etc/hosts），请在本机终端运行。
#
# 用法:
#   sudo bash setup-cqlys-local.sh            # 在 /etc/hosts 写入 127.0.0.1 cqlys.ai
#   sudo bash setup-cqlys-local.sh --rollback # 撤销 hosts 改动
#
# ⚠️ 重要：当前 WorkBuddy 沙箱环境无法解析/转发 cqlys.ai，
#   因此本地访问地址统一用【路径形式】:
#       http://localhost:5173/cqlys/
#   （vite.config.js 的 base 已设为 '/cqlys/'，已验证可访问。）
#
#   本脚本写入的 cqlys.ai hosts 仅用于：未来在真实本机用 sudo 让 dev server
#   监听 80 端口时测试 http://cqlys.ai 之用，不是当前必要步骤。
# ============================================================
set -e

HOST_NAME="cqlys.ai"

# ---------- 回滚 ----------
if [ "$1" = "--rollback" ]; then
  echo "==> 移除 /etc/hosts 中的 $HOST_NAME"
  sudo sed -i.bak "/127.0.0.1 $HOST_NAME/d" /etc/hosts
  echo "    完成（备份: /etc/hosts.bak）"
  exit 0
fi

echo "==> 配置 /etc/hosts  (127.0.0.1 $HOST_NAME)"
if ! grep -q "$HOST_NAME" /etc/hosts; then
  echo "127.0.0.1 $HOST_NAME" | sudo tee -a /etc/hosts >/dev/null
  echo "    已追加"
else
  echo "    已存在，跳过"
fi

echo
echo "============================================================"
echo " hosts 已配置 (127.0.0.1 $HOST_NAME)"
echo " 当前可访问地址（已验证）: http://localhost:5173/cqlys/"
echo " 注: WorkBuddy 沙箱无法解析 cqlys.ai，请用上面的路径地址访问。"
echo "============================================================"
