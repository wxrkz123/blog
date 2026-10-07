---
title: Python 从入门到精通（19）：内存管理与垃圾回收
date: 2026-10-07 10:25:00
summary: CPython 内存管理的全景：引用计数何时增减、确定性析构；循环引用与分代回收的“减去内部引用”算法、哪些对象被 GC 追踪、gc.freeze；__del__ 的陷阱与 weakref；pymalloc 的 arena/pool/block 三层结构（3.14 实测 1 MiB/16 KiB/512 B）与“内存不还给系统”的原因；用 tracemalloc 定位内存泄漏，以及常见的泄漏模式。
tags:
  - Python
  - Python高级
categories:
  - Python
---

Python 程序员几乎从不需要手动管理内存：没有 `malloc`/`free`，也没有 `new`/`delete`。但“不需要手动管理”不等于“不需要理解”：为什么进程的内存占用只增不减？为什么某个对象的 `__del__` 从来没有被调用？为什么一个长期运行的服务内存在缓慢增长？本篇将深入 CPython 的两套内存回收机制——引用计数和循环垃圾回收，以及底层的内存分配器 pymalloc，最后介绍定位内存泄漏的实战方法。

> 本文是「Python 从入门到精通」系列第 19 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、全景：CPython 内存管理的层次

```text
┌──────────────────────────────────────────────────┐
│  Python 代码：x = [1, 2, 3]                       │
├──────────────────────────────────────────────────┤
│  对象专用分配器：free list、小整数、不朽对象……       │   ← 复用常用对象
├──────────────────────────────────────────────────┤
│  pymalloc：小对象分配器（≤ 512 字节）              │   ← arena / pool / block
├──────────────────────────────────────────────────┤
│  C 库 malloc / free（大对象直接走这里）            │
├──────────────────────────────────────────────────┤
│  操作系统：mmap / brk 虚拟内存                     │
└──────────────────────────────────────────────────┘
```

回收对象则依靠两套互补的机制：

1. **引用计数**：主力，绝大多数对象在不再被引用的**那一刻**就被立即释放；
2. **循环垃圾回收器**（`gc` 模块）：补充，专门处理引用计数无法处理的**循环引用**。

## 二、引用计数

### 1. 基本原理

第 02 篇讲过，每个对象的头部都有一个 `ob_refcnt` 字段，记录着有多少个引用指向它。当计数降为 0 时，对象**立即**被销毁，它占用的内存被释放，它引用的其他对象的计数也随之减一（可能引发连锁释放）。

```python
>>> import sys
>>> a = []
>>> sys.getrefcount(a)        # 结果比实际多 1：调用 getrefcount 时，参数本身也是一个临时引用
2
>>> b = a                     # 赋值：+1
>>> container = [a, a]        # 被容器引用：+2
>>> sys.getrefcount(a)
5
>>> del b                     # 删除名字：-1
>>> container.clear()         # 容器不再引用：-2
>>> sys.getrefcount(a)
2
```

以下操作会增加引用计数：赋值给名字、放入容器、作为参数传入函数、作为属性值……反之，名字被删除或重新绑定、离开作用域（局部变量）、从容器中移除、容器本身被销毁，都会减少引用计数。

### 2. 确定性的析构

引用计数最大的优点是**及时、可预测**：对象在最后一个引用消失时立即被回收。我们可以用 `weakref.finalize` 观察到这一点：

```python
>>> import weakref
>>> class Resource:
...     def __init__(self, name):
...         self.name = name
...
>>> def make():
...     r = Resource("临时资源")
...     weakref.finalize(r, print, f"{r.name} 被回收了")
...     print("函数即将返回")
...
>>> make()                    # 局部变量 r 在函数返回时离开作用域，对象立即被回收
函数即将返回
临时资源 被回收了
```

