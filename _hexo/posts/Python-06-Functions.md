---
title: Python 从入门到精通（06）：函数——参数、作用域与一等对象
date: 2026-10-07 11:30:00
summary: def 在运行时创建函数对象；五种参数与实参绑定规则、仅限位置参数的设计动机；默认参数只求值一次的陷阱与哨兵对象；LEGB 作用域在编译期确定、UnboundLocalError 的成因、global 与 nonlocal；函数作为一等对象、partial 与 3.14 的 Placeholder、递归限制。
tags:
  - Python
  - Python基础
categories:
  - Python
---

函数是组织代码的基本单元。在 Python 中，函数不只是一段可以被调用的代码，它本身就是一个**对象**：可以被赋值、传递、存储、返回，也有自己的属性。本篇先把参数传递的规则讲透，再深入作用域的实现原理，最后讨论“函数是一等对象”带来的编程方式。这一篇是下一阶段（闭包、装饰器、生成器）的基础。

> 本文是「Python 从入门到精通」系列第 06 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、def 语句：在运行时创建函数对象

很多人以为 `def` 是“声明”，就像 C 语言的函数定义那样在编译期就存在了。实际上，**`def` 是一条可执行语句**：执行到它时，Python 用预先编译好的代码对象创建一个**函数对象**，并把它绑定到函数名上。

```python
>>> def greet(name: str, greeting: str = "Hello") -> str:
...     """返回一句问候语。"""
...     return f"{greeting}, {name}!"
...
>>> greet
<function greet at 0x...>
>>> type(greet)
<class 'function'>
>>> greet.__name__, greet.__doc__
('greet', '返回一句问候语。')
>>> greet.__defaults__                     # 默认值保存在函数对象上
('Hello',)
>>> greet.__annotations__
{'name': <class 'str'>, 'greeting': <class 'str'>, 'return': <class 'str'>}
>>> greet.__code__.co_varnames              # 函数背后的代码对象
('name', 'greeting')
```

既然 `def` 是语句，它就可以出现在任何语句能出现的地方，比如 `if` 分支或另一个函数内部：

```python
>>> import sys
>>> if sys.platform == "win32":
...     def clear_cmd(): return "cls"
... else:
...     def clear_cmd(): return "clear"
...
>>> clear_cmd() in ("cls", "clear")
True
```

代码对象（`__code__`）和函数对象的区别很重要：代码对象是编译的产物，包含字节码、常量、变量名等**静态**信息，在编译模块时就生成了；函数对象则是在运行时创建的，它把代码对象和**运行时环境**（全局命名空间 `__globals__`、默认参数值、闭包变量）组合在一起。同一个代码对象可以被用来创建多个函数对象——这正是下一篇要讲的闭包的基础。

### 返回值

- 没有 `return` 语句，或 `return` 后面没有值，函数返回 `None`；
- “返回多个值”其实是返回一个元组，调用方再解包。

```python
>>> def min_max(items):
...     return min(items), max(items)
...
>>> lo, hi = min_max([3, 1, 4, 1, 5])
>>> lo, hi
(1, 5)
```

## 二、参数：五种类型与绑定规则

### 1. 完整的参数列表

Python 函数的参数列表最多可以包含五种参数，顺序固定：

<!-- norun -->
```python
def f(pos_only, /, pos_or_kw, *args, kw_only, **kwargs):
    ...
```

| 参数类型 | 写法 | 调用时 |
|---|---|---|
| 仅限位置参数 | `/` 之前的参数（3.8+） | 只能按位置传 |
| 位置或关键字参数 | 普通参数 | 按位置或关键字传都可以 |
| 可变位置参数 | `*args` | 收集多余的位置实参为元组 |
| 仅限关键字参数 | `*` 或 `*args` 之后的参数 | 只能按关键字传 |
| 可变关键字参数 | `**kwargs` | 收集多余的关键字实参为字典 |

```python
>>> def demo(a, b, /, c, *args, d, e=5, **kwargs):
...     return f"a={a} b={b} c={c} args={args} d={d} e={e} kwargs={kwargs}"
...
>>> demo(1, 2, 3, 4, 5, d=6, z=7)
"a=1 b=2 c=3 args=(4, 5) d=6 e=5 kwargs={'z': 7}"
>>> demo(1, 2, c=3, d=4)
'a=1 b=2 c=3 args=() d=4 e=5 kwargs={}'
>>> demo(1, b=2, c=3, d=4)
Traceback (most recent call last):
  ...
TypeError: demo() missing 1 required positional argument: 'b'
>>> demo(1, 2, 3)
Traceback (most recent call last):
  ...
TypeError: demo() missing 1 required keyword-only argument: 'd'
```

