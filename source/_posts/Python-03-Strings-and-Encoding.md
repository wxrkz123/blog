---
title: Python 从入门到精通（03）：字符串、字节与编码
date: 2026-10-07 11:45:00
summary: 从 Unicode 码点讲起，彻底搞懂 UTF-8 的编码规则、str 与 bytes 的边界、乱码的成因与修复、Unicode 规范化，以及 CPython 灵活字符串表示、切片语义、f-string 格式化迷你语言和 3.14 的模板字符串。
tags:
  - Python
  - Python基础
categories:
  - Python
---

“乱码”大概是每个中文程序员都踩过的坑：文件读出来是一堆“锟斤拷”“涓枃”，爬下来的网页全是问号，Windows 上写的 CSV 在 Mac 上打不开……这些问题的根源只有一个：**没有分清“字符”和“字节”**。本篇从 Unicode 的基本概念讲起，彻底理清 Python 中 `str` 与 `bytes` 的关系，然后介绍字符串的各种操作与格式化技巧。

> 本文是「Python 从入门到精通」系列第 03 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、字符、码点与编码

计算机只能存储数字。要存储文字，就需要两层映射：

1. **字符集**：给每个字符分配一个编号。Unicode 就是这样一个“全世界所有字符的大字典”，每个字符的编号叫做**码点**（code point），写作 `U+XXXX`。例如“中”是 `U+4E2D`，“😀”是 `U+1F600`。
2. **编码**：规定如何把码点（一个整数）变成字节序列存储或传输。UTF-8、UTF-16、GBK 都是编码。

**Python 3 的 `str` 是码点序列，`bytes` 是字节序列。** 两者之间的转换称为编码（encode）和解码（decode）：

```text
            encode("utf-8")
   str  ─────────────────────►  bytes
 (码点序列)  ◄─────────────────────  (字节序列)
            decode("utf-8")
```

```python
>>> s = "中"
>>> ord(s)                   # 字符 → 码点
20013
>>> hex(ord(s))
'0x4e2d'
>>> chr(0x4E2D)              # 码点 → 字符
'中'
>>> "\u4e2d", "\U0001F600"   # 用转义序列直接写码点
('中', '😀')
>>> "\N{GRINNING FACE}"      # 甚至可以用字符的 Unicode 名称
'😀'
>>> import unicodedata
>>> unicodedata.name("中")
'CJK UNIFIED IDEOGRAPH-4E2D'
```

注意 `len` 计算的是**码点个数**，而不是字节数：

```python
>>> len("中文")
2
>>> len("中文".encode("utf-8"))
6
```

## 二、UTF-8 是怎样编码的

UTF-8 是目前互联网上压倒性的主流编码，它是一种**变长编码**：一个码点用 1～4 个字节表示，规则如下：

| 码点范围 | 字节数 | 二进制模板 |
|---|---|---|
| U+0000 ～ U+007F | 1 | `0xxxxxxx` |
| U+0080 ～ U+07FF | 2 | `110xxxxx 10xxxxxx` |
| U+0800 ～ U+FFFF | 3 | `1110xxxx 10xxxxxx 10xxxxxx` |
| U+10000 ～ U+10FFFF | 4 | `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` |

我们手工把“中”（U+4E2D）编码一遍：

1. `0x4E2D` 落在第三行，需要 3 个字节，有 16 个 `x` 可填。
2. `0x4E2D` 的二进制是 `0100 1110 0010 1101`。
3. 按 4 + 6 + 6 位切分：`0100` `111000` `101101`。
4. 填入模板：`1110 0100`、`10 111000`、`10 101101`，即 `E4 B8 AD`。

用 Python 验证：

```python
>>> "中".encode("utf-8")
b'\xe4\xb8\xad'
>>> [f"{b:08b}" for b in "中".encode("utf-8")]
['11100100', '10111000', '10101101']
```

完全吻合。这个设计有几个非常漂亮的性质：

