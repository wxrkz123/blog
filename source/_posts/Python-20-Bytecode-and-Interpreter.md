---
title: Python 从入门到精通（20）：字节码与解释器内部
date: 2026-10-07 10:20:00
summary: 代码对象的全部关键字段与精确错误定位表；逐行读懂 dis 输出、值栈与跳转；帧对象与调用栈；编译器做了哪些优化；3.11 起的自适应特化解释器——亲眼看到 BINARY_OP 被特化为 BINARY_OP_ADD_INT 又因类型变化而改变；用 100 行 Python 写一个能运行真实 CPython 字节码的迷你虚拟机；sys.monitoring 与 JIT。
tags:
  - Python
  - Python高级
categories:
  - Python
---

在第 01 篇中，我们走马观花地看过一行代码如何变成字节码。现在，经过十九篇的积累，是时候真正打开 CPython 的“引擎盖”了：代码对象里到底装着什么？解释器如何执行一条条字节码指令？为什么 3.11 之后 Python 突然快了很多？本篇最后，我们会用 Python 自己写一个能执行**真实 CPython 字节码**的迷你虚拟机。

> 本文是「Python 从入门到精通」系列第 20 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。本篇的字节码输出均来自 CPython 3.14，其他版本的指令名称会有所不同。

## 一、代码对象

### 1. 代码对象里有什么

每个函数都有一个 `__code__` 属性，指向它的**代码对象**（code object）。代码对象是编译器的产物，包含了执行这段代码所需的全部静态信息，而且是**不可变**的：

```python
>>> def greet(name, punctuation="!"):
...     message = f"你好，{name}{punctuation}"
...     return message
...
>>> c = greet.__code__
>>> c.co_name, c.co_qualname, c.co_firstlineno > 0
('greet', 'greet', True)
>>> c.co_argcount, c.co_varnames, c.co_nlocals     # 参数个数、局部变量名（参数排在最前面）
(2, ('name', 'punctuation', 'message'), 3)
>>> c.co_consts                                     # 用到的常量
('你好，',)
>>> c.co_stacksize                                  # 执行时值栈的最大深度
3
>>> type(c.co_code), len(c.co_code) % 2            # 原始字节码：每条指令 2 字节（操作码 + 参数）
(<class 'bytes'>, 0)
```

| 属性 | 含义 |
|---|---|
| `co_code` | 原始字节码 |
| `co_consts` | 常量元组（嵌套函数的代码对象也在这里） |
| `co_names` | 全局变量名、属性名 |
| `co_varnames` | 局部变量名（包括参数） |
| `co_cellvars` / `co_freevars` | 被内层函数捕获的变量 / 从外层捕获的变量（第 07 篇） |
| `co_flags` | 标志位：是否是生成器、协程，是否有 `*args` 等 |
| `co_exceptiontable` | 异常表（第 11 篇的“零开销异常”） |
| `co_firstlineno` / `co_positions()` | 源码位置信息 |

字节码中的指令只使用**下标**来引用这些表：`LOAD_CONST 0` 的意思是“加载 `co_consts[0]`”，`LOAD_FAST 2` 的意思是“加载第 2 个局部变量”。这让字节码非常紧凑。

### 2. 标志位

```python
>>> import inspect
>>> def gen(): yield 1
...
>>> async def coro(): pass
...
>>> bool(gen.__code__.co_flags & inspect.CO_GENERATOR), bool(coro.__code__.co_flags & inspect.CO_COROUTINE)
(True, True)
>>> def varargs(*args, **kwargs): pass
...
>>> bool(varargs.__code__.co_flags & inspect.CO_VARARGS), bool(varargs.__code__.co_flags & inspect.CO_VARKEYWORDS)
(True, True)
```

一个函数是不是生成器，就是由编译器在 `co_flags` 中设置的 `CO_GENERATOR` 标志决定的——这正是“函数体中只要出现 `yield`，调用它就返回生成器”的实现方式（第 08 篇）。

### 3. 精确的错误位置

3.11 起，代码对象为**每一条指令**都记录了它在源码中的起止行号和列号。这让回溯信息能够精确地指出出错的是哪个子表达式：

```python
>>> def get_city(data):
...     return data["user"]["address"]["city"]
...
>>> get_city({"user": {"address": None}})
Traceback (most recent call last):
  ...
    return data["user"]["address"]["city"]
           ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^
TypeError: 'NoneType' object is not subscriptable
```

