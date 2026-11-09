---
title: Python 从入门到精通（13）：标准库精选
date: 2026-10-07 10:55:00
summary: “自带电池”的正确打开方式：pathlib 文件操作、collections 与 heapq/bisect、带时区的 datetime 与 zoneinfo、json 的自定义编解码、正则表达式的分组与非贪婪、logging 的层级架构、argparse、subprocess 的安全用法、random 与 secrets 的区别、enum 与 sqlite3。每个模块都给出设计原理与常见陷阱。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

Python 的口号之一是“自带电池”（batteries included）：标准库覆盖了文件、文本、数据格式、网络、并发、测试等方方面面。很多人习惯性地 `pip install` 一个第三方包，其实标准库早已提供了足够好的方案。本篇挑选日常开发中最实用的模块，不追求面面俱到，而是讲清楚每个模块的**设计思路和常见陷阱**。

> 本文是「Python 从入门到精通」系列第 13 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、pathlib：面向对象的路径

`pathlib`（3.4+）用对象来表示文件系统路径，取代了 `os.path` 中零散的字符串函数：

```python
>>> from pathlib import Path, PurePosixPath
>>> p = PurePosixPath("/home/alice/projects/report.final.pdf")
>>> p.name, p.stem, p.suffix, p.suffixes
('report.final.pdf', 'report.final', '.pdf', ['.final', '.pdf'])
>>> p.parent, p.parent.parent.name
(PurePosixPath('/home/alice/projects'), 'alice')
>>> p.with_suffix(".docx"), p.with_stem("summary")
(PurePosixPath('/home/alice/projects/report.final.docx'), PurePosixPath('/home/alice/projects/summary.pdf'))
>>> PurePosixPath("/data") / "2026" / "10" / "log.txt"     # 用 / 运算符拼接路径
PurePosixPath('/data/2026/10/log.txt')
>>> p.relative_to("/home/alice")
PurePosixPath('projects/report.final.pdf')
```

`Pure*Path` 只做路径的字符串运算，不访问文件系统；`Path` 则会根据当前操作系统自动成为 `PosixPath` 或 `WindowsPath`，并提供文件操作方法：

```python
>>> import tempfile
>>> root = Path(tempfile.mkdtemp())
>>> (root / "logs").mkdir()
>>> f = root / "logs" / "app.log"
>>> f.write_text("第一行\n第二行\n", encoding="utf-8")
8
>>> f.read_text(encoding="utf-8").splitlines()
['第一行', '第二行']
>>> f.exists(), f.is_file(), f.stat().st_size
(True, True, 20)
>>> _ = (root / "logs" / "old.log").write_text("x", encoding="utf-8")
>>> sorted(p.name for p in root.rglob("*.log"))          # 递归查找
['app.log', 'old.log']
>>> backup = f.copy(root / "app.bak")                     # 3.14 新增 copy / move
>>> backup.read_text(encoding="utf-8") == f.read_text(encoding="utf-8")
True
```

几点建议：

- 写新代码时**优先使用 `pathlib`**。几乎所有接受路径的标准库函数都接受 `Path` 对象（它们实现了 `os.PathLike` 协议的 `__fspath__` 方法）。
- 读写文本时，`read_text`/`write_text` 和 `open` 一样，**一定要指定 `encoding`**。
- 3.14 为 `Path` 增加了 `copy()`、`copy_into()`、`move()`、`move_into()` 方法，以前需要借助 `shutil` 才能完成的操作现在可以直接调用。删除整个目录树仍然使用 `shutil.rmtree`。

## 二、collections：专用容器

第 04 篇已经介绍了 `deque`，这里再看几个同样常用的容器。

### 1. Counter：计数器

