---
title: Python 从入门到精通（11）：异常处理与上下文管理器
date: 2026-10-07 11:05:00
summary: 异常类层次与“只捕获你能处理的”原则；try/except/else/finally 的精确执行顺序与 finally 中 return 的陷阱（3.14 起告警）；显式与隐式异常链、add_note、ExceptionGroup 与 except*；3.11 的零开销异常；with 语句的完整展开、手写上下文管理器、contextmanager 的生成器原理与 ExitStack。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

程序总会出错：文件不存在、网络超时、用户输入了非法数据……如何优雅、可靠地处理错误，是区分“能跑的代码”和“生产级代码”的关键。本篇首先梳理 Python 异常机制的完整语义，包括异常链、异常组等较新的特性；然后深入 `with` 语句和上下文管理器——它是 Python 中管理资源的标准方式，背后的原理与异常处理密不可分。

> 本文是「Python 从入门到精通」系列第 11 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、异常的层次结构

Python 中所有的异常都是类，并且组成了一棵继承树。以下是其中最重要的部分：

```text
BaseException
 ├── BaseExceptionGroup
 ├── GeneratorExit            生成器被关闭
 ├── KeyboardInterrupt        用户按下 Ctrl+C
 ├── SystemExit               sys.exit() 被调用
 └── Exception                ← 所有“常规”错误的基类
      ├── ArithmeticError
      │    ├── ZeroDivisionError
      │    └── OverflowError
      ├── LookupError
      │    ├── IndexError
      │    └── KeyError
      ├── OSError             文件、网络等系统错误
      │    ├── FileNotFoundError
      │    ├── PermissionError
      │    └── TimeoutError
      ├── ValueError
      │    └── UnicodeError
      ├── TypeError
      ├── AttributeError
      ├── NameError
      │    └── UnboundLocalError
      ├── RuntimeError
      │    └── RecursionError
      ├── StopIteration
      ├── ExceptionGroup
      └── ……
```

继承关系意味着，捕获父类就能捕获所有子类：`except LookupError` 同时捕获 `IndexError` 和 `KeyError`。

为什么 `KeyboardInterrupt` 和 `SystemExit` 不继承自 `Exception`？因为它们不是“错误”，而是用户或程序**希望退出**的信号。如果它们也是 `Exception` 的子类，那么到处都有的 `except Exception:` 就会吞掉它们，导致程序无法用 Ctrl+C 中断。这也是为什么**永远不要使用裸 `except:`**——它等价于 `except BaseException:`，会捕获包括退出信号在内的一切。

## 二、try 语句的完整语义

### 1. 四个子句

```python
>>> def parse_age(text):
...     try:
...         age = int(text)                     # 可能出错的代码，范围要尽可能小
...     except ValueError:
...         print(f"无法解析: {text!r}")
...         return None
...     else:
...         print("解析成功")                    # 没有异常时执行
...         return age
...     finally:
...         print("清理工作")                    # 无论如何都会执行
...
>>> parse_age("42")
解析成功
清理工作
42
>>> parse_age("abc")
无法解析: 'abc'
清理工作
```

- `except` 子句按顺序匹配，第一个类型匹配的被执行，所以**子类必须写在父类前面**；
- `else` 子句在 `try` 块**没有发生异常**时执行。为什么不把这些代码直接放进 `try` 块的末尾？因为那样的话，`else` 中代码抛出的异常也会被下面的 `except` 捕获，而那可能并不是你想处理的错误。**`try` 块应该只包含你预期会出错的那几行代码**；
- `finally` 子句**无论如何**都会执行：正常结束、发生异常、`return`、`break`、`continue` 都不例外。它用于释放资源。

可以同时捕获多个异常类型。3.14 起（PEP 758），在不使用 `as` 时，括号可以省略：

<!-- norun -->
```python
except (ValueError, TypeError):        # 所有版本
except ValueError, TypeError:          # 3.14+
```

### 2. finally 中的 return：一个危险的陷阱

既然 `finally` 总会执行，那么如果 `finally` 里有 `return` 会怎样？

<!-- nocheck -->
```python
def dangerous():
    try:
        raise ValueError("重要的错误")
    finally:
        return "一切正常"       # 异常被静默吞掉了！


print(dangerous())
```

```text
一切正常
```

`finally` 中的 `return`（以及 `break`、`continue`）会**丢弃正在传播的异常**，而且没有任何提示。这几乎从来都不是你想要的。从 3.14 开始（PEP 765），编译器会对这种写法发出 `SyntaxWarning: 'return' in a 'finally' block`。

