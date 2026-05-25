---
title: Service Restart Runbook
date: 2026-05-25
tags: [service, restart, kubernetes]
categories: [runbook]
---

# Service Restart Runbook

## 概述

> **适用场景**: 服务无响应或异常时的紧急重启操作

## 触发条件

- ❌ 服务健康检查持续失败 (>2分钟)
- ❌ 请求错误率 > 10%
- ❌ 服务延迟 > 500ms (P99)

## 诊断步骤

```bash
# 1. 检查 Pod 状态
kubectl get pods -n production -l app=YOUR_SERVICE

# 2. 查看最近日志
kubectl logs YOUR_POD -n production --tail=100

# 3. 检查资源使用
kubectl top pod YOUR_POD -n production

# 4. 检查事件
kubectl describe pod YOUR_POD -n production
```

## 重启步骤

### Step 1: 滚动重启（推荐）

```bash
kubectl rollout restart deployment/YOUR_SERVICE -n production

# 观察重启状态
kubectl rollout status deployment/YOUR_SERVICE -n production
```

### Step 2: 如果 Pod 卡住，强制删除

```bash
# 删除卡住的 Pod（Deployment 会自动创建新的）
kubectl delete pod YOUR_POD -n production --force --grace-period=0
```

### Step 3: 验证服务恢复

```bash
# 检查新 Pod 是否 Running
kubectl get pods -n production -l app=YOUR_SERVICE -w

# 测试服务响应
curl -s https://YOUR_SERVICE.example.com/health | jq .
```

## 验证清单

- [ ] Pod 状态为 Running
- [ ] 健康检查通过
- [ ] 错误率恢复正常
- [ ] 延迟恢复正常

## 后续跟进

- [ ] 检查监控告警是否消除
- [ ] 查看是否有 OOMKilled 或重启风暴
- [ ] 如频繁重启，创建 Jira 调查单