```python
>>> from collections import Counter
>>> words = "the quick brown fox jumps over the lazy dog the end".split()
>>> c = Counter(words)
>>> c.most_common(2)
[('the', 3), ('quick', 1)]
>>> c["the"], c["cat"]                   # 不存在的键返回 0，而不是 KeyError
(3, 0)
>>> Counter("aabbbc") + Counter("abd")   # 支持加减和集合运算
Counter({'b': 4, 'a': 3, 'c': 1, 'd': 1})
>>> Counter("aabbbc") - Counter("abbbbb")  # 减法会丢弃非正数的计数
Counter({'a': 1, 'c': 1})
>>> sorted(Counter("listen").elements()) == sorted(Counter("silent").elements())   # 判断字母异位词
True
```

### 2. defaultdict：自动创建默认值

```python
>>> from collections import defaultdict
>>> groups = defaultdict(list)                 # 访问不存在的键时，自动调用 list() 创建默认值
>>> for name, dept in [("张三", "研发"), ("李四", "市场"), ("王五", "研发")]:
...     groups[dept].append(name)
...
>>> dict(groups)
{'研发': ['张三', '王五'], '市场': ['李四']}
>>> tree = lambda: defaultdict(tree)           # 一行实现任意深度的嵌套字典
>>> config = tree()
>>> config["db"]["primary"]["host"] = "10.0.0.1"
>>> config["db"]["primary"]["host"]
'10.0.0.1'
```

需要注意，`defaultdict` 只有在**用 `[]` 访问**时才会创建默认值；`get()` 和 `in` 不会触发创建。另外，“只是读取”也会插入新键，这有时会造成意外：`if groups["不存在的部门"]:` 之后，这个部门就出现在字典里了。

### 3. ChainMap：多层查找

`ChainMap` 把多个字典“串”在一起，查找时按顺序搜索，写入时只写第一个。它非常适合实现“命令行参数 > 环境变量 > 配置文件 > 默认值”这种层叠配置：

```python
>>> from collections import ChainMap
>>> defaults = {"color": "red", "user": "guest", "debug": False}
>>> config_file = {"user": "admin"}
>>> cli_args = {"debug": True}
>>> settings = ChainMap(cli_args, config_file, defaults)
>>> settings["color"], settings["user"], settings["debug"]
('red', 'admin', True)
```

Python 解释器自己查找变量时的 LEGB 规则，本质上就是一个 `ChainMap`。

### 4. OrderedDict 还有用吗？

自从普通字典在 3.7 起保证插入顺序后，`OrderedDict` 的使用场景变少了，但它仍有两个独特之处：`move_to_end()` 方法（实现 LRU 缓存很方便，第 07 篇用过），以及**比较时考虑顺序**：

```python
>>> from collections import OrderedDict
>>> {"a": 1, "b": 2} == {"b": 2, "a": 1}
True
>>> OrderedDict(a=1, b=2) == OrderedDict(b=2, a=1)
False
```

## 三、heapq 与 bisect：有序数据的算法

### 1. heapq：堆与优先队列

`heapq` 在普通列表上实现了**最小堆**：`heap[0]` 始终是最小的元素，插入和弹出都是 O(log n)。

```python
>>> import heapq
>>> tasks = []
>>> heapq.heappush(tasks, (2, "写报告"))       # (优先级, 任务)，元组按第一个元素比较
>>> heapq.heappush(tasks, (1, "修复线上故障"))
>>> heapq.heappush(tasks, (3, "回复邮件"))
>>> heapq.heappop(tasks)
(1, '修复线上故障')
>>> heapq.nsmallest(3, [7, 1, 9, 4, 2, 8]), heapq.nlargest(2, [7, 1, 9, 4, 2, 8])
([1, 2, 4], [9, 8])
>>> list(heapq.merge([1, 4, 7], [2, 5, 8], [3, 6]))   # 惰性地合并多个有序序列
[1, 2, 3, 4, 5, 6, 7, 8]
```

“从 n 个元素中取前 k 大”时，`nlargest` 的复杂度是 O(n log k)，当 k 远小于 n 时比完整排序快得多。3.14 还新增了 `heapify_max`、`heappush_max`、`heappop_max` 等函数，可以直接操作最大堆，不必再用“取负数”的技巧了。

如果多个元素的优先级相同，元组会继续比较第二个元素；如果第二个元素是不可比较的对象（比如字典），就会报错。常见的解决办法是插入一个自增的计数器作为第二个元素：`(priority, next(counter), task)`，这同时也保证了相同优先级的任务按插入顺序出队。