`^^^^` 准确地指向了 `["city"]` 这一步——是 `address` 为 `None`，而不是 `data` 或 `user`。在 3.10 及以前，你只能知道“这一行出错了”。这些位置信息可以通过 `co_positions()` 获取。

## 二、读懂 dis 的输出

### 1. 一个完整的例子

```python
import dis


def classify(n):
    if n < 0:
        return "负数"
    for i in range(2, n):
        if n % i == 0:
            return "合数"
    return "质数或 0/1"


dis.dis(classify)
```

```text
  4           RESUME                   0

  5           LOAD_FAST_BORROW         0 (n)
              LOAD_SMALL_INT           0
              COMPARE_OP              18 (bool(<))
              POP_JUMP_IF_FALSE        3 (to L1)
              NOT_TAKEN

  6           LOAD_CONST               1 ('负数')
              RETURN_VALUE

  7   L1:     LOAD_GLOBAL              1 (range + NULL)
              LOAD_SMALL_INT           2
              LOAD_FAST_BORROW         0 (n)
              CALL                     2
              GET_ITER
      L2:     FOR_ITER                19 (to L4)
              STORE_FAST               1 (i)

  8           LOAD_FAST_BORROW_LOAD_FAST_BORROW 1 (n, i)
              BINARY_OP                6 (%)
              LOAD_SMALL_INT           0
              COMPARE_OP              88 (bool(==))
              POP_JUMP_IF_TRUE         3 (to L3)
              NOT_TAKEN
              JUMP_BACKWARD           18 (to L2)

  9   L3:     POP_TOP
              LOAD_CONST               2 ('合数')
              RETURN_VALUE

  7   L4:     END_FOR
              POP_ITER

 10           LOAD_CONST               3 ('质数或 0/1')
              RETURN_VALUE
```

`dis` 的输出分为几列：**源码行号**、**跳转标签**（`L1:` 表示这里是某个跳转的目标）、**指令名**、**参数**，以及括号中对参数的**解释**。

逐段解读：

- **第 5 行** `if n < 0`：把 `n` 和 `0` 压栈，`COMPARE_OP` 弹出两者、比较后把布尔值压栈；`POP_JUMP_IF_FALSE` 弹出它，如果为假就跳到 `L1`（也就是 `for` 循环开始的地方）。`NOT_TAKEN` 是 3.14 新增的一个空操作，用来帮助性能分析工具记录“分支没有跳转”这一事件。
- **第 7 行** `for i in range(2, n)`：`LOAD_GLOBAL` 加载全局名字 `range`，参数 `range + NULL` 表示它在 `range` 之后还额外压入了一个 `NULL`——这个空位是给“方法调用时的 `self`”预留的，普通函数调用时就留空。然后压入两个参数，`CALL 2` 调用 `range(2, n)`；`GET_ITER` 取得迭代器；`FOR_ITER` 每次取出下一个元素压栈，迭代结束时跳到 `L4`。
- **第 8 行**：`LOAD_FAST_BORROW_LOAD_FAST_BORROW` 是一条**超级指令**，一次加载两个局部变量；`BINARY_OP 6 (%)` 取模；`JUMP_BACKWARD` 跳回 `L2` 进行下一轮循环。
- **第 9 行**：`return "合数"` 前的 `POP_TOP` 把循环的迭代器从栈上弹掉——从循环中间 `return` 时，栈必须是干净的。

可以看到，`if`、`for`、`while` 在字节码层面都变成了**条件跳转**和**无条件跳转**，和汇编语言中的分支和循环如出一辙。

### 2. 基于栈的虚拟机

CPython 的虚拟机是**基于栈**的：几乎所有指令都从**值栈**（value stack）的顶部取操作数，再把结果压回栈顶。`dis.stack_effect` 可以查询每条指令对栈深度的影响：

```python
>>> import dis
>>> dis.stack_effect(dis.opmap["BINARY_OP"], 0)      # 弹出 2 个，压入 1 个
-1
>>> dis.stack_effect(dis.opmap["LOAD_FAST"], 0)      # 压入 1 个
1
```