这种确定性让 CPython 中“打开文件后不显式关闭”的代码通常也能正常工作：文件对象在引用消失时立即关闭。但是，**不要依赖这一点**：PyPy 等实现使用的是追踪式垃圾回收，对象何时被回收是不确定的；即使在 CPython 中，只要对象处在一个循环引用里，或者被某个异常回溯间接引用着，它的回收就会被推迟。**释放资源请使用 `with` 语句。**

### 3. 引用计数的代价

- **性能开销**：几乎每条字节码指令都要修改引用计数，这些内存写入对 CPU 缓存不太友好。3.12 的不朽对象、3.14 的 `LOAD_FAST_BORROW` 等“借用引用”优化，都是为了减少这部分开销。
- **线程安全**：修改计数必须是原子的或受保护的，这正是 GIL 存在的主要原因（第 17 篇）。
- **无法处理循环引用**——这是下一节的主题。

## 三、循环引用与垃圾回收器

### 1. 引用计数的盲区

```python
>>> import gc
>>> class Node:
...     def __init__(self, name):
...         self.name = name
...         self.partner = None
...
>>> a, b = Node("A"), Node("B")
>>> a.partner, b.partner = b, a           # 互相引用，形成环
>>> watcher = weakref.ref(a)              # 弱引用不增加引用计数，用来观察对象是否存活
>>> del a, b                              # 两个名字都删掉了
>>> watcher() is not None                 # 但对象还活着：彼此的引用计数都是 1
True
>>> gc.collect() >= 2                     # 手动触发循环垃圾回收
True
>>> watcher() is None                     # 现在才被回收
True
```

删除名字后，两个对象已经无法从程序的任何地方访问到了，但由于它们互相引用，引用计数都不为 0，引用计数机制无能为力。这种情况非常常见：双向链表、树中子节点指向父节点的引用、对象引用了自己的绑定方法、异常对象引用了包含它自己的栈帧……

### 2. 只有容器对象需要追踪

循环引用只可能发生在**能够引用其他对象**的对象之间，所以垃圾回收器只追踪**容器对象**（列表、字典、集合、自定义类的实例、函数、栈帧……），整数、字符串、浮点数这类“原子”对象不被追踪：

```python
>>> gc.is_tracked(42), gc.is_tracked("text"), gc.is_tracked([]), gc.is_tracked(Node("x"))
(False, False, True, True)
>>> t = (1, 2, 3)
>>> gc.collect() >= 0
True
>>> gc.is_tracked(t)              # 只包含原子对象的元组，在一次回收后会被“取消追踪”
False
```

元组是不可变的，如果它只包含原子对象，那么它永远不可能参与循环引用，回收器在遍历到它时会把它移出追踪列表，以减少以后的工作量。

### 3. 回收算法：减去内部引用

垃圾回收器如何找出“无法访问的环”？它的核心算法相当巧妙，并不需要从“根”出发遍历整个对象图：

1. 对所有被追踪的容器对象，把它的引用计数复制一份到临时字段 `gc_refs` 中；
2. 遍历每个容器对象**引用的**其他对象，如果对方也在被追踪的集合中，就把对方的 `gc_refs` 减一。完成后，`gc_refs` 中剩下的，就是**来自外部的引用**的数量（比如来自栈上的局部变量、来自未被追踪的对象）；
3. `gc_refs > 0` 的对象肯定是可达的；从它们出发，把所有能访问到的对象也标记为可达；
4. 剩下的对象就是只被彼此引用、从外部无法访问的垃圾，回收它们。

以上面的 A ⇄ B 为例：两者的引用计数都是 1；减去彼此之间的内部引用后，`gc_refs` 都变成了 0，并且没有任何可达对象指向它们，于是它们被判定为垃圾。

### 4. 分代回收

每次都遍历所有对象的代价太大。回收器基于“**分代假说**”（大多数对象很快就会死去，而活得久的对象往往会继续存活）进行了优化：新创建的对象属于“年轻代”，频繁地检查；在多次回收中幸存下来的对象被移入“年老代”，较少检查。

