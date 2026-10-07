---
title: Python 从入门到精通（21）：性能分析与优化
date: 2026-10-07 10:15:00
summary: 优化的正确顺序：先测量、再算法、再数据结构、最后才是微观技巧。timeit 与 cProfile 的正确用法，一次完整的“剖析—定位—修复”过程；实测对比：算法改进带来 554 倍、NumPy 与 C 扩展带来约 70 倍、而传统的微观优化在 3.14 上只剩约 1.1 倍；最后介绍 Cython、mypyc、PyPy、Numba 与 Rust 扩展。
tags:
  - Python
  - Python高级
categories:
  - Python
---

“Python 太慢了”是对这门语言最常见的批评。这句话有一定道理：上一篇我们看到，一个简单的循环要执行几千条字节码指令，每一条都有不小的开销。但在实践中，绝大多数 Python 程序的性能问题都可以通过**正确的方法**解决，而不需要换一门语言。本篇的所有数据都来自真实的测量（CPython 3.14，一台 4 核 Linux 机器），你会看到不同层次的优化手段之间，效果可以相差几百倍。

> 本文是「Python 从入门到精通」系列第 21 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、优化的原则

> “过早的优化是万恶之源。”——Donald Knuth

这句名言的完整版本是：“我们应该在 97% 的时间里忘记那些微小的效率问题……但也不应该错过那关键的 3%。”这引出了性能优化的几条基本原则：

1. **先让程序正确，再让它变快。** 并且要有测试来保证优化不会破坏正确性。
2. **先测量，再优化。** 程序员对“瓶颈在哪里”的直觉往往是错误的。不经测量的优化，大概率是在优化一段根本不重要的代码。
3. **按收益从高到低的顺序优化**：
   - **算法与数据结构**：从 O(n²) 降到 O(n)，收益可以是成百上千倍；
   - **把循环交给 C**：使用内置函数、标准库、NumPy 等用 C 实现的工具，收益通常是数十倍；
   - **并发与并行**：利用多核或重叠 I/O 等待（第 17、18 篇）；
   - **微观优化**：局部变量缓存、避免重复计算等，收益通常只有百分之几到几十。
4. **设定目标。** “快一点”不是目标，“这个接口的 P99 延迟要低于 200 毫秒”才是。达到目标就停下来，因为优化会让代码变得更复杂。

## 二、测量工具

### 1. timeit：测量小段代码

```python
>>> import timeit
>>> t = timeit.timeit("sorted(data)", setup="import random; data = random.sample(range(10**6), 1000)", number=1000)
>>> t > 0
True
>>> min(timeit.repeat("x in s", setup="s = set(range(1000)); x = 999", number=100_000, repeat=5)) < 1
True
```

在命令行中更方便：

<!-- norun -->
```bash
python -m timeit -s "data = list(range(1000))" "sum(data)"
# 50000 loops, best of 5: 4.1 usec per loop
```

使用 `timeit` 时需要注意：

- **它会自动关闭垃圾回收**，以减少测量的波动。如果被测代码会产生大量循环引用，结果可能偏乐观；
- 准备工作放在 `setup` 中，不要计入测量时间；
- **取多次重复中的最小值**（`timeit.repeat` + `min`），而不是平均值。测量误差几乎都来自其他进程的干扰，它们只会让时间变长，所以最小值最接近代码本身的真实耗时；
- 对于很快的操作，要让它重复足够多的次数（`number`），使总时间远大于计时器的精度。

测量一段较长的代码的耗时，使用 `time.perf_counter()`（第 13 篇讲过，不要用 `time.time()`）。

### 2. cProfile：找出瓶颈在哪里

`timeit` 告诉你“一段代码有多快”，而**剖析器**（profiler）告诉你“整个程序的时间花在了哪里”。标准库的 `cProfile` 记录每个函数被调用的次数和耗时。来看一个实际的例子——一个统计词频的程序，运行得比预期慢：