### 2. bisect：在有序列表中二分查找

```python
>>> import bisect
>>> scores = [60, 70, 80, 90]
>>> grades = "FDCBA"
>>> def grade(s):
...     return grades[bisect.bisect_right(scores, s)]   # 找到 s 应该插入的位置
...
>>> [grade(s) for s in (55, 60, 75, 89, 90, 100)]
['F', 'D', 'C', 'B', 'A', 'A']
>>> data = [1, 3, 5]
>>> bisect.insort(data, 4)                              # 插入并保持有序
>>> data
[1, 3, 4, 5]
```

`bisect` 的查找是 O(log n)，但 `insort` 的插入仍然是 O(n)（因为列表需要移动元素）。另外，3.10 起 `bisect` 系列函数支持 `key` 参数。

## 四、datetime 与 zoneinfo：正确处理时间

时间处理是 bug 的重灾区。理解两个概念就能避开大部分坑：

- **naive**（朴素）时间：不带时区信息，只是一个“墙上时钟”的读数，无法确定它对应的是世界上哪一个时刻；
- **aware**（感知）时间：带有时区信息，代表一个确定的时刻。

```python
>>> from datetime import datetime, timedelta, timezone
>>> from zoneinfo import ZoneInfo
>>> naive = datetime(2026, 10, 7, 9, 0)
>>> naive.tzinfo is None
True
>>> shanghai = datetime(2026, 10, 7, 9, 0, tzinfo=ZoneInfo("Asia/Shanghai"))
>>> shanghai.isoformat()
'2026-10-07T09:00:00+08:00'
>>> shanghai.astimezone(ZoneInfo("America/New_York")).isoformat()   # 同一时刻，在纽约是几点？
'2026-10-06T21:00:00-04:00'
>>> shanghai.astimezone(timezone.utc)
datetime.datetime(2026, 10, 7, 1, 0, tzinfo=datetime.timezone.utc)
>>> shanghai - naive
Traceback (most recent call last):
  ...
TypeError: can't subtract offset-naive and offset-aware datetimes
```

`zoneinfo`（3.9+）使用 IANA 时区数据库，能正确处理**夏令时**。看一个夏令时切换的例子：2026 年 3 月 8 日凌晨 2 点，美国东部时间会直接跳到 3 点：

```python
>>> ny = ZoneInfo("America/New_York")
>>> before = datetime(2026, 3, 8, 1, 30, tzinfo=ny)
>>> (before + timedelta(hours=1)).isoformat()            # 墙上时钟加 1 小时
'2026-03-08T02:30:00-05:00'
>>> after = (before.astimezone(timezone.utc) + timedelta(hours=1)).astimezone(ny)
>>> after.isoformat()                                     # 真实经过 1 小时
'2026-03-08T03:30:00-04:00'
```

第一种算法得到的 `02:30` 在纽约根本不存在！这是因为 `datetime` 对 aware 时间做加减法时，是按“墙上时钟”计算的。**需要计算真实经过的时间时，先转换为 UTC，计算完再转换回来。**

处理时间的最佳实践：

1. 程序内部和数据库中**统一使用 UTC 的 aware 时间**；
2. 只在显示给用户时，才转换为用户所在的时区；
3. 获取当前时间用 `datetime.now(timezone.utc)`，而不是已经被弃用的 `datetime.utcnow()`（它返回的是一个 naive 时间，非常容易被误用）；
4. 与外部系统交换时间时，使用 ISO 8601 格式（`isoformat()` / `fromisoformat()`）。

另外，测量**代码运行耗时**时不要用 `datetime.now()` 或 `time.time()`，因为系统时钟可能被 NTP 同步调整甚至回拨。应该使用 `time.perf_counter()`（高精度）或 `time.monotonic()`（单调递增，保证不回退）。

## 五、json：数据交换

