---
title: Python 从入门到精通（07）：闭包与装饰器
date: 2026-10-07 11:25:00
summary: 闭包的本质是函数对象携带了 cell 对象；从字节码看自由变量如何被捕获，循环中“延迟绑定”陷阱的根源与解法。装饰器只是 f = d(f) 的语法糖：保留元数据的 wraps、带参数装饰器、可选参数装饰器、类装饰器，最后手写 lru_cache 与重试装饰器。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

装饰器是 Python 中最“魔法”的语法之一：Flask 的 `@app.route`、pytest 的 `@pytest.fixture`、标准库的 `@functools.cache`、`@property`、`@dataclass`……几乎每个框架都在大量使用它。但装饰器本身一点也不神秘，它建立在上一篇讲过的两个事实之上：**函数是一等对象**，以及**函数可以捕获外层作用域的变量**——也就是闭包。本篇先把闭包讲透，再看装饰器就水到渠成了。

> 本文是「Python 从入门到精通」系列第 07 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、闭包

### 1. 什么是闭包

```python
>>> def make_multiplier(factor):
...     def multiply(x):
...         return x * factor          # factor 不是 multiply 的局部变量
...     return multiply
...
>>> double = make_multiplier(2)
>>> triple = make_multiplier(3)
>>> double(10), triple(10)
(20, 30)
```

`make_multiplier(2)` 执行完毕后，它的局部变量 `factor` 按理说应该随着函数调用结束而消失了。但 `double(10)` 依然能访问到 `factor = 2`。这是因为内层函数 `multiply` **捕获**了外层的变量 `factor`，即使外层函数已经返回，被捕获的变量依然存活。

像 `factor` 这样在函数内被使用、但既不是局部变量也不是全局变量的名字，称为**自由变量**（free variable）。**闭包**（closure）就是“函数 + 它所引用的自由变量的绑定”。

### 2. 闭包在内存中长什么样

我们可以直接检查函数对象，看到闭包的“实体”：

```python
>>> double.__code__.co_freevars          # 编译时就知道 multiply 有一个自由变量
('factor',)
>>> make_multiplier.__code__.co_cellvars  # 外层函数知道 factor 会被内层捕获
('factor',)
>>> double.__closure__
(<cell at 0x...: int object at 0x...>,)
>>> double.__closure__[0].cell_contents
2
>>> triple.__closure__[0].cell_contents
3
```

这里出现了一个新角色：**cell 对象**。它是一个小小的“盒子”，里面装着一个对象引用。闭包的工作机制是这样的：

1. **编译时**：编译器分析发现 `factor` 在内层函数中被引用，于是把它标记为外层函数的 **cell 变量**（`co_cellvars`）和内层函数的**自由变量**（`co_freevars`）。
2. **外层函数运行时**：`factor` 不再存放在普通的局部变量槽里，而是被放进一个 cell 对象中。
3. **执行 `def multiply` 时**：创建函数对象，并把那个 cell 对象放进新函数的 `__closure__` 元组。
4. **内层函数运行时**：通过 `LOAD_DEREF` 指令，顺着 cell 读取里面的值。

```text
make_multiplier(2) 的帧                 函数对象 double
┌────────────────────┐            ┌──────────────────────┐
│ factor ──► [cell] ─┼──┐         │ __code__  ──► multiply 的代码 │
└────────────────────┘  │         │ __closure__ = (cell,) │
                        └────────►│        │              │
                                  └────────┼──────────────┘
                                           ▼
                                        [cell] ──► 2
```

外层函数返回后，它的帧被销毁，但 cell 对象因为还被 `double.__closure__` 引用着，所以继续存活。每次调用 `make_multiplier` 都会创建一个**新的** cell，所以 `double` 和 `triple` 各自持有不同的 cell，互不干扰。

用 `dis` 可以看到这些专门的指令：

```python
>>> import dis
>>> sorted({i.opname for i in dis.get_instructions(make_multiplier)} & {"MAKE_CELL", "LOAD_FAST", "MAKE_FUNCTION", "SET_FUNCTION_ATTRIBUTE"})
['MAKE_CELL', 'MAKE_FUNCTION', 'SET_FUNCTION_ATTRIBUTE']
>>> [i.opname for i in dis.get_instructions(double) if "DEREF" in i.opname]
['LOAD_DEREF']
```

### 3. 闭包捕获的是变量，不是值

这是理解闭包最关键的一点：cell 里装的是**对变量的引用**，内层函数每次执行时才去读取 cell 的**当前**内容。如果外层在创建闭包之后修改了变量，闭包看到的也是新值：