<!-- nocheck -->
```python
import cProfile
import pstats
import random
import string

random.seed(1)
WORDS = ["".join(random.choices(string.ascii_lowercase, k=5)) for _ in range(2000)]
TEXT = " ".join(random.choices(WORDS, k=200_000))
STOP_WORDS = ["".join(random.choices(string.ascii_lowercase, k=5)) for _ in range(300)]


def normalize(word):
    return word.strip().lower()


def is_stop_word(word):
    return word in STOP_WORDS


def word_frequency(text):
    counts = {}
    for raw in text.split():
        word = normalize(raw)
        if is_stop_word(word):
            continue
        counts[word] = counts.get(word, 0) + 1
    return sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:10]


profiler = cProfile.Profile()
profiler.enable()
word_frequency(TEXT)
profiler.disable()
pstats.Stats(profiler).sort_stats("tottime").print_stats(5)
```

输出（省略了文件路径）：

<!-- norun -->
```text
         1002005 function calls in 0.956 seconds

   Ordered by: internal time
   List reduced from 11 to 5 due to restriction <5>

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
   200000    0.634    0.000    0.634    0.000 prof.py:16(is_stop_word)
        1    0.134    0.134    0.956    0.956 prof.py:20(word_frequency)
   200000    0.085    0.000    0.140    0.000 prof.py:12(normalize)
   200000    0.038    0.000    0.038    0.000 {method 'get' of 'dict' objects}
   200000    0.028    0.000    0.028    0.000 {method 'lower' of 'str' objects}
```

各列的含义：

- `ncalls`：调用次数；
- `tottime`：函数**自身**花费的时间（不包括它调用的其他函数）；
- `cumtime`：**累计**时间（包括它调用的所有函数）；
- `percall`：分别是 `tottime / ncalls` 和 `cumtime / ncalls`。

按 `tottime` 排序能找到“自己最耗时”的函数，按 `cumtime` 排序能找到“哪条调用路径最耗时”。这里结论一目了然：总共 0.956 秒中，`is_stop_word` 一个函数就占了 0.634 秒（66%）。原因是 `word in STOP_WORDS` 在一个**列表**中查找，每次都要比较最多 300 个字符串。把 `STOP_WORDS` 改为 `frozenset`，查找就变成了 O(1)：

<!-- norun -->
```python
STOP_WORDS = frozenset("".join(random.choices(string.ascii_lowercase, k=5)) for _ in range(300))
```

<!-- norun -->
```text
         1002005 function calls in 0.340 seconds
```

改动了一行代码，总时间从 0.956 秒降到了 0.340 秒。注意，剖析本身有开销（`cProfile` 会让程序变慢，尤其是函数调用密集的程序），所以剖析结果中的绝对时间偏大，但**相对比例**是可靠的。

也可以直接在命令行中剖析整个脚本：`python -m cProfile -s cumtime script.py`。用 `snakeviz` 等工具还可以把结果可视化为火焰图式的图表。

### 3. 其他剖析工具

- **`line_profiler`**：逐行统计耗时，适合在找到瓶颈函数之后，进一步定位到具体哪一行。
- **采样剖析器**：`py-spy`、`Scalene`、`Austin` 等。它们不修改程序，而是每隔一小段时间“偷看”一次程序正在执行的位置，开销极低，甚至可以直接附加到一个**正在运行的生产进程**上（`py-spy top --pid 12345`），而无需重启。Scalene 还能同时分析 CPU、内存和 GPU 的使用情况，并区分时间花在 Python 代码还是 C 代码中。
- **内存剖析**：`tracemalloc`（第 19 篇）、`memray`。

## 三、第一层：算法与数据结构

这是收益最大、最值得优先考虑的一层。下面是“判断一个列表中是否有重复元素”的三种实现，用 5000 个互不相同的数（最坏情况）进行测试：

