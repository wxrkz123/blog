---
title: Python 从入门到精通（08）：迭代器、生成器与 itertools
date: 2026-10-07 11:20:00
summary: 可迭代对象与迭代器的区别、for 循环背后的字节码、迭代器只能消费一次的陷阱；生成器如何“暂停”一个函数的帧，惰性数据管道，send/throw/close 与 yield from 的精确语义，PEP 479；itertools 全景与实用配方。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

`for` 循环、列表推导式、解包赋值、`in` 运算符、`sum`、`zip`、`dict(...)`……这些看起来毫不相关的语法和函数，背后都依赖同一个机制：**迭代协议**。而生成器则让我们能用写普通函数的方式实现迭代器，并由此衍生出惰性计算、数据管道，乃至 Python 协程的最初形态。本篇从协议讲起，一直讲到生成器的内部机制。

> 本文是「Python 从入门到精通」系列第 08 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、迭代协议

### 1. 两个角色：可迭代对象与迭代器

- **可迭代对象**（iterable）：能够被遍历的对象。它实现了 `__iter__` 方法，**返回一个迭代器**。列表、字符串、字典、文件都是可迭代对象。
- **迭代器**（iterator）：负责“遍历的进度”的对象。它实现了 `__next__` 方法，每次调用返回下一个元素，没有更多元素时抛出 `StopIteration`。迭代器自身也要实现 `__iter__`，并返回自己。

```python
>>> nums = [10, 20, 30]
>>> it = iter(nums)            # 调用 nums.__iter__()
>>> it
<list_iterator object at 0x...>
>>> next(it), next(it), next(it)   # 调用 it.__next__()
(10, 20, 30)
>>> next(it)
Traceback (most recent call last):
  ...
StopIteration
>>> iter(it) is it             # 迭代器的 __iter__ 返回自身
True
```

为什么要区分这两个角色？因为**一个可迭代对象可以同时被多次、独立地遍历**。每次调用 `iter(nums)` 都会得到一个新的迭代器，各自维护自己的位置：

```python
>>> a, b = iter(nums), iter(nums)
>>> next(a), next(a), next(b)
(10, 20, 10)
```

### 2. for 循环做了什么

下面的 `for` 循环：

<!-- norun -->
```python
for x in iterable:
    body(x)
```

在语义上等价于：

<!-- norun -->
```python
_it = iter(iterable)
while True:
    try:
        x = next(_it)
    except StopIteration:
        break
    body(x)
```

字节码证实了这一点：

```python
>>> import dis
>>> [i.opname for i in dis.get_instructions("for x in data: pass") if "ITER" in i.opname]
['GET_ITER', 'FOR_ITER', 'POP_ITER']
```

`GET_ITER` 对应 `iter()`，`FOR_ITER` 对应 `next()` 并在 `StopIteration` 时跳出循环。当然，CPython 不会真的每次都抛出并捕获一个异常对象——对于内置迭代器，`FOR_ITER` 会直接检查“是否耗尽”，非常高效，3.11 以后还针对列表、元组、`range` 和生成器做了专门的特化。

### 3. iter() 的两个“后门”

`iter()` 还有两个不太为人所知的行为：

**一是旧式序列协议**：如果对象没有 `__iter__`，但有 `__getitem__`，`iter()` 会创建一个迭代器，从下标 0 开始依次调用 `__getitem__`，直到抛出 `IndexError` 为止。这是为了兼容早期的 Python 代码：

```python
>>> class Squares:
...     def __getitem__(self, i):
...         if i >= 5:
...             raise IndexError
...         return i * i
...
>>> list(Squares())
[0, 1, 4, 9, 16]
>>> 9 in Squares()
True
```

**二是“哨兵”形式** `iter(callable, sentinel)`：反复调用一个无参函数，直到它返回哨兵值为止。用来分块读取文件特别方便：

```python
>>> import io, functools
>>> f = io.BytesIO(b"abcdefghij")
>>> list(iter(functools.partial(f.read, 4), b""))
[b'abcd', b'efgh', b'ij']
```

### 4. 迭代器只能消费一次

