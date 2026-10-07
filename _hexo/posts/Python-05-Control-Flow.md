---
title: Python 从入门到精通（05）：流程控制、推导式与模式匹配
date: 2026-10-07 11:35:00
summary: 条件判断的短路求值与链式比较、循环的 else 子句、海象运算符、range 的惰性与 O(1) 成员测试；推导式的作用域规则与 3.12 内联优化；结构化模式匹配 match 的全部模式类型与常见陷阱，最后用它写一个表达式求值器。
tags:
  - Python
  - Python基础
categories:
  - Python
---

程序的逻辑由三种基本结构组成：顺序、分支、循环。Python 在这三者之上又提供了推导式和结构化模式匹配这样表达力极强的语法。本篇会把这些语法的**精确语义**讲清楚——很多看似简单的东西，比如 `and`/`or` 的返回值、`for` 循环的 `else`、推导式的作用域，都藏着值得深究的细节。

> 本文是「Python 从入门到精通」系列第 05 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、条件判断

### 1. if / elif / else

```python
>>> def grade(score):
...     if score >= 90:
...         return "A"
...     elif score >= 80:
...         return "B"
...     elif score >= 60:
...         return "C"
...     else:
...         return "F"
...
>>> [grade(s) for s in (95, 85, 70, 30)]
['A', 'B', 'C', 'F']
```

条件可以是任意对象，判断规则就是上一篇提到的**真值测试**：`None`、`False`、数值零、空容器为假，其余为真。

### 2. 条件表达式（三元运算）

```python
>>> age = 20
>>> "成年" if age >= 18 else "未成年"
'成年'
```

注意语序是 `值1 if 条件 else 值2`，和 C 语言的 `条件 ? 值1 : 值2` 不同。条件表达式适合简单的二选一，嵌套使用会严重损害可读性。

### 3. and / or 返回的是操作数，不是布尔值

这是 Python 和很多语言的一个重要区别：

```python
>>> 0 or "default"
'default'
>>> "value" or "default"
'value'
>>> [] and "never"
[]
>>> 1 and 2 and 3
3
```

精确的规则是：

- `x or y`：如果 `x` 为真，返回 `x`；否则返回 `y`。
- `x and y`：如果 `x` 为假，返回 `x`；否则返回 `y`。

并且它们都是**短路求值**的：一旦结果确定，就不再计算后面的操作数。这使得 `x or default` 成为一种常见的“提供默认值”的写法，但它有一个陷阱：

```python
>>> def set_volume(level=None):
...     level = level or 50          # 想要：没传参数时用默认值 50
...     return level
...
>>> set_volume(80), set_volume()
(80, 50)
>>> set_volume(0)                    # 用户明确想静音，却得到了 50！
50
```

`0` 是假值，被 `or` 跳过了。当合法值中包含 `0`、`""`、`[]` 这类假值时，必须显式判断 `None`：`level = 50 if level is None else level`。

`not` 则不同，它总是返回 `True` 或 `False`。

### 4. 链式比较

```python
>>> x = 5
>>> 1 < x < 10
True
>>> 1 < x > 3          # 合法但难读，等价于 1 < x and x > 3
True
```

`a < b < c` 在语义上等价于 `a < b and b < c`，但 `b` **只求值一次**。这是数学写法在编程语言中的自然延续。但要小心一些看似合理、实则意外的链式比较：

```python
>>> False == False in [False]
True
```

很多人会以为这是 `(False == False) in [False]`，即 `True in [False]`，结果应该是 `False`。但 `==` 和 `in` 都是比较运算符，于是它被解析成了链式比较 `False == False and False in [False]`，结果是 `True`。

### 5. 用字典代替长长的 if-elif

当分支是“根据某个值选择不同的处理”时，用字典做分派往往比一长串 `elif` 更清晰，也更容易扩展：

```python
>>> import operator
>>> OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}
>>> def calc(a, op, b):
...     try:
...         return OPS[op](a, b)
...     except KeyError:
...         raise ValueError(f"不支持的运算符: {op}") from None
...
>>> calc(6, "*", 7)
42
```

更复杂的分支结构，则可以使用后面要讲的 `match` 语句。

## 二、循环

### 1. while 循环与海象运算符

```python
>>> n, steps = 27, 0
>>> while n != 1:                    # 考拉兹猜想：27 需要多少步归一
...     n = n // 2 if n % 2 == 0 else 3 * n + 1
...     steps += 1
...
>>> steps
111
```

3.8 引入的**赋值表达式** `:=`（因为长得像海象的眼睛和牙齿，常被称为“海象运算符”）可以在表达式内部完成赋值。它最典型的用途是消除“先赋值、再判断”的重复：