```python
>>> gc.get_threshold()
(2000, 10, 10)
```

第一个阈值表示：当“新分配的容器对象数 − 释放的容器对象数”超过 2000 时，触发一次年轻代的回收（3.12 及以前这个值是 700）。

3.14 对回收器做了一次重要的改进：**增量式回收**（incremental GC）。回收器现在只有“年轻代”和“年老代”两代，每次触发时回收年轻代以及年老代的**一部分**，而不是一次性扫描整个年老代。对于拥有大量对象的程序，这能把 GC 的最长停顿时间缩短一个数量级以上。相应地，`gc.collect(1)` 的含义也变成了“执行一次增量回收”。

### 5. 控制垃圾回收

- `gc.collect()`：立即执行一次完整的回收，返回找到的不可达对象数量；
- `gc.disable()`：关闭**自动**的循环回收（引用计数依然正常工作）。一些对延迟极度敏感的程序会关闭自动回收，然后在空闲时手动调用 `gc.collect()`；
- `gc.freeze()`：把当前所有对象移入一个“永久代”，以后的回收都忽略它们。这主要用于**预分叉服务器**（如 Gunicorn）：在主进程中加载完应用后调用 `gc.freeze()`，再 fork 出工作进程。这样子进程中的垃圾回收不会去修改这些继承来的对象的 GC 头部，避免了触发操作系统的**写时复制**，从而让大量内存页继续在进程之间共享。Instagram 曾通过类似的手段节省了大量内存。

## 四、__del__ 的陷阱

`__del__` 方法在对象被销毁前调用，看起来是做清理工作的理想位置，但它有很多问题：

- **调用时机不确定**：在 CPython 中，处于循环引用中的对象要等到 GC 运行时才被销毁；在 PyPy 中，任何对象的销毁时机都不确定；解释器退出时，有些对象的 `__del__` 甚至不会被调用；
- **`__del__` 中抛出的异常会被忽略**，只打印一条警告；
- 在 `__del__` 中，它引用的全局变量、模块可能已经被销毁了（尤其是在解释器关闭阶段）；
- 在 3.4 之前（PEP 442 之前），处于循环引用中且定义了 `__del__` 的对象**根本无法被回收**，会被放进 `gc.garbage` 列表中造成内存泄漏。现在这个问题已经解决，但足以说明 `__del__` 的复杂。

更好的选择是：

1. **显式的资源管理**：提供 `close()` 方法，并实现上下文管理器协议（第 11 篇）；
2. 如果确实需要“对象被回收时执行某个操作”，使用 **`weakref.finalize`**：它不会阻止对象被回收，保证最多只调用一次，并且在解释器退出时也会被调用（除非你明确关闭这个行为）。

```python
>>> import tempfile, os
>>> class TempDir:
...     def __init__(self):
...         self.path = tempfile.mkdtemp()
...         # 注意：回调不能引用 self，否则 finalize 本身就会让对象永远存活
...         self._finalizer = weakref.finalize(self, os.rmdir, self.path)
...     def cleanup(self):
...         self._finalizer()                 # 显式清理；之后不会再被重复调用
...     @property
...     def removed(self):
...         return not self._finalizer.alive
...
>>> d = TempDir()
>>> path = d.path
>>> os.path.isdir(path)
True
>>> del d                                     # 忘记调用 cleanup 也没关系
>>> os.path.isdir(path)
False
```

## 五、弱引用

**弱引用**（weak reference）指向一个对象，但**不增加它的引用计数**，因此不会阻止对象被回收。对象被回收后，弱引用会自动“失效”。

```python
>>> class Image:
...     def __init__(self, name):
...         self.name = name
...
>>> cache = weakref.WeakValueDictionary()     # 值是弱引用的字典
>>> img = Image("logo.png")
>>> cache["logo"] = img
>>> "logo" in cache
True
>>> del img                                   # 程序的其他地方不再使用这张图片
>>> "logo" in cache                           # 缓存中的条目自动消失了
False
```