### 3. 异常变量在 except 块结束后会被删除

```python
>>> try:
...     1 / 0
... except ZeroDivisionError as e:
...     pass
...
>>> e
Traceback (most recent call last):
  ...
NameError: name 'e' is not defined
```

`except ... as e` 中的 `e` 在 `except` 块结束时会被自动 `del` 掉。原因是：异常对象通过 `__traceback__` 引用着回溯信息，回溯又引用着各层的栈帧，栈帧又引用着局部变量——其中就包括 `e` 自己。如果不删除，就会形成一个**引用循环**，让栈帧中的所有对象都无法被及时回收。如果需要在 `except` 块外使用异常，把它赋值给另一个变量即可。

## 三、抛出异常与异常链

### 1. raise 的三种形式

```python
>>> def withdraw(balance, amount):
...     if amount > balance:
...         raise ValueError(f"余额不足：余额 {balance}，需要 {amount}")
...     return balance - amount
...
>>> withdraw(100, 500)
Traceback (most recent call last):
  ...
ValueError: 余额不足：余额 100，需要 500
```

- `raise SomeError("消息")`：抛出一个新的异常实例（`raise SomeError` 也可以，Python 会自动实例化）；
- `raise`：在 `except` 块中单独使用，**原样重新抛出**当前正在处理的异常，保留完整的回溯；
- `raise NewError(...) from original`：抛出新异常，并显式地关联原始异常。

### 2. 隐式异常链与显式异常链

在处理一个异常的过程中又发生了另一个异常时，Python 会自动把两者关联起来：

```python
>>> try:
...     try:
...         {}["config"]
...     except KeyError:
...         undefined_function()                   # 处理过程中又出错了
... except NameError as e:
...     print(repr(e.__context__))
...
KeyError('config')
```

新异常的 `__context__` 属性自动指向原来的异常，这被称为**隐式异常链**。打印回溯时，Python 会显示两个异常，中间写着：

```text
During handling of the above exception, another exception occurred:
```

而当你**有意地**把一个低层异常转换为高层异常时（比如把 `KeyError` 转换为业务层的 `ConfigError`），应该使用 `raise ... from ...`，这会设置 `__cause__` 属性，称为**显式异常链**：

```python
>>> class ConfigError(Exception):
...     pass
...
>>> def get_setting(settings, key):
...     try:
...         return settings[key]
...     except KeyError as e:
...         raise ConfigError(f"缺少配置项 {key!r}") from e
...
>>> try:
...     get_setting({}, "db_url")
... except ConfigError as e:
...     print(repr(e), "<-", repr(e.__cause__))
...
ConfigError("缺少配置项 'db_url'") <- KeyError('db_url')
```

回溯中间的提示也会变成：

```text
The above exception was the direct cause of the following exception:
```

两种提示语的区别很有用：前者暗示“处理异常的代码本身有 bug”，后者表示“这是有意的异常转换”。如果你确实希望隐藏原始异常（比如它包含敏感信息，或者对调用者毫无意义），可以使用 `raise ... from None`。

### 3. 给异常添加注释

3.11 新增了 `add_note()` 方法，可以在异常传播的过程中附加上下文信息，而不需要创建新的异常类型：

```python
>>> def process(records):
...     for i, rec in enumerate(records):
...         try:
...             int(rec)
...         except ValueError as e:
...             e.add_note(f"出错的记录是第 {i} 条：{rec!r}")
...             raise
...
>>> try:
...     process(["1", "2", "x3"])
... except ValueError as e:
...     print(e.__notes__)
...
["出错的记录是第 2 条：'x3'"]
```

这些注释会显示在回溯的末尾。pytest、Hypothesis 等工具已经在大量使用这个特性。

## 四、自定义异常

一个库或应用通常应该定义自己的异常层次，至少包括一个“根”异常，让调用者可以一次性捕获该库的所有错误：

```python
>>> class PaymentError(Exception):
...     """支付模块所有异常的基类。"""
...
>>> class InsufficientFunds(PaymentError):
...     def __init__(self, balance, amount):
...         super().__init__(f"余额 {balance} 不足以支付 {amount}")
...         self.balance, self.amount = balance, amount    # 附带结构化信息，便于程序处理
...     @property
...     def shortfall(self):
...         return self.amount - self.balance
...
>>> class CardDeclined(PaymentError):
...     pass
...
>>> try:
...     raise InsufficientFunds(30, 100)
... except PaymentError as e:                               # 捕获整个模块的错误
...     print(type(e).__name__, e, "差额:", e.shortfall)
...
InsufficientFunds 余额 30 不足以支付 100 差额: 70
```

