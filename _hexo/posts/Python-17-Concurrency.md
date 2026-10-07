---
title: Python 从入门到精通（17）：并发编程——线程、进程与 GIL
date: 2026-10-07 10:35:00
summary: 并发与并行、CPU 密集与 I/O 密集；GIL 的本质、何时释放、为什么有了 GIL 仍然会有竞态条件；锁、条件变量、队列与死锁；多进程与 3.14 默认的 forkserver 启动方式；concurrent.futures 统一接口；3.14 正式支持的自由线程版本（实测多线程加速 3.28 倍）与子解释器 concurrent.interpreters。
tags:
  - Python
  - Python高级
categories:
  - Python
---

“Python 的多线程是假的”“有 GIL 就不用加锁”“想并行就用多进程”……关于 Python 并发，流传着很多半对半错的说法。本篇从概念讲起，弄清 GIL 到底锁住了什么、在什么时候释放；然后介绍线程同步的正确姿势和多进程的代价；最后看看 Python 并发的未来：3.13 引入、3.14 正式支持的**自由线程**（free-threaded）版本，以及子解释器。

> 本文是「Python 从入门到精通」系列第 17 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、基本概念

### 1. 并发与并行

- **并发**（concurrency）：多个任务在**同一时间段内**交替推进。单核 CPU 也能并发——操作系统在任务之间快速切换。
- **并行**（parallelism）：多个任务在**同一时刻**真正同时执行，需要多个 CPU 核心。

并发是关于**结构**的（如何组织多个同时进行的任务），并行是关于**执行**的（如何利用多个核心）。

### 2. 任务的两种类型

判断该用哪种并发工具，首先要看任务的瓶颈在哪里：

- **I/O 密集型**：大部分时间在**等待**——等网络响应、等磁盘读写、等数据库返回。比如爬虫、Web 服务、调用 API。CPU 大部分时间是空闲的。
- **CPU 密集型**：大部分时间在**计算**——图像处理、数值计算、压缩、加密。CPU 一直满负荷运转。

对于 I/O 密集型任务，并发的意义在于“等待的时候去做别的事”；对于 CPU 密集型任务，只有并行（多个核心同时算）才能真正加速。

Python 提供了三类工具：

| 工具 | 模块 | 适合 |
|---|---|---|
| 多线程 | `threading`、`concurrent.futures.ThreadPoolExecutor` | I/O 密集型 |
| 多进程 | `multiprocessing`、`ProcessPoolExecutor` | CPU 密集型 |
| 协程 | `asyncio` | 高并发的 I/O 密集型（{% post_link Python-18-Asyncio '下一篇' %}） |

## 二、线程

### 1. 创建线程

<!-- nocheck -->
```python
import threading
import time


def download(name, seconds):
    print(f"开始下载 {name}")
    time.sleep(seconds)                   # 模拟网络 I/O
    print(f"完成下载 {name}")


start = time.perf_counter()
threads = [threading.Thread(target=download, args=(f"文件{i}", 0.2)) for i in range(5)]
for t in threads:
    t.start()
for t in threads:
    t.join()                              # 等待线程结束
elapsed = time.perf_counter() - start
print(f"5 个各需 0.2 秒的下载，总共用时不到 0.4 秒：{elapsed < 0.4}")
```

```text
开始下载 文件0
开始下载 文件1
……
完成下载 文件4
5 个各需 0.2 秒的下载，总共用时不到 0.4 秒：True
```

五个任务如果串行执行需要 1 秒，用线程并发执行只需要约 0.2 秒。（“开始”和“完成”的顺序每次运行都可能不同，这就是并发的不确定性。）

### 2. 线程池：更好的方式

手动创建和管理线程比较繁琐。`concurrent.futures` 提供了更高层的**线程池**，它复用固定数量的线程，并能方便地获取每个任务的返回值和异常：

```python
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


def fetch(url):
    time.sleep(0.1)                       # 模拟网络请求
    if "bad" in url:
        raise ConnectionError(f"无法连接 {url}")
    return f"{url} 的内容"


urls = ["https://a.com", "https://bad.com", "https://c.com"]
with ThreadPoolExecutor(max_workers=3) as pool:
    futures = {pool.submit(fetch, url): url for url in urls}   # 提交任务，立即返回 Future 对象
    results = {}
    for future in as_completed(futures):                         # 谁先完成先处理谁
        url = futures[future]
        try:
            results[url] = future.result()                       # 任务中的异常会在这里重新抛出
        except ConnectionError as e:
            results[url] = f"失败：{e}"

for url in urls:
    print(results[url])
```