弱引用的典型应用：

- **缓存**：`WeakValueDictionary` 实现的缓存，在对象被其他地方使用时可以复用，不再使用时自动清除，不会因为缓存本身导致内存泄漏；
- **观察者模式**：被观察者用 `WeakSet` 保存观察者，观察者被销毁后自动从集合中消失，不需要显式“取消订阅”；
- **打破循环引用**：比如树结构中，子节点用弱引用指向父节点。

并不是所有对象都支持弱引用：`int`、`str`、`tuple`、`list`、`dict` 等内置类型的实例不支持（出于节省内存的考虑），自定义类的实例默认支持（使用 `__slots__` 的类需要显式加入 `__weakref__`）。

## 六、pymalloc：小对象分配器

### 1. 为什么需要专门的分配器

Python 程序会频繁地创建和销毁大量的小对象（整数、短字符串、小元组、栈帧……）。如果每次都调用 C 库的 `malloc`/`free`，开销太大，还会造成严重的内存碎片。因此 CPython 实现了一个专门针对**小对象**的分配器 **pymalloc**，用于 512 字节及以下的内存请求，更大的请求直接交给系统的 `malloc`。

### 2. 三层结构：arena、pool、block

pymalloc 把内存组织成三个层次。我们可以用一个调试函数查看它的实际参数：

```python
import re
import subprocess
import sys

# _debugmallocstats() 直接写入 C 层面的标准错误（文件描述符 2），
# redirect_stderr 捕获不到，所以在子进程中运行它
stats = subprocess.run([sys.executable, "-c", "import sys; sys._debugmallocstats()"],
                       capture_output=True, text=True).stderr

print(re.search(r"Small block threshold = \d+, in \d+ size classes", stats).group())
print(re.search(r"\d+ bytes/arena", stats).group())
print(re.search(r"\* \d+ bytes  ", stats).group().strip(" *"))
```

```text
Small block threshold = 512, in 32 size classes
1048576 bytes/arena
16384 bytes
```

在 64 位的 CPython 3.14 上：

- **block（块）**：实际分配给对象的内存单位。请求的大小被向上取整到 16 的倍数，形成 512 / 16 = **32 个大小等级**（size class）。比如请求 33～48 字节的内存，都会得到一个 48 字节的块。
- **pool（池）**：**16 KiB** 大小，一个池只存放**同一个大小等级**的块。池中空闲的块通过链表串起来，分配和释放都是 O(1) 的指针操作。
- **arena（场）**：**1 MiB** 大小，从操作系统申请的大块内存（通过 `mmap`），被切分成多个池。

### 3. 为什么内存“只增不减”

这是 Python 程序员最常遇到的困惑之一：创建了大量对象、使用完后删除了它们，`gc.collect()` 也调用了，但进程的内存占用（RSS）却没有下降。原因在于：

- 一个 **arena 只有在其中所有的池都完全空闲时**，才会被归还给操作系统。只要 1 MiB 中还有一个存活的小对象，整个 arena 都不能释放。程序运行一段时间后，存活的对象往往零散地分布在许多 arena 中，造成**碎片化**。
- 被释放的块会留在池中供以后复用，所以内存对 **Python 自己**来说是可用的，只是没有还给操作系统。
- 对于直接通过 `malloc` 分配的大对象，C 库自己的分配器也可能不会立即把内存归还给系统。

所以，“内存占用没有下降”并不一定是内存泄漏。判断是否泄漏，要看在**稳定的工作负载**下，内存是否会**持续无限增长**。对于需要处理大量临时数据的长期运行进程，一种实用的策略是把这部分工作放到子进程中执行，子进程结束后内存会被完整地归还给系统。

