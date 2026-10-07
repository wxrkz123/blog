---
title: Python 从入门到精通（18）：asyncio 异步编程
date: 2026-10-07 10:30:00
summary: 为什么需要协程；async/await 基础与“忘记 await”的陷阱；create_task、gather 与 3.11 的 TaskGroup 结构化并发；await 的本质——协程建立在生成器之上，并用 60 行代码手写一个能运行 async def 的迷你事件循环；取消与超时、Semaphore 限流、阻塞调用的危害与 to_thread、异步迭代器与异步上下文管理器。
tags:
  - Python
  - Python高级
categories:
  - Python
---

上一篇我们用线程处理 I/O 密集型任务。线程简单好用，但如果要同时处理一万个网络连接呢？一万个线程意味着一万个操作系统线程栈（每个默认几 MB 的虚拟内存）、频繁的上下文切换，以及无处不在的锁。**asyncio** 提供了另一种模型：在**单个线程**中，用一个**事件循环**调度成千上万个**协程**，每个协程在等待 I/O 时主动让出控制权。本篇不仅讲如何使用 asyncio，还会亲手实现一个迷你事件循环，让你彻底看清 `await` 背后发生了什么。

> 本文是「Python 从入门到精通」系列第 18 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、协程的基本用法

### 1. async def 与 await

```python
import asyncio


async def greet(name, delay):
    await asyncio.sleep(delay)          # 非阻塞地等待：让出控制权，事件循环可以去运行别的协程
    print(f"你好，{name}")
    return name.upper()


async def main():
    result = await greet("小明", 0.1)    # 等待协程执行完成，并拿到返回值
    print(result)


asyncio.run(main())                     # 创建事件循环，运行 main()，结束后关闭事件循环
```

```text
你好，小明
小明
```

- `async def` 定义的是一个**协程函数**。调用它**不会执行函数体**，而是返回一个**协程对象**——这和第 08 篇的生成器函数一模一样。
- `await` 只能在协程内部使用，它的意思是“暂停当前协程，直到等待的对象完成，然后取回它的结果”。
- `asyncio.run()` 是整个异步程序的入口，通常在程序中只调用一次。

### 2. 最常见的错误：忘记 await

```python
import asyncio
import warnings


async def save(data):
    await asyncio.sleep(0)
    print("已保存", data)


async def main():
    save("重要数据")                    # 忘了 await：协程对象被创建后直接丢弃，函数体从未执行
    print("main 结束")


with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    asyncio.run(main())
    import gc; gc.collect()
print(w[0].message)
```

```text
main 结束
coroutine 'save' was never awaited
```

“已保存”永远不会被打印。Python 只会在协程对象被回收时发出一个 `RuntimeWarning`，很容易被忽略。类型检查器和 Ruff 等工具可以在编写代码时就发现这类错误。

## 二、并发地运行多个协程

### 1. 顺序 await 不会带来并发

```python
import asyncio
import time


async def fetch(name, delay):
    await asyncio.sleep(delay)          # 模拟一次网络请求
    return f"{name}({delay}s)"


async def sequential():
    return [await fetch("A", 0.2), await fetch("B", 0.2), await fetch("C", 0.2)]


async def concurrent():
    return await asyncio.gather(fetch("A", 0.2), fetch("B", 0.2), fetch("C", 0.2))


for f in (sequential, concurrent):
    start = time.perf_counter()
    result = asyncio.run(f())
    print(f"{f.__name__:<10} {result} 约 {time.perf_counter() - start:.1f}s")
```

```text
sequential ['A(0.2s)', 'B(0.2s)', 'C(0.2s)'] 约 0.6s
concurrent ['A(0.2s)', 'B(0.2s)', 'C(0.2s)'] 约 0.2s
```

`await` 会等待协程完成后才继续，所以连续三个 `await` 依然是顺序执行。要让它们并发，必须把协程包装成**任务**（Task）交给事件循环调度。`asyncio.gather` 会把所有协程包装成任务，并发运行，然后**按传入的顺序**返回结果。

### 2. Task：交给事件循环调度的协程

`asyncio.create_task()` 把协程包装成任务，任务会**立即被安排执行**，不需要等待你去 `await` 它：