- **兼容 ASCII**：ASCII 字符编码后就是它本身，所以所有英文文本天然就是合法的 UTF-8。
- **自同步**：每个字节看开头的几位就知道它是“首字节”（`0`、`110`、`1110`、`11110`）还是“后续字节”（`10`）。从任意位置开始读，最多跳过 3 个字节就能找到字符边界，一个字节损坏也只会影响一个字符。
- **不会出现零字节**（除了 U+0000 本身），所以可以安全地用于 C 语言的以零结尾的字符串。
- **按字节排序 = 按码点排序**。

### 其他编码

- **UTF-16**：大部分字符用 2 字节，超出 U+FFFF 的字符（如 emoji）用两个 2 字节的“代理对”（surrogate pair）表示。Windows 内部和 Java、JavaScript 的字符串使用它。由于有字节序问题，文件开头常带一个 BOM（字节顺序标记）。
- **GBK / GB18030**：中国国家标准编码，中文用 2 字节。旧的 Windows 中文系统默认使用 GBK，这是大量乱码问题的来源。

```python
>>> "中文".encode("gbk")
b'\xd6\xd0\xce\xc4'
>>> "😀".encode("utf-16-le")        # emoji 在 UTF-16 中需要 4 字节（一个代理对）
b'=\xd8\x00\xde'
>>> len("😀".encode("utf-16"))       # 不指定字节序时，开头会自动加 2 字节的 BOM
6
```

## 三、乱码是怎么产生的

乱码只有一个原因：**用 A 编码写入的字节，被用 B 编码解读**。

```python
>>> data = "中文".encode("utf-8")       # 用 UTF-8 编码得到 6 个字节
>>> data.decode("gbk", errors="replace")  # 错误地按 GBK 解读
'涓�鏂�'
```

GBK 是双字节编码，它把 UTF-8 的 6 个字节两两一组地解读：`E4 B8` 恰好是 GBK 中的“涓”，`AD E6` 不是合法的 GBK 字符，被替换成了 �，`96 87` 又凑成了“鏂”……于是“中文”变成了“涓�鏂�”这样夹杂着生僻汉字和替换符的文本。看到一串莫名其妙的生僻汉字，基本就可以断定是“UTF-8 被当作 GBK 显示”了。反过来，GBK 的字节按 UTF-8 解码，通常会直接报错，因为 GBK 字节不符合 UTF-8 的格式规则：

```python
>>> "中文".encode("gbk").decode("utf-8")
Traceback (most recent call last):
  ...
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xd6 in position 0: invalid continuation byte
```

著名的“锟斤拷”也是这么来的：某些程序遇到无法解码的字节时会把它替换为 U+FFFD（显示为 �），U+FFFD 的 UTF-8 编码是 `EF BF BD`，连续两个就是 `EF BF BD EF BF BD`，这串字节再被用 GBK 解读，恰好就是“锟斤拷”。

```python
>>> ("\ufffd" * 2).encode("utf-8").decode("gbk")
'锟斤拷'
```

如果乱码是“正确的字节被错误地解码”造成的，并且解码时没有丢失信息，那就可以**逆向操作**修复：

```python
>>> garbled = "中文".encode("utf-8").decode("latin-1")   # latin-1 能解码任何字节，不会丢信息
>>> garbled
'ä¸\xadæ\x96\x87'
>>> garbled.encode("latin-1").decode("utf-8")              # 先还原成字节，再正确解码
'中文'
```

### 错误处理策略

`encode` 和 `decode` 都有一个 `errors` 参数，决定遇到无法处理的字符时怎么办：

```python
>>> raw = b"abc\xffdef"
>>> raw.decode("utf-8", errors="replace")           # 替换为 U+FFFD
'abc\ufffddef'
>>> raw.decode("utf-8", errors="ignore")            # 直接丢弃（危险：静默丢失数据）
'abcdef'
>>> raw.decode("utf-8", errors="backslashreplace")  # 用转义序列表示，便于排查
'abc\\xffdef'
>>> s = raw.decode("utf-8", errors="surrogateescape")
>>> s.encode("utf-8", errors="surrogateescape") == raw   # 可以无损还原
True
```