<!-- nocheck -->
```python
import random
import timeit

random.seed(0)
data = random.sample(range(10**7), 5_000)   # 5000 个互不相同的数：最坏情况


def has_dup_v1(items):                 # O(n²)：对每个元素，在它后面的部分里查找
    for i, x in enumerate(items):
        if x in items[i + 1:]:
            return True
    return False


def has_dup_v2(items):                 # O(n log n)：排序后比较相邻元素
    s = sorted(items)
    return any(a == b for a, b in zip(s, s[1:]))


def has_dup_v3(items):                 # O(n)：集合
    return len(set(items)) != len(items)


def bench(f, number):
    return min(timeit.repeat(lambda: f(data), number=number, repeat=5)) / number


t1, t2, t3 = bench(has_dup_v1, 1), bench(has_dup_v2, 20), bench(has_dup_v3, 200)
for name, t in (("v1 列表切片 O(n²)", t1), ("v2 排序 O(n log n)", t2), ("v3 集合 O(n)", t3)):
    print(f"{name:<18} {t * 1000:>9.3f} ms   相对 v1 加速 {t1 / t:>5.0f} 倍")
```

<!-- norun -->
```text
v1 列表切片 O(n²)        118.021 ms   相对 v1 加速     1 倍
v2 排序 O(n log n)       0.829 ms   相对 v1 加速   142 倍
v3 集合 O(n)             0.213 ms   相对 v1 加速   554 倍
```

只是换了一种数据结构，速度就提升了 **554 倍**，而且数据量越大，差距越悬殊（n 扩大 10 倍，v1 会慢 100 倍，v3 只慢 10 倍）。这是任何微观优化都望尘莫及的。

常见的“算法级”优化机会：

| 坏味道 | 改进 |
|---|---|
| 在循环中对列表做 `in` 判断 | 先转换为 `set` 或 `dict` |
| 嵌套循环做两组数据的匹配（“连接”） | 先用其中一组建立字典索引 |
| 在列表头部插入或删除 | `collections.deque` |
| 反复求最小值/最大值 | `heapq` |
| 在有序数据中查找 | `bisect` 二分查找 |
| 重复计算相同的子问题 | `functools.cache` 记忆化（第 07 篇） |
| 一次性把大文件读入内存再处理 | 生成器流式处理（第 08 篇） |

## 四、第二层：把循环交给 C

CPython 中，**Python 层面的每一次循环迭代都很昂贵**，而 C 层面的循环非常便宜。所以第二条原则是：尽量让循环发生在 C 代码里。我们用 5 种方式计算 0～999999 的平方和：

<!-- nocheck -->
```python
import ctypes
import operator
import pathlib
import subprocess
import tempfile
import timeit

import numpy as np

N = 1_000_000
data = list(range(N))
arr = np.arange(N, dtype=np.int64)

# 用 gcc 现场编译一个 C 函数，再通过 ctypes 调用
src = "long long sum_sq(const long long *a, long n) { long long s = 0; for (long i = 0; i < n; i++) s += a[i] * a[i]; return s; }"
tmp = pathlib.Path(tempfile.mkdtemp())
(tmp / "sumsq.c").write_text(src)
subprocess.run(["gcc", "-O2", "-shared", "-fPIC", "-o", str(tmp / "sumsq.so"), str(tmp / "sumsq.c")], check=True)
lib = ctypes.CDLL(str(tmp / "sumsq.so"))
lib.sum_sq.restype = ctypes.c_longlong
lib.sum_sq.argtypes = [ctypes.POINTER(ctypes.c_longlong), ctypes.c_long]
c_array = arr.ctypes.data_as(ctypes.POINTER(ctypes.c_longlong))


def loop():                     # 纯 Python 循环
    total = 0
    for x in data:
        total += x * x
    return total


def genexpr():                  # 生成器表达式 + 内置 sum
    return sum(x * x for x in data)


def builtin_map():              # map + operator.mul：乘法和迭代都在 C 中完成
    return sum(map(operator.mul, data, data))


def numpy_vec():                # NumPy 向量化
    return int(np.dot(arr, arr))


def c_ext():                    # 手写的 C 函数
    return lib.sum_sq(c_array, N)


expected = loop()
results = []
for f in (loop, genexpr, builtin_map, numpy_vec, c_ext):
    assert f() == expected, f.__name__
    t = min(timeit.repeat(f, number=5, repeat=5)) / 5
    results.append((f.__name__, t))
for name, t in results:
    print(f"{name:<12} {t * 1000:>8.2f} ms   {results[0][1] / t:>6.1f}x")
```