```python
>>> import asyncio
>>> async def worker(name):
...     print(f"{name} 开始")
...     await asyncio.sleep(0.01)
...     print(f"{name} 结束")
...     return name
...
>>> async def main():
...     t1 = asyncio.create_task(worker("任务1"))
...     t2 = asyncio.create_task(worker("任务2"))
...     print("任务已创建")
...     return await t1, await t2
...
>>> asyncio.run(main())
任务已创建
任务1 开始
任务2 开始
任务1 结束
任务2 结束
('任务1', '任务2')
```

注意输出顺序：任务创建后并不会马上运行，而是要等到当前协程**让出控制权**（这里是 `await t1`）时，事件循环才有机会去运行它们。这就是**协作式多任务**：一个协程只有在 `await` 的地方才会被切换出去。

一个隐蔽的陷阱：事件循环只保存对任务的**弱引用**。如果你创建了任务却不保存它的引用（“发射后不管”），任务可能在执行到一半时被垃圾回收掉。

### 3. TaskGroup：结构化并发

`gather` 有一个问题：如果其中一个任务失败了，其他任务**不会被取消**，会继续在后台运行。3.11 引入的 `TaskGroup` 实现了**结构化并发**（structured concurrency）：任务组中的所有任务的生命周期都被限定在 `async with` 块之内；任何一个任务失败，组内其他任务都会被**自动取消**，所有异常被收集成一个 `ExceptionGroup`（第 11 篇介绍过）抛出：

```python
import asyncio


async def job(name, delay, fail=False):
    try:
        await asyncio.sleep(delay)
        if fail:
            raise ValueError(f"{name} 失败了")
        print(f"{name} 完成")
        return name
    except asyncio.CancelledError:
        print(f"{name} 被取消")
        raise                                    # 被取消时一定要重新抛出


async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(job("快任务", 0.01))
            tg.create_task(job("坏任务", 0.02, fail=True))
            tg.create_task(job("慢任务", 1))
    except* ValueError as eg:
        print("捕获到:", [str(e) for e in eg.exceptions])


asyncio.run(main())
```

```text
快任务 完成
慢任务 被取消
捕获到: ['坏任务 失败了']
```

“坏任务”失败后，还在运行的“慢任务”被立即取消，`async with` 块等到所有任务都结束后才退出。**新代码中应该优先使用 `TaskGroup`**，它让“启动的任务一定会被等待或取消”成为语法层面的保证，避免了任务泄漏。

## 三、await 的本质：手写一个事件循环

现在来回答本篇最核心的问题：`await` 到底做了什么？事件循环又是如何在协程之间切换的？

### 1. 协程就是生成器

回顾第 08 篇：生成器可以在 `yield` 处暂停，保存整个帧，之后通过 `send()` 恢复执行；`yield from` 可以把控制权委托给子生成器，形成一条“通道”。Python 的协程正是建立在**完全相同的机制**之上的：

```python
>>> async def coro():
...     return 42
...
>>> c = coro()
>>> type(c).__name__, hasattr(c, "send"), hasattr(c, "throw")
('coroutine', True, True)
>>> try:
...     c.send(None)                   # 和生成器一样，用 send 驱动协程执行
... except StopIteration as e:
...     print("协程的返回值:", e.value)   # 和生成器一样，返回值放在 StopIteration 里
...
协程的返回值: 42
```

`await x` 在语义上和 `yield from x.__await__()` 非常相似：它把控制权委托给 `x`。如果 `x` 内部最终 `yield` 了一个值，这个值会沿着 `await` 链**一路传递到最外层**——也就是调用 `send()` 的那个人：**事件循环**。事件循环拿到这个值，就知道这个协程在等什么（比如“请在 0.5 秒后唤醒我”“请在这个套接字可读时唤醒我”），然后去运行其他已经就绪的协程。等条件满足了，再用 `send()` 恢复这个协程。

所以，**协程只在 `await` 链的最底层真正 `yield` 的地方暂停**，而这个“最底层”通常是一个 `Future` 对象。

### 2. 60 行代码的迷你事件循环

理解了这个原理，我们就可以写出一个能运行 `async def` 协程的事件循环了。它支持 `sleep` 和并发任务：