```text
https://a.com 的内容
失败：无法连接 https://bad.com
https://c.com 的内容
```

`Future` 对象代表一个“将来会得到的结果”。`submit` 立即返回 Future，`result()` 阻塞直到结果可用；任务中抛出的异常被保存在 Future 中，调用 `result()` 时重新抛出。如果只需要按顺序拿到所有结果，`pool.map(fetch, urls)` 更简洁。`with` 语句结束时会等待所有任务完成并关闭线程池。

## 三、GIL：全局解释器锁

### 1. 现象：CPU 密集型任务，多线程不加速

<!-- nocheck -->
```python
import sys
import time
from concurrent.futures import ThreadPoolExecutor


def count_primes(n):
    count = 0
    for i in range(2, n):
        if all(i % d for d in range(2, int(i ** 0.5) + 1)):
            count += 1
    return count


N, JOBS = 200_000, 4
start = time.perf_counter()
for _ in range(JOBS):
    count_primes(N)
serial = time.perf_counter() - start

start = time.perf_counter()
with ThreadPoolExecutor(JOBS) as pool:
    list(pool.map(count_primes, [N] * JOBS))
threaded = time.perf_counter() - start

print(f"GIL 启用: {sys._is_gil_enabled()}，串行 {serial:.2f}s，4 线程 {threaded:.2f}s，"
      f"加速比 {serial / threaded:.2f}x")
```

在一台 4 核机器上，用标准的 CPython 3.14 运行，结果是：

```text
GIL 启用: True，串行 1.23s，4 线程 1.27s，加速比 0.96x
```

4 个线程跑在 4 个核心上，却**没有任何加速**，甚至略慢。罪魁祸首就是 GIL。

### 2. GIL 是什么

**GIL**（Global Interpreter Lock，全局解释器锁）是 CPython 解释器中的一把互斥锁：**任何时刻，只有持有 GIL 的线程才能执行 Python 字节码**。所以即使有多个 CPU 核心，同一个进程中的多个线程也无法同时执行 Python 代码。

为什么 CPython 需要 GIL？最主要的原因是**引用计数**。第 02 篇讲过，每个对象头部都有一个引用计数，几乎每一条字节码指令都在修改引用计数。如果多个线程同时修改同一个对象的引用计数而不加保护，计数就会出错，导致对象被提前释放（程序崩溃）或永远不被释放（内存泄漏）。给每个对象都加锁的开销巨大，而用一把大锁保护整个解释器，实现简单、单线程性能好，而且让 C 扩展的编写变得容易得多（C 扩展作者大多不必考虑线程安全）。在 1990 年代多核 CPU 尚未普及时，这是一个非常合理的权衡。

### 3. GIL 何时释放

GIL 并不是被一个线程永久占有的，它会在以下时机被释放：

1. **阻塞的 I/O 操作**：读写文件、网络收发、`time.sleep()` 等，在进入阻塞的系统调用之前会释放 GIL，返回后再重新获取。这就是**多线程对 I/O 密集型任务有效**的原因：一个线程在等待网络时，其他线程可以运行。
2. **定时切换**：一个线程持有 GIL 运行一段时间后，如果有其他线程在等待，它会被要求释放 GIL。这个时间间隔默认是 5 毫秒：

```python
>>> import sys
>>> sys.getswitchinterval()
0.005
```

3. **C 扩展主动释放**：执行耗时的纯 C 计算时，扩展可以主动释放 GIL。标准库的 `hashlib`（计算大块数据的哈希）、`zlib`、`bz2`，以及 NumPy 的许多操作都会这样做。所以用多线程并发计算多个大文件的 SHA-256，**是能利用多核的**。

### 4. 有 GIL 也需要加锁

一个常见的误解是：“既然同一时刻只有一个线程在执行，那就不需要锁了。”这是错的。GIL 保证的是**单条字节码指令**的原子性（准确地说，是解释器内部状态的一致性），而不是你的**业务操作**的原子性。看看 `counter += 1` 被编译成了什么：

```python
>>> import dis
>>> counter = 0
>>> def increment():
...     global counter
...     counter += 1
...
>>> [i.opname for i in dis.get_instructions(increment)][1:5]
['LOAD_GLOBAL', 'LOAD_SMALL_INT', 'BINARY_OP', 'STORE_GLOBAL']
```

“读取—计算—写回”是三步独立的操作。如果线程 A 读取了 `counter` 的值之后、写回之前，GIL 切换到了线程 B，B 也读到了同样的旧值，那么两次加一最终只生效一次。这就是**竞态条件**（race condition）。下面的代码人为地在读写之间让出执行权，来稳定地复现这个问题：