```python
>>> def outer():
...     x = 1
...     def inner():
...         return x
...     x = 2                 # 在创建 inner 之后修改
...     return inner
...
>>> outer()()
2
```

### 4. 延迟绑定陷阱

这条规则直接导致了 Python 中另一个著名的陷阱：

```python
>>> funcs = [lambda: i for i in range(3)]
>>> [f() for f in funcs]          # 期望 [0, 1, 2]
[2, 2, 2]
```

三个 lambda 捕获的是**同一个变量 `i`**（推导式作用域中只有一个 `i`），而不是创建 lambda 那一刻 `i` 的值。等到调用它们的时候，循环早已结束，`i` 的值停留在 2。这被称为**延迟绑定**（late binding）。

有三种常见的修复方法：

```python
>>> funcs = [lambda i=i: i for i in range(3)]       # 方法一：利用默认参数在定义时求值
>>> [f() for f in funcs]
[0, 1, 2]
>>> from functools import partial
>>> funcs = [partial(lambda i: i, i) for i in range(3)]   # 方法二：partial 在创建时绑定值
>>> [f() for f in funcs]
[0, 1, 2]
>>> def make(i):                                     # 方法三：用工厂函数为每个值创建独立的作用域
...     return lambda: i
...
>>> funcs = [make(i) for i in range(3)]
>>> [f() for f in funcs]
[0, 1, 2]
```

方法一利用了上一篇讲到的“默认值在定义时求值”的特性，是最简洁的写法（缺点是函数签名里多了一个可以被调用者覆盖的参数）。方法三最清晰：每次调用 `make(i)` 都会创建一个新的作用域和一个新的 cell。

这个陷阱在 GUI 编程中尤其常见：在循环中为一组按钮绑定点击回调，结果所有按钮都触发了最后一个按钮的行为。

### 5. 闭包与对象：一体两面

有一句流传很广的话：“闭包是穷人的对象，对象是穷人的闭包。”闭包把**行为**（函数）和**状态**（被捕获的变量）绑在了一起，这正是对象做的事情。下面两种实现是等价的：

```python
>>> def make_averager():
...     total, count = 0, 0
...     def averager(value):
...         nonlocal total, count
...         total += value
...         count += 1
...         return total / count
...     return averager
...
>>> class Averager:
...     def __init__(self):
...         self.total, self.count = 0, 0
...     def __call__(self, value):            # 实现 __call__ 的对象可以像函数一样被调用
...         self.total += value
...         self.count += 1
...         return self.total / self.count
...
>>> avg1, avg2 = make_averager(), Averager()
>>> [avg1(v) for v in (10, 20, 30)], [avg2(v) for v in (10, 20, 30)]
([10.0, 15.0, 20.0], [10.0, 15.0, 20.0])
```

当状态简单、只有一个操作时，闭包更轻量；当状态复杂、需要多个操作或者需要被外部检查时，类更合适。

## 二、装饰器

### 1. 装饰器只是语法糖

**装饰器就是一个接受函数、返回函数（或其他对象）的可调用对象。** 下面两种写法完全等价：

<!-- norun -->
```python
@decorator
def func():
    ...

# 等价于
def func():
    ...
func = decorator(func)
```

就这么简单。`@` 语法只是让“用一个函数包装另一个函数”这件事写起来更优雅，并且让装饰紧挨着函数定义，一眼就能看到。

一个最简单的装饰器，记录函数的调用：

```python
>>> def trace(func):
...     def wrapper(*args, **kwargs):
...         print(f"→ 调用 {func.__name__}{args}")
...         result = func(*args, **kwargs)
...         print(f"← {func.__name__} 返回 {result!r}")
...         return result
...     return wrapper
...
>>> @trace
... def add(a, b):
...     return a + b
...
>>> add(2, 3)
→ 调用 add(2, 3)
← add 返回 5
5
```

`wrapper` 是一个闭包，它捕获了 `func`。`@trace` 执行后，名字 `add` 不再指向原来的函数，而是指向 `wrapper`；调用 `add(2, 3)` 实际上是调用 `wrapper(2, 3)`，而 `wrapper` 再去调用原来的函数。

### 2. 装饰器在导入时执行

装饰器在**函数定义时**（通常是模块被导入时）就会执行，而不是在函数被调用时。很多框架利用这一点实现“注册”功能：

