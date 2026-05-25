---
title: 首页
date: 2026-05-25
type: index
---

# SRE Wiki

> Site Reliability Engineering 运行手册与文档中心

---

## 最近文章

{% for post in site.posts.sort('date', -1).limit(5) %}
- [{{ post.title }}]({{ url_for(post.path) }})
{% endfor %}

---

## 分类导航

| 分类 | 说明 |
|------|------|
| Runbook | 故障处理手册 |
| SOP | 标准操作流程 |
| Reference | 命令和配置参考 |

## 快速链接

- [Database Failover Runbook](/2026/05/25/database-failover/)
- [Service Restart Runbook](/2026/05/25/service-restart/)
- [Incident Response SOP](/2026/05/25/incident-response-sop/)
- [Alert Quick Reference](/2026/05/25/alert-quick-reference/)

---

*最后更新: {{ site.posts.sort('date', -1).first().date | date("YYYY-MM-DD") }}*