编译器正是根据这些信息计算出了 `co_stacksize`，在创建帧时一次性分配好足够大的栈空间，执行过程中就不需要检查栈是否溢出了。

基于栈的设计让指令格式简单、字节码紧凑、编译器容易实现，代价是同样的计算需要更多条指令（比如 `a + b` 需要 3 条：两次加载、一次相加）。Lua 5 和 Android 早期的 Dalvik 虚拟机则采用了**基于寄存器**的设计，指令数更少但每条指令更长。

## 三、帧：函数执行的现场

代码对象是静态的“剧本”，**帧**（frame）则是一次具体执行的“现场”：它保存着局部变量的值、值栈、当前执行到哪条指令，以及指向调用者帧的指针。每调用一次函数，就创建一个新的帧；这些帧通过 `f_back` 链接成**调用栈**：

```python
>>> import sys
>>> def inner():
...     frame = sys._getframe()               # 获取当前帧
...     chain = []
...     while frame:
...         chain.append(frame.f_code.co_name)
...         frame = frame.f_back              # 顺着调用链向上
...     return chain[:3]
...
>>> def middle():
...     local_var = 42
...     return inner()
...
>>> def outer():
...     return middle()
...
>>> outer()
['inner', 'middle', 'outer']
```

异常回溯（traceback）就是在异常传播时，沿途把每一层帧记录下来形成的链表；调试器通过帧读取和修改局部变量；`inspect.stack()`、日志模块中的“调用位置”信息都来自帧。

在 3.11 之前，每次函数调用都会在堆上创建一个完整的帧**对象**，开销不小。3.11 起，解释器内部使用一种轻量的“内部帧”结构，连续地存放在一块预先分配好的内存中（类似 C 语言的调用栈），只有当 Python 代码真正需要访问帧对象时（比如调用 `sys._getframe()`、发生异常需要构建回溯），才**惰性地**创建对应的 Python 帧对象。这是 3.11 函数调用大幅提速的主要原因之一。

## 四、编译器的优化

CPython 的编译器是一个相当“朴素”的编译器，它只做少量安全的优化：

```python
>>> def f():
...     return 24 * 60 * 60, "ab" * 3, not not True
...
>>> f.__code__.co_consts[-1]               # 常量折叠：表达式在编译时就算好了
(86400, 'ababab', True)
>>> def g():
...     if __debug__:                      # __debug__ 是编译时常量（-O 模式下为 False）
...         return "调试模式"
...     return "优化模式"
...
>>> [i.opname for i in dis.get_instructions(g)]   # 永远不会执行的分支被直接删除了
['RESUME', 'NOP', 'LOAD_CONST', 'RETURN_VALUE']
```

（那条 `NOP` 是被删除的 `if` 留下的占位，它让 `if __debug__:` 这一行依然对应着一条指令，以便调试器和覆盖率工具能正确地报告行号。）

此外还有：死代码消除（`return` 之后的代码）、跳转链优化、把 `x in [1, 2, 3]` 中的列表常量转换为元组或 `frozenset`、超级指令的合并、3.12 的推导式内联等。

为什么不做更激进的优化，比如函数内联、循环展开、公共子表达式消除？因为 Python 的**动态性**让这些优化几乎都不安全：`range` 可能在运行时被重新赋值成别的东西，`x + y` 可能调用任意的 `__add__` 方法并产生副作用，一个函数的代码甚至可以在运行时被替换。编译时能确定的信息太少了。于是 CPython 选择了另一条路：**在运行时观察，在运行时优化**。

## 五、自适应特化解释器（3.11+）

### 1. 原理

PEP 659 引入了**特化的自适应解释器**（specializing adaptive interpreter）。核心思想是：虽然 `BINARY_OP +` 理论上可以作用于任何类型，但在一个具体程序的具体位置，它**几乎总是**作用于同样的类型。解释器会：

1. 执行几次某条通用指令，观察它实际处理的数据类型；
2. 把它原地**替换**为针对这种类型的特化指令（比如 `BINARY_OP_ADD_INT`，只处理两个 `int` 相加，省去了类型分派的开销）；
3. 特化指令在执行前会做一个很便宜的**守卫检查**（guard）。如果某一次类型不符合预期，就执行一个“去优化”（deoptimize）的回退路径；多次失败后，会重新回到通用指令并尝试新的特化。