```python
>>> ROUTES = {}
>>> def route(path):
...     def register(func):
...         ROUTES[path] = func           # 定义时就完成了注册
...         return func                   # 原样返回，不做包装
...     return register
...
>>> @route("/")
... def index():
...     return "首页"
...
>>> @route("/about")
... def about():
...     return "关于"
...
>>> ROUTES["/about"]()                    # 还没调用过任何视图函数，路由表已经建好了
'关于'
```

这正是 Flask 中 `@app.route` 的基本原理。

### 3. 保留函数的元数据：functools.wraps

前面的 `trace` 装饰器有一个问题：

```python
>>> add.__name__, add.__doc__
('wrapper', None)
```

被装饰后，`add` 的名字变成了 `wrapper`，文档字符串也丢失了。这会让调试、日志、文档生成工具都得到错误的信息。解决办法是使用标准库的 `functools.wraps`，它本身也是一个装饰器：

```python
>>> import functools
>>> def trace(func):
...     @functools.wraps(func)            # 把 func 的元数据复制到 wrapper 上
...     def wrapper(*args, **kwargs):
...         return func(*args, **kwargs)
...     return wrapper
...
>>> @trace
... def add(a: int, b: int) -> int:
...     """两数相加。"""
...     return a + b
...
>>> add.__name__, add.__doc__, add.__annotations__
('add', '两数相加。', {'a': <class 'int'>, 'b': <class 'int'>, 'return': <class 'int'>})
>>> add.__wrapped__                   # 还能拿到原始函数
<function add at 0x...>
>>> import inspect
>>> inspect.signature(add)            # inspect 会顺着 __wrapped__ 找到真实签名
<Signature (a: int, b: int) -> int>
```

`wraps` 复制了 `__module__`、`__name__`、`__qualname__`、`__doc__`、`__annotations__` 等属性，更新了 `__dict__`，还添加了一个 `__wrapped__` 属性指向原函数。**编写装饰器时，永远记得加上 `@functools.wraps`。**

### 4. 带参数的装饰器

如果装饰器需要参数，比如 `@repeat(3)`，就需要多一层函数。分析一下：`@repeat(3)` 意味着先执行 `repeat(3)`，**它的返回值**才是真正的装饰器。所以 `repeat` 是一个“返回装饰器的函数”，也称为**装饰器工厂**：

```python
>>> def repeat(times):                    # 第一层：接收装饰器参数
...     def decorator(func):              # 第二层：接收被装饰的函数
...         @functools.wraps(func)
...         def wrapper(*args, **kwargs): # 第三层：接收调用参数
...             return [func(*args, **kwargs) for _ in range(times)]
...         return wrapper
...     return decorator
...
>>> @repeat(3)
... def roll():
...     return "🎲"
...
>>> roll()
['🎲', '🎲', '🎲']
```

三层嵌套看起来有点绕，但只要记住 `@expr` 等价于 `func = expr(func)`，然后代入 `expr = repeat(3)`，就能推导出每一层的职责。

### 5. 参数可选的装饰器

有时我们希望装饰器既能写成 `@log`，也能写成 `@log(level="DEBUG")`。这需要判断第一个参数是不是被装饰的函数：

```python
>>> def log(func=None, *, level="INFO"):
...     if func is None:                          # 被写成了 @log(...)，返回真正的装饰器
...         return functools.partial(log, level=level)
...     @functools.wraps(func)
...     def wrapper(*args, **kwargs):
...         print(f"[{level}] {func.__name__}")
...         return func(*args, **kwargs)
...     return wrapper
...
>>> @log
... def a(): pass
...
>>> @log(level="DEBUG")
... def b(): pass
...
>>> a(); b()
[INFO] a
[DEBUG] b
```

关键在于把装饰器的配置参数设为**仅限关键字参数**（`*` 之后），这样 `func` 永远只可能通过位置传入，判断逻辑就不会有歧义。

### 6. 多个装饰器的顺序

```python
>>> def bold(func):
...     @functools.wraps(func)
...     def wrapper():
...         return f"<b>{func()}</b>"
...     return wrapper
...
>>> def italic(func):
...     @functools.wraps(func)
...     def wrapper():
...         return f"<i>{func()}</i>"
...     return wrapper
...
>>> @bold
... @italic
... def hello():
...     return "hello"
...
>>> hello()
'<b><i>hello</i></b>'
```

多个装饰器**从下往上**应用（离函数最近的先应用），等价于 `hello = bold(italic(hello))`；而调用时，最外层（最上面）的包装最先执行。可以把它想象成洋葱：最上面的装饰器是最外层的皮。

### 7. 类作为装饰器，以及装饰类

装饰器不一定是函数，任何可调用对象都可以。用类实现装饰器，可以方便地维护状态：

