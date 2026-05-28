import os

files = [
    "2026/05/25/database-failover/index.html",
    "2026/05/25/service-restart/index.html",
    "2026/05/25/incident-response/index.html",
    "2026/05/25/alert-quick-reference/index.html",
    "2026/05/25/docker-debug/index.html",
    "2026/05/25/k8s-pod-debug/index.html",
    "about/index.html",
]

for f in files:
    path = os.path.join(os.getcwd(), f)
    with open(path, encoding='utf-8') as fh:
        c = fh.read()
    c = c.replace('/images/og-image.png', '/images/logo.png')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(c)
    print("Updated: " + f)

print("Done")