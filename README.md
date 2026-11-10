# 小明的博客

一个**纯静态**的 GitHub Pages 博客框架。你只负责两件事：**写 Markdown**、**放图片**。

- 深色科技风，右上角可切浅色
- 时间线首页 · 标签筛选 · 关键词搜索
- 文章页自动生成右侧目录、顶部阅读进度条
- 代码高亮 + 一键复制，外链自动新窗口打开
- 自动生成 RSS（`feed.xml`）和 sitemap
- 不需要 Node，不需要数据库，不需要后台

---

## 一、三分钟上线

### 1. 建一个仓库

登录 GitHub，新建仓库，名字用 **`你的用户名.github.io`**（例如 `xiaoming-0x0.github.io`）。
这样博客地址就是 `https://xiaoming-0x0.github.io`，最短最省事。

> 用别的名字也可以，地址会变成 `https://用户名.github.io/仓库名/`。
> 站点里所有路径都是相对的，两种方式都能跑。

### 2. 传上去

把这个文件夹里的**所有文件**（包括隐藏的 `.github` 和 `.nojekyll`）上传到仓库根目录。

命令行方式：

```bash
git init
git add .
git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/用户名/用户名.github.io.git
git push -u origin main
```

网页方式：仓库页 → **Add file → Upload files**，把文件夹里除 ``.git` 以外的内容全拖进去。
注意网页上传**不支持**隐藏文件夹 `.github`，需要用 GitHub 网页新建文件的方式补上，
或者干脆用命令行 / GitHub Desktop。

### 3. 打开 Pages

仓库 → **Settings → Pages** → **Source** 选 **GitHub Actions**。

回到仓库的 **Actions** 标签页，会看到 `Deploy Blog` 正在跑。绿色勾之后，
访问 `https://你的用户名.github.io` 就能看到首页了。

第一次大概要等 1～2 分钟。

### 4. 改站点信息

打开 `site.config.json`，把标题、作者、地址改成你自己的：

```json
{
  "title": "小明的博客",
  "subtitle": "记录代码、折腾与思考",
  "author": "小明",
  "url": "https://xiaoming-0x0.github.io",
  "heroTitle": "在代码与生活之间，*写点什么*",
  "heroText": "这里放技术笔记、踩坑记录和生活碎片。",
  "footer": "用 Markdown 写作，用一个文件夹做博客。"
}
```

- `heroTitle` 里用 `*星号*` 包住的部分会显示成渐变色。
- `url` 一定要填对，RSS 和 sitemap 靠它生成绝对链接。

---

## 二、写一篇文章

在 `posts/` 里新建 `my-post.md`，顶部写一小段配置，下面是正文：

```markdown
---
title: 文章标题
date: 2026-11-08 21:30
tags: [随笔, 技术]
summary: 首页列表里显示的一句话摘要。
---

正文从这里开始。

## 小标题

普通段落、**加粗**、`行内代码`。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 否 | 不写就用文件名 |
| `date` | 否 | 决定排序；支持 `2026-11-08` 或 `2026-11-08 21:30`；不写用文件修改时间 |
| `tags` | 否 | `[a, b]` 或 `a, b` |
| `summary` | 否 | 不写自动截取正文前 96 字 |
| `draft` | 否 | 写 `true` 就不发布 |

**文件名就是网址**：`posts/hello-world.md` → `post.html?p=hello-world`

建议文件名用英文小写加短横线。中文文件名也能用，但链接会变成一长串百分号编码，分享不好看。

---

## 三、加图片

1. 把图片放进 `images/` 文件夹（任意子目录也行）。
2. 在 Markdown 里这样引用：

```markdown
![图片说明](images/我的截图.png)
```

就这样，别的什么都不用做。

> 图片路径相对于**站点根目录**，不是相对于 md 文件。
> 如果误放到了 `posts/` 里，页面也会自动纠正一次。

为了加载速度，建议图片宽度不超过 1600px，格式用 `.webp` 或 `.jpg`。
截图类可以用 `.png`。

---

## 四、本地预览（可选）

装了 Python 就能本地看效果，改完文章刷新浏览器即可，不用等推送：

```bash
python scripts/dev.py
```

会自动打开 `http://127.0.0.1:4321/`，并且监视 `posts/` 目录——只要 md 有改动就自动重建索引。

Windows 上如果 `python` 命令不认识，试试 `py scripts/dev.py`。

只想重新生成索引（不启服务器）：

```bash
python scripts/build.py
```

---

## 五、目录结构