```python
>>> import io
>>> stream = io.BytesIO(b"abcdefghij")
>>> chunks = []
>>> while chunk := stream.read(4):   # 读取并判断，一步完成
...     chunks.append(chunk)
...
>>> chunks
[b'abcd', b'efgh', b'ij']
```

没有海象运算符时，只能写成 `while True:` 加 `if not chunk: break`，或者在循环前后各写一次 `read`。海象运算符还常用于推导式中，避免重复计算：

```python
>>> data = ["10", "x", "25", "-3", "abc"]
>>> [n for s in data if (n := int(s) if s.lstrip("-").isdigit() else None) is not None]
[10, 25, -3]
```

不过请克制使用：它的目的是消除重复，而不是把多行代码挤成一行。

### 2. for 循环：遍历可迭代对象

Python 的 `for` 不是 C 风格的“计数循环”，而是“遍历一个可迭代对象中的每个元素”。任何实现了迭代协议的对象都能被 `for` 遍历——列表、字符串、字典、文件、生成器……协议的细节留到 {% post_link Python-08-Iterators-and-Generators '第 08 篇' %} 讲解。

需要下标时，使用 `enumerate` 而不是 `range(len(...))`：

```python
>>> fruits = ["apple", "banana", "cherry"]
>>> for i, fruit in enumerate(fruits, start=1):
...     print(i, fruit)
...
1 apple
2 banana
3 cherry
```

并行遍历多个序列时，使用 `zip`。默认情况下 `zip` 在最短的序列耗尽时停止，这可能会**静默地丢失数据**；3.10 起可以加上 `strict=True`，长度不一致时直接报错：

```python
>>> names = ["Alice", "Bob", "Carol"]
>>> scores = [90, 85]
>>> list(zip(names, scores))                 # Carol 被悄悄丢掉了
[('Alice', 90), ('Bob', 85)]
>>> list(zip(names, scores, strict=True))
Traceback (most recent call last):
  ...
ValueError: zip() argument 2 is shorter than argument 1
>>> dict(zip(["a", "b"], [1, 2]))            # 两个列表组合成字典
{'a': 1, 'b': 2}
```

### 3. range 对象：惰性的数字序列

```python
>>> r = range(0, 10**12, 3)      # 一万亿以内 3 的倍数
>>> len(r)
333333333334
>>> r[1000]
3000
>>> 999_999_999_999 in r          # 瞬间返回，并不会遍历
True
>>> r[10:20:2]                    # 切片得到的还是 range
range(30, 60, 6)
```

`range` 并不在内存中存储所有数字，只存 `start`、`stop`、`step` 三个值。下标访问、长度、甚至对整数的成员测试都是通过数学计算完成的，复杂度 O(1)。所以 `range(10**12)` 不会耗尽内存。

### 4. break、continue 与循环的 else

`break` 立即跳出循环，`continue` 跳到下一次迭代。Python 的循环还有一个其他语言少见的 `else` 子句：**当循环正常结束（没有被 `break` 打断）时执行**。

```python
>>> def find_first_negative(nums):
...     for i, n in enumerate(nums):
...         if n < 0:
...             print(f"找到负数 {n}，位置 {i}")
...             break
...     else:
...         print("没有负数")
...
>>> find_first_negative([3, 1, -4, 1])
找到负数 -4，位置 2
>>> find_first_negative([3, 1, 4])
没有负数
```

“搜索”是 `for-else` 最经典的场景：`else` 分支代表“搜遍了也没找到”，省去了一个标志变量。不过 `else` 这个关键字选得并不直观（很多人误以为是“循环一次都没执行时”），可以把它理解为 `nobreak`。

### 5. 循环变量的作用域

Python 没有块级作用域，`for` 循环的变量在循环结束后依然存在，值是最后一次迭代的值：

```python
>>> for i in range(3):
...     pass
...
>>> i
2
```

这个特性有时会造成意外，比如在循环里创建函数时（“延迟绑定”问题）。我们会在 {% post_link Python-07-Closures-and-Decorators '第 07 篇' %} 详细分析。

## 三、推导式

推导式（comprehension）是 Python 最具特色的语法之一，它用一种接近数学集合表示法的方式，从一个可迭代对象构造出新的容器。

### 1. 四种推导式