```python
import heapq
import time
from collections import deque


class Sleep:
    """可等待对象：await Sleep(秒数)。它 yield 自己，告诉事件循环“我要睡多久”。"""

    def __init__(self, seconds):
        self.seconds = seconds

    def __await__(self):
        yield self                            # 暂停整条 await 链，把自己交给事件循环


class Task:
    def __init__(self, coro, name):
        self.coro, self.name = coro, name
        self.done, self.result = False, None
        self.waiters = []                     # 等待这个任务结束的其他任务

    def __await__(self):                      # 让 Task 也可以被 await
        if not self.done:
            yield self
        return self.result


class EventLoop:
    def __init__(self):
        self.ready = deque()                  # 可以立即运行的任务
        self.sleeping = []                    # (唤醒时间, 序号, 任务) 组成的最小堆
        self.counter = 0

    def create_task(self, coro, name):
        task = Task(coro, name)
        self.ready.append(task)
        return task

    def run_until_complete(self, coro):
        main = self.create_task(coro, "main")
        while self.ready or self.sleeping:
            if not self.ready:                # 没有就绪任务：睡到最早的那个闹钟响起
                wake_at, _, task = heapq.heappop(self.sleeping)
                time.sleep(max(0, wake_at - time.monotonic()))
                self.ready.append(task)
            task = self.ready.popleft()
            try:
                request = task.coro.send(None)            # 运行任务，直到它在某处 yield
            except StopIteration as e:                    # 任务结束
                task.done, task.result = True, e.value
                self.ready.extend(task.waiters)           # 唤醒等待它的任务
                continue
            if isinstance(request, Sleep):                # 任务想睡一会儿
                self.counter += 1
                heapq.heappush(self.sleeping,
                               (time.monotonic() + request.seconds, self.counter, task))
            elif isinstance(request, Task):               # 任务想等待另一个任务
                request.waiters.append(task)
        return main.result


loop = EventLoop()


async def download(name, seconds):
    print(f"[{time.monotonic() - t0:.1f}s] 开始下载 {name}")
    await Sleep(seconds)
    print(f"[{time.monotonic() - t0:.1f}s] 下载完成 {name}")
    return f"{name} 的数据"


async def main():
    tasks = [loop.create_task(download(n, s), n) for n, s in (("A", 0.3), ("B", 0.1), ("C", 0.2))]
    results = []
    for t in tasks:
        results.append(await t)
    return results


t0 = time.monotonic()
print(loop.run_until_complete(main()))
```

```text
[0.0s] 开始下载 A
[0.0s] 开始下载 B
[0.0s] 开始下载 C
[0.1s] 下载完成 B
[0.2s] 下载完成 C
[0.3s] 下载完成 A
['A 的数据', 'B 的数据', 'C 的数据']
```

我们的事件循环没有使用 asyncio 的任何代码，却成功地**并发**运行了三个 `async def` 协程：三个下载同时开始，总共只用了 0.3 秒，并且按各自的耗时先后完成。

梳理一下整个流程：

1. 事件循环从就绪队列中取出一个任务，调用 `coro.send(None)` 让它运行。
2. 协程一路执行，直到遇到 `await Sleep(0.3)`。`Sleep.__await__` 中的 `yield self` 让**整个协程**暂停，`send()` 返回了这个 `Sleep` 对象。
3. 事件循环看到 `Sleep` 请求，把任务放进按唤醒时间排序的堆里，然后去运行下一个就绪任务。
4. 没有就绪任务时，事件循环睡到最早的唤醒时间，把对应的任务放回就绪队列，再次 `send(None)`，协程从 `yield` 的地方继续执行。
5. 协程执行完毕时抛出 `StopIteration`，返回值在 `e.value` 中，事件循环唤醒所有在 `await` 这个任务的协程。

真正的 asyncio 事件循环在结构上与此完全相同，区别在于：它“等待”的不只是时间，还有 I/O 事件——它使用操作系统的 `select`/`epoll`/`kqueue` 等机制，在**一次系统调用**中同时监听成千上万个套接字，哪个套接字可读或可写了，就唤醒等待它的协程。这正是 asyncio 能用一个线程处理海量连接的原因。

## 四、取消与超时

### 1. 超时

任何网络操作都应该有超时。3.11 新增的 `asyncio.timeout()` 是一个异步上下文管理器：

```python
>>> async def slow_query():
...     await asyncio.sleep(10)
...     return "结果"
...
>>> async def main():
...     try:
...         async with asyncio.timeout(0.05):
...             return await slow_query()
...     except TimeoutError:
...         return "查询超时，使用缓存数据"
...
>>> asyncio.run(main())
'查询超时，使用缓存数据'
```

### 2. 取消是如何实现的