<!-- nocheck -->
```python
import threading
import time

balance = 0


def deposit(times):
    global balance
    for _ in range(times):
        current = balance          # 读
        time.sleep(0)              # 在读和写之间让出 GIL（模拟现实中可能发生的线程切换）
        balance = current + 1      # 写


threads = [threading.Thread(target=deposit, args=(1000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(f"期望 4000，实际 {balance}，丢失了更新：{balance < 4000}")
```

```text
期望 4000，实际 1013，丢失了更新：True
```

（具体数值每次都不同。）现实中的线程切换不会这么频繁，但它**一定会**在某个时刻发生，而且往往是在生产环境的高负载下、最难排查的时候。

## 四、线程同步

### 1. 锁

修复竞态条件的方法是用**锁**（`Lock`）保护“读—改—写”这段**临界区**，保证同一时刻只有一个线程在执行它：

```python
import threading
import time

balance = 0
lock = threading.Lock()


def deposit(times):
    global balance
    for _ in range(times):
        with lock:                 # 获取锁；离开 with 块时自动释放（即使发生异常）
            current = balance
            time.sleep(0)
            balance = current + 1


threads = [threading.Thread(target=deposit, args=(1000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(balance)
```

```text
4000
```

**永远使用 `with lock:`**，而不是手动调用 `acquire()` 和 `release()`，否则一旦临界区中抛出异常，锁就永远不会被释放。

`threading` 模块还提供了其他同步原语：

| 原语 | 用途 |
|---|---|
| `Lock` | 互斥锁，最基本的同步工具 |
| `RLock` | 可重入锁：同一个线程可以多次获取，适合递归调用的场景 |
| `Semaphore(n)` | 允许最多 n 个线程同时进入，常用于限制并发连接数 |
| `Event` | 一个线程发出信号，其他线程等待该信号（如“初始化完成”“请停止”） |
| `Condition` | 等待某个条件成立，配合 `wait()`/`notify()` 使用 |
| `Barrier(n)` | 等待 n 个线程都到达某个点后再一起继续 |

### 2. 死锁

当两个线程各自持有一把锁，又都在等待对方的锁时，就发生了**死锁**：

<!-- norun -->
```python
# 线程 1                      # 线程 2
with lock_a:                   with lock_b:
    with lock_b:  # 等待 2 释放 b    with lock_a:  # 等待 1 释放 a
        ...                            ...
```

避免死锁的经典方法是：**所有线程都按相同的全局顺序获取多把锁**；尽量缩小临界区，不要在持有锁的时候调用外部代码（回调、日志、I/O）；在 `acquire()` 时使用 `timeout` 参数，以便检测到可能的死锁。

### 3. 队列：用通信代替共享

比起让多个线程共享可变数据并小心地加锁，更好的设计是**让线程之间通过队列传递消息**。`queue.Queue` 是线程安全的，内部已经处理好了所有的锁。最经典的模式是**生产者—消费者**：

```python
import queue
import threading

tasks = queue.Queue(maxsize=10)        # 有界队列：生产太快时 put 会阻塞，形成“背压”
results = []
STOP = object()                        # 哨兵：通知消费者结束


def producer():
    for i in range(1, 6):
        tasks.put(i)
    tasks.put(STOP)


def consumer():
    while (item := tasks.get()) is not STOP:
        results.append(item * item)


threads = [threading.Thread(target=producer), threading.Thread(target=consumer)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(results)
```

```text
[1, 4, 9, 16, 25]
```

3.13 起，`Queue` 还新增了 `shutdown()` 方法，可以更优雅地通知所有等待中的线程“队列已关闭”，从而不必再使用哨兵对象。

## 五、多进程

### 1. 用进程绕过 GIL

每个进程都有自己独立的解释器和独立的 GIL，所以多进程可以真正地利用多核执行 CPU 密集型任务。`ProcessPoolExecutor` 和 `ThreadPoolExecutor` 的接口完全相同：

```python
import time
from concurrent.futures import ProcessPoolExecutor


def count_primes(n):
    count = 0
    for i in range(2, n):
        if all(i % d for d in range(2, int(i ** 0.5) + 1)):
            count += 1
    return count


if __name__ == "__main__":             # 使用多进程时，这个保护是必需的
    with ProcessPoolExecutor(max_workers=4) as pool:
        print(list(pool.map(count_primes, [10_000, 20_000, 30_000, 40_000])))
```

```text
[1229, 2262, 3245, 4203]
```

