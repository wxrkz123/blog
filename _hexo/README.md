# 「Python 从入门到精通」系列：源文件与构建说明

这个目录保存了博客中 Python 系列（23 篇）的 **Markdown 源文件**，以及在本仓库中重新生成整站页面的工具。
目录名以下划线开头，GitHub Pages（Jekyll）不会把它发布到网站上。

```text
_hexo/
├── posts/                 # 23 篇文章的 Hexo 源文件（带 front matter），可直接放进 source/_posts/
└── rebuild/               # 在本仓库中重建整站的工具
    ├── build.sh           # 一键重建：生成全部页面并复制回仓库根目录
    ├── _config.yml        # 根据已部署页面还原的站点配置（root: /blog/）
    ├── _config.matery.yml # 根据已部署页面还原的 Matery 主题配置（开启了 TOC）
    ├── extract_posts.py   # 把旧文章从已部署的 HTML 还原成 Hexo 文章
    ├── scripts/           # Hexo 脚本：rawhtml 文章、标签/分类原有顺序、post_link 容错
    ├── check_examples.py  # 执行并校验文章中的全部代码示例
    └── package.json       # Hexo 6.3.0 及生成器插件
```

## ⚠️ 重要：下次在本地执行 `hexo d` 之前

本仓库是 `hexo deploy` 推送的**构建产物**。如果你直接在本地的 Hexo 项目中执行 `hexo g -d`，
新的部署会覆盖这里的页面，Python 系列就会消失。请先把源文件合并到你的 Hexo 项目中：

1. 把 `_hexo/posts/*.md` 复制到本地 Hexo 项目的 `source/_posts/` 目录。
2. （可选，推荐）这些长文使用了侧边栏目录。若想保留，在主题配置 `themes/matery/_config.yml` 中设置：

   ```yaml
   toc:
     enable: true
   ```

   如果不希望旧文章也出现目录，可以在旧文章的 front matter 中加上 `toc: false`。
   不开启也没关系，文章依然可以正常显示，只是没有侧边目录。
3. 正常执行 `hexo clean && hexo g -d` 即可。

文章之间的链接使用 Hexo 内置的 `{% post_link 文件名 '文字' %}` 标签，不依赖任何额外插件。
系列导读（00 篇）设置了 `top: true`，会出现在首页的“推荐文章”区域。

## 在本仓库中重建页面

如果只想修改文章内容、而不想动本地的 Hexo 项目，可以直接在本仓库中重建：

```bash
_hexo/rebuild/build.sh            # 需要 node、npm、git、python3 和 beautifulsoup4
```

脚本会：安装 Hexo 6.3.0 与 Matery 主题（固定在与线上一致的提交）；把仓库中已有的旧文章
从 HTML 还原为 Hexo 文章（它们的原始 Markdown 不在这个仓库中）；加入 `posts/` 中的系列文章；
重新生成首页、归档、分类、标签、关于页和 `search.xml`，并复制回仓库根目录。

重建结果与原来部署的页面逐字节一致，唯一的差异来自构建日期本身：页脚的版权年份、
归档页日历和关于页统计图的时间窗口。

## 代码示例的验证方式

所有可运行的示例都在 **CPython 3.14** 上实际执行过：

```bash
python3 _hexo/rebuild/check_examples.py _hexo/posts/*.md
```

- 以 `>>>` 开头的交互式示例用 `doctest` 校验（同一篇文章中的示例共享一个会话）；
- 脚本示例会被执行，如果紧跟着一个 `text` 代码块，则输出必须与之完全一致；
- 第 16 篇中的类型检查结果由 mypy 实际运行得到并逐字比对；
- 文章中的 HTML 注释（如 `<!-- norun -->`、`<!-- file: x.py -->`）是给校验脚本的标记，渲染后不可见。
  各标记的含义见 `check_examples.py` 的文件头注释。

部分示例的输出与运行环境有关（耗时、内存地址、性能测试结果），这些示例只校验“能够正常运行”，
文中的数字来自一台 4 核 Linux 机器上的实测。