`surrogateescape` 是个精妙的设计：它把无法解码的字节 `0xff` 映射到一个特殊的“孤立代理”码点 `U+DCFF`，编码回去时再恢复原字节。Python 用它来处理文件名、环境变量这类“理论上是文本，但可能含有非法字节”的系统数据，保证往返无损。

## 四、“Unicode 三明治”原则

处理文本的最佳实践被形象地称为“Unicode 三明治”：

1. **输入时尽早解码**：从文件、网络、数据库读入的 `bytes`，在边界处立即 `decode` 成 `str`；
2. **程序内部只处理 `str`**；
3. **输出时尽晚编码**：在写出的那一刻才 `encode` 成 `bytes`。

对文件操作来说，最重要的一条是：**永远显式指定 `encoding`**。

<!-- norun -->
```python
with open("data.txt", encoding="utf-8") as f:     # 好
    text = f.read()

with open("data.txt") as f:                        # 不好：使用平台默认编码
    text = f.read()
```

不指定编码时，`open` 使用“区域设置”的首选编码：在大多数 Linux 和 macOS 上是 UTF-8，但在中文 Windows 上很可能是 GBK（cp936）。同样的代码在不同机器上读出不同结果，这就是“我电脑上好好的”类 bug 的经典来源。

Python 提供了 **UTF-8 模式**（`python -X utf8` 或环境变量 `PYTHONUTF8=1`）让默认编码在所有平台上统一为 UTF-8，并且 PEP 686 计划在 3.15 中将 UTF-8 模式设为默认。在此之前，最稳妥的做法依然是显式写出 `encoding="utf-8"`。你还可以用 `python -X warn_default_encoding` 运行程序，让所有没有指定编码的 `open` 调用都发出警告。

另外，Excel 打开 UTF-8 编码的 CSV 时经常乱码，原因是 Excel 依赖 BOM 来识别 UTF-8。写给 Excel 用的 CSV 可以使用 `encoding="utf-8-sig"`，它会在文件开头写入 BOM；读取时它也会自动跳过 BOM。

## 五、Unicode 的“深水区”

### 1. 规范化：看起来一样，却不相等

“é”在 Unicode 中有两种表示方式：一个预组合字符 `U+00E9`，或者字母 `e` 加上一个组合重音符 `U+0301`。它们显示完全相同，但在 Python 看来是不同的字符串：

```python
>>> a = "\u00e9"         # 预组合形式
>>> b = "e\u0301"        # 组合形式
>>> [hex(ord(c)) for c in a], [hex(ord(c)) for c in b]
(['0xe9'], ['0x65', '0x301'])
>>> a == b, len(a), len(b)
(False, 1, 2)
>>> import unicodedata
>>> unicodedata.normalize("NFC", b) == a     # 统一规范化后就相等了
True
```

从用户输入、不同操作系统的文件名（macOS 的文件系统习惯使用分解形式）中得到的文本，在比较、去重或作为字典键之前，应当先规范化。常用的形式有：

- **NFC**：尽量组合，最常用；
- **NFD**：尽量分解；
- **NFKC / NFKD**：在前两者基础上，还把“兼容字符”转为标准字符，比如全角字母 `Ａ` 变成 `A`、上标 `²` 变成 `2`、连字 `ﬁ` 变成 `fi`。适合做搜索和标识符比较。

```python
>>> unicodedata.normalize("NFKC", "Ｐｙｔｈｏｎ３ ① ²")
'Python3 1 2'
```

### 2. 大小写：lower 不等于不区分大小写

```python
>>> "ß".lower(), "ß".upper(), "ß".casefold()
('ß', 'SS', 'ss')
>>> "Straße".lower() == "STRASSE".lower()
False
>>> "Straße".casefold() == "STRASSE".casefold()
True
```

德语的 ß 大写是 SS，所以 `lower()` 并不能用来做不区分大小写的比较。正确的工具是 `casefold()`，它就是为“大小写无关比较”设计的。