```python
>>> class CountCalls:
...     def __init__(self, func):
...         functools.update_wrapper(self, func)   # 类版本的 wraps
...         self.func = func
...         self.calls = 0
...     def __call__(self, *args, **kwargs):
...         self.calls += 1
...         return self.func(*args, **kwargs)
...
>>> @CountCalls
... def ping():
...     return "pong"
...
>>> ping(); ping()
'pong'
'pong'
>>> ping.calls
2
```

不过类装饰器有一个坑：如果用它装饰**类中的方法**，调用时 `self` 不会被自动传入，因为 `CountCalls` 的实例不是函数，不会触发方法绑定。要解决这个问题需要实现描述符协议的 `__get__` 方法，我们会在 {% post_link Python-14-Descriptors '第 14 篇' %} 揭开方法绑定的秘密。

装饰器也可以作用于**类**，接收一个类、返回一个类（通常是同一个类，修改后返回）。标准库的 `@dataclass` 就是一个类装饰器，它读取类的注解，自动生成 `__init__`、`__repr__`、`__eq__` 等方法：

```python
>>> def add_repr(cls):
...     def __repr__(self):
...         fields = ", ".join(f"{k}={v!r}" for k, v in vars(self).items())
...         return f"{cls.__name__}({fields})"
...     cls.__repr__ = __repr__
...     return cls
...
>>> @add_repr
... class User:
...     def __init__(self, name, age):
...         self.name, self.age = name, age
...
>>> User("Alice", 30)
User(name='Alice', age=30)
```

## 三、实用装饰器

### 1. 手写记忆化缓存

记忆化（memoization）是装饰器最经典的应用：缓存函数的结果，相同参数再次调用时直接返回缓存。我们来实现一个简化版的 `lru_cache`，支持最大容量和“最近最少使用”淘汰策略：

```python
import functools
from collections import OrderedDict


def lru_cache(maxsize=128):
    def decorator(func):
        cache = OrderedDict()
        hits = misses = 0

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            nonlocal hits, misses
            # 构造缓存键：位置参数元组 + 排序后的关键字参数（要求参数可哈希）
            key = (args, tuple(sorted(kwargs.items())))
            if key in cache:
                hits += 1
                cache.move_to_end(key)           # 标记为最近使用
                return cache[key]
            misses += 1
            result = func(*args, **kwargs)
            cache[key] = result
            if len(cache) > maxsize:
                cache.popitem(last=False)        # 淘汰最久未使用的
            return result

        wrapper.cache_info = lambda: f"hits={hits} misses={misses} size={len(cache)}"
        wrapper.cache_clear = cache.clear
        return wrapper

    return decorator


@lru_cache(maxsize=100)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


print(fib(80))
print(fib.cache_info())
```

```text
23416728348467685
hits=78 misses=81 size=81
```

没有缓存时，`fib(80)` 需要指数级的调用次数（约 10¹⁶ 次，永远算不完）；有了缓存，只需要计算 81 个不同的子问题。注意 `fib` 内部的递归调用 `fib(n - 1)` 调用的也是**被装饰后的版本**，因为名字 `fib` 已经被重新绑定到了 `wrapper` 上。这就是缓存能对递归生效的原因。

标准库的 `functools.lru_cache` 是用 C 实现的，功能更完善、速度更快；如果不需要容量限制，3.9 起可以直接用 `functools.cache`：

```python
>>> @functools.cache
... def fib(n):
...     return n if n < 2 else fib(n - 1) + fib(n - 2)
...
>>> fib(300)
222232244629420445529739893461909967206666939096499764990979600
>>> fib.cache_info()
CacheInfo(hits=298, misses=301, maxsize=None, currsize=301)
```

使用缓存装饰器有几个注意事项：

- 所有参数都必须**可哈希**（不能传列表、字典）；
- 被缓存的函数应当是**纯函数**：结果只取决于参数，没有副作用；
- 缓存会**持有参数和返回值的引用**，阻止它们被回收。在方法上使用 `@lru_cache` 时，`self` 也会成为缓存键的一部分，导致实例永远不会被释放——这是一个常见的内存泄漏来源。对于“每个实例只算一次的属性”，应使用 `functools.cached_property`。

### 2. 带指数退避的重试

网络请求、数据库连接这类操作可能偶尔失败，重试是常见的应对手段：