迭代器是“一次性”的：遍历完就耗尽了，不会自动重置。这是很多隐蔽 bug 的来源：

```python
>>> squares = map(lambda x: x * x, [1, 2, 3])     # map 返回的是迭代器
>>> list(squares)
[1, 4, 9]
>>> list(squares)                                  # 第二次什么也没有！
[]
>>> it = iter([1, 2, 3, 4])
>>> 2 in it                                        # in 会消费迭代器，直到找到为止
True
>>> list(it)                                       # 1 和 2 已经被消费掉了
[3, 4]
```

`map`、`filter`、`zip`、`enumerate`、`reversed`、文件对象、生成器都是迭代器。如果需要多次遍历，先用 `list()` 把结果保存下来。在设计函数时也要注意：如果函数需要遍历参数两次（比如先求和再求平均），那么传入迭代器会得到错误的结果。

```python
>>> def normalize(values):
...     total = sum(values)                    # 第一次遍历
...     return [v / total for v in values]     # 第二次遍历
...
>>> normalize([1, 2, 7])
[0.1, 0.2, 0.7]
>>> normalize(iter([1, 2, 7]))                 # 传入迭代器：第二次遍历时已经空了
[]
```

一种防御性写法是检查 `iter(values) is values`——如果成立，说明传入的是迭代器，可以报错或者先把它转成列表。

### 5. 自己实现一个迭代器

```python
>>> class Countdown:
...     """可迭代对象：每次 iter() 都返回一个新的迭代器。"""
...     def __init__(self, start):
...         self.start = start
...     def __iter__(self):
...         return CountdownIterator(self.start)
...
>>> class CountdownIterator:
...     def __init__(self, n):
...         self.n = n
...     def __iter__(self):
...         return self
...     def __next__(self):
...         if self.n <= 0:
...             raise StopIteration
...         self.n -= 1
...         return self.n + 1
...
>>> c = Countdown(3)
>>> list(c), list(c)           # 可以多次遍历
([3, 2, 1], [3, 2, 1])
```

为了一个简单的倒计时，写了两个类、十几行代码，还要手动维护状态。生成器可以让这一切大大简化。

## 二、生成器

### 1. 生成器函数

**函数体中只要出现了 `yield`，它就不再是普通函数，而是生成器函数。** 调用生成器函数时，函数体**一行都不会执行**，而是返回一个生成器对象；生成器对象是一个迭代器，每次 `next()` 时，函数体执行到下一个 `yield`，交出一个值，然后**暂停**：

```python
>>> def countdown(n):
...     print("开始")
...     while n > 0:
...         yield n
...         n -= 1
...     print("结束")
...
>>> gen = countdown(3)          # 什么都没打印：函数体还没开始执行
>>> gen
<generator object countdown at 0x...>
>>> next(gen)                   # 执行到第一个 yield
开始
3
>>> next(gen)                   # 从上次暂停的地方继续
2
>>> list(gen)                   # 耗尽剩余部分
结束
[1]
```

有了生成器，`Countdown` 可以简化为：

```python
>>> class Countdown:
...     def __init__(self, start):
...         self.start = start
...     def __iter__(self):         # __iter__ 写成生成器函数，每次调用都返回新的生成器
...         n = self.start
...         while n > 0:
...             yield n
...             n -= 1
...
>>> list(Countdown(3))
[3, 2, 1]
```

### 2. 生成器是如何“暂停”的

普通函数调用时会创建一个**帧**（frame），保存局部变量和执行位置，函数返回后帧被销毁。生成器的魔力在于：**它的帧在 `yield` 时不会被销毁，而是被保存在生成器对象中**。下次 `next()` 时，解释器恢复这个帧，从上次的指令位置继续执行。

我们可以直接观察生成器的状态和它保存的帧：