### 3. 用户眼中的“一个字符”

```python
>>> family = "👨‍👩‍👧"
>>> len(family)
5
>>> [hex(ord(c)) for c in family]
['0x1f468', '0x200d', '0x1f469', '0x200d', '0x1f467']
```

这个“一家人”emoji 在屏幕上是一个图形，但实际由 5 个码点组成：男人、零宽连接符（ZWJ）、女人、ZWJ、女孩。用户感知到的“一个字符”在 Unicode 中叫**字素簇**（grapheme cluster），Python 的 `str` 并不直接支持按字素簇操作。如果需要（比如做“最多输入 10 个字”的限制），可以使用第三方库 `grapheme` 或 `regex` 模块的 `\X`。直接对这样的字符串做切片，可能会把一个 emoji“切成两半”。

## 六、CPython 中 str 的内存布局

一个自然的问题：既然 `str` 是码点序列，而码点最大到 `0x10FFFF`，那每个字符是不是都要占 4 字节？

从 3.3 开始（PEP 393，灵活字符串表示），答案是：**看情况**。CPython 会扫描字符串中最大的码点，选择能容纳它的最小单位来存储**所有**字符：

| 最大码点 | 每个字符占用 |
|---|---|
| ≤ U+007F（纯 ASCII） | 1 字节 |
| ≤ U+00FF（Latin-1） | 1 字节 |
| ≤ U+FFFF（基本多文种平面，含绝大多数汉字） | 2 字节 |
| > U+FFFF（emoji 等） | 4 字节 |

```python
>>> import sys
>>> def per_char(ch):
...     return sys.getsizeof(ch * 2000) - sys.getsizeof(ch * 1000)
...
>>> [per_char(c) / 1000 for c in ("a", "é", "中", "😀")]
[1.0, 1.0, 2.0, 4.0]
>>> sys.getsizeof("a" * 100), sys.getsizeof("a" * 99 + "😀")
(141, 460)
```

最后一行很有意思：仅仅加入一个 emoji，整个字符串占用的内存就从 141 字节涨到了 460 字节，因为**所有**字符都被迫升级为 4 字节存储。这个设计让 `s[i]` 索引始终是 O(1) 的（定长存储可以直接计算偏移量），同时让纯英文文本保持紧凑。代价是，在大量纯 ASCII 文本中混入少量 emoji 会显著增加内存。

纯 ASCII 字符串还有额外的优化：它们的 UTF-8 编码就是自身，因此 `encode("utf-8")` 不需要任何转换。

## 七、字符串基本操作

### 1. 索引与切片

字符串、列表、元组等**序列**共享同一套索引与切片语法：

```python
>>> s = "Python"
>>> s[0], s[-1]          # 负数索引从末尾开始
('P', 'n')
>>> s[1:4]               # 左闭右开区间 [1, 4)
'yth'
>>> s[:2], s[2:]         # s[:k] + s[k:] == s 恒成立
('Py', 'thon')
>>> s[::2], s[::-1]      # 步长；步长为 -1 即反转
('Pto', 'nohtyP')
>>> s[100:]              # 切片越界不会报错，只会得到空串
''
>>> s[100]               # 但索引越界会报错
Traceback (most recent call last):
  ...
IndexError: string index out of range
```

“左闭右开”是一个经过深思熟虑的选择：`s[a:b]` 的长度恰好是 `b - a`；`s[:k]` 和 `s[k:]` 恰好不重叠地拼成整个序列。

切片语法 `s[a:b:c]` 实际上是在构造一个 `slice` 对象，然后调用 `s.__getitem__(slice(a, b, c))`。你可以把切片“存起来”复用，让解析定长格式数据的代码更易读：

```python
>>> record = "20261007ALICE     0095"
>>> DATE, NAME, SCORE = slice(0, 8), slice(8, 18), slice(18, 22)
>>> record[DATE], record[NAME].strip(), int(record[SCORE])
('20261007', 'ALICE', 95)
```

### 2. 字符串是不可变的

