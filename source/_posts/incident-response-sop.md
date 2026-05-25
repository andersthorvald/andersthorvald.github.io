---
title: Incident Response SOP
date: 2026-05-25
tags: [incident, on-call, escalation]
categories: [sop]
---

# Incident Response SOP

## 事件分级

| 级别 | 定义 | 响应时间 | 示例 |
|------|------|----------|------|
| P0 | 核心服务完全不可用 | 立即 | 网站无法访问、支付失败 |
| P1 | 主要功能受损 | 15分钟内 | 登录异常、搜索不可用 |
| P2 | 部分功能受影响 | 1小时内 | 某地区用户受影响 |
| P3 | 轻微问题 | 4小时内 | 非核心功能延迟 |

## 响应流程

### Phase 1: 发现与确认 (0-5分钟)

1. 收到告警或用户反馈
2. 确认真实性，排除误报
3. 评估影响范围
4. 记录事件开始时间

### Phase 2: 通报 (5-10分钟)

```
📢 事件通报模板：
【P1 事件】[服务名] [问题描述]
影响: [影响范围]
状态: 调查中
负责人: [你的名字]
预计恢复: [时间]
```

发送至：
- 值班群
- 相关业务负责人

### Phase 3: 调查与止血 (10-30分钟)

1. 查看监控和日志
2. 定位根因
3. 执行止血操作
4. 验证止血效果

### Phase 4: 恢复与通知 (30-60分钟)

1. 确认服务恢复
2. 通知相关方
3. 更新状态

### Phase 5: 复盘 (事件结束后)

1. 编写 Postmortem
2. 分析根因
3. 制定改进措施
4. 跟踪 Action Items

## 常用止血操作

```bash
# 回滚版本
kubectl rollout undo deployment/YOUR_APP -n production

# 切换流量到备用集群
kubectl patch service YOUR_APP -n production -p '{"spec":{"selector":{"cluster":"backup"}}}'

# 启用熔断
curl -X POST http://circuit-breaker/api/enable
```

## 关键联系人

| 角色 | 联系方式 |
|------|----------|
| 值班工程师 | 值班群 @all |
| DBA 团队 | dba@example.com |
| 网络团队 | network@example.com |
| 产品负责人 | @product_owner |