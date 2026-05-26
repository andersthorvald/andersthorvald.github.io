---
title: Alert Quick Reference
date: 2026-05-25 10:00:00
tags:
  - alerts
  - reference
  - cheatsheet
categories:
  - References
---

# Alert Quick Reference

## High Priority (P1)

### CPU > 90% for 5min
```bash
# Check top processes
top -b -n 1 | head -20
dmesg | tail
```

### Memory > 95% for 5min
```bash
# OOM killer active?
journalctl -k | grep -i "killed process"
```

### Disk > 90%
```bash
du -sh /* 2>/dev/null | sort -rh | head -10
```

## Medium Priority (P2)

### Response Time > 2s
- Check app logs for slow queries
- Check upstream service health
- Scale if needed: `kubectl scale deployment --replicas=+2`

### Error Rate > 1%
- Check recent deployments
- Rollback if necessary: `helm rollback <release>`

### Disk I/O Wait > 20%
```bash
iostat -x 1 5
```

## Low Priority (P3)

### Certificate Expiry < 30 days
```bash
echo | openssl s_client -connect hostname:443 2>/dev/null | openssl x509 -noout -dates
```

### Connection Pool > 80%
Check application connection pool settings and scale database if needed.