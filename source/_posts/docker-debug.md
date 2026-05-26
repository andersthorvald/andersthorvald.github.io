---
title: Docker Debug
date: 2026-05-25 10:00:00
tags:
  - docker
  - debug
  - container
categories:
  - Runbooks
---

# Docker Debug Commands

## Container Inspection
```bash
# List running containers
docker ps

# Container logs
docker logs -f <container-name> --tail 100

# Container process list
docker top <container-name>

# Container resource stats
docker stats --no-stream
```

## Inside the Container
```bash
# Enter container shell
docker exec -it <container-name> /bin/sh

# Check container filesystem
docker diff <container-name>

# Container network
docker inspect <container-name> | jq '.[0].NetworkSettings'
```

## Network Debugging
```bash
# Check DNS resolution
docker exec <container-name> nslookup <hostname>

# Check port connectivity
docker exec <container-name> nc -zv <host> <port>

# View container network
docker network ls
docker network inspect <network-name>
```

## Performance
```bash
# Container resource usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Inspect layer sizes
docker history <image-name>
```

## Cleanup
```bash
# Remove unused containers/images/networks
docker system prune -f
```