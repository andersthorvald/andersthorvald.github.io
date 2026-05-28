import subprocess, json, os, time

prompts = [
    ("sre-wiki-logo-server", "Minimalist logo for SRE Wiki site reliability engineering documentation blog. A stylized server rack icon with a green heartbeat line on a small LCD screen, text SRE Wiki in clean sans-serif. Coral pink gradient background #ff9a9e to #fecfef, white icons and text. Professional tech logo, vector style, flat design, simple and recognizable at small sizes. No noise, no texturing."),
    ("sre-wiki-logo-gear", "Minimalist logo for SRE Wiki site reliability engineering documentation blog. A gear/cog wheel interlocking with a document/page icon, text SRE Wiki in modern sans-serif below. Coral pink #ff9a9e to peach #fad0c4 gradient background, white icons and text. Clean flat design, professional tech documentation. Simple and recognizable at small sizes. No noise, no texturing."),
    ("sre-wiki-logo-shield", "Minimalist logo for SRE Wiki site reliability engineering blog. A shield shape containing a checkmark and server signal icon, SRE Wiki text below in modern sans-serif. Coral pink gradient #ff9a9e to #fad0c4 background, white icons and text inside shield. Professional SRE operations theme, flat design, simple and clean. No noise, no texturing."),
]

for slug, prompt in prompts:
    result = subprocess.run(
        ["mavis", "mcp", "call", "matrix", "matrix_generate_image",
         json.dumps({"prompt": prompt})],
        capture_output=True, text=True, cwd=r"C:\Users\Administrator\gh-pages-worktree"
    )
    print(f"[{slug}] stdout: {result.stdout[:300]}")
    print(f"[{slug}] stderr: {result.stderr[:200]}")
    time.sleep(2)