<!-- norun -->
```text
loop            38.57 ms      1.0x
genexpr         37.09 ms      1.0x
builtin_map     32.46 ms      1.2x
numpy_vec        0.56 ms     69.0x
c_ext            0.54 ms     71.1x
```

这组数据非常有启发性：

- **前三种写法差别不大**。生成器表达式和 `map` 虽然把“迭代”交给了 C，但每个元素依然要创建 Python 整数对象、执行乘法的类型分派、更新引用计数。
- **NumPy 快了约 70 倍**。因为数据以原始的 64 位整数紧密地存放在连续内存中（而不是 100 万个独立的 Python 整数对象），整个计算在一次 C 调用中完成，没有任何 Python 层面的开销，还能利用 CPU 的 SIMD 指令。
- **手写的 C 函数**和 NumPy 不相上下。对于这种简单的计算，NumPy 已经接近硬件的极限。

所以，对于数值计算，**向量化**是最重要的优化手段：用对整个数组的运算代替逐个元素的循环。这要求一种思维方式的转变：不再思考“对每个元素做什么”，而是思考“对整个数组做什么”。

## 五、第三层：微观优化

很多 Python 性能技巧流传已久，它们在今天还有用吗？我们实测一下：

<!-- nocheck -->
```python
import math
import timeit

data = list(range(100_000))
words = [str(i) for i in range(100_000)]


def append_loop():
    out = []
    for x in data:
        out.append(x * 2)
    return out


def list_comp():
    return [x * 2 for x in data]


def global_attr():
    return [math.sqrt(x) for x in data]


def local_alias():
    sqrt = math.sqrt                      # 把模块属性缓存为局部变量
    return [sqrt(x) for x in data]


def map_builtin():
    return list(map(math.sqrt, data))


def concat():
    s = ""
    for w in words:
        s += w
    return s


def join():
    return "".join(words)


def ratio(slow, fast):
    return min(timeit.repeat(slow, number=20, repeat=5)) / min(timeit.repeat(fast, number=20, repeat=5))


for slow, fast in ((append_loop, list_comp), (global_attr, local_alias), (global_attr, map_builtin), (concat, join)):
    print(f"{slow.__name__:<12} → {fast.__name__:<12} 提速 {ratio(slow, fast):.2f} 倍")
```

<!-- norun -->
```text
append_loop  → list_comp    提速 1.10 倍
global_attr  → local_alias  提速 1.11 倍
global_attr  → map_builtin  提速 1.31 倍
concat       → join         提速 5.45 倍
```

结论是：

- **列表推导式代替 `append` 循环、把全局名字缓存为局部变量**，在 3.14 上只有约 10% 的提升。在 3.10 及以前，这些技巧的效果要明显得多（常常有 30%～50%），但第 20 篇介绍的特化解释器已经让属性查找、全局变量查找、方法调用变得非常快，“手工优化”的空间被大大压缩了。
- **`join` 代替 `+=` 拼接字符串**依然有 5 倍以上的提升，而且在字符串更长、或者存在其他引用（使 CPython 的原地拼接优化失效）时，差距会大得多，这是一个**复杂度**层面的差异（O(n²) 对 O(n)），而不仅仅是常数因子。

所以，除非剖析结果表明某个热点循环确实是瓶颈，否则**不要为了微观优化牺牲代码的可读性**。写清晰、地道的 Python 代码（推导式、内置函数、合适的数据结构），通常已经是最快的写法之一了。

一些依然值得记住的习惯：

- 用 `in` 检查成员时，确保容器是 `set` 或 `dict`；
- 避免在循环中重复计算不变的值（把它提到循环外面）；
- 尽量使用内置函数和标准库：`sum`、`min`、`max`、`sorted`、`any`、`all`、`collections.Counter`、`itertools` 都由 C 实现；
- 保持类型稳定，让特化解释器能更好地发挥作用；
- 对于大量的小对象，考虑 `__slots__`（第 10 篇）。

## 六、第四层：换一个执行引擎

当以上手段都用尽、某个热点依然太慢时，可以考虑把这部分代码交给更快的执行引擎：