设计异常时的几个建议：

- 继承 `Exception`（而不是 `BaseException`）；
- 类名以 `Error` 结尾（如果它表示错误的话）；
- 如果语义上是“参数值不对”，可以同时继承内置异常，比如 `class InvalidEmail(MyLibError, ValueError)`，这样调用者用 `except ValueError` 也能捕获它；
- 把有用的数据作为属性附带在异常上，而不是只塞进消息字符串里，让调用者需要解析字符串。

## 五、EAFP 与 LBYL

处理“可能失败的操作”有两种风格：

- **LBYL**（Look Before You Leap，三思而后行）：先检查条件，再执行操作；
- **EAFP**（Easier to Ask for Forgiveness than Permission，请求原谅比请求许可更容易）：直接执行，失败了再处理异常。

<!-- norun -->
```python
# LBYL
if key in mapping:
    value = mapping[key]
else:
    value = default

# EAFP
try:
    value = mapping[key]
except KeyError:
    value = default
```

Python 社区更推崇 EAFP，原因有二。第一，它能避免**竞态条件**：

<!-- norun -->
```python
import os

if os.path.exists(path):       # 检查时文件还在……
    with open(path) as f:      # ……打开时可能已经被另一个进程删除了
        ...
```

“检查”和“使用”之间存在时间窗口，这在并发环境下是真实存在的 bug（称为 TOCTOU：time-of-check to time-of-use）。直接 `open` 并捕获 `FileNotFoundError` 则没有这个问题。

第二，在“通常会成功”的情况下，EAFP 更快：从 3.11 开始，CPython 实现了**零开销异常**（zero-cost exceptions）——进入 `try` 块不再需要执行任何指令，异常处理信息被编译成一张静态的“异常表”，只有在真正发生异常时才去查表。所以没有异常时，`try` 块几乎没有任何开销。反过来，真正抛出和捕获一个异常的代价相对较高（需要创建异常对象、回溯对象并进行栈展开），所以如果失败是**常态**而不是例外，LBYL 可能更合适。

```python
>>> import dis
>>> def f():
...     try:
...         return g()
...     except KeyError:
...         return None
...
>>> any(i.opname.startswith("SETUP") for i in dis.get_instructions(f))   # 没有任何“进入 try 块”的指令
False
>>> import io, contextlib
>>> out = io.StringIO()
>>> with contextlib.redirect_stdout(out):
...     dis.dis(f)
...
>>> "ExceptionTable:" in out.getvalue()        # 取而代之的是一张静态的异常表
True
```

在 3.10 及以前，`try` 块的开头会有一条 `SETUP_FINALLY` 指令，在运行时把异常处理器压入一个“块栈”；而现在，字节码里根本没有这类指令，异常处理器的范围被记录在 `dis` 输出末尾的 `ExceptionTable` 中。

## 六、异常组与 except*

### 1. 为什么需要异常组

在并发程序中，多个任务可能**同时**失败。传统的异常机制一次只能传播一个异常，其余的只能丢弃或手动收集。3.11 引入的 `ExceptionGroup`（PEP 654）可以把多个异常打包成一个：

```python
>>> eg = ExceptionGroup("批量任务失败", [
...     ValueError("任务 1：参数错误"),
...     TypeError("任务 2：类型错误"),
...     ValueError("任务 3：参数错误"),
... ])
>>> len(eg.exceptions)
3
```

### 2. except*：按类型拆分处理

配套的新语法 `except*` 会从异常组中**挑出**匹配类型的子异常进行处理，没有被处理的部分会继续向上传播：

```python
>>> try:
...     raise eg
... except* ValueError as group:
...     print("处理 ValueError:", [str(e) for e in group.exceptions])
... except* TypeError as group:
...     print("处理 TypeError:", [str(e) for e in group.exceptions])
...
处理 ValueError: ['任务 1：参数错误', '任务 3：参数错误']
处理 TypeError: ['任务 2：类型错误']
```

与普通的 `except` 不同，多个 `except*` 子句**可以都被执行**——每个子句处理异常组中属于自己的那一部分。asyncio 的 `TaskGroup`（{% post_link Python-18-Asyncio '第 18 篇' %}）就是用异常组来报告多个并发任务的失败的。

## 七、上下文管理器与 with 语句

### 1. 资源管理的问题

打开的文件、网络连接、数据库事务、锁……这些资源在使用完之后都必须被释放，**即使中途发生了异常**。用 `try/finally` 可以做到：

<!-- norun -->
```python
f = open("data.txt", encoding="utf-8")
try:
    data = f.read()
finally:
    f.close()
```