注意第三个调用的报错信息：`b=2` 并没有触发“仅限位置参数不能用关键字传递”的错误，而是因为存在 `**kwargs`，这个名为 `b` 的关键字实参被**收进了 `kwargs`**，于是真正的形参 `b` 没有得到值。这恰恰说明了仅限位置参数的名字与关键字实参是完全隔离的（下文会利用这一点）。如果函数没有 `**kwargs`，报错信息才会是 “got some positional-only arguments passed as keyword arguments”。

### 2. 实参是如何绑定到形参的

调用函数时，解释器按以下步骤把实参“分配”给形参：

1. 依次把**位置实参**分配给仅限位置参数和位置或关键字参数；多出来的位置实参放进 `*args`（如果没有 `*args`，就报错 “takes N positional arguments but M were given”）。
2. 对每个**关键字实参**，按名字找到对应的形参；如果这个形参已经通过位置得到了值，报错 “got multiple values for argument”；如果找不到同名形参，放进 `**kwargs`（如果没有 `**kwargs`，报错 “got an unexpected keyword argument”）。
3. 还没有值的形参，使用默认值；如果没有默认值，报错 “missing required argument”。

标准库 `inspect` 模块可以模拟这一过程，这在编写装饰器和框架时非常有用：

```python
>>> import inspect
>>> sig = inspect.signature(demo)
>>> sig
<Signature (a, b, /, c, *args, d, e=5, **kwargs)>
>>> bound = sig.bind(1, 2, 3, 4, d=6, z=7)
>>> bound.apply_defaults()
>>> bound.arguments
{'a': 1, 'b': 2, 'c': 3, 'args': (4,), 'd': 6, 'e': 5, 'kwargs': {'z': 7}}
```

### 3. 为什么需要仅限关键字参数

当一个参数是“开关”或“配置项”时，强制用关键字传递能极大提高调用处的可读性：

<!-- norun -->
```python
sorted(data, key=len, reverse=True)       # 一目了然
sorted(data, len, True)                    # 如果允许这样写，读者需要去查文档
```

`sorted` 的 `key` 和 `reverse` 正是仅限关键字参数。在自己的函数中，在参数列表里放一个单独的 `*` 即可：

```python
>>> def connect(host, port, *, timeout=10, retries=3):
...     return host, port, timeout, retries
...
>>> connect("db.local", 5432, timeout=30)
('db.local', 5432, 30, 3)
>>> connect("db.local", 5432, 30)
Traceback (most recent call last):
  ...
TypeError: connect() takes 2 positional arguments but 3 were given
```

### 4. 为什么需要仅限位置参数

`/` 的引入（PEP 570）有几个动机：

- **参数名不属于公开 API**。比如 `len(obj)` 中参数叫什么根本不重要。如果允许 `len(obj=x)`，以后就不能再改这个名字了，否则会破坏别人的代码。仅限位置参数让库作者可以自由地重命名参数。
- **与 `**kwargs` 避免冲突**。看下面这个例子：

```python
>>> def format_record(name, **fields):
...     return name, fields
...
>>> format_record("Alice", age=30, name="A.")         # 想把 name 作为一个普通字段传入
Traceback (most recent call last):
  ...
TypeError: format_record() got multiple values for argument 'name'
>>> def format_record(name, /, **fields):
...     return name, fields
...
>>> format_record("Alice", age=30, name="A.")         # 现在 name 不会再被关键字实参占用
('Alice', {'age': 30, 'name': 'A.'})
```

- **性能**：很多内置函数用 C 实现，按位置解析参数比按名字更快。

### 5. 调用时的解包

在调用一侧，`*` 和 `**` 把序列和字典“展开”为位置实参和关键字实参：

```python
>>> def area(width, height):
...     return width * height
...
>>> size = (3, 4)
>>> area(*size)
12
>>> opts = {"width": 5, "height": 6}
>>> area(**opts)
30
>>> print(*[1, 2, 3], sep=" | ")
1 | 2 | 3
```

`*args` 和 `**kwargs` 配合使用，可以写出“原样转发所有参数”的包装函数，这是编写装饰器的核心技巧：

<!-- norun -->
```python
def wrapper(*args, **kwargs):
    # ……做点额外的事……
    return original(*args, **kwargs)
```

## 三、默认参数：只求值一次

### 1. 经典陷阱

这可能是 Python 中最著名的陷阱：

```python
>>> def add_item(item, bucket=[]):
...     bucket.append(item)
...     return bucket
...
>>> add_item(1)
[1]
>>> add_item(2)                  # 期望 [2]，结果……
[1, 2]
>>> add_item.__defaults__        # 罪魁祸首：默认值对象一直挂在函数上
([1, 2],)
```