```python
>>> import inspect
>>> def gen_demo():
...     x = 1
...     yield x
...     x = 2
...     yield x
...
>>> g = gen_demo()
>>> inspect.getgeneratorstate(g)
'GEN_CREATED'
>>> next(g)
1
>>> inspect.getgeneratorstate(g)
'GEN_SUSPENDED'
>>> g.gi_frame.f_locals                 # 暂停中的帧，保存着局部变量
{'x': 1}
>>> next(g)
2
>>> g.gi_frame.f_locals
{'x': 2}
>>> next(g, "耗尽")                     # next 的第二个参数：耗尽时返回的默认值
'耗尽'
>>> inspect.getgeneratorstate(g), g.gi_frame
('GEN_CLOSED', None)
```

正因为局部变量都完好地保存在帧里，生成器可以自然地维护复杂的状态，而不需要像迭代器类那样把每个状态都存成实例属性。这也是为什么说生成器是“可以暂停和恢复的函数”。在 CPython 3.11 之后，生成器的帧直接嵌入在生成器对象的内存中，暂停和恢复几乎没有额外的分配开销。

### 3. 惰性求值：处理无限与海量数据

生成器只在被请求时才计算下一个值，所以它可以表示**无限序列**，也可以处理**远大于内存**的数据：

```python
>>> def fibonacci():
...     a, b = 0, 1
...     while True:                      # 无限序列
...         yield a
...         a, b = b, a + b
...
>>> from itertools import islice
>>> list(islice(fibonacci(), 10))        # 只取前 10 个
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

生成器表达式是生成器函数的简写形式，和列表推导式相比，它的内存占用是常数级的：

```python
>>> import sys
>>> sys.getsizeof([x * x for x in range(100_000)]) > 800_000
True
>>> sys.getsizeof(x * x for x in range(100_000)) < 300
True
```

### 4. 数据管道

把多个生成器串联起来，就形成了一条**惰性数据管道**：每个阶段只处理一个元素，就把它传给下一个阶段。无论数据有多大，内存中同时只有少量元素。这种风格非常适合日志分析、ETL 等任务：

```python
import io

LOG = io.StringIO("""\
2026-10-07 10:00:01 INFO  user=alice action=login
2026-10-07 10:00:05 ERROR user=bob action=pay amount=30
2026-10-07 10:01:12 INFO  user=alice action=pay amount=120
2026-10-07 10:02:40 ERROR user=carol action=pay amount=75
2026-10-07 10:03:00 INFO  user=bob action=logout
""")


def read_lines(f):
    for line in f:                       # 文件对象本身就是惰性的迭代器
        yield line.rstrip("\n")


def parse(lines):
    for line in lines:
        date, time, level, *fields = line.split()
        record = dict(f.split("=") for f in fields)
        record["level"] = level
        yield record


def only(records, level):
    return (r for r in records if r["level"] == level)


pipeline = only(parse(read_lines(LOG)), "ERROR")
total = sum(int(r["amount"]) for r in pipeline if r["action"] == "pay")
print("失败的支付总额:", total)
```

```text
失败的支付总额: 105
```

每个函数都只做一件事，可以单独测试、自由组合。把 `LOG` 换成一个 10 GB 的真实日志文件，这段代码的内存占用也几乎不变。

## 三、生成器的高级用法：send、throw、close

生成器不仅能向外**产出**值，还能从外部**接收**值。这是 Python 协程最初的形态（PEP 342），理解它对后面学习 `async/await` 非常有帮助。

### 1. send：向生成器传值

`yield` 其实是一个**表达式**，它的值就是外部通过 `send()` 传进来的值：

```python
>>> def running_average():
...     total, count, average = 0.0, 0, None
...     while True:
...         value = yield average        # 交出当前平均值，并等待下一个输入
...         total += value
...         count += 1
...         average = total / count
...
>>> avg = running_average()
>>> next(avg)                # “预激”：让生成器运行到第一个 yield
>>> avg.send(10)
10.0
>>> avg.send(20)
15.0
>>> avg.send(60)
30.0
```

执行过程是这样的：`next(avg)` 让生成器运行到 `yield average`，交出 `None` 并暂停；`avg.send(10)` 恢复执行，`yield` 表达式的值为 `10`，赋给 `value`，然后计算新的平均值，循环回到 `yield average`，交出 `10.0` 并再次暂停。`next(g)` 等价于 `g.send(None)`。

必须先“预激”的原因是：刚创建的生成器还没有运行到任何 `yield`，没有地方接收值。向一个刚创建的生成器 `send` 非 `None` 的值会报错：

```python
>>> running_average().send(10)
Traceback (most recent call last):
  ...