但每次都这么写既啰嗦又容易遗漏。`with` 语句把这个模式封装了起来：

<!-- norun -->
```python
with open("data.txt", encoding="utf-8") as f:
    data = f.read()
# 离开 with 块时，文件一定已经被关闭
```

### 2. with 语句的精确语义

`with EXPR as VAR: BLOCK` 在语义上大致等价于：

<!-- norun -->
```python
manager = EXPR
enter = type(manager).__enter__
exit = type(manager).__exit__
value = enter(manager)
try:
    VAR = value                  # 注意：VAR 绑定的是 __enter__ 的返回值，而不是 manager 本身
    BLOCK
except BaseException as e:
    if not exit(manager, type(e), e, e.__traceback__):
        raise                    # __exit__ 返回假值：继续传播异常
else:
    exit(manager, None, None, None)
```

由此可以得出几个要点：

1. **上下文管理器**是实现了 `__enter__` 和 `__exit__` 两个特殊方法的对象。
2. `as` 后面的变量绑定的是 `__enter__()` 的**返回值**。对于文件对象，`__enter__` 返回 `self`；但对于其他对象可能不同，比如数据库连接的 `__enter__` 可能返回一个游标或事务对象。
3. 无论 `BLOCK` 是正常结束还是抛出异常，`__exit__` 都会被调用。发生异常时，异常的类型、值和回溯会作为参数传给它。
4. 如果 `__exit__` 返回**真值**，异常就会被**吞掉**，不再传播。

### 3. 手写一个上下文管理器

```python
>>> import time
>>> class Timer:
...     def __init__(self, label):
...         self.label = label
...     def __enter__(self):
...         self.start = time.perf_counter()
...         return self                          # 让 as 变量拿到计时器自身
...     def __exit__(self, exc_type, exc, tb):
...         self.elapsed = time.perf_counter() - self.start
...         status = "失败" if exc_type else "完成"
...         print(f"[{self.label}] {status}")
...         return False                         # 不吞掉异常
...
>>> with Timer("求和") as t:
...     total = sum(range(1_000_000))
...
[求和] 完成
>>> t.elapsed > 0
True
>>> with Timer("除法"):
...     1 / 0
...
Traceback (most recent call last):
  ...
ZeroDivisionError: division by zero
```

第二个例子中，虽然发生了异常，`__exit__` 依然被调用了（虽然 doctest 只展示了回溯）。

### 4. 用生成器写上下文管理器：contextlib.contextmanager

对于简单的场景，写一个类有点重。`contextlib.contextmanager` 装饰器可以把一个**生成器函数**变成上下文管理器：`yield` 之前的代码相当于 `__enter__`，`yield` 出的值绑定给 `as` 变量，`yield` 之后的代码相当于 `__exit__`：

```python
>>> from contextlib import contextmanager
>>> import os, tempfile
>>> @contextmanager
... def working_directory(path):
...     old = os.getcwd()
...     os.chdir(path)
...     try:
...         yield path                 # with 块在这里执行
...     finally:
...         os.chdir(old)              # 无论 with 块是否出错，都恢复原目录
...
>>> tmp = tempfile.mkdtemp()
>>> before = os.getcwd()
>>> with working_directory(tmp) as p:
...     os.path.samefile(os.getcwd(), tmp)
...
True
>>> os.getcwd() == before
True
```

它是怎么工作的？`contextmanager` 返回的对象在 `__enter__` 中调用 `next(gen)`，让生成器运行到 `yield`，并把产出的值返回；在 `__exit__` 中，如果 `with` 块正常结束，就再调用一次 `next(gen)` 让生成器运行完毕；如果 `with` 块抛出了异常，就调用 `gen.throw(exc)`，**把异常注入到生成器暂停的 `yield` 处**。这正是上一篇讲到的生成器 `throw` 方法的实际用途。

因此，生成器中的 `yield` **必须**放在 `try/finally` 中，否则 `with` 块出错时，`yield` 之后的清理代码就不会执行。这是使用 `@contextmanager` 时最常见的错误。

### 5. contextlib 中的实用工具

```python
>>> from contextlib import suppress, redirect_stdout, nullcontext, ExitStack, chdir
>>> import io
>>> with suppress(FileNotFoundError):              # 忽略指定异常
...     os.remove("/不存在的文件")
...
>>> buf = io.StringIO()
>>> with redirect_stdout(buf):                     # 临时重定向 print 的输出
...     print("被捕获的输出")
...
>>> buf.getvalue()
'被捕获的输出\n'
>>> with chdir(tmp):                               # 3.11 新增：就是我们上面手写的那个
...     os.path.samefile(os.getcwd(), tmp)
...
True
```

