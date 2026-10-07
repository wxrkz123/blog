"""Recover the pre-existing posts from the deployed HTML so Hexo can rebuild the whole site.

The original Markdown sources of the older posts are not in this repository, so each
deployed post page is turned back into a Hexo post whose body is the rendered HTML
(front matter `rawhtml: true`, handled by scripts/rawhtml.js).

usage: python3 extract_posts.py <deployed site dir> <out _posts dir> <series posts dir>
"""
import sys, pathlib
from bs4 import BeautifulSoup

blog, out, series = (pathlib.Path(a) for a in sys.argv[1:4])
out.mkdir(parents=True, exist_ok=True)
skip = {p.stem for p in series.glob('*.md')}
for page in sorted(blog.glob('20*/*/*/*/index.html')):
    y, m, d, slug = page.parent.relative_to(blog).parts
    if slug in skip:
        continue
    raw = page.read_text(encoding='utf-8')
    soup = BeautifulSoup(raw, 'html.parser')
    title = soup.select_one('h1.post-title').get_text()
    info = soup.select_one('.article-info')
    tags = [c.get_text() for c in info.select('.article-tag .chip') if c.get_text() != '无标签']
    cats = [a.get_text().strip() for a in info.select('.post-category')]
    head = '<div id="articleContent">\n                '
    start = raw.index(head) + len(head)
    end = raw.index('\n                \n            </div>\n            <hr/>', start)
    # target/rel are added by Hexo's external_link filter at render time; store the pre-filter HTML
    content = raw[start:end].replace('<a target="_blank" rel="noopener" href=', '<a href=')
    fm = ['---', f'title: {title}', f'date: {y}-{m}-{d} 12:00:00']
    if tags:
        fm += ['tags:'] + [f'  - {t}' for t in tags]
    if cats:
        fm += ['categories:'] + [f'  - {c}' for c in cats]
    if 'MathJax.Hub.Config' in raw:
        fm.append('mathjax: true')
    fm += ['toc: false', 'rawhtml: true', '---']
    (out / f'{slug}.md').write_text('\n'.join(fm) + '\n' + content, encoding='utf-8')
    assets = [p for p in page.parent.iterdir() if p.name != 'index.html']
    if assets:
        (out / slug).mkdir(exist_ok=True)
        for a in assets:
            (out / slug / a.name).write_bytes(a.read_bytes())
