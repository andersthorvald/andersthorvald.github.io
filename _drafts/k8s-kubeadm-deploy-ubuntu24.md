# 基于 Kubeadm 的 Kubernetes 集群部署方案

> **文档版本**：v1.0  
> **操作系统**：Ubuntu 24.04 LTS  
> **部署方式**：Kubeadm  
> **容器引擎**：Docker Engine (最新稳定版) + cri-dockerd  
> **网络方案**：Calico (非 BGP 模式)  
> **镜像仓库**：Harbor (10.0.0.20)  
> **容器管理工具**：nerdctl  
> **编写日期**：2026-05-29

---

## 一、集群架构概述

### 1.1 硬件与网络规划

| 角色 | 主机名 | IP 地址 | 规格 | 用途 |
|------|--------|---------|------|------|
| Master | k8s-master | 10.0.0.12 | 2C/4G+ | 控制面节点，运行 API Server、Scheduler、Controller Manager |
| Worker-1 | k8s-node01 | 10.0.0.13 | 2C/4G+ | 工作节点，运行业务 Pod |
| Worker-2 | k8s-node02 | 10.0.0.14 | 2C/4G+ | 工作节点，运行业务 Pod |
| 镜像仓库 | harbor | 10.0.0.20 | — | 存放集群所需的容器镜像 |

### 1.2 软件版本对照

| 组件 | 推荐版本 | 说明 |
|------|----------|------|
| Ubuntu | 24.04 LTS | 长期支持版 |
| Docker Engine | 27.x (最新) | 容器运行时 |
| cri-dockerd | 0.3.x (最新) | CRI 适配层，使 K8s 能通过 Docker 运行容器 |
| Kubernetes | 1.29 / 1.30 | 稳定版本，kubeadm 支持良好 |
| Calico | 3.28.x | 网络插件（IPIP 模式，无需 BGP） |
| nerdctl | 2.x (最新) | 容器管理 CLI 工具 |
| Harbor | 2.10.x | 企业级镜像仓库 |

### 1.3 整体拓扑

```
┌─────────────────────────────────────────────────────────┐
│                      Harbor                             │
│                   10.0.0.20:443                         │
└──────────────────────┬────────────────────────────────┘
                       │ pull/push 镜像
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  k8s-master  │ │  k8s-node01   │ │  k8s-node02   │
│  10.0.0.12   │ │  10.0.0.13    │ │  10.0.0.14    │
│  ControlPlane│ │   Worker      │ │   Worker      │
│  + etcd      │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
                       │ Pod 网络 (Calico)
                       ▼
              ┌─────────────────┐
              │  10.244.0.0/16  │
              │  (Pod CIDR)     │
              └─────────────────┘
```

---

## 二、主机名与网络配置

### 2.1 主机名配置

**在所有三台机器上分别执行以下命令（按节点角色选择对应命令）：**

#### Master 节点 (10.0.0.12)

```bash
sudo hostnamectl set-hostname k8s-master --static
sudo reboot
```

#### Worker-1 节点 (10.0.0.13)

```bash
sudo hostnamectl set-hostname k8s-node01 --static
sudo reboot
```

#### Worker-2 节点 (10.0.0.14)

```bash
sudo hostnamectl set-hostname k8s-node02 --static
sudo reboot
```

### 2.2 hosts 文件配置

**在所有三台机器上统一配置 hosts 文件，确保节点间可通过主机名互相解析：**

```bash
sudo tee /etc/hosts <<EOF
127.0.0.1 localhost

# Kubernetes 集群节点
10.0.0.12   k8s-master
10.0.0.13   k8s-node01
10.0.0.14   k8s-node02

# Harbor 镜像仓库
10.0.0.20   harbor
EOF
```

### 2.3 网络互通性验证

**在任意节点上验证网络连通性（以 Master 为例）：**

```bash
# 验证所有节点可达
ping -c 2 k8s-master
ping -c 2 k8s-node01
ping -c 2 k8s-node02
ping -c 2 harbor

# 验证 SSH 端口可用
nc -zv k8s-node01 22
nc -zv k8s-node02 22
```