```python
>>> nums = [3, 1, 4, 1, 5, 9, 2, 6]
>>> [n * n for n in nums if n % 2 == 0]              # 列表推导式
[16, 4, 36]
>>> {n % 3 for n in nums}                            # 集合推导式
{0, 1, 2}
>>> {n: n * n for n in nums if n > 4}                # 字典推导式
{5: 25, 9: 81, 6: 36}
>>> sum(n * n for n in nums)                         # 生成器表达式（作为唯一参数时可省略括号）
173
```

注意，没有“元组推导式”：`(x for x in ...)` 得到的是**生成器表达式**，它是惰性求值的，只有在被迭代时才逐个产生值，不会一次性构建整个容器。对于 `sum`、`max`、`any`、`"".join` 这类只需遍历一次的场景，生成器表达式更节省内存。

### 2. 多重循环与条件

推导式中可以有多个 `for` 和 `if`，它们的顺序和**等价的嵌套循环从外到内的顺序一致**：

```python
>>> [(x, y) for x in range(3) for y in range(3) if x < y]
[(0, 1), (0, 2), (1, 2)]
>>> matrix = [[1, 2, 3], [4, 5, 6]]
>>> [x for row in matrix for x in row]               # 展平：外层循环写在前面
[1, 2, 3, 4, 5, 6]
>>> [[row[i] for row in matrix] for i in range(3)]   # 转置：嵌套推导式
[[1, 4], [2, 5], [3, 6]]
```

上面第二个推导式等价于：

<!-- norun -->
```python
result = []
for row in matrix:
    for x in row:
        result.append(x)
```

另外，`if` 放在推导式末尾表示**过滤**，而放在表达式里的 `a if cond else b` 是**条件表达式**，两者含义完全不同：

```python
>>> [n for n in range(6) if n % 2]                    # 过滤：只保留奇数
[1, 3, 5]
>>> ["odd" if n % 2 else "even" for n in range(4)]    # 映射：每个元素都保留
['even', 'odd', 'even', 'odd']
```

### 3. 推导式的作用域

在 Python 3 中，推导式里的循环变量**不会泄漏**到外部：

```python
>>> x = "outer"
>>> [x for x in range(3)]
[0, 1, 2]
>>> x
'outer'
```

这是因为推导式在语义上拥有自己独立的作用域。在 3.12 之前，CPython 的实现方式是：每个推导式都被编译成一个隐藏的嵌套函数，执行时创建并调用它。这带来了额外的函数调用开销。3.12 起（PEP 709），列表、集合、字典推导式被**内联**到外层代码中，不再创建函数对象，执行速度最多提升约一倍，同时在语义上依然保持变量隔离。

不过，“独立作用域”在类定义中会导致一个令人困惑的现象：

```python
>>> class Config:
...     factor = 10
...     values = [factor * i for i in range(3)]
...
Traceback (most recent call last):
  ...
NameError: name 'factor' is not defined
```

类体中的名字不会被它内部的嵌套作用域（函数、推导式）看到——这和类中定义的方法不能直接访问类变量是同一个规则。唯一的例外是推导式**最外层的可迭代对象**，它在外层作用域中求值：`[i for i in range(factor)]` 是可以工作的。

### 4. 何时不用推导式

推导式适合“从一个序列构造另一个序列”。以下情况应该改用普通循环：

- 逻辑复杂，需要多层嵌套或多个条件，一行写不下；
- 主要目的是**副作用**（如打印、写文件）而不是构造新容器。`[print(x) for x in items]` 会构造一个全是 `None` 的列表然后丢弃，这是一种误用。

## 四、结构化模式匹配：match 语句

3.10 引入的 `match` 语句（PEP 634～636）常被误认为是“Python 版的 switch”。实际上它强大得多：它不仅能匹配值，还能**匹配数据的结构**，并在匹配的同时**解构**出其中的部分。

### 1. 字面量模式与通配符

```python
>>> def http_status(code):
...     match code:
...         case 200:
...             return "OK"
...         case 301 | 302:                  # 或模式
...             return "Redirect"
...         case 404:
...             return "Not Found"
...         case _:                          # 通配符：匹配任何值，不绑定名字
...             return "Unknown"
...
>>> http_status(302), http_status(418)
('Redirect', 'Unknown')
```

`case` 按顺序尝试，第一个匹配成功的分支被执行，之后不会“贯穿”到下一个分支（不需要 `break`）。如果都不匹配，什么也不发生，也不报错。

### 2. 序列模式：匹配结构并解构