原因在于：**默认值表达式只在 `def` 语句执行时求值一次**，得到的对象被保存在函数的 `__defaults__` 属性中。之后每次调用不传 `bucket` 时，用的都是**同一个**列表对象。结合第 02 篇的“标签模型”就很容易理解：每次调用时，局部名字 `bucket` 都贴到了那个唯一的列表上。

### 2. 正确写法：None 作为哨兵

```python
>>> def add_item(item, bucket=None):
...     if bucket is None:
...         bucket = []           # 每次调用都新建
...     bucket.append(item)
...     return bucket
...
>>> add_item(1), add_item(2)
([1], [2])
```

如果 `None` 本身也是合法的参数值，无法用来表示“没有传参”，可以创建一个专用的**哨兵对象**：

```python
>>> _MISSING = object()          # 一个独一无二的对象
>>> def get(mapping, key, default=_MISSING):
...     try:
...         return mapping[key]
...     except KeyError:
...         if default is _MISSING:
...             raise
...         return default
...
>>> get({"a": None}, "a"), get({}, "b", None)
(None, None)
>>> get({}, "b")
Traceback (most recent call last):
  ...
KeyError: 'b'
```

### 3. 同理：默认参数中的“当前时间”

```python
>>> import time
>>> def log(msg, ts=time.time()):     # 错误！时间戳在定义时就固定了
...     return ts
...
>>> log("a") == log("b")
True
```

为什么 Python 要这样设计，而不是每次调用都重新求值？因为在定义时求值有清晰的语义（“默认值就是这个对象”），实现简单且高效；而且这种行为偶尔也很有用，比如用可变默认值做简单的缓存。但作为规则：**默认值请只使用不可变对象**。代码检查工具（如 Ruff 的 B006 规则）会自动发现这个问题。

## 四、作用域：LEGB 规则

### 1. 四层作用域

Python 查找一个名字时，按以下顺序搜索四层作用域，找到即停止：

1. **L**ocal：当前函数的局部作用域；
2. **E**nclosing：外层嵌套函数的作用域（由内向外）；
3. **G**lobal：当前模块的全局作用域；
4. **B**uiltins：内置作用域（`len`、`print`、`ValueError` 等）。

```python
>>> x = "global"
>>> def outer():
...     x = "enclosing"
...     def inner():
...         return x            # 局部没有，向外找到了 enclosing
...     return inner()
...
>>> outer()
'enclosing'
```

注意，`if`、`for`、`while`、`with` 都**不会**创建新的作用域。只有模块、函数（包括 lambda）、类和推导式会创建作用域。

### 2. 局部变量在编译时确定

这是理解 Python 作用域最关键的一点：**一个名字在函数中是不是局部变量，是在编译时决定的，而不是运行时**。规则是：只要函数体中**任何位置**对这个名字进行了赋值（包括 `=`、`+=`、`for` 循环变量、`import`、`def`、`with ... as` 等），它在**整个函数**中就是局部变量。

这直接导致了一个让初学者困惑的错误：

```python
>>> count = 0
>>> def increment():
...     print(count)        # 期望打印全局的 0？
...     count += 1
...
>>> increment()
Traceback (most recent call last):
  ...
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

因为函数中有 `count += 1`，编译器就把 `count` 判定为局部变量。于是第一行的 `print(count)` 试图读取一个尚未赋值的局部变量，报错。从字节码中可以清楚地看到编译器的决定：

```python
>>> import dis
>>> [ins.opname for ins in dis.get_instructions(increment) if "FAST" in ins.opname]
['LOAD_FAST_CHECK', 'LOAD_FAST_BORROW', 'STORE_FAST']
```

`LOAD_FAST` / `STORE_FAST` 系列是访问局部变量的指令：`_CHECK` 后缀表示需要先检查变量是否已赋值（这正是抛出 `UnboundLocalError` 的地方），`_BORROW` 是 3.14 新增的变体，它“借用”引用而不增加引用计数，以减少开销。如果 `count` 被当作全局变量，生成的会是 `LOAD_GLOBAL`。

为什么要在编译时决定？因为这样局部变量可以存放在一个**定长数组**中，通过下标直接访问（`LOAD_FAST 0`），而不必像全局变量那样做字典查找。这是 Python 函数中局部变量访问比全局变量快的根本原因，也是一个常见的优化技巧：在性能敏感的循环中，把频繁使用的全局函数先赋值给局部变量。

```python
>>> increment.__code__.co_varnames     # 局部变量表，编译时就确定了
('count',)
```

### 3. global 与 nonlocal

要在函数中**重新绑定**外层作用域的名字，需要显式声明：

```python
>>> counter = 0
>>> def increment():
...     global counter          # 声明：counter 指的是模块级的那个名字
...     counter += 1
...
>>> increment(); increment()
>>> counter
2
>>> def make_counter():
...     n = 0
...     def inc():
...         nonlocal n           # 声明：n 指的是外层函数的那个名字
...         n += 1
...         return n
...     return inc
...
>>> c = make_counter()
>>> c(), c(), c()
(1, 2, 3)
```

注意区分“重新绑定名字”和“修改对象”：如果外层变量指向一个可变对象，在内层函数中调用它的方法（如 `items.append(x)`）**不需要**任何声明，因为没有对名字赋值。

`global` 应当谨慎使用：全局可变状态会让代码难以测试和推理。大多数情况下，更好的做法是传参和返回值，或者把状态封装进类里。

### 4. 小心遮蔽内置名字

```python
>>> list = [1, 2, 3]             # 遮蔽了内置的 list
>>> list("abc")
Traceback (most recent call last):
  ...