为了支持这一机制，指令后面附带了若干个“**内联缓存**”（inline cache）单元，用来存放特化需要的信息，比如属性在对象中的偏移量、全局字典的版本号等。

### 2. 亲眼看到特化

`dis.dis` 的 `adaptive=True` 参数可以显示特化后的指令：

```python
import dis


def total(items):
    s = 0
    for x in items:
        s = s + x
    return s


def show(title):
    ops = [i.opname for i in dis.get_instructions(total, adaptive=True)]
    print(f"{title:<14}", [op for op in ops if op.startswith(("FOR_ITER", "BINARY_OP"))])


show("刚定义时")
for _ in range(1000):
    total([1, 2, 3])              # 用整数列表“预热”
show("整数预热后")
for _ in range(1000):
    total([0.5, 1.5])             # 改用浮点数：int + float 的组合
show("换成浮点数后")
for _ in range(1000):
    total((1, 2, 3))              # 改用元组
show("换成元组后")
```

```text
刚定义时           ['FOR_ITER', 'BINARY_OP']
整数预热后          ['FOR_ITER_LIST', 'BINARY_OP_ADD_INT']
换成浮点数后         ['FOR_ITER_LIST', 'BINARY_OP_EXTEND']
换成元组后          ['FOR_ITER_TUPLE', 'BINARY_OP_ADD_INT']
```

整个过程完全自动、对程序透明：

- 用整数列表调用后，`FOR_ITER` 被特化为专门遍历列表的 `FOR_ITER_LIST`，`BINARY_OP` 被特化为 `BINARY_OP_ADD_INT`；
- 改用浮点数后，`s = 0 + 0.5` 是 `int + float` 的混合运算，`ADD_INT` 的守卫失败，指令被重新特化为能处理更多类型组合的 `BINARY_OP_EXTEND`；
- 改用元组后，循环指令变成了 `FOR_ITER_TUPLE`；而元组中的元素又都是整数了，于是加法指令也被**重新特化**回了 `BINARY_OP_ADD_INT`。

属性访问是特化收益最大的地方之一。比如 `obj.attr` 会被特化为 `LOAD_ATTR_INSTANCE_VALUE`：它在内联缓存中记录了对象类型的版本号和属性在实例中的偏移量，下次执行时只要类型没有变化，就直接按偏移量读取，完全跳过第 14 篇讲的那一整套描述符查找流程。

这也给了我们一条性能建议：**保持代码中各处使用的类型稳定**（“类型单态”）。一个时而处理 `int`、时而处理 `str` 的函数，更难被有效地特化。

### 3. 更进一步：JIT

3.13 起，CPython 加入了实验性的 **JIT 编译器**（PEP 744）。它使用一种叫做 “copy-and-patch” 的技术：在构建 CPython 时，预先用 LLVM 把每条“微指令”编译成机器码模板；运行时，把热点代码对应的模板拼接起来，填入具体的参数，就得到了可以直接执行的机器码。它建立在特化解释器的基础之上：先由特化解释器收集类型信息、形成热点路径，再由 JIT 编译成机器码。JIT 目前默认是关闭的，可以通过环境变量 `PYTHON_JIT=1` 在支持它的构建中启用。此外，3.14 还支持在使用较新版本 Clang 编译时，采用“尾调用”方式实现的解释器主循环，在部分平台上能带来几个百分点的提速。

## 六、动手：用 Python 写一个字节码虚拟机

理解解释器最好的方法，是自己写一个。下面的 `run` 函数用 Python 实现了一个迷你虚拟机，它读取一个**真实的 CPython 函数**的字节码，用一个列表作为值栈，用一个字典存放局部变量，逐条解释执行：