```python
>>> import json
>>> data = {"name": "小明", "scores": [90, 85.5], "active": True, "spouse": None}
>>> json.dumps(data)
'{"name": "\\u5c0f\\u660e", "scores": [90, 85.5], "active": true, "spouse": null}'
>>> print(json.dumps(data, ensure_ascii=False, indent=2))
{
  "name": "小明",
  "scores": [
    90,
    85.5
  ],
  "active": true,
  "spouse": null
}
```

`ensure_ascii` 默认为 `True`，会把非 ASCII 字符转义为 `\uXXXX`。输出给人看或者写文件时，通常加上 `ensure_ascii=False`（写文件时别忘了 `encoding="utf-8"`）。

JSON 只支持字符串、数字、布尔值、`null`、数组和对象。Python 的元组会变成数组（读回来是列表），字典的非字符串键会被转为字符串，`datetime`、`Decimal`、`set`、自定义类则根本无法序列化。可以通过 `default` 参数处理这些类型，用 `object_hook` 在反序列化时还原：

```python
>>> from datetime import date
>>> from decimal import Decimal
>>> def encode(obj):
...     if isinstance(obj, date):
...         return {"__date__": obj.isoformat()}
...     if isinstance(obj, Decimal):
...         return str(obj)                     # 转成字符串，避免精度损失
...     raise TypeError(f"无法序列化 {type(obj).__name__}")
...
>>> def decode(d):
...     if "__date__" in d:
...         return date.fromisoformat(d["__date__"])
...     return d
...
>>> text = json.dumps({"day": date(2026, 10, 7), "price": Decimal("19.99")}, default=encode)
>>> text
'{"day": {"__date__": "2026-10-07"}, "price": "19.99"}'
>>> json.loads(text, object_hook=decode)
{'day': datetime.date(2026, 10, 7), 'price': '19.99'}
```

还有一个精度相关的细节：JSON 中的数字被解析为 Python 的 `float` 时会有精度损失，处理金额时可以使用 `json.loads(text, parse_float=Decimal)`。

## 六、re：正则表达式

正则表达式本身是一门小语言，这里只强调 Python 中最重要的用法和陷阱。

```python
>>> import re
>>> text = "订单 A1024 金额 ¥399.00，订单 B2048 金额 ¥1,250.50"
>>> pattern = re.compile(r"订单 (?P<id>[A-Z]\d+) 金额 ¥(?P<amount>[\d,]+\.\d{2})")
>>> [m.groupdict() for m in pattern.finditer(text)]
[{'id': 'A1024', 'amount': '399.00'}, {'id': 'B2048', 'amount': '1,250.50'}]
>>> pattern.findall(text)                       # 有分组时，findall 返回分组的元组
[('A1024', '399.00'), ('B2048', '1,250.50')]
```

- **始终使用原始字符串** `r"..."` 写正则表达式，否则 `\d`、`\b` 这样的反斜杠序列可能先被 Python 字符串解释掉（`"\b"` 是退格符！）。
- **命名分组** `(?P<name>...)` 让代码更易读、更易维护。
- `match` 只从字符串**开头**匹配，`search` 在任意位置匹配，`fullmatch` 要求**整个**字符串匹配。做输入校验时应该使用 `fullmatch`，否则 `re.match(r"\d+", "123abc")` 也会成功。

### 贪婪与非贪婪

```python
>>> html = "<b>粗体</b>和<i>斜体</i>"
>>> re.findall(r"<.+>", html)                   # 贪婪：尽可能多地匹配
['<b>粗体</b>和<i>斜体</i>']
>>> re.findall(r"<.+?>", html)                  # 非贪婪：尽可能少地匹配
['<b>', '</b>', '<i>', '</i>']
```

### 用函数做替换

`re.sub` 的替换参数可以是一个函数，它接收匹配对象，返回替换后的字符串：

```python
>>> def to_yuan(m):
...     return f"{int(m.group(1)) / 100:.2f} 元"
...
>>> re.sub(r"(\d+) 分", to_yuan, "运费 1250 分，优惠 300 分")
'运费 12.50 元，优惠 3.00 元'
```

