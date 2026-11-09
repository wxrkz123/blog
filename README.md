# 博客源码（source 分支）

这是博客 <https://wxrkz123.github.io/blog/> 的 Hexo 源码。

- **`source` 分支（这里）**：文章、配置、主题。**以后只需要改这里。**
- **`main` 分支**：自动生成的网页，GitHub Pages 从这里发布。不要手动修改。

每次推送到 `source` 分支，GitHub Actions 会自动执行 `hexo generate`，并把生成的网页发布到 `main` 分支，一两分钟后网站就会更新。运行记录在仓库的 **Actions** 页面。

📖 **详细的写作、预览、发布方法和常见问题，见 [使用说明.md](使用说明.md)。**

## 目录结构

```text
├── _config.yml              站点配置（网址、分页、永久链接等）
├── package.json             依赖（Hexo 6.3.0 及插件）
├── 使用说明.md               详细使用说明
├── scaffolds/post.md        新建文章的模板
├── scripts/                 构建时用到的小脚本（见下文）
├── source/
│   ├── _posts/              所有文章（.md）
│   ├── images/did/          DID 系列的配图
│   ├── about/ tags/ categories/   特殊页面
│   ├── 404.html             找不到页面时显示，会尝试自动修复坏链接
│   └── README.md            发布到 main 分支的仓库说明
├── themes/matery/           Matery 主题（已包含你的头像、相册等图片和主题配置）
└── .github/workflows/deploy.yml   自动部署流程
```

## 写一篇新文章

### 方法一：直接在 GitHub 网页上写（最简单）

1. 打开仓库，切换到 `source` 分支，进入 `source/_posts/` 目录。
2. 点击 **Add file → Create new file**，文件名例如 `My-New-Post.md`（建议用英文，作为网址的一部分）。
3. 按下面的格式写内容，然后点击 **Commit changes**。

```markdown
---
title: 文章标题
date: 2026-11-09 20:00:00
tags:
  - 标签1
categories:
  - 分类
summary: 一两句话的摘要，显示在首页卡片上（可选）
---

正文从这里开始……
```

图片可以上传到 `source/images/` 下，在文章中用 `![说明](/blog/images/文件名.png)` 引用。

### 方法二：在自己电脑上写

```bash
git clone -b source https://github.com/wxrkz123/blog.git blog-source
cd blog-source
npm install                 # 第一次需要
npx hexo new "文章标题"      # 新建文章
npx hexo server             # 本地预览：http://localhost:4000/blog/
git add . && git commit -m "新文章：xxx" && git push    # 推送后自动发布
```

**不再需要 `hexo deploy`。** 只要 `git push` 到 `source` 分支，网站就会自动更新。

## 关于图片

文章的配图放在与文章同名的文件夹里（例如 `source/_posts/趋势交易/`），在文章中直接写文件名即可：

```markdown
![收盘价与 MACD](Close_Price_and_MACD_Analysis.png)
```

也可以写成 `![说明](文章名/图片.png)`（Typora 的习惯写法），`hexo-asset-img` 插件会自动转换。DID 系列的配图放在 `source/images/did/`，引用方式是 `![说明](/images/did/图片.png)`。

`scripts/seed-order.js` 只用来保持标签云、分类云中标签的显示顺序和原来一致，不影响内容。

## 已做的改进

- 所有文章启用右侧目录（`themes/matery/_config.yml` 中 `toc.enable: true`）；
- 新的 404 页面会自动修复常见的坏链接；
- 访问统计脚本（`themes/matery/source/libs/others/busuanzi.pure.mini.js`）在服务不稳定时不显示空白、不拖慢页面；
- 菜单链接以斜杠结尾，减少一次跳转；
- 去掉了未生效的腾讯验证码和百度推送脚本；MathJax 改用 cdnjs。