### 2. 多进程的代价

进程之间**不共享内存**，这带来了几个重要的限制和开销：

- **数据需要序列化**：传给子进程的参数和返回的结果，都要用 `pickle` 序列化后通过管道传输。所以函数和参数都必须是**可 pickle 的**：lambda、局部函数、打开的文件、锁、数据库连接都不行。传输大量数据（如一个巨大的列表）时，序列化的开销可能超过并行带来的收益。
- **启动开销**：创建进程比创建线程慢得多，内存占用也大得多。
- **状态不共享**：子进程中修改全局变量，父进程看不到。需要共享数据时，可以使用 `multiprocessing.shared_memory`、`Manager`，或者干脆通过消息传递。

所以，多进程适合“**计算量大、数据传输量小**”的任务。

### 3. 启动方式与 `__main__` 保护

创建子进程有三种方式：

- **fork**：直接复制父进程（仅限类 Unix 系统）。速度快，但如果父进程中有其他线程，复制出来的子进程可能会继承处于“被锁住”状态的锁，导致死锁，这是一个长期存在的隐患。
- **spawn**：启动一个全新的 Python 解释器，导入主模块，然后执行任务。安全但较慢。Windows 和 macOS 的默认方式。
- **forkserver**：先启动一个干净的“服务器进程”，之后每次需要子进程时都从它 fork。兼顾了安全和速度。

**3.14 起，Linux 上的默认启动方式从 `fork` 改为了 `forkserver`**：

```python
>>> import multiprocessing, sys
>>> sys.platform != "linux" or multiprocessing.get_start_method() == "forkserver"
True
```

在 spawn 和 forkserver 模式下，子进程会重新**导入主模块**。如果创建进程池的代码没有放在 `if __name__ == "__main__":` 保护中，子进程导入主模块时又会去创建进程池，导致无限递归地创建进程（Python 会检测到这种情况并报错）。所以：**使用多进程时，一定要加 `__main__` 保护**。这个变化也意味着，以前在 Linux 上“碰巧能运行”的、依赖 fork 语义的代码（比如在子进程中使用了未 pickle 的全局状态），在 3.14 上可能会出问题。

## 六、自由线程 Python：没有 GIL 的未来

### 1. PEP 703

移除 GIL 的尝试在 Python 历史上有过好几次，都因为单线程性能下降太多而失败。2023 年，Sam Gross 提出的 PEP 703 被接受，它通过一系列精巧的技术，在可接受的性能代价下实现了无 GIL 的 CPython：

- **偏向引用计数**（biased reference counting）：每个对象都有一个“所有者线程”。所有者线程修改引用计数时使用普通的（快速的）操作，其他线程则使用原子操作。由于绝大多数对象只被创建它的线程使用，这样大部分引用计数操作依然很快。
- **不朽对象**（第 02 篇介绍的 PEP 683）：`None`、小整数等被所有线程频繁使用的对象，引用计数根本不需要修改。
- **延迟引用计数**：对于函数、模块这类被大量线程共享的对象，部分引用计数操作被推迟处理。
- **细粒度锁**：`list`、`dict` 等内置容器使用每个对象自己的轻量级锁，保证并发访问时不会损坏内部结构。
- 内存分配器改用线程安全的 **mimalloc**。

自由线程版本在 3.13 中作为实验性功能发布，3.14 起（PEP 779）进入“**正式支持**”阶段，但目前它仍是一个单独的构建版本，可执行文件通常叫 `python3.14t`。

### 2. 实测

用 `uv python install 3.14t` 安装自由线程版本后，运行和上面完全相同的质数计算代码：

<!-- norun -->
```text
GIL 启用: False，串行 1.37s，4 线程 0.42s，加速比 3.28x
```

在同一台 4 核机器上，4 个线程获得了 **3.28 倍**的加速，CPU 密集型的多线程程序第一次真正实现了并行！代价也很明显：单线程的串行执行从 1.23 秒变成了 1.37 秒，慢了约 11%，这来自于原子操作和锁带来的额外开销（CPython 团队的目标是在后续版本中将这一开销持续降低）。

### 3. 现状与注意事项

- **C 扩展需要适配**：C 扩展必须声明自己支持自由线程。如果导入了一个没有声明支持的扩展模块，解释器会**自动重新启用 GIL** 并发出警告，以保证安全。可以用 `sys._is_gil_enabled()` 检查当前状态，也可以用 `-X gil=0` 强制禁用。主流的库（NumPy 等）正在陆续发布兼容自由线程的版本。
- **你的代码需要真正线程安全**：有 GIL 时一些“碰巧正确”的代码（依赖单条字节码的原子性，比如多个线程往同一个列表 `append`），在自由线程下虽然不会导致解释器崩溃，但业务层面的竞态条件会更容易暴露出来。本文第四节的同步原则变得更加重要。
- 对于纯 I/O 密集型的程序，自由线程几乎没有收益。