调用 `task.cancel()` 时，事件循环会在该任务下一次被恢复时，**在它暂停的 `await` 处抛出 `CancelledError`**——就像第 08 篇中生成器的 `throw()` 一样。超时也是通过取消实现的。因此，协程可以用 `try/finally` 在被取消时清理资源：

```python
>>> async def worker():
...     try:
...         await asyncio.sleep(10)
...     except asyncio.CancelledError:
...         print("收到取消请求，正在清理……")
...         raise                             # 必须重新抛出！
...     finally:
...         print("资源已释放")
...
>>> async def main():
...     task = asyncio.create_task(worker())
...     await asyncio.sleep(0.01)
...     task.cancel()
...     try:
...         await task
...     except asyncio.CancelledError:
...         print("任务已被取消:", task.cancelled())
...
>>> asyncio.run(main())
收到取消请求，正在清理……
资源已释放
任务已被取消: True
```

**不要吞掉 `CancelledError`**。它继承自 `BaseException`（而不是 `Exception`），正是为了防止被 `except Exception` 意外捕获。如果你捕获了它却不重新抛出，`TaskGroup`、`timeout` 等依赖取消机制的功能就会失效。

## 五、同步原语与限流

虽然协程运行在单线程中，但由于在 `await` 处会发生切换，“读—改—写”跨越 `await` 时同样存在竞态条件。asyncio 提供了与 `threading` 对应的 `Lock`、`Event`、`Condition`、`Semaphore` 和 `Queue`（注意它们不是线程安全的，只能在同一个事件循环中使用）。

其中最常用的是 `Semaphore`，用来**限制并发数**。比如爬虫同时发起一万个请求，很可能被对方服务器封禁，或者耗尽本机的文件描述符：

```python
import asyncio

active = 0
peak = 0


async def fetch(i, limiter):
    global active, peak
    async with limiter:                  # 最多 3 个协程能同时进入
        active += 1
        peak = max(peak, active)
        await asyncio.sleep(0.01)        # 模拟请求
        active -= 1
        return i


async def main():
    limiter = asyncio.Semaphore(3)
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(i, limiter)) for i in range(20)]
    print(f"完成 {len(tasks)} 个请求，最大并发数 {peak}")


asyncio.run(main())
```

```text
完成 20 个请求，最大并发数 3
```

## 六、最危险的错误：在协程中阻塞

协作式多任务有一个致命的弱点：**一个协程如果不 `await`，其他所有协程都会被卡住**。在协程中调用了阻塞的函数（`time.sleep()`、`requests.get()`、同步的数据库驱动、大量的 CPU 计算），整个事件循环都会停止响应：

```python
import asyncio
import time


async def heartbeat():
    for _ in range(3):
        print(f"[{time.monotonic() - t0:.1f}s] 心跳")
        await asyncio.sleep(0.1)


async def bad_task():
    time.sleep(0.3)                          # 阻塞调用！整个事件循环被冻结 0.3 秒


async def good_task():
    await asyncio.to_thread(time.sleep, 0.3) # 把阻塞调用放到线程池中执行


async def main(task):
    async with asyncio.TaskGroup() as tg:
        tg.create_task(heartbeat())
        tg.create_task(task())


for task in (bad_task, good_task):
    print(task.__name__)
    t0 = time.monotonic()
    asyncio.run(main(task))
```

```text
bad_task
[0.0s] 心跳
[0.3s] 心跳
[0.4s] 心跳
good_task
[0.0s] 心跳
[0.1s] 心跳
[0.2s] 心跳
```

`bad_task` 中的 `time.sleep` 冻结了事件循环，心跳被推迟了 0.3 秒。如果这是一个 Web 服务，那么这 0.3 秒内所有用户的请求都会卡住。

处理方法：

- 使用异步版本的库：`httpx` 或 `aiohttp` 代替 `requests`，`asyncpg` 代替 `psycopg2` 的同步接口，`asyncio.sleep` 代替 `time.sleep`；
- 无法避免的阻塞调用，用 `asyncio.to_thread()`（3.9+）放到线程中执行；
- CPU 密集型计算，用 `loop.run_in_executor()` 配合 `ProcessPoolExecutor` 放到进程中执行；
- 开发时开启 asyncio 的调试模式（`asyncio.run(main(), debug=True)` 或 `PYTHONASYNCIODEBUG=1`），它会报告执行时间超过 100 毫秒的回调。

## 七、异步迭代与异步上下文管理器

