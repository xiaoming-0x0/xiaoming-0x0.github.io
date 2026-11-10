---
title: 这套博客是怎么跑起来的
date: 2026-11-01 15:20
tags: [教程, GitHub]
summary: 从一次推送到一个能访问的网址，中间发生了什么；以及出问题时该看哪里。
---

整个站点只有静态文件，没有任何服务端。理解下面这条链路，你就再也不会被它卡住。

## 一次推送之后

```text
git push
   │
   ├─ GitHub Actions 被触发
   │     │
   │     ├─ python scripts/build.py
   │     │     扫描 posts/*.md
   │     │     生成 posts/index.json / feed.xml / sitemap.xml
   │     │
   │     └─ 把整个目录打包成 Pages 制品
   │
   └─ GitHub Pages 发布，几十秒后网址生效
```

浏览器打开首页时，只做了一件事：读取 `posts/index.json`，然后把文章列表画出来。
点进某一篇，再用 `fetch` 取回对应的 `.md` 原文，在浏览器里转成 HTML。

## 为什么要生成索引

浏览器没法"列目录"。它不知道 `posts/` 里有哪些文件，所以需要 `index.json` 这份清单——
标题、日期、标签、摘要都在里面。搜索引擎和 RSS 也靠它。

这个文件是自动生成的，**不要手改**。

## 出问题先看这三处

1. 首页写着「还没有生成文章索引」→ 本地跑一次 `python scripts/build.py`。
2. 推送后网址没更新 → 仓库的 **Actions** 标签页，看最近一次任务是不是红色。
3. 文章打开是 404 → 检查文件名是否和链接一致，以及 `draft` 是不是写成了 `true`。

## 为什么不用现成的博客框架

现成的方案也很好。但这个文件夹的好处是：没有 `node_modules`、没有版本升级、没有插件冲突，
三年后回来改一篇文章，它还是这样跑。

换电脑也好办——克隆仓库，装上 Python，`python scripts/dev.py`，就能写。