```python
>>> s = "hello"
>>> s[0] = "H"
Traceback (most recent call last):
  ...
TypeError: 'str' object does not support item assignment
>>> "H" + s[1:]          # 只能创建新字符串
'Hello'
```

### 3. 常用方法

```python
>>> "  hi  ".strip(), "xxhixx".strip("x")
('hi', 'hi')
>>> "a,b,,c".split(","), "a b   c".split()      # 不带参数的 split 会合并连续空白
(['a', 'b', '', 'c'], ['a', 'b', 'c'])
>>> "-".join(["2026", "10", "07"])
'2026-10-07'
>>> "key=value=x".partition("=")                # 只在第一个分隔符处切分，总是返回三元组
('key', '=', 'value=x')
>>> "report.final.pdf".rpartition(".")[2]
'pdf'
>>> "image.png".endswith((".png", ".jpg"))      # 可以传入元组，匹配任意一个
True
>>> "v1.2.3".removeprefix("v")                  # 3.9 新增，比 lstrip("v") 安全
'1.2.3'
>>> "Python".find("th"), "Python".find("xyz")   # 找不到返回 -1；index() 则会抛异常
(2, -1)
>>> "hello world".title(), "Hello".center(11, "*")
('Hello World', '***Hello***')
```

`lstrip("v")` 和 `removeprefix("v")` 的区别很容易被忽视：`strip` 系列的参数是**字符集合**，会去掉开头所有属于该集合的字符，而不是去掉一个前缀：

```python
>>> "vvv1.0".lstrip("v"), "vvv1.0".removeprefix("v")
('1.0', 'vv1.0')
>>> "basics.csv".rstrip(".csv")         # 想去掉扩展名？结果出乎意料
'basi'
>>> "basics.csv".removesuffix(".csv")   # 正确做法
'basics'
```

### 4. 拼接的性能：用 join

```python
>>> parts = [str(i) for i in range(5)]
>>> "".join(parts)
'01234'
```

因为字符串不可变，循环中用 `s += piece` 理论上每次都要创建一个新字符串并复制全部内容，总复杂度是 O(n²)。CPython 对此做了一个优化：如果 `s` 的引用计数为 1（没有其他名字引用它），就尝试原地扩展内存。但这个优化是 CPython 特有的、脆弱的（多一个引用就失效），PyPy 等实现也没有。**构建长字符串时，把片段收集到列表里，最后用 `"".join()` 一次性拼接**，这在任何实现上都是 O(n) 的。

## 八、字符串格式化

Python 有三代格式化语法，今天应该优先使用 f-string：

```python
>>> name, score = "Alice", 95.5
>>> "%s scored %.1f" % (name, score)              # 第一代：printf 风格
'Alice scored 95.5'
>>> "{} scored {:.1f}".format(name, score)         # 第二代：str.format
'Alice scored 95.5'
>>> f"{name} scored {score:.1f}"                   # 第三代：f-string（3.6+）
'Alice scored 95.5'
```

f-string 不只是语法糖：它在编译时就被解析成高效的字节码，运行速度也是三者中最快的。

### 1. 格式规格迷你语言

冒号后面的部分叫**格式规格**（format spec），完整结构是：

```text
[[填充]对齐][符号][z][#][0][宽度][分组][.精度][类型]
```

```python
>>> f"[{'left':<10}] [{'right':>10}] [{'mid':^10}] [{'pad':*^9}]"
'[left      ] [     right] [   mid    ] [***pad***]'
>>> f"{1234567.891:,.2f}", f"{1234567:_}", f"{0.256:.1%}"
('1,234,567.89', '1_234_567', '25.6%')
>>> f"{42:b}", f"{42:08b}", f"{255:#x}", f"{255:X}"
('101010', '00101010', '0xff', 'FF')
>>> f"{3.14159:+.3f}", f"{-0.0001:z.2f}"     # z 选项（3.11+）把 -0.00 规范为 0.00
('+3.142', '0.00')
>>> f"{12345.678:e}", f"{12345.678:.3g}"
('1.234568e+04', '1.23e+04')
```