另外，自由线程版本（第 17 篇）的 CPython 使用 **mimalloc** 代替了 pymalloc，因为后者不是线程安全的。

### 4. 对象级别的缓存

在 pymalloc 之上，一些高频类型还有自己的**空闲列表**（free list）：被销毁的 `float`、`tuple`（长度较小时）、`list`、`dict`、栈帧等对象不会真正被释放，而是放进一个缓存列表中，下次创建同类对象时直接复用。再加上小整数和 `None` 这样的不朽对象、驻留的字符串，绝大多数常用对象的创建都不需要真正地分配内存。

## 七、测量与定位内存问题

### 1. 对象有多大

`sys.getsizeof` 只计算对象**自身**的大小，不包括它引用的其他对象：

```python
>>> sys.getsizeof(["x"]) == sys.getsizeof(["x" * 100_000])   # 列表的大小与元素本身有多大无关
True
>>> sys.getsizeof("x" * 100_000)
100041
```

要计算一个对象“连同它引用的所有对象”的总大小，需要递归遍历，同时记录访问过的对象以避免重复计算和无限递归：

```python
>>> def deep_size(obj, seen=None):
...     seen = set() if seen is None else seen
...     if id(obj) in seen:
...         return 0
...     seen.add(id(obj))
...     size = sys.getsizeof(obj)
...     if isinstance(obj, dict):
...         size += sum(deep_size(k, seen) + deep_size(v, seen) for k, v in obj.items())
...     elif isinstance(obj, (list, tuple, set, frozenset)):
...         size += sum(deep_size(x, seen) for x in obj)
...     elif hasattr(obj, "__dict__"):
...         size += deep_size(vars(obj), seen)
...     return size
...
>>> deep_size([1, 2, 3, "x" * 1000]) > 1000
True
```

### 2. tracemalloc：找出内存从哪里来

`tracemalloc` 模块可以追踪每一块内存是**在哪一行代码**分配的。最有用的技巧是在两个时间点各拍一张快照，比较它们的差异，找出增长最多的地方：

```python
import tracemalloc

_cache = {}


def handle_request(request_id):
    # 一个有 bug 的“缓存”：键永远不重复，所以它只会无限增长
    _cache[request_id] = bytearray(1000)
    return len(_cache)


def harmless(request_id):
    data = [request_id] * 100          # 临时数据，函数返回后就被释放
    return sum(data)


tracemalloc.start()
before = tracemalloc.take_snapshot()

for i in range(5000):
    handle_request(i)
    harmless(i)

after = tracemalloc.take_snapshot()
top = after.compare_to(before, "lineno")[0]          # 按增长量排序，取第一名
frame = top.traceback[0]
print(f"增长最多的位置: 第 {frame.lineno} 行，增加约 {top.size_diff // 1024} KiB，新增 {top.count_diff} 个内存块")
```

```text
增长最多的位置: 第 8 行，增加约 5305 KiB，新增 10001 个内存块
```

`tracemalloc` 准确地指出了第 8 行的 `_cache[request_id] = ...` 是罪魁祸首（每个条目对应两个内存块：`bytearray` 对象本身和它的数据缓冲区），而 `harmless` 函数中的临时列表没有出现在结果中。

这里还有一个小插曲：这段代码的第一版写的是 `_cache[request_id] = "x" * 1000`，结果 `tracemalloc` 报告增长最多的竟然是 `for` 循环那一行，而且只增长了一百多 KiB。原因是 `"x" * 1000` 由常量组成，编译器在**编译时**就把它折叠成了一个字符串常量，5000 个缓存条目引用的其实是**同一个**字符串对象；真正在增长的，只是作为字典键的那 5000 个整数。这个“意外”本身就是对第 01、02 篇内容的一次很好的复习。在实际项目中，可以在服务运行时定期拍快照进行比较。第三方工具 **memray**（Bloomberg 开源）提供了更强大的分析能力，包括追踪 C 扩展中的分配和生成火焰图。