TypeError: can't send non-None value to a just-started generator
```

### 2. throw 与 close

- `gen.throw(exc)`：在生成器暂停的 `yield` 处**抛出**一个异常。生成器可以捕获它并继续产出值，也可以让它传播出来。
- `gen.close()`：在暂停处抛出 `GeneratorExit`，让生成器有机会执行清理代码（`finally` 块）。生成器被垃圾回收时也会自动调用 `close()`。

```python
>>> def worker():
...     try:
...         while True:
...             try:
...                 job = yield
...                 print("处理", job)
...             except ValueError as e:
...                 print("跳过错误任务:", e)
...     finally:
...         print("清理资源")
...
>>> w = worker(); next(w)
>>> w.send("任务A")
处理 任务A
>>> w.throw(ValueError("格式错误"))
跳过错误任务: 格式错误
>>> w.close()
清理资源
```

### 3. 生成器的返回值

生成器函数也可以 `return` 一个值。这个值不会被 `for` 循环看到，而是作为 `StopIteration` 异常的 `value` 属性：

```python
>>> def gen_with_return():
...     yield 1
...     return "完成"
...
>>> g = gen_with_return()
>>> next(g)
1
>>> try:
...     next(g)
... except StopIteration as e:
...     print("返回值:", e.value)
...
返回值: 完成
```

这个看似冷门的特性，正是 `yield from` 能够获取子生成器结果的基础。

## 四、yield from：委托给子生成器

### 1. 最简单的用法：展平

`yield from iterable` 会把一个可迭代对象的所有值逐个产出，可以替代一个 `for` 循环：

```python
>>> def flatten(nested):
...     for item in nested:
...         if isinstance(item, (list, tuple)):
...             yield from flatten(item)       # 递归委托
...         else:
...             yield item
...
>>> list(flatten([1, [2, [3, (4, 5)]], 6]))
[1, 2, 3, 4, 5, 6]
```

### 2. 完整语义：建立双向通道

但 `yield from` 远不只是 `for x in sub: yield x` 的简写。它在调用方和子生成器之间建立了一个**透明的双向通道**：

- 子生成器产出的值直接传给调用方；
- 调用方 `send()` 的值直接传给子生成器；
- 调用方 `throw()` 的异常直接抛进子生成器；
- 子生成器 `return` 的值成为 `yield from` 表达式的值。

```python
>>> def averager():                       # 子生成器：接收数值，收到 None 时返回平均值
...     total, count = 0, 0
...     while True:
...         value = yield
...         if value is None:
...             return total / count
...         total += value
...         count += 1
...
>>> def grouper(results, key):             # 委托生成器
...     while True:
...         results[key] = yield from averager()   # 拿到子生成器的返回值
...
>>> results = {}
>>> for key, values in {"男": [170, 180, 175], "女": [160, 165]}.items():
...     g = grouper(results, key)
...     next(g)
...     for v in values:
...         g.send(v)                     # 值穿过 grouper，直接到达 averager
...     g.send(None)                      # 结束当前的 averager
...
>>> results
{'男': 175.0, '女': 162.5}
```

`grouper` 本身什么都不做，只是把通道接通。正是这种“生成器可以委托给另一个生成器，并取回其结果”的能力，让人们意识到可以用生成器来编写协作式的并发程序——在 3.5 引入 `async/await` 之前，asyncio 就是用 `yield from` 实现协程的。我们会在 {% post_link Python-18-Asyncio '第 18 篇' %} 中用生成器手写一个迷你事件循环。

## 五、PEP 479：生成器中的 StopIteration

在生成器内部，如果意外地抛出了 `StopIteration`（比如对一个空迭代器调用了 `next()`），会发生什么？

```python
>>> def first_of_each(*iterables):
...     for it in iterables:
...         yield next(iter(it))          # 如果某个可迭代对象为空，这里会抛出 StopIteration
...
>>> list(first_of_each([1, 2], [3]))
[1, 3]
>>> list(first_of_each([1, 2], [], [3]))
Traceback (most recent call last):
  ...