复杂的正则表达式可以使用 `re.VERBOSE` 模式，允许在表达式中加入空白和注释。另外，要警惕“灾难性回溯”：像 `(a+)+$` 这样嵌套的量词，在匹配失败时可能需要指数级的时间，攻击者可以利用它发动拒绝服务攻击（ReDoS）。3.11 起，`re` 支持了原子分组 `(?>...)` 和占有量词 `*+`、`++`，可以用来避免回溯。

最后，**不要用正则表达式解析 HTML、JSON 等结构化格式**，请使用专门的解析器。

## 七、logging：日志

### 1. 为什么不用 print

`print` 无法区分消息的重要程度，无法统一关闭或重定向，也不记录时间和来源。`logging` 模块解决了所有这些问题，它的架构由四个组件组成：

- **Logger**（记录器）：代码中调用的接口，按名字组成**层级树**（`"app"` 是 `"app.db"` 的父节点）；
- **Handler**（处理器）：决定日志发到哪里（终端、文件、网络……）；
- **Formatter**（格式器）：决定日志的格式；
- **Filter**（过滤器）：更细粒度地控制哪些日志被输出。

日志记录会沿着 Logger 树**向上传播**，由沿途各个 Logger 上的 Handler 处理。

```python
>>> import logging, sys
>>> logger = logging.getLogger("shop.payment")          # 惯用法：getLogger(__name__)
>>> handler = logging.StreamHandler(sys.stdout)
>>> handler.setFormatter(logging.Formatter("%(levelname)s [%(name)s] %(message)s"))
>>> app_logger = logging.getLogger("shop")
>>> app_logger.addHandler(handler)                       # 处理器挂在父 Logger 上
>>> app_logger.setLevel(logging.INFO)
>>> logger.debug("调试信息")                              # 低于 INFO，被过滤
>>> logger.info("订单 %s 支付成功，金额 %.2f", "A1024", 399)
INFO [shop.payment] 订单 A1024 支付成功，金额 399.00
>>> try:
...     1 / 0
... except ZeroDivisionError:
...     logger.exception("计算失败")                      # 自动附带异常回溯
...
ERROR [shop.payment] 计算失败
Traceback (most recent call last):
  File "<doctest ...>", line 2, in <module>
    1 / 0
    ~~^~~
ZeroDivisionError: division by zero
```

### 2. 最佳实践

- **库代码**中，每个模块用 `logger = logging.getLogger(__name__)` 获取自己的 Logger，**只记录、不配置**（不要添加 Handler、不要设置级别），把配置的权力留给应用程序。
- **应用程序**在入口处统一配置一次，简单场景用 `logging.basicConfig(...)`，复杂场景用 `logging.config.dictConfig(...)`。
- 使用 `logger.info("用户 %s 登录", name)` 而不是 `logger.info(f"用户 {name} 登录")`：前者只有在这条日志确实需要输出时才会进行字符串格式化，而且日志聚合系统可以根据未格式化的模板对消息分组。

## 八、argparse：命令行参数

```python
>>> import argparse
>>> parser = argparse.ArgumentParser(prog="resize", description="批量调整图片大小")
>>> _ = parser.add_argument("files", nargs="+", help="要处理的图片")
>>> _ = parser.add_argument("-w", "--width", type=int, required=True)
>>> _ = parser.add_argument("-q", "--quality", type=int, default=85, choices=range(1, 101), metavar="1-100")
>>> _ = parser.add_argument("-v", "--verbose", action="store_true")
>>> args = parser.parse_args(["a.jpg", "b.jpg", "-w", "800", "--verbose"])
>>> args
Namespace(files=['a.jpg', 'b.jpg'], width=800, quality=85, verbose=True)
>>> print(parser.format_usage().strip())
usage: resize [-h] -w WIDTH [-q 1-100] [-v] files [files ...]
```

`argparse` 会自动生成帮助信息（`-h`）、进行类型转换和校验，并在参数错误时给出清晰的提示。通过 `add_subparsers()` 还能实现 `git commit`、`git push` 这样的子命令。如果项目对命令行体验有更高的要求，第三方库 Typer 和 Click 也是很好的选择。