## 七、子解释器

除了多线程和多进程，3.14 还提供了第三种并行方式：**子解释器**（PEP 734）。同一个进程中可以运行多个相互隔离的解释器，每个解释器有自己的 GIL（3.12 的 PEP 684 实现了“每个解释器一个 GIL”），因此它们可以并行执行。它介于线程和进程之间：比进程轻量（共享同一个进程的地址空间，启动更快），又比线程隔离（每个解释器有自己独立的模块和对象，不能直接共享 Python 对象）。

```python
from concurrent.futures import InterpreterPoolExecutor


def square_sum(n):
    return sum(i * i for i in range(n))


if __name__ == "__main__":
    with InterpreterPoolExecutor(max_workers=4) as pool:      # 3.14 新增，接口与线程池/进程池一致
        print(list(pool.map(square_sum, [10, 100, 1000])))
```

```text
[285, 328350, 332833500]
```

更底层的 `concurrent.interpreters` 模块提供了创建解释器、在其中执行代码、以及在解释器之间通过队列传递数据的接口。子解释器目前仍处于早期阶段，很多第三方 C 扩展还不支持在子解释器中加载，但它为 Python 的并行计算提供了一个很有前景的新方向。

## 八、如何选择

| 场景 | 推荐方案 |
|---|---|
| 少量的 I/O 密集任务（并发几十个以内） | `ThreadPoolExecutor` |
| 大量的 I/O 密集任务（成千上万个连接） | `asyncio`（下一篇） |
| CPU 密集，纯 Python 计算 | `ProcessPoolExecutor`；或自由线程版本 + 线程池 |
| CPU 密集，数值计算 | NumPy 等向量化库（它们在 C 层释放 GIL 甚至自带多线程） |
| CPU 密集，需要极致性能 | 用 C/Rust/Cython 编写扩展，在其中释放 GIL |
| 需要隔离、又不想付出多进程的开销 | 子解释器（`InterpreterPoolExecutor`） |

另外，`concurrent.futures` 的三种执行器（线程池、进程池、解释器池）接口完全相同，所以完全可以先写出正确的程序，再通过替换执行器来实验哪种方式最快。

## 小结

- I/O 密集型任务用并发（线程、协程），CPU 密集型任务需要并行（多进程、自由线程、C 扩展）。
- GIL 保证同一时刻只有一个线程执行字节码；它在阻塞 I/O、每 5 毫秒的定时切换以及 C 扩展主动释放时被让出。
- GIL 不保证业务操作的原子性：`x += 1` 是“读—改—写”三步，必须用锁保护共享的可变状态；优先使用队列在线程间通信。
- 多进程能利用多核，但有序列化、启动和不共享内存的代价；3.14 在 Linux 上默认使用 `forkserver`，必须加 `__main__` 保护。
- 3.14 正式支持自由线程版本（`python3.14t`），CPU 密集的多线程可以真正并行，单线程有约 10% 的开销。
- 子解释器（`InterpreterPoolExecutor`）是介于线程和进程之间的新选择。

## 练习

1. 用 `ThreadPoolExecutor` 写一个并发下载器：同时下载一组 URL（可以用 `urllib.request`），限制最大并发数为 5，统计成功和失败的数量，并显示整体进度。
2. 用 `threading.Condition` 实现一个有界的阻塞队列 `BoundedQueue`，支持 `put` 和 `get`，队列满时 `put` 阻塞、空时 `get` 阻塞。与 `queue.Queue` 的实现（它就是用 Python 写的）进行对比。
3. 设计一个会发生死锁的程序，然后用 `faulthandler.dump_traceback_later()` 或 `py-spy dump` 找出死锁的位置，再修复它。
4. 计算 100 个大文件（可以自己生成）的 SHA-256，分别用串行、线程池、进程池三种方式实现并比较耗时。为什么线程池在这里也能加速？
5. 安装自由线程版本的 Python，运行本文的质数计算程序，然后把 `count_primes` 改为“所有线程往同一个列表中 `append` 结果”，观察结果是否依然正确，并思考原因。

下一篇我们将学习另一种并发模型——协程：{% post_link Python-18-Asyncio 'asyncio 异步编程' %}。