```python
>>> def handle(command):
...     match command.split():
...         case ["quit"]:
...             return "退出"
...         case ["go", direction]:                       # 捕获模式：绑定到名字
...             return f"向 {direction} 移动"
...         case ["drop", *items] if items:               # 星号捕获剩余元素；if 是守卫
...             return f"丢弃 {', '.join(items)}"
...         case ["drop"]:
...             return "要丢弃什么？"
...         case _:
...             return f"无法理解: {command!r}"
...
>>> handle("go north")
'向 north 移动'
>>> handle("drop sword shield")
'丢弃 sword, shield'
>>> handle("drop")
'要丢弃什么？'
>>> handle("dance")
"无法理解: 'dance'"
```

`case ["go", direction]` 同时检查了三件事：对象是一个序列、长度为 2、第一个元素等于 `"go"`；匹配成功后，第二个元素被绑定到 `direction`。如果用 `if` 来写，需要好几行判断。`if items` 是**守卫**（guard），只有在模式匹配成功且守卫条件为真时，分支才会被选中。

注意：序列模式不会匹配字符串（尽管字符串也是序列），这是有意为之，防止 `case [a, b]` 意外地匹配上一个两字符的字符串。

### 3. 映射模式

映射模式匹配字典这类映射对象，**只检查列出的键**，多余的键会被忽略（除非用 `**rest` 收集）。这让它非常适合处理 JSON 数据：

```python
>>> def describe(event):
...     match event:
...         case {"type": "click", "pos": [x, y]}:
...             return f"点击 ({x}, {y})"
...         case {"type": "key", "key": str(k), **rest}:      # str(k)：类型检查并绑定
...             return f"按键 {k}，其他字段 {sorted(rest)}"
...         case {"type": t}:
...             return f"未知事件类型 {t}"
...
>>> describe({"type": "click", "pos": [10, 20], "button": "left"})
'点击 (10, 20)'
>>> describe({"type": "key", "key": "Enter", "shift": True, "ts": 1})
"按键 Enter，其他字段 ['shift', 'ts']"
>>> describe({"type": "scroll"})
'未知事件类型 scroll'
```

### 4. 类模式

类模式 `ClassName(...)` 首先用 `isinstance` 检查类型，再匹配属性：

```python
>>> from dataclasses import dataclass
>>> @dataclass
... class Point:
...     x: float
...     y: float
...
>>> def where(p):
...     match p:
...         case Point(x=0, y=0):
...             return "原点"
...         case Point(x=0, y=y):
...             return f"在 y 轴上，y={y}"
...         case Point(x, y) if x == y:                 # 位置参数形式
...             return f"在对角线上 ({x}, {y})"
...         case Point():
...             return "其他位置"
...         case _:
...             return "不是点"
...
>>> where(Point(0, 0)), where(Point(0, 5)), where(Point(3, 3)), where(Point(1, 2)), where("x")
('原点', '在 y 轴上，y=5', '在对角线上 (3, 3)', '其他位置', '不是点')
```

`Point(x, y)` 这种**位置参数**形式是怎么知道第一个参数对应属性 `x` 的？靠的是类属性 `__match_args__`：

```python
>>> Point.__match_args__
('x', 'y')
```

`dataclass` 会自动生成它；自定义类则需要手动定义。对于 `int`、`str`、`list` 等内置类型，`int(n)` 这样的写法表示“检查类型并把整个对象绑定到 `n`”，就像前面例子中的 `str(k)`。

### 5. 最大的陷阱：名字永远是捕获

```python
>>> RED = "red"
>>> def check(color):
...     match color:
...         case RED:                # 你以为在和 RED 常量比较？
...             return "是红色"
...         case _:
...             return "不是红色"
...
Traceback (most recent call last):
  ...
SyntaxError: name capture 'RED' makes remaining patterns unreachable
```

在 `case` 中，**单独的名字永远是捕获模式**：`case RED:` 的意思是“匹配任何值，并把它绑定到名字 `RED` 上”。在这个例子中由于它后面还有其他分支，编译器发现后面的分支永远不可能被执行，于是报错；但如果它是唯一或最后一个分支，代码会“正常”运行，并悄悄地覆盖掉全局变量 `RED`！

要和常量比较，必须使用**带点的名字**（值模式），比如枚举成员或模块属性：

```python
>>> from enum import Enum
>>> class Color(Enum):
...     RED = "red"
...     GREEN = "green"
...
>>> def check(color):
...     match color:
...         case Color.RED:          # 带点的名字是值模式，会用 == 比较
...             return "是红色"
...         case Color.GREEN:
...             return "是绿色"
...
>>> check(Color.RED)
'是红色'
```

### 6. 综合示例：表达式求值器

模式匹配最能发挥威力的地方是处理**树状的递归数据结构**，比如编译器中的语法树。下面用元组表示算术表达式，写一个求值器和一个化简器：