## 九、subprocess：运行外部命令

```python
>>> import subprocess, sys
>>> result = subprocess.run(
...     [sys.executable, "-c", "import sys; print('hello'); sys.exit(3)"],
...     capture_output=True, text=True,
... )
>>> result.returncode, result.stdout
(3, 'hello\n')
>>> subprocess.run([sys.executable, "-c", "raise SystemExit(1)"], check=True)
Traceback (most recent call last):
  ...
subprocess.CalledProcessError: Command '[...]' returned non-zero exit status 1.
```

使用 `subprocess` 时有一条非常重要的安全规则：**以列表形式传递参数，避免使用 `shell=True`**，尤其是当参数中含有用户输入时。

<!-- norun -->
```python
filename = "x.txt; rm -rf ~"                          # 恶意输入
subprocess.run(f"cat {filename}", shell=True)          # 危险！shell 会执行分号后面的命令
subprocess.run(["cat", filename])                       # 安全：整个字符串只是一个参数
```

`shell=True` 会把命令交给 `/bin/sh` 解释，分号、管道、反引号等都会被 shell 当作语法执行，这就是**命令注入**漏洞。列表形式则直接调用程序，参数原样传入。另外，记得加 `check=True` 让失败的命令抛出异常，以及在可能卡住的命令上设置 `timeout`。

## 十、random 与 secrets

```python
>>> import random
>>> rng = random.Random(42)                    # 指定种子：结果可以复现
>>> [rng.randint(1, 6) for _ in range(5)]
[6, 1, 1, 6, 3]
>>> rng.choice(["石头", "剪刀", "布"]), rng.sample(range(100), 3)
('石头', [28, 17, 94])
>>> import secrets
>>> len(secrets.token_urlsafe(32)) >= 40        # 生成安全的随机令牌
True
```

`random` 模块使用梅森旋转算法（Mersenne Twister），它的统计特性很好、速度快，适合模拟、游戏、抽样；但它是**可预测的**：观察到 624 个连续的输出后，就能推算出之后的所有输出。因此，**生成密码、令牌、验证码、密钥时，必须使用 `secrets` 模块**，它使用操作系统提供的密码学安全的随机源。

## 十一、enum：枚举

```python
>>> from enum import Enum, IntFlag, auto, StrEnum
>>> class OrderStatus(StrEnum):                # 3.11 新增：成员同时也是字符串
...     PENDING = auto()
...     PAID = auto()
...     SHIPPED = auto()
...
>>> OrderStatus.PAID, OrderStatus.PAID == "paid", OrderStatus("shipped")
(<OrderStatus.PAID: 'paid'>, True, <OrderStatus.SHIPPED: 'shipped'>)
>>> [s.name for s in OrderStatus]
['PENDING', 'PAID', 'SHIPPED']
>>> class Perm(IntFlag):                       # 可以按位组合的标志
...     READ = 4
...     WRITE = 2
...     EXEC = 1
...
>>> mode = Perm.READ | Perm.WRITE
>>> mode, Perm.WRITE in mode, Perm.EXEC in mode
(<Perm.READ|WRITE: 6>, True, False)
```

用枚举代替“魔法字符串”和“魔法数字”，可以让拼写错误在第一时间暴露（`OrderStatus.PAYED` 会直接报 `AttributeError`），也让类型检查器和 IDE 能够提供帮助。结合第 05 篇的 `match` 语句使用时，枚举成员是标准的值模式。

## 十二、sqlite3：内置的数据库

Python 内置了 SQLite 数据库，无需安装任何服务，对于小型应用、原型开发和数据分析非常方便：

```python
>>> import sqlite3
>>> conn = sqlite3.connect(":memory:")                   # 内存数据库；也可以传文件路径
>>> _ = conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INT)")
>>> with conn:                                           # 事务：正常结束提交，异常则回滚
...     _ = conn.executemany("INSERT INTO users (name, age) VALUES (?, ?)",
...                          [("张三", 28), ("李四", 35), ("王五", 22)])
...
>>> name = "李四' OR '1'='1"                             # 恶意输入
>>> conn.execute("SELECT * FROM users WHERE name = ?", (name,)).fetchall()   # 参数化查询：安全
[]
>>> conn.execute("SELECT name FROM users WHERE age > ? ORDER BY age", (25,)).fetchall()
[('张三',), ('李四',)]
```

