---
title: Alert Response Quick Reference
date: 2026-05-25
tags: [monitoring, alert, prometheus]
categories: [reference]
---

# Alert Response Quick Reference

## 常用告警处理

### CPU 高负载

```bash
# 查看 CPU 使用最高的进程
top -c

# 查看具体容器 CPU
docker stats --no-stream

# 如果是 Java 服务
jstack <pid> | head -50
```

### 内存不足 (OOM)

```bash
# 查看 OOM Killer 日志
dmesg -T | grep -i "out of memory"

# 查看各服务内存使用
free -h
docker stats --no-stream
```

### 磁盘空间不足

```bash
# 查看各分区使用
df -h

# 查看大文件
du -sh /* 2>/dev/null | sort -rh | head -10

# 清理日志
journalctl --vacuum-size=500M
```

### 网络连接数过多

```bash
# 查看连接数
ss -s

# 查看 TIME_WAIT 连接
ss -ant | awk '{print $1}' | sort | uniq -c

# 查看异常 IP
netstat -ant | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -10
```

## Prometheus 常用查询

```promql
# CPU 使用率
100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 磁盘使用率
100 - (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100

# HTTP 请求延迟 P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

## Grafana Dashboard 快捷键

| 快捷键 | 功能 |
|--------|------|
| `g` + `d` | 跳转到 Dashboards |
| `g` + `s` | 跳转到 Explore |
| `v` | 切换面板编辑模式 |
| `t` | 切换时间范围 |

## 告警静默

```bash
# 使用 amtool 静默告警（需配置 AlertManager）
amtool silence add alertname="HighCPU" duration="1h" creator="on-call@example.com"

# 查看当前静默
amtool silence query
```