```python
def evaluate(expr, env):
    match expr:
        case int() | float():
            return expr
        case str(name):
            return env[name]
        case ("neg", x):
            return -evaluate(x, env)
        case (op, left, right):
            a, b = evaluate(left, env), evaluate(right, env)
            match op:
                case "+": return a + b
                case "-": return a - b
                case "*": return a * b
                case "/": return a / b
            raise ValueError(f"未知运算符 {op!r}")
        case _:
            raise TypeError(f"非法表达式 {expr!r}")


def simplify(expr):
    match expr:
        case (op, left, right):
            expr = (op, simplify(left), simplify(right))
    match expr:
        case ("+", 0, x) | ("+", x, 0) | ("*", 1, x) | ("*", x, 1):
            return x
        case ("*", 0, _) | ("*", _, 0):
            return 0
        case (op, int(a), int(b)) if op in "+-*":       # 常量折叠
            return evaluate(expr, {})
        case _:
            return expr


# (x + 0) * (2 * 3) - y * 1
e = ("-", ("*", ("+", "x", 0), ("*", 2, 3)), ("*", "y", 1))
print(simplify(e))
print(evaluate(e, {"x": 5, "y": 4}))
```

```text
('-', ('*', 'x', 6), 'y')
26
```

注意 `("+", 0, x) | ("+", x, 0)` 这样的或模式：每个分支都必须绑定**相同的名字集合**，否则编译器会报错。短短几十行，我们就实现了一个带常量折叠的表达式化简器。用 `if-elif` 加 `isinstance` 和 `len` 判断来写同样的逻辑，代码量会多出好几倍，而且难以阅读。

### 7. match 是怎么执行的

`match` 并不是语法糖。编译器为它生成了专门的字节码指令，比如 `MATCH_SEQUENCE`（检查是否为序列）、`MATCH_MAPPING`、`MATCH_CLASS`、`MATCH_KEYS` 等。序列模式会先检查类型和长度，再逐个比较元素；它们的执行效率与等价的手写 `isinstance` + 下标判断大致相当。需要注意的是，`match` **不会**像 C 的 `switch` 那样编译成跳转表，分支是按顺序逐个尝试的，所以把最常见的情况放在前面会稍微快一些。

## 五、pass、Ellipsis 与空语句

Python 用缩进表示代码块，代码块不能为空。需要一个“什么也不做”的占位时，使用 `pass`：

<!-- norun -->
```python
class MyError(Exception):
    pass

def todo():
    ...          # Ellipsis 也可以作为占位，常用于类型存根和“尚未实现”的函数
```

## 小结

- `and`/`or` 返回操作数本身并短路求值；`x or default` 会跳过所有假值，注意 `0` 和空字符串。
- 链式比较 `a < b < c` 只求值 `b` 一次；`in`、`==` 也参与链式比较。
- 循环的 `else` 在没有 `break` 时执行，适合“搜索未找到”的场景；循环变量在循环后依然存在。
- `range` 是惰性的，支持 O(1) 的下标、长度和成员测试；并行遍历用 `zip(strict=True)`。
- 推导式有独立作用域（3.12 起内联实现）；类体中的推导式看不到类变量。
- `match` 能匹配结构并解构；单独的名字总是捕获模式，比较常量要用带点的名字。

## 练习

1. 不运行代码，判断 `1 < 2 > 1.5 == 1.5 != 3` 的值，然后写出它展开后的等价 `and` 表达式。
2. 用 `for-else` 实现一个判断质数的函数 `is_prime(n)`，并用列表推导式求出 100 以内的所有质数。
3. 写一个函数 `flatten(obj)`，使用 `match` 把任意嵌套的列表/元组展平为一个列表，例如 `flatten([1, (2, [3, [4]]), 5])` 返回 `[1, 2, 3, 4, 5]`。字符串应作为整体保留，不能被拆成字符。
4. 扩展本文的表达式求值器：支持 `("pow", a, b)` 运算；在 `simplify` 中加入规则 `x - x → 0` 和 `x * 0 → 0`（提示：模式中不能重复使用同一个捕获名，考虑用守卫实现 `x - x`）。
5. 解释为什么下面的类定义中，`squares` 能正常创建，而 `scaled` 会抛出 `NameError`：
   <!-- norun -->
   ```python
   class A:
       n = 3
       squares = [i * i for i in range(n)]
       scaled = [i * n for i in range(3)]
   ```

下一篇我们将学习 Python 中最重要的代码组织单元：{% post_link Python-06-Functions '函数：参数、作用域与一等对象' %}。