`nullcontext` 是一个什么也不做的上下文管理器，用于“有时需要上下文管理器、有时不需要”的场景：

<!-- norun -->
```python
cm = lock if thread_safe else nullcontext()
with cm:
    ...
```

`ExitStack` 是最强大的工具，它可以**动态地**管理任意数量的上下文管理器，比如同时打开一组数量在运行时才知道的文件：

```python
>>> import pathlib
>>> paths = []
>>> for i in range(3):
...     p = pathlib.Path(tmp, f"part{i}.txt")
...     _ = p.write_text(f"第{i}部分\n", encoding="utf-8")
...     paths.append(p)
...
>>> with ExitStack() as stack:
...     files = [stack.enter_context(open(p, encoding="utf-8")) for p in paths]
...     merged = "".join(f.read() for f in files)
...
>>> merged
'第0部分\n第1部分\n第2部分\n'
>>> all(f.closed for f in files)                    # 离开 with 时全部关闭（按相反顺序）
True
```

即使打开第三个文件时失败，`ExitStack` 也会正确关闭前两个已经打开的文件。它还提供了 `callback()` 方法，可以注册任意的清理函数。

### 6. 多个上下文管理器

一个 `with` 语句可以同时管理多个上下文管理器，它们按顺序进入、按**相反**顺序退出。3.10 起可以用括号把它们分成多行：

<!-- norun -->
```python
with (
    open("input.txt", encoding="utf-8") as src,
    open("output.txt", "w", encoding="utf-8") as dst,
):
    dst.write(src.read())
```

### 7. 上下文管理器的更多应用

上下文管理器的本质是“**在一段代码前后执行配对的操作**”，所以它的用途远不止关闭资源：

- 锁的获取与释放：`with threading.Lock():`
- 数据库事务的提交与回滚：`with connection:`（`sqlite3` 中，正常结束则提交，异常则回滚）
- 临时修改状态并恢复：`decimal.localcontext()`、`unittest.mock.patch()`、`warnings.catch_warnings()`
- 测试中断言异常：`with pytest.raises(ValueError):`

异步代码中还有对应的 `async with`，使用 `__aenter__` 和 `__aexit__`，我们在第 18 篇中会遇到。

## 小结

- 异常组成类层次；`except Exception` 捕获常规错误，永远不要用裸 `except:`。
- `try` 块要尽量小；`else` 放没有异常时才执行的代码；`finally` 总会执行，但不要在其中 `return`（3.14 起会告警）。
- `except ... as e` 的变量会在块结束时被删除，以避免引用循环。
- 隐式链（`__context__`）表示“处理时又出错”，显式链（`raise ... from`，`__cause__`）表示“有意转换”；`from None` 隐藏原异常；`add_note` 附加上下文。
- 为库定义异常层次，并把数据作为属性附带在异常上。
- 3.11 起 `try` 是零开销的，EAFP 风格既安全又高效。
- `ExceptionGroup` 和 `except*` 用于处理多个同时发生的异常。
- `with` 调用 `__enter__`/`__exit__`；`@contextmanager` 用生成器实现上下文管理器，`yield` 必须包在 `try/finally` 中；`ExitStack` 管理动态数量的资源。

## 练习

1. 写出下面函数的返回值和打印顺序，并解释原因：
   <!-- norun -->
   ```python
   def f():
       try:
           print("try")
           return "from try"
       finally:
           print("finally")
   ```
   如果在 `finally` 中再加一行 `return "from finally"` 呢？
2. 实现一个上下文管理器 `transaction(d)`：在 `with` 块中对字典 `d` 的修改，如果块正常结束则保留，如果抛出异常则全部回滚到进入前的状态。分别用类和 `@contextmanager` 实现。
3. 实现一个 `retry_on` 上下文管理器能做到“重试 with 块”吗？为什么？（提示：思考 `__exit__` 能做什么、不能做什么。）
4. 用 `ExitStack` 实现一个函数 `open_all(paths)`，返回一个上下文管理器，进入时打开所有文件并返回文件列表，退出时全部关闭。
5. 编写代码同时启动 5 个“任务”（可以是普通函数调用），收集所有失败的异常并以 `ExceptionGroup` 的形式抛出；调用方用 `except*` 分别处理其中的 `ValueError` 和 `OSError`。

下一篇我们将探索 Python 代码的组织方式：{% post_link Python-12-Modules-and-Imports '模块、包与导入系统' %}。
