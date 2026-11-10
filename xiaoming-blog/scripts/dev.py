#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地预览服务器。改了 posts/ 里的 md 会自动重建索引，刷新浏览器即可看到。

用法：python scripts/dev.py  [端口，默认 4321]
"""

from __future__ import annotations

import http.server
import sys
import webbrowser
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4321

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

_snapshot = None


def rebuild_if_needed(force=False):
    global _snapshot
    if POSTS_DIR.exists():
        current = tuple((p.name, p.stat().st_mtime) for p in sorted(POSTS_DIR.glob("*.md")))
    else:
        current = ()
    if force or current != _snapshot:
        _snapshot = current
        try:
            build.main()
        except Exception as exc:
            print(f"  ! 构建出错：{exc}")
        return True
    return False


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        rebuild_if_needed()
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("  %s\n" % (fmt % args))


def main():
    rebuild_if_needed(force=True)
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://127.0.0.1:{PORT}/"
        print(f"\n本地预览：{url}")
        print("按 Ctrl+C 停止\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止。")


if __name__ == "__main__":
    main()