宽度和精度本身也可以是表达式：

```python
>>> width, prec = 10, 3
>>> f"{3.14159:{width}.{prec}f}"
'     3.142'
```

格式规格并不是字符串独有的。任何对象都可以通过实现 `__format__` 方法来定义自己的格式规格，比如 `datetime`：

```python
>>> from datetime import datetime
>>> now = datetime(2026, 10, 7, 9, 30)
>>> f"{now:%Y年%m月%d日 %H:%M}"
'2026年10月07日 09:30'
```

### 2. 转换标志与调试语法

```python
>>> s = "a\tb"
>>> f"{s}", f"{s!r}"           # !r 调用 repr()，!s 调用 str()，!a 调用 ascii()
('a\tb', "'a\\tb'")
>>> x, y = 3, 4
>>> f"{x=}, {x + y = }, {x / y=:.2f}"     # 3.8+ 的“自文档化表达式”，调试神器
'x=3, x + y = 7, x / y=0.75'
```

### 3. 3.12 起的 f-string 新语法

PEP 701 把 f-string 正式纳入了语法分析器，解除了很多旧限制：可以在 f-string 里复用相同的引号、写反斜杠、跨行书写表达式，甚至加注释：

```python
>>> items = ["a", "b"]
>>> f"{", ".join(items)}"            # 3.12 之前这里不能用双引号
'a, b'
>>> f"{'\n'.join(items)}"            # 3.12 之前表达式部分不能有反斜杠
'a\nb'
```

### 4. 3.14 新特性：模板字符串（t-string）

f-string 的问题是它“太快了”：一旦求值，得到的就是一个普通字符串，插入的值和模板文字已经混在一起，无法区分。如果把用户输入拼进 SQL 或 HTML，就会产生注入漏洞。

3.14 引入的**模板字符串**（PEP 750）用 `t` 前缀，它**不会**直接生成字符串，而是返回一个 `Template` 对象，保留了“静态文字部分”和“插值部分”的结构，交给处理函数决定如何组合：

```python
>>> from string.templatelib import Template, Interpolation
>>> user = "<script>alert(1)</script>"
>>> t = t"<p>Hello, {user}!</p>"
>>> type(t)
<class 'string.templatelib.Template'>
>>> t.strings
('<p>Hello, ', '!</p>')
>>> t.interpolations[0].value, t.interpolations[0].expression
('<script>alert(1)</script>', 'user')
```

基于这个结构，可以写一个“对插值部分自动转义”的安全 HTML 渲染函数：

```python
>>> import html
>>> def render_html(template: Template) -> str:
...     parts = []
...     for item in template:                      # 迭代时依次产出字符串和 Interpolation
...         if isinstance(item, Interpolation):
...             parts.append(html.escape(str(item.value)))   # 只转义插入的值
...         else:
...             parts.append(item)                 # 模板自身的文字原样保留
...     return "".join(parts)
...
>>> render_html(t)
'<p>Hello, &lt;script&gt;alert(1)&lt;/script&gt;!</p>'
```

模板中的 `<p>` 原样保留，而用户输入中的 `<script>` 被转义了。t-string 为 SQL 参数化、日志结构化、国际化等场景提供了一个统一而安全的基础设施，可以预见未来会有大量库支持它。

## 九、bytes 与 bytearray

`bytes` 是不可变的字节序列，`bytearray` 是它的可变版本。它们的很多方法和 `str` 相同，但有几个关键区别：

```python
>>> b = b"hello"
>>> b[0]                   # 索引得到的是整数（0~255），而不是长度为 1 的 bytes
104
>>> b[0:1]                 # 切片得到的才是 bytes
b'h'
>>> list(b"AB")
[65, 66]
>>> bytes([228, 184, 173]).decode("utf-8")
'中'
>>> b"\xe4\xb8\xad".hex(" ")
'e4 b8 ad'
>>> bytes.fromhex("e4 b8 ad")
b'\xe4\xb8\xad'
>>> ba = bytearray(b"hello")
>>> ba[0] = ord("H")       # bytearray 可以原地修改
>>> ba
bytearray(b'Hello')
>>> b"abc" + "def"         # bytes 和 str 不能混用
Traceback (most recent call last):
  ...
TypeError: can't concat str to bytes
```