和 `subprocess` 一样，**永远使用参数化查询（`?` 占位符）**，不要用字符串拼接或格式化构造 SQL，否则就会产生 SQL 注入漏洞。上面的恶意输入如果被拼接进 SQL，就会变成 `WHERE name = '李四' OR '1'='1'`，返回所有用户。

## 十三、更多值得了解的模块

| 模块 | 用途 |
|---|---|
| `itertools`、`functools`、`operator` | 函数式编程工具（第 06～08 篇） |
| `dataclasses`、`enum`、`typing` | 数据建模与类型（第 10、16 篇） |
| `shutil`、`tempfile`、`glob` | 高级文件操作、临时文件 |
| `csv`、`tomllib`（3.11+，只读）、`configparser` | 常见数据与配置格式 |
| `hashlib`、`hmac`、`secrets` | 哈希、消息认证、安全随机数 |
| `statistics`、`math`、`decimal`、`fractions` | 数学与统计 |
| `textwrap`、`difflib`、`string` | 文本处理 |
| `concurrent.futures`、`threading`、`multiprocessing`、`asyncio` | 并发（第 17、18 篇） |
| `unittest`、`doctest`、`unittest.mock` | 测试（第 22 篇） |
| `timeit`、`cProfile`、`tracemalloc` | 性能分析（第 19、21 篇） |
| `urllib.request`、`http.server`、`socket` | 网络（生产环境常用第三方库 `httpx`、`requests`） |
| `compression.zstd` | 3.14 新增的 Zstandard 压缩支持 |

## 小结

- 路径操作使用 `pathlib`；读写文本始终指定编码。
- `Counter` 计数、`defaultdict` 分组、`ChainMap` 层叠配置；`heapq` 实现优先队列和 Top-K，`bisect` 在有序列表中二分查找。
- 时间统一用 UTC 的 aware `datetime` 存储，用 `zoneinfo` 处理时区和夏令时；测量耗时用 `perf_counter`。
- `json` 用 `default`/`object_hook` 扩展类型；正则用原始字符串、命名分组和 `fullmatch` 校验。
- 库只记录日志不配置日志；使用 `%` 风格的延迟格式化。
- `subprocess` 用参数列表避免命令注入；SQL 用参数化查询避免注入；安全相关的随机数使用 `secrets`。

## 练习

1. 写一个脚本，统计某个目录（递归）下所有 `.py` 文件的总行数、空行数和注释行数，按文件行数从大到小输出前 10 名。只使用 `pathlib` 和 `collections`。
2. 用 `heapq` 实现一个 `TaskScheduler` 类，支持 `add(task, priority)`、`pop()`（返回优先级最高的任务，同优先级先进先出）和 `remove(task)`（提示：查阅 `heapq` 官方文档中“优先队列实现说明”一节，了解“惰性删除”技巧）。
3. 写一个函数 `meeting_times(utc_time, cities)`，给定一个 UTC 时间和若干城市的时区名，打印该时刻在各城市的本地时间，并标注是否处于当地的工作时间（9:00～18:00）。
4. 给 `json` 编写一个完整的编解码器，支持 `datetime`、`Decimal`、`set`、`bytes`（用 base64 编码）和 `dataclass` 实例的往返转换。
5. 为一个命令行工具配置日志：终端输出 INFO 及以上级别、带颜色；文件输出 DEBUG 及以上级别、按天轮转并保留 7 天。要求使用 `logging.config.dictConfig` 实现。

进阶篇到这里就结束了。从下一篇开始，我们进入高级篇，第一站是解释 `property`、方法绑定、`__slots__` 等诸多“魔法”背后共同原理的 {% post_link Python-14-Descriptors '描述符与属性访问机制' %}。