---

## 三、系统基础配置

> ⚠️ **以下操作如未特别说明，均在所有三台节点上执行。**

### 3.1 关闭 Swap

Kubernetes 要求必须关闭 swap，否则 kubelet 无法正常启动。

```bash
# 临时关闭
sudo swapoff -a

# 永久关闭（移除 /etc/fstab 中的 swap 行）
sudo sed -i '/swap/d' /etc/fstab

# 验证 swap 已关闭
free -h | grep -i swap
# 输出应显示 Swap 行全部为 0 或无输出
```

### 3.2 加载内核模块

```bash
# 写入模块加载配置
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

# 立即加载模块（重启后自动加载）
sudo modprobe overlay
sudo modprobe br_netfilter

# 验证模块加载成功
lsmod | grep -E "overlay|br_netfilter"
```

### 3.3 配置 sysctl 网络参数

```bash
# 写入 sysctl 配置
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 立即生效
sudo sysctl --system

# 验证参数
sysctl net.bridge.bridge-nf-call-iptables
sysctl net.ipv4.ip_forward
```

### 3.4 防火墙配置（可选）

如果启用了 UFW 防火墙，需要放行相关端口：

```bash
# Master 节点需要放行的端口
sudo ufw allow 6443/tcp   # Kubernetes API Server
sudo ufw allow 2379/tcp   # etcd client port
sudo ufw allow 2380/tcp   # etcd peer port
sudo ufw allow 10250/tcp  # kubelet API
sudo ufw allow 10259/tcp  # kube-scheduler
sudo ufw allow 10257/tcp  # kube-controller-manager

# Worker 节点需要放行的端口
sudo ufw allow 10250/tcp  # kubelet API
sudo ufw allow 30000:32767/tcp  # NodePort 范围

# 所有节点之间放行 Calico 所需端口
sudo ufw allow 179/tcp   # BGP（若使用bird则需要，即使非BGP模式Calico内部可能用到）
sudo ufw allow 4789/udp  # VXLAN
sudo ufw allow 51820/udp  # WireGuard IPv4（Calico 网络隔离用）
sudo ufw allow 51821/udp  # WireGuard IPv6

# 重新加载防火墙规则
sudo ufw reload
```

> **提示**：建议生产环境关闭防火墙（`sudo ufw disable`），在网络层面统一控制访问。

---

## 四、安装 Docker Engine

### 4.1 安装最新版 Docker

```bash
# 更新 apt 包索引
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -o root -g root -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 设置 Docker APT 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker 最新版本
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 并设置开机自启
sudo systemctl enable containerd
sudo systemctl restart docker

# 验证 Docker 安装
sudo docker version
```

### 4.2 配置 Docker 镜像加速与私有仓库

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 写入 Docker daemon 配置（Harbor + 官方镜像加速）
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn"
  ],
  "insecure-registries": [
    "10.0.0.20",
    "10.0.0.20:443"
  ],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# 重启 Docker 生效配置
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证配置
sudo docker info | grep -A 5 "Registry Mirrors"
sudo docker info | grep -A 2 "Insecure Registries"
```

### 4.3 配置 Harbor 证书信任（可选，若 Harbor 使用 HTTPS）

如果 Harbor 使用了自签名证书，需要将证书添加到系统信任列表：

```bash
# 从 Harbor 下载证书（若有 CA 证书）
# sudo mkdir -p /usr/local/share/ca-certificates/harbor
# sudo cp harbor.crt /usr/local/share/ca-certificates/harbor/
# sudo update-ca-certificates

