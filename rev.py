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
    p = os.path.join(os.getcwd(), f)
    with open(p, encoding='utf-8') as fh:
        c = fh.read()
    c = c.replace('/images/logo.png', '/images/og-image.png')
    with open(p, 'w', encoding='utf-8') as fh:
        fh.write(c)
    print("Reverted: " + f)
print("Done")