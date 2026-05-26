---
title: K8s Pod Debug
date: 2026-05-25 10:00:00
tags:
  - kubernetes
  - k8s
  - debug
  - pod
categories:
  - Runbooks
---

# K8s Pod Debug Runbook

## Quick Checks
```bash
# Pod status
kubectl get pods -n <namespace>

# Pod events
kubectl describe pod <pod-name> -n <namespace>

# Pod logs
kubectl logs -f <pod-name> -n <namespace> --tail=100
```

## Restart Issues
```bash
# Check restart count
kubectl get pods | grep -v Running

# Check liveness/readiness probes
kubectl describe pod <pod-name> | grep -A5 "Liveness\|Readiness"
```

## Resource Issues
```bash
# Pod resource usage
kubectl top pod -n <namespace>

# Node capacity
kubectl describe nodes | grep -A5 "Allocated resources"
```

## Network Debug
```bash
# Pod IP
kubectl get pod -o wide

# Service endpoints
kubectl get endpoints <svc-name> -n <namespace>

# DNS resolution test
kubectl run dnsutils --rm -it --image=tutum/dnsutils --restart=Never -- nslookup <service-name>
```

## Access Pod Shell
```bash
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh
```

## Common Fixes
```bash
# Force restart pod
kubectl delete pod <pod-name> -n <namespace>

# Scale up
kubectl scale deployment <deploy-name> --replicas=3 -n <namespace>
```