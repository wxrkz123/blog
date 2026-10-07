#!/usr/bin/env bash
# Rebuild the whole site with Hexo 6.3.0 + hexo-theme-matery and copy the generated
# pages back into this repository. Usage: _hexo/rebuild/build.sh [work dir]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../.." && pwd)
WORK=${1:-${TMPDIR:-/tmp}/wxrkz-blog-build}
MATERY_COMMIT=86ad429e24d0b002c1feb245e510ea93f82e3395
mkdir -p "$WORK" && cd "$WORK"
cp "$HERE/package.json" "$HERE/_config.yml" .
[ -d node_modules ] || npm install --no-audit --no-fund
if [ ! -d themes/matery ]; then
  git clone https://github.com/blinkfox/hexo-theme-matery.git themes/matery
  git -C themes/matery checkout -q "$MATERY_COMMIT"
fi
cp "$HERE/_config.matery.yml" themes/matery/_config.yml
rm -rf scripts source && mkdir -p scripts source/_posts source/about source/tags source/categories
cp "$HERE"/scripts/*.js scripts/
for p in about tags categories; do
  printf -- '---\ntitle: %s\ndate: 2023-08-11 00:00:00\ntype: "%s"\nlayout: "%s"\n---\n' $p $p $p > source/$p/index.md
done
python3 "$HERE/extract_posts.py" "$REPO" source/_posts "$REPO/_hexo/posts"
cp "$REPO"/_hexo/posts/*.md source/_posts/
npx hexo clean >/dev/null
npx hexo generate
cd public
find . -name index.html | while read -r f; do mkdir -p "$REPO/$(dirname "$f")"; cp "$f" "$REPO/$f"; done
cp search.xml "$REPO/search.xml"
echo "site regenerated into $REPO"