### 3. 常见的内存泄漏模式

Python 中的“内存泄漏”几乎都是**不再需要的对象仍然被某个地方引用着**：

1. **无限增长的全局容器**：模块级的缓存、注册表、列表，只增不删。缓存应当设置上限（如 `lru_cache(maxsize=...)`）或过期时间，或者使用弱引用容器。
2. **在方法上使用 `@lru_cache`**：`self` 成为缓存键的一部分，缓存会让实例永远无法被回收（第 07 篇）。
3. **闭包或回调捕获了大对象**：一个注册到全局事件系统的回调函数，如果闭包中引用了一个大对象，那个对象会一直存活。
4. **异常和回溯**：异常对象引用回溯，回溯引用栈帧，栈帧引用所有局部变量。如果把异常对象保存起来（比如存进一个列表供以后分析），它所经过的每一层函数中的所有局部变量也都会一起被保留。这正是第 11 篇中 `except ... as e` 的变量会被自动删除的原因。
5. **未结束的线程和任务**：仍在运行的线程、未被等待的 asyncio 任务会保持它们引用的所有对象。

```python
>>> big_objects = []
>>> def process():
...     huge = bytearray(10_000_000)          # 一个 10 MB 的局部变量
...     raise ValueError("出错了")
...
>>> errors = []
>>> try:
...     process()
... except ValueError as e:
...     errors.append(e)                      # 保存了异常对象……
...
>>> frame_locals = errors[0].__traceback__.tb_next.tb_frame.f_locals
>>> len(frame_locals["huge"])                  # ……于是 10 MB 的 huge 也被一起保留了下来
10000000
```

如果需要保存异常信息供以后分析，可以保存格式化后的字符串（`traceback.format_exception(e)`），或者使用 `traceback.TracebackException.from_exception(e)`，它只保留必要的信息，而不持有栈帧。

## 小结

- CPython 主要依靠引用计数回收对象，计数归零时立即释放，具有确定性；但不要依赖它来释放资源，请使用 `with`。
- 引用计数无法处理循环引用，由 `gc` 模块的分代回收器补充；它只追踪容器对象，通过“减去内部引用”找出不可达的环。3.14 起回收器是增量式的。
- `__del__` 问题很多，优先使用上下文管理器和 `weakref.finalize`；弱引用适合实现缓存和观察者。
- pymalloc 管理 ≤512 字节的小对象，按 arena（1 MiB）、pool（16 KiB）、block（32 个大小等级）组织；arena 只有完全空闲才归还系统，所以进程内存“只增不减”不一定是泄漏。
- 用 `tracemalloc` 比较快照定位内存增长；泄漏的本质是不再需要的对象仍被引用着。

## 练习

1. 写一个双向链表类，节点之间用强引用连接，创建 10 万个节点后删除链表，观察 `gc.collect()` 的返回值；再把“指向前一个节点”的引用改为弱引用，重复实验并比较。
2. 使用 `gc.set_debug(gc.DEBUG_SAVEALL)`，然后制造一个循环引用并回收，检查 `gc.garbage` 中保存了哪些对象。
3. 实现一个基于 `WeakValueDictionary` 的“对象池”：相同参数创建的 `Color(r, g, b)` 对象在仍被使用时返回同一个实例，不再使用时自动从池中移除。
4. 写一个程序：创建 100 万个小对象后删除其中 99%（每 100 个保留 1 个），用 `psutil` 或 `resource` 模块观察进程的 RSS 变化，并用 `sys._debugmallocstats()` 解释你看到的现象。
5. 在你的一个长期运行的程序（或 Web 服务）中加入一个调试接口，每次调用时拍一张 `tracemalloc` 快照并与上一次比较，输出增长最多的前 10 个位置。

下一篇我们将深入 CPython 的执行引擎：{% post_link Python-20-Bytecode-and-Interpreter '字节码与解释器内部' %}。