```python
import functools
import random
import time


def retry(times=3, exceptions=(Exception,), base_delay=0.01, backoff=2):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = base_delay
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == times:
                        raise                    # 最后一次失败：原样抛出
                    print(f"第 {attempt} 次失败（{e}），{delay:.2f}s 后重试")
                    time.sleep(delay * (1 + random.random() * 0.1))   # 加一点随机抖动
                    delay *= backoff
        return wrapper
    return decorator


attempts = iter([ConnectionError("超时"), ConnectionError("拒绝连接"), "OK"])

@retry(times=4, exceptions=(ConnectionError,))
def fetch():
    result = next(attempts)
    if isinstance(result, Exception):
        raise result
    return result


print(fetch())
```

```text
第 1 次失败（超时），0.01s 后重试
第 2 次失败（拒绝连接），0.02s 后重试
OK
```

几个设计细节值得注意：只捕获**指定的**异常类型（不要无差别重试 `KeyboardInterrupt` 或编程错误）；最后一次失败时用裸 `raise` 重新抛出原始异常，保留完整的回溯信息；等待时间指数增长并加入随机抖动，避免大量客户端在同一时刻集中重试。

### 3. 标准库中的装饰器

| 装饰器 | 作用 |
|---|---|
| `@functools.cache` / `@lru_cache` | 记忆化 |
| `@functools.cached_property` | 惰性计算、只算一次的实例属性 |
| `@functools.singledispatch` | 根据第一个参数的类型分派到不同实现 |
| `@functools.total_ordering` | 只定义 `__eq__` 和一个比较方法，自动补全其余比较 |
| `@contextlib.contextmanager` | 用生成器函数实现上下文管理器（第 11 篇） |
| `@property` / `@classmethod` / `@staticmethod` | 第 09 篇和第 14 篇 |
| `@dataclasses.dataclass` | 自动生成数据类的方法（第 10 篇） |
| `@typing.overload` / `@typing.override` | 类型检查相关（第 16 篇） |
| `@warnings.deprecated` | 3.13 新增，标记弃用并在调用时发出警告 |

`singledispatch` 值得单独展示一下，它实现了基于类型的函数重载：

```python
>>> from functools import singledispatch
>>> @singledispatch
... def to_json(obj):
...     raise TypeError(f"无法序列化 {type(obj).__name__}")
...
>>> @to_json.register
... def _(obj: int | float):           # 通过类型注解指定要处理的类型
...     return str(obj)
...
>>> @to_json.register
... def _(obj: list):
...     return "[" + ", ".join(to_json(x) for x in obj) + "]"
...
>>> @to_json.register
... def _(obj: str):
...     return '"' + obj.replace('"', '\\"') + '"'
...
>>> to_json([1, 2.5, "hi", [3]])
'[1, 2.5, "hi", [3]]'
```

## 小结

- 闭包 = 函数 + 被捕获的自由变量。被捕获的变量存放在 cell 对象中，挂在函数的 `__closure__` 上，外层函数返回后依然存活。
- 闭包捕获的是**变量**而不是值，这导致了循环中的延迟绑定陷阱；用默认参数、`partial` 或工厂函数解决。
- `@d` 只是 `f = d(f)` 的语法糖，装饰器在定义时执行，可以用来做注册。
- 写装饰器永远要加 `@functools.wraps`；带参数的装饰器需要三层函数；多个装饰器从下往上应用。
- 缓存装饰器要求参数可哈希、函数是纯函数，并注意它会延长对象的生命周期。

## 练习

1. 不运行代码，写出下面代码的输出，然后用 `__closure__` 验证你的分析：
   <!-- norun -->
   ```python
   def counters():
       result = []
       for i in range(3):
           def f():
               return i * i
           result.append(f)
       return result
   print([f() for f in counters()])
   ```
2. 实现一个装饰器 `@timeout(seconds)`：如果被装饰的函数运行超过指定时间，就抛出 `TimeoutError`。（提示：在 Unix 上可以用 `signal.alarm`；更通用的做法是在线程中执行函数，对比两种方案的局限性。）
3. 实现一个装饰器 `@validate`，读取函数的类型注解，在调用时检查实参的类型是否匹配（只需支持 `int`、`str` 这类简单类型），不匹配时抛出 `TypeError`。
4. 修改本文的 `lru_cache`，使 `f(1, 2)` 和 `f(a=1, b=2)`、`f(1, b=2)` 命中同一个缓存项。（提示：用 `inspect.signature(...).bind` 把实参规范化。）
5. 实现一个 `@once` 装饰器：被装饰的函数只有第一次调用会真正执行，之后的调用直接返回第一次的结果。要求线程安全。

下一篇我们将深入 Python 中另一个无处不在的机制：{% post_link Python-08-Iterators-and-Generators '迭代器、生成器与 itertools' %}。
