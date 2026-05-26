---
title: Incident Response
date: 2026-05-25 10:00:00
tags:
  - incident
  - response
  - sop
categories:
  - SOPs
---

# Incident Response SOP

## Severity Levels
| Level | Response Time | Example |
|------|--------------|---------|
| P1 | 15 min | Full outage, data loss |
| P2 | 1 hour | Partial outage |
| P3 | 4 hours | Degraded performance |

## Response Steps

### 1. Acknowledge
- Claim incident in PagerDuty
- Create incident channel: #inc-YYYYMMDD-description

### 2. Assess
- Check monitoring dashboards
- Identify blast radius
- Assign roles: Lead, Comms, Tech

### 3. Mitigate
- Communicate status every 15 min
- Apply fastest mitigation first
- Document actions in real-time

### 4. Resolve
- Confirm metrics return to normal
- Update status page
- Close incident in PagerDuty

### 5. Follow-up
- Schedule post-mortem within 48h
- Create action items in Jira
- Update runbooks if gaps found

## Contacts
- On-call SRE: PagerDuty
- Engineering Lead: @eng-lead
- Management: @mgt-oncall