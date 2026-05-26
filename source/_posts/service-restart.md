---
title: Service Restart
date: 2026-05-25 10:00:00
tags:
  - restart
  - service
  - runbook
categories:
  - Runbooks
---

# Service Restart Runbook

## When to Use
Service is unresponsive, returning 5xx errors, or hanging requests.

## Step 1: Check Service Status
```bash
systemctl status <service-name>
journalctl -u <service-name> -n 50
```

## Step 2: Check Resource Usage
```bash
top -p $(pgrep -d',' -f <service-name>)
df -h
```

## Step 3: Restart Service
```bash
systemctl restart <service-name>
sleep 10
systemctl status <service-name>
```

## Step 4: Verify Health
```bash
curl -s http://localhost:<port>/health
```

## Step 5: Monitor for 5 minutes
Watch error rates and latency in Grafana.

## Escalation
If restart fails or service crashes repeatedly → escalate to #sre-incidents.