```python
import builtins
import dis
import operator

NULL = object()

BINARY_OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv,
              "//": operator.floordiv, "%": operator.mod, "+=": operator.iadd, "*=": operator.imul}
COMPARE_OPS = {"<": operator.lt, "<=": operator.le, "==": operator.eq, "!=": operator.ne,
               ">": operator.gt, ">=": operator.ge}


def run(func, *args):
    """用 Python 解释执行 func 的字节码（只支持一小部分指令）。"""
    instructions = list(dis.get_instructions(func))
    index_of = {ins.offset: i for i, ins in enumerate(instructions)}   # 字节偏移 → 指令下标
    local_vars = dict(zip(func.__code__.co_varnames, args))
    stack, pc, executed = [], 0, 0
    while True:
        ins = instructions[pc]                    # 取指令
        op, arg = ins.opname, ins.argval
        pc += 1
        executed += 1
        if op in ("RESUME", "NOP", "NOT_TAKEN", "END_FOR"):
            pass
        elif op in ("LOAD_CONST", "LOAD_SMALL_INT"):
            stack.append(arg)
        elif op.count("LOAD_FAST") == 2:          # 超级指令：一次加载两个局部变量
            stack.extend(local_vars[name] for name in arg)
        elif op.startswith("LOAD_FAST"):
            stack.append(local_vars[arg])
        elif op == "STORE_FAST":
            local_vars[arg] = stack.pop()
        elif op == "LOAD_GLOBAL":
            stack.append(func.__globals__.get(arg, getattr(builtins, arg, None)))
            if ins.arg & 1:                       # 参数最低位为 1：再压入一个 NULL
                stack.append(NULL)
        elif op == "CALL":
            call_args = [stack.pop() for _ in range(arg)][::-1]
            self_or_null, callee = stack.pop(), stack.pop()
            if self_or_null is not NULL:
                call_args.insert(0, self_or_null)
            stack.append(callee(*call_args))
        elif op == "BINARY_OP":
            b, a = stack.pop(), stack.pop()       # 注意顺序：先弹出的是右操作数
            stack.append(BINARY_OPS[ins.argrepr](a, b))
        elif op == "COMPARE_OP":
            b, a = stack.pop(), stack.pop()
            stack.append(COMPARE_OPS[ins.argrepr.removeprefix("bool(").removesuffix(")")](a, b))
        elif op == "TO_BOOL":
            stack.append(bool(stack.pop()))
        elif op == "POP_JUMP_IF_FALSE":
            if not stack.pop():
                pc = index_of[arg]
        elif op == "POP_JUMP_IF_TRUE":
            if stack.pop():
                pc = index_of[arg]
        elif op in ("JUMP_FORWARD", "JUMP_BACKWARD"):
            pc = index_of[arg]
        elif op == "GET_ITER":
            stack.append(iter(stack.pop()))
        elif op == "FOR_ITER":
            try:
                stack.append(next(stack[-1]))     # 迭代器留在栈上，下一个元素压在它上面
            except StopIteration:
                pc = index_of[arg]                # 迭代结束：跳到循环之后
        elif op in ("POP_ITER", "POP_TOP"):
            stack.pop()
        elif op == "RETURN_VALUE":
            return stack.pop(), executed
        else:
            raise NotImplementedError(op)


def sum_even_squares(n):
    total = 0
    for i in range(n):
        if i % 2 == 0:
            total += i * i
    return total


def collatz_steps(n):
    steps = 0
    while n != 1:
        if n % 2:
            n = 3 * n + 1
        else:
            n = n // 2
        steps += 1
    return steps


for f, arg in ((sum_even_squares, 10), (collatz_steps, 27)):
    result, executed = run(f, arg)
    print(f"{f.__name__}({arg}) = {result}，与真实执行一致: {result == f(arg)}，"
          f"共解释执行 {executed} 条指令")
```

```text
sum_even_squares(10) = 120，与真实执行一致: True，共解释执行 132 条指令
collatz_steps(27) = 111，与真实执行一致: True，共解释执行 2282 条指令
```

不到一百行代码，我们的虚拟机就能正确运行包含循环、分支、函数调用的真实 Python 函数。它的主体结构——**取指令、按操作码分派、操作值栈、修改程序计数器**——和 CPython 用 C 编写的主循环（`Python/ceval.c` 及由 `Python/bytecodes.c` 生成的代码）完全相同，只是后者支持两百多种指令，并且用 C 语言、“计算跳转”（computed goto）等技术把每条指令的分派开销降到了最低。

这个小实验也直观地展示了解释执行的开销：计算 `collatz_steps(27)` 只需要 111 次循环，却执行了 2282 条字节码指令，每条指令背后都有取指、分派、引用计数、类型检查等工作。这就是为什么在 CPython 中，**“把工作交给内置函数和 C 实现的库”** 往往是最有效的优化手段，我们会在下一篇详细讨论。