TypeError: 'list' object is not callable
>>> del list                     # 删除全局的 list，内置的 list 重新可见
>>> list("abc")
['a', 'b', 'c']
```

`list`、`dict`、`str`、`id`、`type`、`input`、`filter`、`sum`、`max` 这些都是常见的“受害者”。不要用它们做变量名。

### 5. locals() 的语义

`locals()` 返回当前局部作用域的名字字典。在函数中，**修改这个字典不会影响真正的局部变量**——因为局部变量存储在前面提到的定长数组中，字典只是一份快照。3.13 起（PEP 667），这一行为被正式规范化：在函数中每次调用 `locals()` 都返回一个新的独立快照。

## 五、函数是一等对象

“一等对象”（first-class object）意味着函数可以像其他任何值一样被使用：赋值给变量、存入容器、作为参数传递、作为返回值。

### 1. 高阶函数

接受函数作为参数或返回函数的函数，称为**高阶函数**：

```python
>>> words = ["banana", "Apple", "cherry", "date"]
>>> sorted(words, key=str.lower)                  # 传入一个函数
['Apple', 'banana', 'cherry', 'date']
>>> max(words, key=len)
'banana'
>>> list(map(len, words))
[6, 5, 6, 4]
>>> list(filter(lambda w: "a" in w, words))
['banana', 'date']
```

在现代 Python 中，`map` 和 `filter` 大多可以被推导式取代（`[len(w) for w in words]` 通常更易读），但 `key=` 参数这种“传入函数来定制行为”的模式无处不在。

### 2. lambda 表达式

`lambda` 创建匿名函数，函数体只能是**一个表达式**：

```python
>>> square = lambda x: x * x
>>> square(7)
49
>>> square.__name__
'<lambda>'
```

lambda 只是创建函数的另一种语法，生成的函数对象和 `def` 没有本质区别。它适合作为简短的一次性参数（如 `key=lambda p: p.age`）。如果要给它起名字（如上面的 `square = lambda ...`），那就应该直接用 `def`，因为 `def` 定义的函数有正确的 `__name__`，在异常回溯中更容易识别。

### 3. operator 模块：避免简单的 lambda

```python
>>> from operator import itemgetter, attrgetter, methodcaller
>>> pairs = [("b", 2), ("a", 3), ("c", 1)]
>>> sorted(pairs, key=itemgetter(1))              # 等价于 key=lambda p: p[1]
[('c', 1), ('b', 2), ('a', 3)]
>>> itemgetter(0, 1)(["x", "y", "z"])             # 一次取多个
('x', 'y')
>>> list(map(methodcaller("upper"), ["a", "b"]))
['A', 'B']
```

`operator` 模块的这些函数用 C 实现，比等价的 lambda 更快，也更能表达意图。

### 4. functools.partial：固定部分参数

```python
>>> from functools import partial
>>> int_from_binary = partial(int, base=2)
>>> int_from_binary("1010")
10
>>> import functools
>>> pow_of_2 = partial(pow, 2)                     # 固定第一个位置参数
>>> pow_of_2(10)
1024
```

`partial` 只能从左边开始固定位置参数。如果想固定**中间**的位置参数怎么办？3.14 新增了 `functools.Placeholder`：

```python
>>> from functools import Placeholder as _P
>>> square = partial(pow, _P, 2)                   # 固定第二个参数，第一个留空
>>> square(9)
81
>>> remove_spaces = partial(str.replace, _P, " ", "")
>>> remove_spaces("a b c")
'abc'
```

### 5. 函数也可以有属性

函数对象有一个 `__dict__`，可以随意附加属性：

```python
>>> def handler():
...     pass
...
>>> handler.route = "/index"
>>> handler.methods = ["GET"]
>>> handler.__dict__
{'route': '/index', 'methods': ['GET']}
```

一些框架会利用这一点在函数上标记元数据，不过更常见的做法是用装饰器来完成，我们下一篇会讲到。

## 六、递归

Python 支持递归，但有两个需要知道的限制：

```python
>>> import sys
>>> sys.getrecursionlimit()
1000
>>> def depth(n):
...     return 0 if n == 0 else 1 + depth(n - 1)
...
>>> depth(500)
500
>>> depth(100_000)
Traceback (most recent call last):
  ...