# 或者在 /etc/docker/daemon.json 中添加 tls 跳过验证（如上一步所示）
```

---

## 五、安装 cri-dockerd

### 5.1 什么是 cri-dockerd

cri-dockerd 是 Docker 的 CRI（Container Runtime Interface）实现。Kubernetes 通过 CRI 接口与容器运行时通信，Docker 本身不直接实现 CRI，因此需要 cri-dockerd 作为桥接层。

### 5.2 下载与安装 cri-dockerd

```bash
# 下载最新版 cri-dockerd（请根据最新的 GitHub Release 选择对应版本）
CRIDOCKER_VERSION=$(curl -s https://api.github.com/repos/Mirantis/cri-dockerd/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
echo "Latest cri-dockerd version: ${CRIDOCKER_VERSION}"

# 下载 cri-dockerd 安装包（amd64 架构）
curl -fsSL "https://github.com/Mirantis/cri-dockerd/releases/download/v${CRIDOCKER_VERSION}/cri-dockerd-${CRIDOCKER_VERSION}.amd64.tgz" -o /tmp/cri-dockerd.tgz

# 解压并安装
sudo tar -xzf /tmp/cri-dockerd.tgz -C /tmp
sudo mv /tmp/cri-dockerd/usr/bin/* /usr/bin/
sudo mv /tmp/cri-dockerd/usr/local/bin/* /usr/local/bin/

# 清理
rm -rf /tmp/cri-dockerd.tgz /tmp/cri-dockerd

# 验证安装
cri-dockerd --version
```

### 5.3 配置 cri-dockerd 系统服务

```bash
# 创建 systemd 服务文件
cat <<EOF | sudo tee /etc/systemd/system/cri-dockerd.service
[Unit]
Description=CRI Interface for Docker Application Container Engine
Documentation=https://docs.mirantis.com
After=network-online.target firewalld.service docker.service
Wants=network-online.target

[Service]
ExecStart=/usr/bin/cri-dockerd --pod-infra-container-image=registry.k8s.io/pause:3.9 --network-plugin=cri-dockerd --dockerversion=v27.x --cri-dockerd-root-directory=/var/lib/cri-dockerd --docker-daemon-root-directory=/var/lib/docker --container-runtime-endpoint=unix:///var/run/docker.sock --advertise-address=auto --cri-dockerd-advertise-address=auto --feature-gates=EventedPLEG=false
Restart=always
RestartSec=5
StartLimitInterval=0
StartLimitBurst=0
TimeoutStartSec=0
Delegate=yes
KillMode=process
LimitNOFILE=1048576
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd，启用并启动 cri-dockerd
sudo systemctl daemon-reload
sudo systemctl enable cri-dockerd
sudo systemctl start cri-dockerd

# 验证状态
sudo systemctl status cri-dockerd --no-pager
```

### 5.4 验证 cri-dockerd 可用性

```bash
# 查看 cri-dockerd 是否正常运行
sudo systemctl status cri-dockerd | grep "Active:"

# 验证 CRI  socket 文件存在
ls -la /var/run/cri-dockerd.sock

# 测试 cri-dockerd 响应
crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock version
```

---

## 六、安装 Kubernetes 组件

### 6.1 添加 Kubernetes APT 仓库

**在所有三台节点上执行：**

```bash
# 添加 GPG 密钥
sudo install -m 0755 -o root -g root -d /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# 添加 Kubernetes APT 仓库
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

# 安装 kubelet、kubeadm、kubectl
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl

# 锁定版本，防止意外升级
sudo apt-mark hold kubelet kubeadm kubectl

# 验证安装
kubeadm version
kubelet --version
kubectl version --client
```

### 6.2 配置 kubectl 自动补全

```bash
# 安装 bash-completion
sudo apt-get install -y bash-completion

# 配置当前用户的 kubectl 自动补全
kubectl completion bash | sudo tee /etc/bash_completion.d/kubectl > /dev/null

# 重新加载 shell 使补全生效
source /usr/share/bash-completion/bash_completion
```

---

## 七、部署 Kubernetes 集群

### 7.1 拉取必需镜像（Master 节点执行）

为避免国内网络问题，建议提前拉取所有必需的容器镜像。可以使用阿里云或中科大镜像加速。

```bash
# 设置镜像加速源的环境变量
export REGISTRY_MIRROR="--registry-mirror=https://docker.m.daocloud.io"

# 预先拉取控制面组件镜像（使用 kubeadm 自动拉取模式）
kubeadm config images pull \
  --cri-socket unix:///var/run/cri-dockerd.sock \
  --image-repository registry.k8s.io \
  --kubernetes-version v1.29.0

# 如果网络有问题，可以手动从镜像加速源拉取并打 tag
# 示例（使用中科大镜像源）
# crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.29.0
# crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.29.0 registry.k8s.io/kube-apiserver:v1.29.0
```

> **提示**：如果使用 nerdctl，需注意 nerdctl 的默认 socket 路径可能与 crictl 不同，请根据实际情况调整。

### 7.2 初始化 Master 节点

**仅在 Master 节点 (10.0.0.12) 上执行：**

```bash
# 执行 kubeadm init
# 参数说明：
#   --control-plane-endpoint: API Server 对外暴露的地址（可用负载均衡 VIP）
#   --pod-network-cidr: Pod 网络地址段（Calico 默认使用 10.244.0.0/16）
#   --service-cidr: Service 网络地址段
#   --cri-socket: 指定使用 cri-dockerd 的 socket
#   --image-repository: 镜像仓库地址
#   --upload-certs: 将证书自动上传到 kubelet 以便后续添加 control-plane 节点
sudo kubeadm init \
  --control-plane-endpoint=k8s-master:6443 \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12 \
  --cri-socket unix:///var/run/cri-dockerd.sock \
  --image-repository registry.k8s.io \
  --kubernetes-version v1.29.0 \
  --upload-certs

# 等待初始化完成（约 3-5 分钟）
```

初始化成功后会输出类似以下内容，**请务必保存好输出的 join 命令**：

```
Your Kubernetes control-plane has been initialized successfully!

To start using your cluster, you run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

  kubectl apply -f <pod-network-subnet-of-your-cidr>

# 将工作节点加入集群（Worker Join 命令）
kubeadm join k8s-master:6443 --token xxxxxxxx --discovery-token-ca-cert-hash sha256:xxxxxxxx

# 将新的 Master 节点加入集群（仅当需要多 Master 时使用）
kubeadm join k8s-master:6443 --token xxxxxxxx --discovery-token-ca-cert-hash sha256:xxxxxxxx --control-plane
```

### 7.3 配置 kubectl

```bash
# 配置 kubectl 访问集群
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
sudo chmod 600 $HOME/.kube/config

# 验证 kubectl 配置
kubectl get nodes

# 设置环境变量（永久生效，写入 ~/.bashrc）
echo 'export KUBECONFIG=$HOME/.kube/config' >> $HOME/.bashrc
source $HOME/.bashrc
```

---

## 八、安装 Calico 网络插件

### 8.1 下载并安装 Calico

```bash
# 下载 Calico manifest 文件
curl -fsSL https://docs.projectcalico.org/manifests/calico.yaml -o /tmp/calico.yaml

# 修改 Pod CIDR 配置（确保与 kubeadm init 时指定的 --pod-network-cidr 一致）
# 检查当前配置
grep "CALICO_IPV4POOL_CIDR" /tmp/calico.yaml

# 编辑 CALICO_IPV4POOL_CIDR 为 10.244.0.0/16（Calico 默认值，无需修改）
# CALICO_IPV4POOL_CIDR: "10.244.0.0/16"

# 如果使用 nerdctl 管理镜像，先拉取镜像到本地
# crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock pull docker.io/calico/cni:v3.28.0
# crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock pull docker.io/calico/kube-controllers:v3.28.0
# crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock pull docker.io/calico/node:v3.28.0
# crictl --runtime-endpoint unix:///var/run/cri-dockerd.sock pull registry.k8s.io/pause:3.9

# 安装 Calico
kubectl apply -f /tmp/calico.yaml

# 清理
rm /tmp/calico.yaml
```

### 8.2 验证 Calico 组件状态

```bash
# 等待 Calico Pod 就绪（可能需要 2-3 分钟）
kubectl get pods -n kube-system -l k8s-app=calico-node

# 确认所有 Calico Pod 均为 Running 状态
watch kubectl get pods -n kube-system -l k8s-app=calico-node

# 查看 Calico node 状态
kubectl get nodes -o wide
```

---

## 九、添加 Worker 节点

### 9.1 在 Master 节点获取 Join 命令

如果未保存之前的 join 命令，可在 Master 节点重新生成：

```bash
# 生成新的 join token（有效期 24 小时）
kubeadm token create --print-join-command

# 输出示例：
# kubeadm join k8s-master:6443 --token xxxxxxxx --discovery-token-ca-cert-hash sha256:xxxxxxxx
```

### 9.2 在 Worker 节点执行 Join

**分别在 Worker-1 (10.0.0.13) 和 Worker-2 (10.0.0.14) 上执行：**

```bash
# 复制之前生成的 join 命令并执行（使用 cri-dockerd socket）
kubeadm join k8s-master:6443 \
  --token xxxxxxxx \
  --discovery-token-ca-cert-hash sha256:xxxxxxxx \
  --cri-socket unix:///var/run/cri-dockerd.sock
```

### 9.3 验证集群节点状态

**在 Master 节点上执行：**

```bash
# 查看所有节点状态
kubectl get nodes -o wide

# 预期输出：
# NAME          STATUS     ROLES           AGE     VERSION
# k8s-master   NotReady   control-plane   5m      v1.29.0
# k8s-node01    NotReady   <none>          1m      v1.29.0
# k8s-node02    NotReady   <none>          1m      v1.29.0

# 等待所有节点变为 Ready 状态
# 可能需要 1-2 分钟让 kubelet 拉取 pause 镜像
watch kubectl get nodes
```

> **注意**：节点初次加入时状态为 `NotReady` 是正常的，需要等待 Calico 网络插件部署完成。稍后会变为 `Ready`。

---

## 十、安装 nerdctl

### 10.1 nerdctl 简介

nerdctl 是一个与 Docker CLI 兼容的容器管理工具，支持 Docker Compose v2、nerdctl 特有功能（如 rootless 模式、镜像加密等）。在集群环境中可以使用 nerdctl 直接管理节点上的容器。

### 10.2 下载与安装

```bash
# 下载最新版 nerdctl（请根据 GitHub Release 选择对应版本）
NERDCTL_VERSION=$(curl -s https://api.github.com/repos/containerd/nerdctl/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
echo "Latest nerdctl version: ${NERDCTL_VERSION}"

# 下载 nerdctl 二进制文件
curl -fsSL "https://github.com/containerd/nerdctl/releases/download/v${NERDCTL_VERSION}/nerdctl-${NERDCTL_VERSION}-linux-amd64.tar.gz" -o /tmp/nerdctl.tar.gz

# 解压安装
sudo tar -xzf /tmp/nerdctl.tar.gz -C /usr/local/bin/

# 清理
rm /tmp/nerdctl.tar.gz

# 验证安装
nerdctl version
```

### 10.3 配置 nerdctl 连接 cri-dockerd

nerdctl 默认连接的是 containerd socket。如需通过 nerdctl 管理 cri-dockerd，需要配置 alias 或修改默认 socket 路径：

```bash
# 方式一：创建 alias（推荐，写入 ~/.bashrc）
echo 'alias nerdctl="nerdctl --address unix:///var/run/cri-dockerd.sock"' >> $HOME/.bashrc
source $HOME/.bashrc

# 方式二：直接指定 socket
nerdctl --address unix:///var/run/cri-dockerd.sock ps

# 方式三：设置 NERDCTL_ADDRESS 环境变量
echo 'export NERDCTL_ADDRESS=unix:///var/run/cri-dockerd.sock' >> $HOME/.bashrc
source $HOME/.bashrc
nerdctl ps
```

### 10.4 nerdctl 常用命令示例

```bash
# 查看运行中的容器
nerdctl ps

# 查看所有容器（包括已停止）
nerdctl ps -a

# 拉取镜像
nerdctl pull docker.io/library/nginx:alpine

# 从 Harbor 拉取镜像
nerdctl pull 10.0.0.20/library/nginx:alpine

# 登录 Harbor
nerdctl login 10.0.0.20 -u admin -p Harbor12345

# 运行一个容器
nerdctl run -d --name web-test docker.io/library/nginx:alpine

# 查看容器日志
nerdctl logs web-test

# 停止容器
nerdctl stop web-test

# 删除容器
nerdctl rm web-test

# 查看镜像列表
nerdctl images

# 清理未使用的镜像
nerdctl image prune -f

# 构建镜像（使用 Dockerfile）
nerdctl build -t 10.0.0.20/myapp:v1.0.0 ./myapp/

# 推送镜像到 Harbor
nerdctl push 10.0.0.20/myapp:v1.0.0
```

---

## 十一、配置 Harbor 镜像仓库

### 11.1 登录 Harbor

```bash
# 使用 nerdctl 或 docker 登录 Harbor
nerdctl login 10.0.0.20 -u admin -p Harbor12345
# 或
docker login 10.0.0.20 -u admin -p Harbor12345
```

> **注意**：Harbor 默认管理员账号为 `admin`，密码在首次部署时设置。若忘记密码，可在 Harbor 服务器上通过 `./prepare` 脚本重新生成或修改。

### 11.2 配置 Kubernetes 使用 Harbor

为了让 K8s Pod 能从 Harbor 拉取镜像，需要在集群中配置 imagePullSecrets：

```bash
# 创建拉取 Harbor 镜像用的 Secret
kubectl create secret docker-registry harbor-secret \
  --docker-server=10.0.0.20 \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  --docker-email=admin@example.com \
  -n default

# 查看创建的 Secret
kubectl get secret harbor-secret -n default
```

### 11.3 在 Pod 中使用 Harbor Secret

在 Pod 的 spec 中添加 imagePullSecrets：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-test
spec:
  containers:
  - name: nginx
    image: 10.0.0.20/library/nginx:alpine
  imagePullSecrets:
  - name: harbor-secret
```

### 11.4 全局配置 imagePullSecrets（可选）

如果希望所有 Pod 默认使用 Harbor，可以创建 ServiceAccount 并绑定 secret：

```bash
# 编辑 default ServiceAccount
kubectl edit serviceaccount default -n default

# 在 data 字段中添加：
# docker-config.json: <base64编码的 docker config.json>
```

---

## 十二、管理与验证

### 12.1 集群状态总览

```bash
# 查看所有节点状态
kubectl get nodes -o wide

# 查看所有命名空间下的 Pod
kubectl get pods --all-namespaces -o wide

# 查看集群组件健康状态
kubectl get cs

# 查看 kubelet 日志
sudo journalctl -u kubelet -f --no-pager
```

### 12.2 部署测试应用验证集群功能

```bash
# 部署一个简单的 Nginx 应用
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      imagePullSecrets:
      - name: harbor-secret
      containers:
      - name: nginx
        image: 10.0.0.20/library/nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: NodePort
EOF

# 查看 Pod 部署情况
kubectl get pods -l app=nginx -o wide

# 查看 Service
kubectl get svc nginx-service

# 测试访问（通过 NodePort）
curl http://10.0.0.12:$(kubectl get svc nginx-service -o jsonpath='{.spec.ports[0].nodePort}')
curl http://10.0.0.13:$(kubectl get svc nginx-service -o jsonpath='{.spec.ports[0].nodePort}')
curl http://10.0.0.14:$(kubectl get svc nginx-service -o jsonpath='{.spec.ports[0].nodePort}')
```

### 12.3 跨节点 Pod 通信验证

```bash
# 查看 Pod 的 IP 地址（Pod 之间通过 IP 直接通信）
kubectl get pods -l app=nginx -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.podIP}{"\n"}{end}'

# 进入一个 Pod，测试访问另一个 Pod
kubectl exec -it <pod-name> -- sh
# 在 Pod 内执行
wget -qO- http://<another-pod-ip>
```

### 12.4 nerdctl 节点层面验证

```bash
# 在各个节点上验证 cri-dockerd 和 nerdctl 的连接
nerdctl --address unix:///var/run/cri-dockerd.sock ps

# 验证节点上的容器（通过 nerdctl 查看）
# 注意：nerdctl 看到的是运行时容器，K8s Pod 容器由 kubelet 管理
# nerdctl 主要用于查看非 K8s 管理的独立容器
```

---

## 十三、异常处理

### 13.1 节点加入失败

**症状**：执行 `kubeadm join` 后报错或超时。

**排查步骤**：

```bash
# 1. 检查 token 是否过期（token 默认有效期 24 小时）
kubeadm token list

# 2. 如果 token 过期，重新生成
kubeadm token create --print-join-command

# 3. 获取最新的 ca-cert-hash
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'

# 4. 重新执行 join 命令（带上正确的 hash）

# 5. 检查 kubelet 日志
sudo journalctl -u kubelet -f --no-pager | tail -100
```

### 13.2 镜像拉取失败

**症状**：Pod 一直处于 `ImagePullBackOff` 或 `ErrImagePull` 状态。

**排查步骤**：

```bash
# 1. 查看具体错误
kubectl describe pod <pod-name>

# 2. 检查镜像是否存在
nerdctl --address unix:///var/run/cri-dockerd.sock images | grep <image-name>

# 3. 手动拉取镜像测试
nerdctl pull <image-url>

# 4. 如果是 Harbor 证书问题，检查配置
cat /etc/docker/daemon.json | grep insecure

# 5. 手动 tag 并推送镜像（绕过 HTTPS 问题）
nerdctl tag <source-image> 10.0.0.20/<path>:<tag>
nerdctl push 10.0.0.20/<path>:<tag>
```

### 13.3 Calico 网络异常

**症状**：节点状态为 `Ready`，但 Pod 之间无法通信。

**排查步骤**：

```bash
# 1. 确认 Calico Pod 全部 Running
kubectl get pods -n kube-system -l k8s-app=calico-node

# 2. 查看 Calico 日志
kubectl logs -n kube-system -l k8s-app=calico-node --tail=50

# 3. 确认 Calico node 状态
kubectl get nodes -o wide
kubectl get nn -n kube-system

# 4. 检查 Felix（Calico 策略）配置
kubectl exec -n kube-system calico-node-<pod-hash> -- calico-node status

# 5. 确认 Pod CIDR 已分配
kubectl get pods -o wide | grep <pod-name>

# 6. 如需重装 Calico
kubectl delete -f /tmp/calico.yaml
kubectl apply -f /tmp/calico.yaml
```

### 13.4 cri-dockerd 启动失败

**症状**：`systemctl status cri-dockerd` 显示 failed。

```bash
# 1. 查看详细日志
sudo journalctl -u cri-dockerd -f --no-pager

# 2. 常见原因：Docker daemon 未启动
sudo systemctl status docker | grep Active

# 3. 常见原因：socket 路径错误
ls -la /var/run/cri-dockerd.sock
ls -la /var/run/docker.sock

# 4. 重启 cri-dockerd
sudo systemctl restart cri-dockerd
```

### 13.5 kubelet 无法启动

**症状**：`systemctl status kubelet` 显示 failed。

```bash
# 1. 查看 kubelet 日志
sudo journalctl -u kubelet -f --no-pager

# 2. 常见原因：swap 未关闭
free -h | grep -i swap
# 如果还有 swap，执行 sudo swapoff -a

# 3. 常见原因：网桥未配置
cat /proc/sys/net/bridge/bridge-nf-call-iptables

# 4. 常见原因：cri-socket 不存在
ls -la /var/run/cri-dockerd.sock

# 5. 如果 kubelet 配置有问题，重置 kubeadm
sudo kubeadm reset --cri-socket unix:///var/run/cri-dockerd.sock
```

### 13.6 Harbor 连接问题

**症状**：无法登录或拉取 Harbor 镜像。

```bash
# 1. 验证 Harbor 服务正常
curl -k https://10.0.0.20/api/v2.0/

# 2. 检查 Docker daemon 配置的 insecure-registries
cat /etc/docker/daemon.json | grep insecure

# 3. 重启 Docker
sudo systemctl restart docker

# 4. 手动测试拉取
docker pull 10.0.0.20/library/ubuntu:22.04
```

### 13.7 nerdctl 无法连接 cri-dockerd

```bash
# 1. 确认 cri-dockerd socket 存在
ls -la /var/run/cri-dockerd.sock

# 2. 测试 socket 连接
nerdctl --address unix:///var/run/cri-dockerd.sock ps

# 3. 检查权限
sudo ls -la /var/run/cri-dockerd.sock

# 4. 将当前用户加入 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 5. 或者用 sudo 执行（临时方案）
sudo nerdctl ps
```

---

## 十四、常用维护命令汇总

### 14.1 日常运维

```bash
# 重启 kubelet
sudo systemctl restart kubelet

# 重启 cri-dockerd
sudo systemctl restart cri-dockerd

# 重启 Docker
sudo systemctl restart docker

# 查看 kubelet 日志
sudo journalctl -u kubelet -f --no-pager

# 查看节点污点（Taints）
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{": "}{.spec.taints[*].key}{"\n"}{end}'

# 移除节点污点（允许 Master 调度 Pod）
kubectl taint nodes k8s-master node-role.kubernetes.io/control-plane:NoSchedule-
```

### 14.2 证书管理

```bash
# 查看证书过期时间
kubeadm certs check-expiration

# 更新所有证书
kubeadm certs renew all
sudo systemctl restart kubelet

# 查看 kubelet.conf 配置
ls -la /etc/kubernetes/kubelet.conf
```

### 14.3 重置集群

```bash
# 在要移除的节点上执行（仅限 Worker 节点）
sudo kubeadm reset --cri-socket unix:///var/run/cri-dockerd.sock

# 清理残留配置
sudo rm -rf /etc/kubernetes/manifests /etc/kubernetes/pki
sudo rm -rf ~/.kube

# 重新 join
kubeadm join ...
```

---

## 十五、环境变量速查表

为方便日常使用，建议将以下环境变量写入 `~/.bashrc`：

```bash
# Kubernetes
export KUBECONFIG=$HOME/.kube/config
source <(kubectl completion bash)

# nerdctl（使用 cri-dockerd socket）
export NERDCTL_ADDRESS=unix:///var/run/cri-dockerd.sock
alias nerdctl='nerdctl --address unix:///var/run/cri-dockerd.sock'

# Docker daemon 免 sudo
export DOCKER_HOST=unix:///var/run/docker.sock
```

---

## 附录 A：完整节点配置检查清单

| 检查项 | Master | Node01 | Node02 | 命令 |
|--------|--------|--------|--------|------|
| 主机名设置 | k8s-master | k8s-node01 | k8s-node02 | `hostnamectl` |
| swap 已关闭 | ✓ | ✓ | ✓ | `free -h \| grep -i swap` |
| overlay/br_netfilter 模块加载 | ✓ | ✓ | ✓ | `lsmod \| grep -E "overlay\|br_netfilter"` |
| sysctl 网络参数 | ✓ | ✓ | ✓ | `sysctl net.bridge.bridge-nf-call-iptables` |
| Docker 已安装 | ✓ | ✓ | ✓ | `docker --version` |
| Docker daemon 配置 | ✓ | ✓ | ✓ | `cat /etc/docker/daemon.json` |
| cri-dockerd 已安装 | ✓ | ✓ | ✓ | `cri-dockerd --version` |
| cri-dockerd 运行中 | ✓ | ✓ | ✓ | `systemctl status cri-dockerd` |
| kubelet/kubeadm/kubectl | ✓ | ✓ | ✓ | `kubectl version --client` |
| nerdctl 已安装 | ✓ | ✓ | ✓ | `nerdctl version` |

---

## 附录 B：相关资源链接

| 资源 | 链接 |
|------|------|
| kubeadm 官方文档 | https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ |
| cri-dockerd GitHub | https://github.com/Mirantis/cri-dockerd |
| Calico 官方文档 | https://docs.projectcalico.org/ |
| nerdctl GitHub | https://github.com/containerd/nerdctl |
| Harbor 官方文档 | https://goharbor.io/docs/ |
| Kubernetes 镜像仓库 | https://registry.k8s.io/ |

---

> **文档完**