在 Python 2 中，`str` 其实是字节串，和 Unicode 字符串可以隐式混用，导致了无数编码 bug。Python 3 最重要的改变之一，就是**严格区分 `str` 和 `bytes`，禁止它们之间的隐式转换**。这让编码错误在第一时间暴露，而不是在数据流转到很远的地方后才出现乱码。

处理二进制协议或文件格式时，标准库的 `struct` 模块可以在 Python 值和 C 结构体字节之间转换：

```python
>>> import struct
>>> packed = struct.pack("<HI", 1, 1000)     # 小端序：2 字节无符号短整数 + 4 字节无符号整数
>>> packed
b'\x01\x00\xe8\x03\x00\x00'
>>> struct.unpack("<HI", packed)
(1, 1000)
```

## 十、原始字符串与其他字面量

```python
>>> print("C:\new")              # \n 被当作换行符
C:
ew
>>> print(r"C:\new")             # r 前缀：原始字符串，反斜杠不转义
C:\new
>>> len(r"\d+"), len("\\d+")
(3, 3)
```

原始字符串在写正则表达式和 Windows 路径时非常有用。但要注意一个奇怪的限制：原始字符串**不能以奇数个反斜杠结尾**（`r"C:\dir\"` 是语法错误），因为反斜杠依然会“转义”后面的引号，防止字符串提前结束。写路径时更好的选择是使用正斜杠或 `pathlib`。

此外还有：

- 三引号字符串 `"""..."""`：可以跨多行，常用于文档字符串；
- 相邻字符串字面量会在**编译时**自动拼接：`("abc" "def") == "abcdef"`，适合把长字符串拆成多行书写；
- 前缀可以组合：`rb"..."`（原始字节串）、`fr"..."`、`rt"..."` 等。

## 小结

- `str` 是码点序列，`bytes` 是字节序列，二者通过 `encode`/`decode` 转换；编码规定了码点到字节的映射。
- UTF-8 是变长编码，兼容 ASCII、可自同步；乱码的本质是用错误的编码解读字节。
- 遵循“Unicode 三明治”，并且**永远给 `open` 指定 `encoding`**。
- 比较前做规范化（NFC/NFKC），大小写无关比较用 `casefold()`；`len` 数的是码点，不是用户眼中的字符。
- CPython 根据最大码点为整个字符串选择 1/2/4 字节存储。
- 切片左闭右开；拼接大量字符串用 `join`；格式化优先用 f-string；3.14 的 t-string 为安全插值提供了新工具。

## 练习

1. 不借助 `encode`，手写一个函数 `utf8_encode(s: str) -> bytes`，按照本文的表格把字符串编码为 UTF-8，并用 `s.encode("utf-8")` 验证结果（测试用例要包含 ASCII、中文和 emoji）。
2. 给定一段“UTF-8 被当成 GBK 解码”产生的乱码字符串，写一个函数尝试修复它。思考：为什么有些情况下无法完全修复？（提示：考虑 `errors="replace"` 造成的信息丢失。）
3. 写一个函数判断两个用户名是否“视为相同”：需要忽略大小写（包括德语 ß）、忽略全角半角差异、忽略首尾空白。
4. 用 t-string 写一个 `sql(template)` 函数，把插值部分替换为 `?` 占位符，返回 `(sql_text, params)` 元组，从而可以直接传给 `sqlite3` 的 `execute`。
5. 测量 `"a" * 10**6` 和 `"a" * (10**6 - 1) + "😀"` 的内存占用，并解释差异。

下一篇我们将进入 Python 最常用的四种容器：{% post_link Python-04-Containers '列表、元组、字典与集合' %}，并揭开它们底层实现的面纱。