RecursionError: maximum recursion depth exceeded
```

1. **默认递归深度限制约为 1000 层**。这个限制是为了防止无限递归耗尽内存导致解释器崩溃。可以用 `sys.setrecursionlimit` 调大，但不宜过大。
2. **Python 没有尾调用优化**。即使递归调用位于函数的最后一步，每一层仍然会保留一个栈帧。Guido 明确拒绝了尾调用优化，理由之一是它会破坏异常回溯中的调用栈信息，让调试变得困难。

所以，对于深度可能很大的递归（比如遍历一个很深的树、链表），应该改写成**循环加显式栈**的形式。对于有大量重复子问题的递归（如斐波那契数列），可以用 `functools.cache` 记忆化，我们下一篇会实现一个自己的版本。

## 七、函数调用的开销

在 CPython 中，函数调用曾经是一个相对昂贵的操作：需要创建帧对象、绑定参数、在 C 栈上递归调用求值函数。3.11 做了两个重要的优化：

- **帧对象惰性创建**：解释器内部使用轻量的帧结构，只有在真正需要时（比如调试器或 `sys._getframe()` 访问它）才创建完整的 Python 帧对象；
- **Python 到 Python 的调用内联**：调用另一个 Python 函数时，不再在 C 栈上递归调用求值函数，而是在同一个求值循环中直接“跳转”过去。

这让 3.11 的函数调用开销大幅降低。不过，在极度性能敏感的内层循环中，减少不必要的函数调用依然是一种有效的优化手段，我们在 {% post_link Python-21-Performance '第 21 篇' %} 会用实际测量来讨论。

## 小结

- `def` 是可执行语句，运行时用代码对象创建函数对象；函数对象携带默认值、全局命名空间、闭包等运行时信息。
- 参数有五类，顺序为：仅限位置、普通、`*args`、仅限关键字、`**kwargs`；`/` 和 `*` 分别是前两类和后两类的分界。
- 默认值只在定义时求值一次，可变默认值会在调用间共享；用 `None` 或专用哨兵对象代替。
- 名字是否为局部变量在编译时决定：函数中任何位置的赋值都会让它成为局部变量，这是 `UnboundLocalError` 的根源。
- 要重新绑定外层名字需要 `global` / `nonlocal`；修改可变对象则不需要。
- 函数是一等对象，可以传递、返回、附加属性；善用 `key=`、`operator`、`partial` 与 `Placeholder`。
- 默认递归深度约 1000，没有尾调用优化。

## 练习

1. 写一个函数 `call_with_log(func, *args, **kwargs)`，打印出调用时每个形参实际绑定到的值（包括使用了默认值的参数），然后执行调用并返回结果。提示：使用 `inspect.signature(...).bind(...)`。
2. 预测并解释下面代码的输出：
   <!-- norun -->
   ```python
   x = 10
   def f():
       return x
   def g():
       x = 20
       return f()
   print(g())
   ```
   这体现了 Python 使用的是“词法作用域”还是“动态作用域”？
3. 不使用 `global` 和 `nonlocal`，用“函数属性”实现一个记录自身被调用次数的函数 `counter()`。
4. 把下面的递归函数改写为使用显式栈的迭代版本，使它能处理 10 万层嵌套的列表：
   <!-- norun -->
   ```python
   def total(nested):
       return sum(total(x) if isinstance(x, list) else x for x in nested)
   ```
5. 查阅 `dis` 的输出，比较在一个循环中调用 `len(x)` 一百万次，和先执行 `_len = len` 再调用 `_len(x)` 时字节码的区别，并用 `timeit` 测量两者的性能差异。

基础篇到这里就结束了。从下一篇开始，我们进入进阶篇，第一站是建立在本篇基础之上的 {% post_link Python-07-Closures-and-Decorators '闭包与装饰器' %}。
