---
title: Markdown 速查：写文章会用到的全部语法
date: 2026-11-05 10:00
tags: [教程, Markdown]
summary: 一份随手可查的 Markdown 语法表，覆盖标题、列表、代码、表格、图片和折叠块。
---

写博客只用得上 Markdown 的一小部分。这一页就够了。

## 标题

用一到六个 `#` 开头，`##` 会出现在右侧目录里。

```markdown
## 二级标题
### 三级标题
```

## 强调

```markdown
**加粗**  *斜体*  ~~删除线~~  `行内代码`
```

效果：**加粗**、*斜体*、~~删除线~~、`行内代码`。

## 列表

```markdown
- 无序列表
- 第二项
  - 嵌套一层

1. 有序列表
2. 第二项
```

## 代码块

三个反引号开头，后面跟语言名，代码会自动高亮，右上角有复制按钮。

```python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(10))
```

支持的语言：Python、JavaScript、TypeScript、Bash、Go、Rust、C、C++、Java、SQL、JSON、YAML、HTML、CSS、Dockerfile……

## 表格

```markdown
| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| a | b | 1 |
| c | d | 2 |
```

| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| a | b | 1 |
| c | d | 2 |

## 引用

```markdown
> 引用一行话。
```

> 引用一行话。

## 链接与图片

```markdown
[链接文字](https://example.com)
![图片说明](images/example.svg)
```

图片放在 `images/` 文件夹，路径写 `images/文件名`。外链会自动在新标签页打开。

## 分割线

```markdown
---
```

---

大概就这些。真的不需要更多。
