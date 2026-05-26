---
title: Database Failover
date: 2026-05-25 10:00:00
tags:
  - database
  - failover
  - runbook
categories:
  - Runbooks
---

# Database Failover Runbook

## Pre-check
- Verify primary DB is unreachable from app servers
- Check monitoring alerts for DB health

## Step 1: Identify Primary Failure
```bash
# Check current primary status
psql -h <primary-host> -c "SELECT pg_is_in_recovery();"
```

## Step 2: Promote Replica
```bash
# On replica server
pg_ctl promote -D /var/lib/postgresql/data
```

## Step 3: Update Connection Strings
Update application config to point to new primary IP.

## Step 4: Verify Replication
```bash
# Confirm all data synced
psql -h <new-primary> -c "SELECT * FROM pg_stat_replication;"
```

## Step 5: Notify Team
- Post incident in #sre-incidents
- Update status page
- Schedule post-mortem

## Rollback
If primary recovers, reconfigure as new replica and sync data before switching back.