## 七、sys.monitoring：低开销的执行监控

调试器、性能分析器、代码覆盖率工具都需要“监视”程序的执行。传统的 `sys.settrace` 会在**每一行**、每一次调用时都调用一个 Python 回调函数，开销极大（让程序慢上数十倍）。3.12 引入的 `sys.monitoring`（PEP 669）提供了一种低开销的方案：工具可以**只为特定的代码对象**开启**特定的事件**，并且回调可以返回 `DISABLE` 来关闭某个位置的后续事件（覆盖率工具只需要知道某行“是否执行过”，记录一次后就可以关闭它）。没有开启监控的代码完全没有额外开销。

下面用它实现一个简单的“行执行计数器”：

```python
import sys
from collections import Counter

mon = sys.monitoring
TOOL = mon.PROFILER_ID


def fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out


hits = Counter()


def on_line(code, line_number):
    hits[line_number - code.co_firstlineno] += 1      # 记录相对于函数第一行的行号


mon.use_tool_id(TOOL, "line-counter")
mon.register_callback(TOOL, mon.events.LINE, on_line)
mon.set_local_events(TOOL, fizzbuzz.__code__, mon.events.LINE)   # 只监控这一个函数
fizzbuzz(30)
mon.set_local_events(TOOL, fizzbuzz.__code__, 0)
mon.free_tool_id(TOOL)

for offset in sorted(hits):
    print(f"第 {offset:>2} 行  执行 {hits[offset]:>2} 次")
```

```text
第  1 行  执行  1 次
第  2 行  执行 31 次
第  3 行  执行 30 次
第  4 行  执行  2 次
第  5 行  执行 28 次
第  6 行  执行  8 次
第  7 行  执行 20 次
第  8 行  执行  4 次
第 10 行  执行 16 次
第 11 行  执行  1 次
```

（`for` 那一行执行了 31 次，因为最后一次检测到迭代结束；`else:` 那一行本身不对应任何指令，所以没有记录。）现代的 `coverage.py` 在 3.12 之后正是使用 `sys.monitoring` 来大幅降低覆盖率统计的开销的。

## 小结

- 代码对象是不可变的编译产物，包含字节码和常量、名字、变量名等表；`co_flags` 标记生成器、协程；3.11 起记录每条指令的精确源码位置。
- CPython 是基于栈的虚拟机，`if`/`for` 在字节码中变成跳转；帧保存一次执行的现场并组成调用栈，3.11 起帧对象惰性创建。
- 编译器只做常量折叠、死代码消除等安全的优化，因为 Python 的动态性让激进优化不安全。
- 3.11 的自适应特化解释器在运行时根据观察到的类型，把通用指令替换为特化指令（如 `BINARY_OP_ADD_INT`），守卫失败时去优化；3.13 起有实验性的 JIT。
- 解释器主循环就是“取指—分派—执行”，我们用不到 100 行 Python 就能实现一个能运行真实字节码的虚拟机。
- `sys.monitoring` 提供了按需开启、低开销的执行监控接口。

## 练习

1. 扩展本文的迷你虚拟机，让它支持 `BUILD_LIST`、`LIST_APPEND`、`BINARY_SUBSCR`（在 3.14 中下标访问也是 `BINARY_OP`，请先用 `dis` 确认）、`LOAD_ATTR`（方法调用），使它能运行一个对列表排序的冒泡排序函数。
2. 用 `dis` 比较 `[x * 2 for x in data]`、`list(map(lambda x: x * 2, data))` 和普通 `for` 循环 + `append` 三种写法的字节码，结合 `timeit` 的测量结果，解释它们的性能差异。
3. 写一个函数，预热后用 `dis.get_instructions(f, adaptive=True)` 统计其中有多少条指令被成功特化。然后让它处理混合类型的数据，观察特化指令的变化。
4. 使用 `sys.monitoring` 实现一个简单的函数调用分析器：统计每个 Python 函数被调用的次数（提示：使用 `PY_START` 事件）。
5. 阅读 CPython 源码中 `Python/bytecodes.c` 里 `BINARY_OP_ADD_INT` 的定义（可以在 GitHub 上在线阅读），找出它的守卫条件和快速路径分别是什么。

下一篇，我们将把这些底层知识用于实战：{% post_link Python-21-Performance '性能分析与优化' %}。