RuntimeError: generator raised StopIteration
```

在 3.7 之前，这个 `StopIteration` 会被外层的 `list()` 误认为是“生成器正常结束”，结果是**静默地**返回 `[1]`，丢掉了后面的数据，这种 bug 极难排查。PEP 479 改变了这一行为：生成器内部泄漏出的 `StopIteration` 会被转换为 `RuntimeError`，让错误暴露出来。要结束生成器，请使用 `return`。

## 六、itertools：迭代器的工具箱

`itertools` 模块提供了一组高效（C 实现）、可组合的迭代器构建块。熟练使用它们，可以写出既简洁又节省内存的代码。

### 1. 无限迭代器

```python
>>> from itertools import count, cycle, repeat, islice
>>> list(islice(count(10, 5), 4))                  # 10, 15, 20, ...
[10, 15, 20, 25]
>>> list(islice(cycle("AB"), 5))
['A', 'B', 'A', 'B', 'A']
>>> list(map(pow, range(5), repeat(2)))            # repeat 常用于给 map 提供常量参数
[0, 1, 4, 9, 16]
```

### 2. 切片、过滤与连接

```python
>>> from itertools import chain, takewhile, dropwhile, compress, filterfalse
>>> list(chain([1, 2], (3,), "ab"))                # 依次连接多个可迭代对象
[1, 2, 3, 'a', 'b']
>>> list(chain.from_iterable([[1, 2], [3, 4]]))    # 展平一层
[1, 2, 3, 4]
>>> list(takewhile(lambda x: x < 5, [1, 3, 6, 2])) # 条件为真时一直取，遇假即停
[1, 3]
>>> list(dropwhile(lambda x: x < 5, [1, 3, 6, 2])) # 条件为真时一直丢，之后全部保留
[6, 2]
>>> list(compress("ABCDE", [1, 0, 1, 0, 1]))
['A', 'C', 'E']
```

### 3. 分组：groupby

`groupby` 把**连续的**相同键的元素分为一组。注意“连续”二字：如果数据没有按键排序，同一个键会被分成多个组。

```python
>>> from itertools import groupby
>>> words = ["apple", "avocado", "banana", "blueberry", "cherry", "apricot"]
>>> [(k, list(g)) for k, g in groupby(words, key=lambda w: w[0])]
[('a', ['apple', 'avocado']), ('b', ['banana', 'blueberry']), ('c', ['cherry']), ('a', ['apricot'])]
>>> {k: list(g) for k, g in groupby(sorted(words), key=lambda w: w[0])}   # 先排序
{'a': ['apple', 'apricot', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
```

`groupby` 适合处理“已经有序的流式数据”（比如按时间排列的日志）。如果数据无序，用 `collections.defaultdict(list)` 分组通常更简单。

### 4. 累积、配对与分批

```python
>>> from itertools import accumulate, pairwise, batched
>>> import operator
>>> list(accumulate([1, 2, 3, 4]))                     # 前缀和
[1, 3, 6, 10]
>>> list(accumulate([3, 1, 4, 1, 5], max))             # 前缀最大值
[3, 3, 4, 4, 5]
>>> list(pairwise([1, 4, 9, 16]))                       # 3.10：相邻元素配对
[(1, 4), (4, 9), (9, 16)]
>>> [b - a for a, b in pairwise([1, 4, 9, 16])]         # 求差分
[3, 5, 7]
>>> list(batched("ABCDEFG", 3))                         # 3.12：按固定大小分批
[('A', 'B', 'C'), ('D', 'E', 'F'), ('G',)]
>>> list(batched("ABCDEF", 3, strict=True))             # 3.13：strict=True 时最后一批不足会报错
[('A', 'B', 'C'), ('D', 'E', 'F')]
```

`batched` 非常实用，比如把大量数据按 1000 条一批写入数据库，或者调用有批量限制的 API。

### 5. 组合数学

```python
>>> from itertools import product, permutations, combinations, combinations_with_replacement
>>> list(product("AB", repeat=2))               # 笛卡尔积，等价于嵌套循环
[('A', 'A'), ('A', 'B'), ('B', 'A'), ('B', 'B')]
>>> list(permutations("ABC", 2))                # 排列
[('A', 'B'), ('A', 'C'), ('B', 'A'), ('B', 'C'), ('C', 'A'), ('C', 'B')]
>>> list(combinations("ABCD", 2))               # 组合
[('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]
>>> len(list(combinations_with_replacement(range(6), 2)))   # 两个骰子不计顺序的点数组合
21
```

### 6. tee 与 zip_longest

```python
>>> from itertools import tee, zip_longest
>>> a, b = tee(iter([1, 2, 3]))         # 把一个迭代器“复制”成两个独立的迭代器
>>> list(a), list(b)
([1, 2, 3], [1, 2, 3])
>>> list(zip_longest("AB", [1, 2, 3], fillvalue="-"))
[('A', 1), ('B', 2), ('-', 3)]
```

`tee` 内部会缓存“领先的迭代器已经读取、落后的迭代器还没读取”的元素。如果两个副本的进度相差很大，缓存会变得很大，此时不如直接用 `list()`。另外，`tee` 之后就不应该再使用原来的迭代器了。

### 7. 一个配方：滑动窗口

`pairwise` 是窗口大小为 2 的特例。任意大小的滑动窗口可以用 `deque` 实现：

```python
>>> from collections import deque
>>> def sliding_window(iterable, n):
...     it = iter(iterable)
...     window = deque(islice(it, n - 1), maxlen=n)
...     for x in it:
...         window.append(x)              # maxlen 保证自动丢弃最旧的元素
...         yield tuple(window)
...
>>> list(sliding_window(range(6), 3))
[(0, 1, 2), (1, 2, 3), (2, 3, 4), (3, 4, 5)]
>>> [sum(w) / 3 for w in sliding_window([10, 20, 30, 40, 50], 3)]   # 移动平均
[20.0, 30.0, 40.0]
```

官方文档 `itertools` 页面末尾有一节 “Itertools Recipes”，收录了几十个类似的配方，非常值得通读。

## 小结

- 可迭代对象的 `__iter__` 返回迭代器；迭代器实现 `__next__`，耗尽时抛出 `StopIteration`，并且 `__iter__` 返回自身。
- `for` 循环 = `iter()` + 反复 `next()` + 捕获 `StopIteration`。迭代器只能消费一次。
- 含有 `yield` 的函数是生成器函数；生成器在 `yield` 处暂停时保存了整个帧，因此能“恢复执行”。
- 生成器是惰性的，适合无限序列和海量数据；串联生成器可以构建内存恒定的数据管道。
- `send` 向生成器传值，`throw` 注入异常，`close` 触发清理；`return` 的值存放在 `StopIteration.value` 中。
- `yield from` 建立调用方与子生成器之间的双向通道，并取回子生成器的返回值——这是 asyncio 协程的前身。
- 熟练使用 `itertools`：`chain`、`islice`、`groupby`、`accumulate`、`pairwise`、`batched`、`product` 等。

## 练习

1. 实现一个 `Range` 类，行为与内置的 `range` 尽量一致：支持正负步长、`len()`、下标访问、`in` 运算（要求 O(1)），并且能被多次迭代。
2. 写一个生成器 `read_records(path, batch_size)`，以恒定内存读取一个超大 CSV 文件，每次产出一批（列表）解析好的记录。
3. 用生成器实现一个“素数筛”：`primes()` 无限地产出素数。尝试只用生成器的嵌套（每发现一个素数就在管道中加一层过滤器）来实现，并思考这种实现的效率问题。
4. 本文的 `averager` 在没有接收任何数值就收到 `None` 时会发生什么？修改它，使这种情况返回 `None` 而不是报错。
5. 不使用 `itertools`，自己实现 `groupby`，要求行为与标准库一致（包括“当外层前进时，上一个组的迭代器失效”这一点）。

下一篇我们将进入面向对象的世界：{% post_link Python-09-OOP-Classes '类、实例、继承与 MRO' %}。