| 方案 | 原理 | 适用场景 |
|---|---|---|
| **NumPy / pandas / Polars** | 向量化的 C/Rust 实现 | 数值计算、数据分析 |
| **Numba** | 用 LLVM 把带有 `@jit` 装饰器的数值函数即时编译为机器码 | 无法向量化的数值循环 |
| **Cython** | 把带有类型声明的类 Python 代码编译为 C 扩展 | 需要精细控制、与 C 库交互 |
| **mypyc** | 把带有类型注解的普通 Python 代码编译为 C 扩展（mypy 自身就用它编译） | 已有完善类型注解的纯 Python 代码 |
| **Rust + PyO3 / maturin** | 用 Rust 编写扩展模块 | 需要高性能且内存安全的扩展（Polars、Pydantic v2 的核心、Ruff、uv 都是这样做的） |
| **ctypes / cffi** | 直接调用已有的 C 动态库（如本文的例子） | 复用现成的 C 库 |
| **PyPy** | 带有追踪式 JIT 的 Python 实现 | 纯 Python 的长时间运行程序，常有数倍提速；但对 C 扩展的兼容性较差 |

一个经验法则是：**先用 Python 写出正确的程序，用剖析器找到真正的热点，只把那 5% 的热点代码用更快的工具重写。** 这也是 Python 生态最成功的地方：用 Python 编写高层逻辑，用 C/C++/Rust 实现性能关键的底层，两者通过扩展模块无缝结合。NumPy、PyTorch、TensorFlow 都是这种模式的典范。

## 七、性能优化检查清单

1. 我有可以复现的、有代表性的基准测试吗？我设定了明确的性能目标吗？
2. 我用剖析器找到真正的瓶颈了吗？
3. 瓶颈处的算法复杂度是否合理？数据结构选对了吗？
4. 是否有重复的计算可以缓存？是否有不必要的工作可以删掉？
5. 热点循环能否交给内置函数、标准库或 NumPy？
6. 是 I/O 密集还是 CPU 密集？能否利用并发或并行？
7. 以上都做了之后，是否需要用 Cython、Numba、Rust 等重写热点？
8. 每一步优化后，测试是否依然通过？性能提升是否经过测量确认？

## 小结

- 先测量、后优化；按“算法与数据结构 → 交给 C → 并发并行 → 微观优化”的顺序考虑，收益依次递减。
- `timeit` 测量小段代码，取多次重复的最小值；`cProfile` 找出时间花在哪个函数上，`tottime` 看自身耗时，`cumtime` 看累计耗时；采样剖析器可以分析生产环境的进程。
- 实测：把列表换成集合带来 554 倍提速；NumPy 向量化或 C 实现带来约 70 倍提速；局部变量缓存等微观优化在 3.14 上只剩约 10%。
- 只把真正的热点交给 Numba、Cython、mypyc、Rust 等工具。

## 练习

1. 用 `cProfile` 剖析你自己写过的一个脚本，找出 `tottime` 最高的三个函数，并尝试优化其中之一，记录优化前后的耗时。
2. 给定两个各有 10 万条记录的列表 `orders`（包含 `user_id`）和 `users`（包含 `id` 和 `name`），写出把每个订单与用户名匹配起来的代码，分别用嵌套循环和字典索引实现，比较两者的耗时。
3. 用 NumPy 实现“计算 100 万个二维点两两之间距离的最小值”（提示：对全部点对做向量化计算内存会爆炸，思考如何分块，或者使用 `scipy.spatial.cKDTree`）。
4. 安装 `line_profiler`，对本文的 `word_frequency` 函数进行逐行剖析，看看在修复 `STOP_WORDS` 之后，下一个瓶颈在哪一行。
5. 用 Numba 的 `@njit` 装饰本文的 `loop()` 函数（需要把数据改为 NumPy 数组），测量它与 NumPy 向量化版本、C 版本的速度差异。

下一篇是本系列的最后一篇，我们将讨论如何把代码变成可靠的工程：{% post_link Python-22-Testing-and-Engineering '测试与工程化实践' %}。