当迭代的每一步、或者资源的获取与释放本身就需要等待 I/O 时（比如逐页从 API 拉取数据、获取数据库连接），就需要它们的异步版本：

- `async for` 使用 `__aiter__` / `__anext__`，其中 `__anext__` 是协程；
- `async with` 使用 `__aenter__` / `__aexit__`。

最简单的方式是写**异步生成器**和用 `contextlib.asynccontextmanager`：

```python
>>> import contextlib
>>> async def paginate(total_pages):
...     for page in range(1, total_pages + 1):
...         await asyncio.sleep(0)               # 模拟请求下一页
...         yield [f"p{page}-item{i}" for i in range(2)]
...
>>> @contextlib.asynccontextmanager
... async def connection(name):
...     print(f"连接 {name}")
...     try:
...         yield name
...     finally:
...         await asyncio.sleep(0)
...         print(f"断开 {name}")
...
>>> async def main():
...     async with connection("db") as conn:
...         items = [item async for page in paginate(3) for item in page]   # 异步推导式
...         return conn, items
...
>>> asyncio.run(main())
连接 db
断开 db
('db', ['p1-item0', 'p1-item1', 'p2-item0', 'p2-item1', 'p3-item0', 'p3-item1'])
```

## 八、asyncio 与线程的对比，以及调试工具

| | 线程 | asyncio |
|---|---|---|
| 切换方式 | 抢占式：操作系统随时切换 | 协作式：只在 `await` 处切换 |
| 并发规模 | 数十到数百 | 数万到数十万 |
| 竞态条件 | 任何地方都可能发生 | 只在 `await` 处可能发生，更易推理 |
| 生态要求 | 可以使用任何同步库 | 需要异步版本的库，阻塞调用会冻结一切 |
| 代码“传染性” | 无 | `async` 会向上传染：调用协程的函数也必须是协程 |

最后一点常被称为“函数颜色问题”：一旦底层是异步的，整个调用链都得是异步的。所以 asyncio 最适合**从一开始就以异步方式设计**的网络服务（如基于 FastAPI 的 Web 应用、爬虫、聊天服务器、网关），而不是为了“加速”而改造一个已有的同步程序。

3.14 为 asyncio 增加了强大的**运行时自省**能力：`python -m asyncio ps <PID>` 和 `python -m asyncio pstree <PID>` 可以查看一个**正在运行的**进程中所有任务的状态和 `await` 调用链，`asyncio.capture_call_graph()` 和 `asyncio.print_call_graph()` 则可以在程序内部打印当前任务的调用图。排查“某个任务卡在哪里”终于有了称手的工具。

## 小结

- `async def` 定义协程函数，调用它只得到协程对象；`await` 暂停当前协程等待结果；`asyncio.run` 是程序入口。
- 顺序 `await` 不会并发，需要 `create_task`、`gather`，或者更推荐的 `TaskGroup`（结构化并发、失败时自动取消其他任务）。
- 协程建立在生成器的机制之上：`await` 委托给可等待对象，最底层的 `yield` 把请求一路交给事件循环，事件循环用 `send()` 恢复协程。
- 取消通过在 `await` 处抛出 `CancelledError` 实现，清理后必须重新抛出；用 `asyncio.timeout` 设置超时。
- 用 `Semaphore` 限制并发数；不要在协程中执行阻塞操作，必要时用 `asyncio.to_thread`。

## 练习

1. 扩展本文的迷你事件循环：实现 `gather(*coros)`，以及一个 `Event` 类（`await event.wait()` 和 `event.set()`）。
2. 用 asyncio 实现一个简单的 TCP 回显服务器（`asyncio.start_server`），然后写一个客户端同时发起 1000 个连接，统计全部完成所需的时间。
3. 写一个异步爬虫：从一个起始 URL 开始，抓取页面中的链接并继续抓取（限定在同一域名、最多 100 个页面），使用 `Semaphore` 限制并发数为 10，用 `asyncio.Queue` 作为待抓取队列。
4. 写一个函数 `run_with_retry(coro_func, retries, timeout)`：对每次尝试设置超时，失败后按指数退避重试。注意正确处理 `CancelledError`。
5. 解释为什么下面的代码不会并发执行，并修复它：
   <!-- norun -->
   ```python
   async def main():
       for url in urls:
           task = asyncio.create_task(fetch(url))
           await task
   ```

下一篇我们将深入 CPython 的内存世界：{% post_link Python-19-Memory-and-GC '内存管理与垃圾回收' %}。
