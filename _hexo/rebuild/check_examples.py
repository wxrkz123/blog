"""Execute every Python example in the series' markdown files.

Conventions inside the markdown (HTML comments render invisibly):
  ```python  with '>>>' lines   -> checked with doctest (ELLIPSIS enabled)
  ```python  without '>>>'      -> run as a script; if the next fenced block is
                                   ```text (only blank lines / one caption line
                                   between), stdout must equal it exactly
  <!-- norun -->      skip the next block
  <!-- nocheck -->    run the next block but don't compare its output
  <!-- raises -->     the next script block must exit non-zero
  <!-- continue -->   prepend the previous script block(s) to this one
  <!-- file: p.py --> write the next block to <workdir>/p.py instead of running
  <!-- mypy: p.py -->  the next ```text block must equal `mypy p.py` output
Blocks of one article share a temp working directory.
Also flags '{{', '{%', '{#' outside code fences (Hexo would treat them as Nunjucks).
"""
import re, subprocess, sys, tempfile, pathlib, textwrap, json, os

PY = os.environ.get('CHECK_PYTHON', 'python3.14')
FENCE = re.compile(r'^(\s*)(`{3,})(\S*)\s*$')

DOCTEST_RUNNER = r'''
# All doctest blocks of one article run in one shared namespace, like one REPL session.
import doctest, sys, json
blocks = json.load(open(sys.argv[1], encoding="utf-8"))
parser = doctest.DocTestParser()
globs = {"__name__": "__main__"}
bad = 0
for b in blocks:
    if b["fresh"]:
        globs = {"__name__": "__main__"}
    test = parser.get_doctest(b["code"], globs, f"line {b['line']}", sys.argv[2], b["line"])
    runner = doctest.DocTestRunner(optionflags=doctest.ELLIPSIS)
    runner.run(test, clear_globs=False)
    globs = test.globs  # DocTest copies globs; carry the session forward
    bad += runner.failures
sys.exit(1 if bad else 0)
'''


def parse(md):
    lines = md.split('\n')
    blocks, i, marker_buf, caption_lines = [], 0, [], 0
    in_front = lines[0].strip() == '---'
    prose_issues = []
    while i < len(lines):
        line = lines[i]
        if in_front:
            if i > 0 and line.strip() == '---':
                in_front = False
            i += 1
            continue
        m = FENCE.match(line)
        if m:
            ticks, lang = m.group(2), m.group(3)
            j = i + 1
            body = []
            while j < len(lines) and lines[j].strip() != ticks:
                body.append(lines[j])
                j += 1
            blocks.append(dict(lang=lang, code='\n'.join(l[len(m.group(1)):] if l.startswith(m.group(1)) else l for l in body) + '\n', line=i + 1,
                               markers=marker_buf, gap=caption_lines))
            marker_buf, caption_lines = [], 0
            i = j + 1
            continue
        mm = re.match(r'^\s*<!--\s*(.+?)\s*-->\s*$', line)
        if mm:
            marker_buf.append(mm.group(1))
        elif line.strip():
            caption_lines += 1
            marker_buf = [] if not marker_buf else marker_buf
            stripped = re.sub(r"\{% post_link [\w-]+(?: '[^']*')? %\}", '', line)
            for tok in ('{{', '{%', '{#'):
                if tok in stripped:
                    prose_issues.append((i + 1, tok, line.strip()[:80]))
        i += 1
    return blocks, prose_issues


def run(cmd, cwd, timeout=120):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout,
                          env={**os.environ, 'PYTHONHASHSEED': '0', 'PYTHONIOENCODING': 'utf-8',
                               'PYTHONDONTWRITEBYTECODE': '1'})


def check_file(path):
    md = pathlib.Path(path).read_text(encoding='utf-8')
    blocks, prose_issues = parse(md)
    failures = [f'{path}:{ln}: Nunjucks token {tok!r} in prose: {txt}' for ln, tok, txt in prose_issues]
    stats = dict(doctest=0, script=0, compared=0, skipped=0)
    with tempfile.TemporaryDirectory() as wd:
        runner = pathlib.Path(wd, '_doctest_runner.py')
        runner.write_text(DOCTEST_RUNNER, encoding='utf-8')
        chain = ''
        doctests = []
        for k, b in enumerate(blocks):
            mypy_files = [x[5:].strip() for x in b['markers'] if x.startswith('mypy:')]
            if mypy_files and b['lang'] == 'text':
                stats['compared'] += 1
                r = run(['mypy', '--python-version', '3.14', '--no-color-output', *mypy_files[0].split()], wd)
                got, exp = r.stdout.strip(), b['code'].strip()
                if got != exp:
                    failures.append(f'{path}:{b["line"]}: mypy output mismatch\n--- expected\n{exp}\n--- got\n{got}')
                continue
            if b['lang'] not in ('python', 'py'):
                continue
            mk = b['markers']
            where = f'{path}:{b["line"]}'
            files = [x[5:].strip() for x in mk if x.startswith('file:')]
            if files:
                p = pathlib.Path(wd, files[0]); p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(b['code'], encoding='utf-8')
                continue
            if 'norun' in mk:
                stats['skipped'] += 1
                continue
            code = b['code']
            if re.search(r'^\s*>>> ', code, re.M):
                stats['doctest'] += 1
                doctests.append(dict(code=code, line=b['line'], fresh='fresh' in mk))
                continue
            stats['script'] += 1
            if 'continue' in mk:
                code = chain + code
            chain = code
            src = pathlib.Path(wd, f'_block{k}.py'); src.write_text(code, encoding='utf-8')
            try:
                r = run([PY, str(src)], wd)
            except subprocess.TimeoutExpired:
                failures.append(f'{where}: timeout'); continue
            if 'raises' in mk:
                if r.returncode == 0:
                    failures.append(f'{where}: expected an exception but exited 0')
                continue
            if r.returncode != 0:
                failures.append(f'{where}: exit {r.returncode}\n{textwrap.indent(r.stderr[-2500:], "    ")}')
                continue
            nxt = blocks[k + 1] if k + 1 < len(blocks) else None
            if nxt and nxt['lang'] == 'text' and nxt['gap'] <= 1 and 'nocheck' not in mk:
                stats['compared'] += 1
                got = '\n'.join(l.rstrip() for l in r.stdout.rstrip('\n').split('\n'))
                exp = '\n'.join(l.rstrip() for l in nxt['code'].rstrip('\n').split('\n'))
                if got != exp:
                    failures.append(f'{where}: output mismatch\n--- expected\n{textwrap.indent(exp, "    ")}\n--- got\n{textwrap.indent(got, "    ")}')
        if doctests:
            src = pathlib.Path(wd, '_doctests.json'); src.write_text(json.dumps(doctests), encoding='utf-8')
            r = run([PY, str(runner), str(src), str(path)], wd, timeout=600)
            if r.returncode != 0:
                failures.append(f'{path}: doctest failed\n{textwrap.indent(r.stdout + r.stderr, "    ")}')
    return failures, stats


if __name__ == '__main__':
    total_fail = 0
    for p in sys.argv[1:]:
        fails, st = check_file(p)
        total_fail += len(fails)
        print(f'{"FAIL" if fails else "ok  "} {pathlib.Path(p).name}: {json.dumps(st)}')
        for f in fails:
            print('  ' + f.replace('\n', '\n  '))
    sys.exit(1 if total_fail else 0)
