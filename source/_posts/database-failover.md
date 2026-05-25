---
title: Database Failover Runbook
date: 2026-05-25
tags: [database, failover, critical]
categories: [runbook]
---

# Database Failover Runbook

## 概述

> **适用场景**: 主库不可用时的紧急切换操作

## 触发条件

当出现以下任一情况时触发此 Runbook：

- ❌ 数据库连接超时率 > 5%
- ❌ 主库心跳检测失败
- ❌ 应用告警：`db-primary-down`

## 初步诊断

```bash
# 1. 检查主库状态
ssh db-primary "systemctl status postgresql"

# 2. 查看从库复制状态
ssh db-replica "psql -c 'SELECT * FROM pg_stat_replication;'"

# 3. 检查网络连通性
ping -c 5 db-primary.internal
```

## 切换步骤

### Step 1: 确认从库健康

```bash
# 在从库执行：确认数据同步完成
psql -c "SELECT pg_is_in_recovery();"
# 预期输出: t (true)

# 检查延迟
psql -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"
```

### Step 2: 提升从库为主库

```bash
# 停止从库复制
ssh db-replica "pg_ctl promote -D /var/lib/postgresql/data"

# 验证提升成功
psql -c "SELECT pg_is_in_recovery();"
# 预期输出: f (false)
```

### Step 3: 更新连接字符串

```bash
# 更新应用配置
kubectl patch configmap app-config -n production -p '{"data":{"DB_HOST":"db-replica.internal"}}'

# 重启应用 Pod
kubectl rollout restart deployment/app -n production
```

## 验证清单

- [ ] 从库成功提升为主库
- [ ] 应用能正常连接数据库
- [ ] 数据写入正常
- [ ] 监控图表恢复正常
- [ ] 无错误日志持续出现

## 后续跟进

- [ ] 在 Jira 创建故障单记录
- [ ] 通知 DBA 团队
- [ ] 安排故障复盘会议
- [ ] 修复原主库并重新配置主从

## 相关文档

- [架构文档](/architecture/database)
- [监控 Dashboard](https://grafana.example.com/d/db-overview)