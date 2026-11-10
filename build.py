#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
扫描 posts/*.md，生成：
  - posts/index.json   文章索引（首页 / 标签页 / 文章页都读它）
  - feed.xml           RSS 2.0
  - sitemap.xml        站点地图
纯标准库，不需要安装任何依赖。

用法：python scripts/build.py
"""

from __future__ import annotations

import json
import math
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
CONFIG_FILE = ROOT / "site.config.json"

DATE_FORMATS = (
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d",
    "%Y/%m/%d %H:%M:%S",
    "%Y/%m/%d %H:%M",
    "%Y/%m/%d",
    "%Y.%m.%d",
)


# --------------------------------------------------------------------------
# front matter
# --------------------------------------------------------------------------
FM_RE = re.compile(r"^\ufeff?---\r?\n(.*?)\r?\n---[ \t]*\r?\n?", re.S)


def split_front_matter(text: str):
    m = FM_RE.match(text)
    if not m:
        return {}, text
    raw, body = m.group(1), text[m.end():]
    meta = {}
    for line in raw.splitlines():
        line = line.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        elif value.startswith("[") and value.endswith("]"):
            inner = value[1:-1]
            value = [v.strip().strip("\"'") for v in inner.split(",") if v.strip()]
        elif "," in value and key in ("tags", "categories"):
            value = [v.strip() for v in value.split(",") if v.strip()]
        meta[key] = value
    return meta, body


def as_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return [v.strip() for v in str(value).split(",") if v.strip()]


def parse_date(value):
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


# --------------------------------------------------------------------------
# 文本处理
# --------------------------------------------------------------------------
FENCE = "```"
TICK = "`"


def plain_text(md: str) -> str:
    t = re.sub(FENCE + r"[\s\S]*?" + FENCE, " ", md)
    t = re.sub(TICK + r"[^" + TICK + r"]*" + TICK, " ", t)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", t)
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"^\s{0,3}#{1,6}\s*", " ", t, flags=re.M)
    t = re.sub(r"[*_~>|]+", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def count_words(text: str) -> int:
    cn = len(re.findall(r"[\u4e00-\u9fff]", text))
    en = len(re.findall(r"[A-Za-z][A-Za-z0-9'_-]*", text))
    digits = len(re.findall(r"\d+", text))
    return cn + en + digits


def cut(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "…"


# --------------------------------------------------------------------------
# 主流程
# --------------------------------------------------------------------------
def load_config():
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"  ! site.config.json 解析失败：{exc}")
    return {}


def collect_posts():
    posts = []
    bodies = {}
    if not POSTS_DIR.exists():
        return posts, bodies

    for path in sorted(POSTS_DIR.glob("*.md")):
        if path.name.startswith("_"):
            continue
        try:
            raw = path.read_text(encoding="utf-8")
        except Exception as exc:
            print(f"  ! 读取失败 {path.name}: {exc}")
            continue

        meta, body = split_front_matter(raw)
        if str(meta.get("draft", "")).lower() in ("true", "1", "yes"):
            continue

        slug = path.stem
        title = str(meta.get("title") or slug)
        dt = parse_date(meta.get("date") or meta.get("created"))
        if dt is None:
            dt = datetime.fromtimestamp(path.stat().st_mtime)

        text = plain_text(body)
        words = count_words(text)
        summary = str(meta.get("summary") or meta.get("description") or "").strip()
        if not summary:
            summary = cut(text, 96)

        bodies[slug] = body.strip()
        posts.append({
            "slug": slug,
            "title": title,
            "date": dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "dateText": dt.strftime("%Y-%m-%d"),
            "tags": as_list(meta.get("tags") or meta.get("categories")),
            "summary": summary,
            "cover": str(meta.get("cover") or ""),
            "readingTime": max(1, math.ceil(words / 350)),
            "words": words,
            "search": cut(text, 800),
        })

    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts, bodies


def write_content(bodies):
    """把每篇正文的 Markdown 原文另存一份。
    这样即使 .md 被托管平台的 Jekyll 转成了 .html，文章页依然能读到内容。"""
    payload = {"posts": bodies, "pages": {}}
    about = ROOT / "pages" / "about.md"
    if about.exists():
        try:
            _, body = split_front_matter(about.read_text(encoding="utf-8"))
            payload["pages"]["about"] = body.strip()
        except Exception as exc:
            print(f"  ! 读取 about.md 失败：{exc}")
    out = POSTS_DIR / "content.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return out


def write_index(site, posts):
    payload = {
        "site": site,
        "builtAt": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "count": len(posts),
        "posts": posts,
    }
    out = POSTS_DIR / "index.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return out


def build_feed(site, posts):
    base = str(site.get("url") or "").rstrip("/")
    title = escape(str(site.get("title") or "Blog"))
    desc = escape(str(site.get("description") or ""))
    author = escape(str(site.get("author") or ""))

    items = []
    for p in posts[:20]:
        link = (base + "/post.html?p=" + quote(p["slug"])) if base else ("post.html?p=" + quote(p["slug"]))
        items.append(
            "    <item>\n"
            f"      <title>{escape(p['title'])}</title>\n"
            f"      <link>{escape(link)}</link>\n"
            f"      <guid isPermaLink=\"false\">{escape(p['slug'])}</guid>\n"
            f"      <pubDate>{p['dateText']} 00:00:00 +0800</pubDate>\n"
            f"      <description>{escape(p['summary'])}</description>\n"
            "    </item>"
        )

    xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<rss version="2.0">\n'
        "  <channel>\n"
        f"    <title>{title}</title>\n"
        f"    <link>{escape(base or './')}</link>\n"
        f"    <description>{desc}</description>\n"
        f"    <language>{escape(str(site.get('lang') or 'zh-CN'))}</language>\n"
        f"    <managingEditor>{author}</managingEditor>\n"
        f"    <lastBuildDate>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} +0800</lastBuildDate>\n"
        + "\n".join(items)
        + "\n  </channel>\n</rss>\n"
    )
    (ROOT / "feed.xml").write_text(xml, encoding="utf-8")


def build_sitemap(site, posts):
    base = str(site.get("url") or "").rstrip("/")
    if not base:
        return
    urls = [base + "/", base + "/tags.html", base + "/about.html"]
    urls += [base + "/post.html?p=" + quote(p["slug"]) for p in posts]
    body = "\n".join("  <url><loc>" + escape(u) + "</loc></url>" for u in urls)
    xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + body + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")


def main():
    print("-> 构建博客索引")
    site = load_config()
    posts, bodies = collect_posts()
    out = write_index(site, posts)
    content = write_content(bodies)
    build_feed(site, posts)
    build_sitemap(site, posts)

    print(f"   站点：{site.get('title', '(未命名)')}")
    print(f"   文章：{len(posts)} 篇")
    for p in posts[:8]:
        tags = ("  #" + " #".join(p["tags"])) if p["tags"] else ""
        print(f"     - {p['dateText']}  {p['title']}{tags}")
    if len(posts) > 8:
        print(f"     ... 其余 {len(posts) - 8} 篇")
    print(f"   输出：{out.relative_to(ROOT)} · {content.relative_to(ROOT)} · feed.xml · sitemap.xml")
    print("完成")


if __name__ == "__main__":
    main()