```text
.
├── index.html            首页（时间线 + 搜索 + 标签筛选）
├── post.html             文章页
├── tags.html             标签总览
├── about.html            关于页
├── 404.html              找不到页面
├── site.config.json      ★ 站点信息都在这里
├── posts/                ★ 文章：一个 .md 一篇
│   ├── index.json        自动生成的索引，不要手改
│   └── content.json      自动生成的正文备份（.md 被平台改写时兜底）
├── pages/
│   └── about.md          关于页内容
├── images/               ★ 图片都放这里
├── assets/
│   ├── css/style.css     样式（改配色看这里）
│   └── js/               页面逻辑
├── scripts/
│   ├── build.py          生成索引 / RSS / sitemap
│   └── dev.py            本地预览服务器
└── .github/workflows/
    └── deploy.yml        推送后自动构建并发布
```

带 ★ 的四个位置是你日常会动的地方，其余不用管。

---

## 六、改配色

打开 `assets/css/style.css`，最上面是「设计变量」：

```css
:root {
  --bg: #08090c;         /* 背景 */
  --text: #e7eaf1;       /* 正文 */
  --accent: #00e6a8;     /* 主色：链接、标签、发光 */
  --accent-2: #7c5cff;   /* 辅色：引用条、标题渐变 */
  --accent-3: #22d3ee;   /* 点缀色：进度条、渐变过渡 */
}
```

改这几个值，整站跟着变。浅色模式在下面的 `[data-theme="light"]` 里，对应着改一份就行。

---

## 七、常见问题

**首页显示「还没有生成文章索引」**
索引文件还没生成。本地跑 `python scripts/build.py`，或者等 Actions 跑完。

**打开网址是 GitHub 的默认 404（The site configured at this address does not contain the requested file）**
说明 Pages 已经开启了，但发布出去的文件里**没有 index.html**。按顺序查三处：

1. 仓库首页第一层看到的是 `index.html`，还是一个名叫 `xiaoming-blog` 的文件夹？
   如果是文件夹 —— 整个目录被当成子目录传上去了，这是最常见的原因，把里面的文件全部剪切到仓库根目录。
2. 仓库名如果是 `用户名.github.io`，网址是 `https://用户名.github.io/`；
   其他仓库名必须带尾巴：`https://用户名.github.io/仓库名/`。
3. Settings → Pages 里 Branch 和目录（`/` 还是 `/docs`）是不是指向 index.html 实际所在的目录。

**Actions 页面空空如也，没有 Deploy Blog**
`.github` 这个点开头的目录没传上去。GitHub 网页上传会静默丢弃隐藏文件，
改用 `git push` / GitHub Desktop，或在网页手动新建 `.github/workflows/deploy.yml` 再把内容粘进去。

**推送了但网址没变**
去仓库 **Actions** 页看最近一次任务。红色就是构建失败，点进去看日志。
最常见的原因是 `posts/index.json` 被手动改坏了，删掉它重新构建即可。

**文章点开是 404**
检查三点：文件名和链接是否一致、`draft` 是不是 `true`、`posts/index.json` 是不是最新的。

**文章页显示「加载失败 · HTTP 404 · ./posts/xxx.md」**
托管平台的 Jekyll 把 `.md` 编译成 `.html` 了，所以直接请求 `.md` 会 404。
根目录缺 `.nojekyll` 时就会这样（分支部署最容易遇到）。

修法：仓库根目录新建一个空文件 `.nojekyll`（Add file → Create new file，文件名就叫 `.nojekyll`），提交即可。
当前版本已带兜底：读不到 `.md` 会自动改用构建生成的 `posts/content.json`，所以更新一次文件也能好。

**Access 被拒 / 部署报错 "Pages site not found"**
Settings → Pages 里的 Source 还没切到 **GitHub Actions**。

**能不能用中文文件名？**
能。但网址会变成 `post.html?p=%E4%BD%A0%E5%A5%BD` 这种，建议还是用英文。

**想换域名**
仓库 Settings → Pages → Custom domain 填域名，然后在域名服务商加一条 CNAME 记录指向 `用户名.github.io`，等 DNS 生效后勾上 Enforce HTTPS。
同时把 `site.config.json` 里的 `url` 改成新域名。

---

## 八、不想用 Actions？改用分支部署

Actions 不是必须的。`posts/index.json` 已经替你生成好了，纯静态托管也能跑。

仓库 → **Settings → Pages** → Source 选 **Deploy from a branch** → Branch 选 `main`、目录选 `/ (root)` → Save。

这样只要文件在根目录，几十秒就能访问，完全不依赖 `.github/workflows/deploy.yml`
（网页上传最容易漏掉的就是这个隐藏目录）。

代价只有一个：每写一篇新文章，要在本地跑一次 `python scripts/build.py` 再提交，
否则首页列表不会更新。

---

## 九、它是怎么工作的

推送代码 → GitHub Actions 运行 `python scripts/build.py` → 扫描 `posts/*.md` 生成 `posts/index.json` →
整个目录打包成 Pages 制品 → GitHub Pages 发布。

页面在浏览器里读 `index.json` 画出列表，点进文章再取 `.md` 原文、用 marked 转成 HTML。
所以：**没有服务端，没有数据库，也没有构建步骤需要你操心**。
