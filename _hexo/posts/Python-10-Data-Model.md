---
title: Python 从入门到精通（10）：数据模型与魔术方法
date: 2026-10-07 11:10:00
summary: Python 数据模型的核心思想——语法调用特殊方法，且特殊方法在类型上查找。实现一个完整的向量类：表示、算术运算的反射与 NotImplemented 分派、比较与 __eq__/__hash__ 契约；容器协议与 collections.abc；__slots__ 的内存收益；dataclass 的全部常用选项。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

为什么 `len(x)` 是一个函数，而不是 `x.length()` 方法？为什么自定义的类可以支持 `+`、`[]`、`in`、`for`、`with`？答案都在 Python 的**数据模型**（Data Model）里。官方文档《语言参考》的第 3 章 “Data model” 是理解 Python 最重要的一章，本篇就是对它的一次深度导读。学完之后，你写的类将能像内置类型一样自然地融入 Python 的语法。

> 本文是「Python 从入门到精通」系列第 10 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、数据模型的核心思想

Python 的语法和内置函数，在背后都会调用对象的**特殊方法**（special method），也就是那些前后带双下划线的方法，俗称“魔术方法”或 “dunder 方法”：

| 你写的代码 | Python 实际调用 |
|---|---|
| `len(x)` | `type(x).__len__(x)` |
| `x + y` | `type(x).__add__(x, y)`，必要时 `type(y).__radd__(y, x)` |
| `x[k]` | `type(x).__getitem__(x, k)` |
| `k in x` | `type(x).__contains__(x, k)` |
| `for i in x` | `type(x).__iter__(x)` |
| `x == y` | `type(x).__eq__(x, y)` |
| `str(x)`、`f"{x}"` | `type(x).__str__(x)`、`type(x).__format__(x, "")` |
| `x(...)` | `type(x).__call__(x, ...)` |
| `with x:` | `type(x).__enter__(x)` / `__exit__` |

这就是 Python 的设计哲学：**语言提供一套统一的协议，任何对象只要实现了对应的特殊方法，就能使用对应的语法**。`len()` 是函数而不是方法，正是为了让“获取长度”这件事对所有类型都有统一的接口；而对于内置类型，`len()` 可以直接读取 C 结构体中的长度字段，非常快。

### 特殊方法在类型上查找

注意上表中的写法是 `type(x).__len__(x)`，而不是 `x.__len__()`。这是一个重要的细节：**隐式调用特殊方法时，Python 会绕过实例字典，直接在类型上查找**。

```python
>>> class Box:
...     def __len__(self):
...         return 1
...
>>> b = Box()
>>> b.__len__ = lambda: 42           # 在实例上设置一个同名属性
>>> b.__len__()                       # 显式调用：先在实例字典中找到了它
42
>>> len(b)                            # 隐式调用：直接去类型上找，无视实例属性
1
```

这样设计有两个原因：一是性能（不需要先查实例字典）；二是避免一个微妙的问题——类本身也是对象，如果在实例上查找，那么 `hash(Box)` 会错误地找到 `Box.__hash__`（这是给 `Box` 的**实例**用的方法），而不是 `type.__hash__`。

## 二、对象的字符串表示

```python
>>> class Point:
...     def __init__(self, x, y):
...         self.x, self.y = x, y
...     def __repr__(self):
...         return f"Point({self.x!r}, {self.y!r})"     # 面向开发者：明确、无歧义
...     def __str__(self):
...         return f"({self.x}, {self.y})"               # 面向用户：简洁、可读
...     def __format__(self, spec):
...         return f"({self.x:{spec}}, {self.y:{spec}})" # 支持格式规格
...
>>> p = Point(1.5, 2)
>>> p                          # REPL 中显示 repr
Point(1.5, 2)
>>> print(p)                   # print 使用 str
(1.5, 2)
>>> f"{p:.2f}"
'(1.50, 2.00)'
>>> [p]                        # 容器的 str 会对元素使用 repr
[Point(1.5, 2)]
```

- `__repr__`：给开发者看的“官方”表示。理想情况下，它应该是一个能重新创建出相同对象的合法 Python 表达式（`eval(repr(p)) == p`）；做不到时，至少用 `<...>` 包裹提供有用的信息。**每个类都应该实现 `__repr__`**，它会出现在调试器、日志、异常信息和 REPL 中。
- `__str__`：给最终用户看的表示。如果没有定义，会退回使用 `__repr__`。
- `__format__`：支持 f-string 和 `format()` 中的格式规格。

## 三、实现一个向量类：运算符重载

下面我们逐步实现一个二维向量类 `Vector`，涵盖数值类型最常用的特殊方法。

### 1. 算术运算与 NotImplemented

```python
>>> import math
>>> class Vector:
...     __match_args__ = ("x", "y")
...     def __init__(self, x=0.0, y=0.0):
...         self.x, self.y = x, y
...     def __repr__(self):
...         return f"Vector({self.x!r}, {self.y!r})"
...     def __add__(self, other):
...         if not isinstance(other, Vector):
...             return NotImplemented          # 不是抛异常，而是返回这个特殊单例
...         return Vector(self.x + other.x, self.y + other.y)
...     def __mul__(self, scalar):
...         if not isinstance(scalar, (int, float)):
...             return NotImplemented
...         return Vector(self.x * scalar, self.y * scalar)
...     def __rmul__(self, scalar):             # 反射版本：处理 scalar * vector
...         return self * scalar
...     def __neg__(self):
...         return Vector(-self.x, -self.y)
...     def __abs__(self):
...         return math.hypot(self.x, self.y)
...     def __bool__(self):
...         return bool(self.x or self.y)
...
>>> v = Vector(3, 4)
>>> v + Vector(1, 1), v * 2, 2 * v, -v
(Vector(4, 5), Vector(6, 8), Vector(6, 8), Vector(-3, -4))
>>> abs(v), bool(Vector())
(5.0, False)
>>> v + 1
Traceback (most recent call last):
  ...
TypeError: unsupported operand type(s) for +: 'Vector' and 'int'
```

`2 * v` 能工作的关键在于**反射方法** `__rmul__`。Python 执行 `a * b` 的完整算法是：

1. 调用 `type(a).__mul__(a, b)`；
2. 如果它不存在或返回了 `NotImplemented`，就调用 `type(b).__rmul__(b, a)`；
3. 如果还是 `NotImplemented`，抛出 `TypeError`。

所以 `2 * v` 先尝试 `int.__mul__(2, v)`，`int` 不认识 `Vector`，返回 `NotImplemented`；然后尝试 `Vector.__rmul__(v, 2)`，成功。

这里有一个关键点：**当无法处理某种类型的操作数时，应该返回 `NotImplemented`，而不是抛出 `TypeError`**。返回 `NotImplemented` 是在告诉 Python：“我不知道怎么处理，问问另一个操作数吧”。如果直接抛出异常，就剥夺了另一方处理的机会，也就无法与其他类型协作。

还有一条特殊规则：**如果右操作数的类型是左操作数类型的子类，并且重写了反射方法，那么会优先调用右操作数的反射方法**。这让子类能够覆盖父类的运算行为。

### 2. 增强赋值

如果没有定义 `__iadd__`，`v += w` 会退化为 `v = v + w`，创建一个新对象。对于不可变的值对象（像我们的 `Vector`），这正是我们想要的。对于可变容器，则应该实现 `__iadd__` 进行原地修改，并**返回 `self`**：

<!-- norun -->
```python
def __iadd__(self, other):
    self._items.extend(other)
    return self               # 必须返回 self，因为结果会被重新赋值给左边的名字
```

第 02 篇中“元组里的列表”那个谜题，正是 `list.__iadd__` 原地修改成功、随后的赋值步骤失败造成的。

## 四、比较与哈希

### 1. 富比较方法

六个比较运算符对应六个特殊方法：`__eq__`、`__ne__`、`__lt__`、`__le__`、`__gt__`、`__ge__`。它们同样可以返回 `NotImplemented`，此时 Python 会尝试**反射**：`a < b` 的反射是 `b > a`，`a == b` 的反射是 `b == a`。

```python
>>> class Version:
...     def __init__(self, text):
...         self.parts = tuple(int(p) for p in text.split("."))
...     def __repr__(self):
...         return f"Version('{'.'.join(map(str, self.parts))}')"
...     def __eq__(self, other):
...         if not isinstance(other, Version):
...             return NotImplemented
...         return self.parts == other.parts
...     def __lt__(self, other):
...         if not isinstance(other, Version):
...             return NotImplemented
...         return self.parts < other.parts       # 元组按字典序比较
...
>>> Version("3.10.1") > Version("3.9")            # 没有定义 __gt__，Python 反射为 Version("3.9") < Version("3.10.1")
True
>>> sorted([Version("3.10"), Version("3.9"), Version("3.14.0")])
[Version('3.9'), Version('3.10'), Version('3.14.0')]
>>> Version("1.0") <= Version("2.0")              # 但 <= 无法由 < 和 == 自动推导
Traceback (most recent call last):
  ...
TypeError: '<=' not supported between instances of 'Version' and 'Version'
```

注意版本号比较是元组比较的经典用例：字符串比较会得出 `"3.10" < "3.9"` 的错误结论，而 `(3, 10) > (3, 9)` 是正确的。

Python 不会根据 `<` 和 `==` 自动推导出 `<=`。如果需要全部六种比较，可以用 `functools.total_ordering` 装饰器：只需定义 `__eq__` 和 `__lt__`（或其他任意一个），它会自动补全剩下的。

`__ne__` 默认会调用 `__eq__` 并取反，所以通常不需要自己实现。

### 2. 默认的相等与哈希

如果一个类没有定义 `__eq__`，它会继承 `object.__eq__`，比较的是**身份**；`object.__hash__` 则基于 `id()` 计算。所以默认情况下，每个实例只和自己相等，并且都可以哈希。

### 3. `__eq__` 与 `__hash__` 的契约

在第 04 篇中我们讲过字典的要求：**如果 `a == b`，那么必须有 `hash(a) == hash(b)`**。如果你重写了 `__eq__`，让两个不同的实例可以相等，那么基于 `id()` 的默认哈希就违反了这条契约。因此 Python 有一条规则：**一个类如果定义了 `__eq__` 而没有定义 `__hash__`，它的 `__hash__` 会被自动设为 `None`**，实例变得不可哈希：

```python
>>> Version.__hash__ is None
True
>>> {Version("1.0")}
Traceback (most recent call last):
  ...
TypeError: cannot use 'Version' as a set element (unhashable type: 'Version')
```

要让它可哈希，需要实现一个和 `__eq__` 一致的 `__hash__`，通常的做法是**对参与相等比较的那些字段组成的元组求哈希**：

<!-- norun -->
```python
def __hash__(self):
    return hash(self.parts)
```

但这里还有一个更深的要求：**参与哈希的字段在对象的生命周期内不能改变**。看看违反这一点会发生什么：

```python
>>> class MutablePoint:
...     def __init__(self, x, y):
...         self.x, self.y = x, y
...     def __eq__(self, other):
...         return (self.x, self.y) == (other.x, other.y)
...     def __hash__(self):
...         return hash((self.x, self.y))
...
>>> p = MutablePoint(1, 2)
>>> s = {p}
>>> p.x = 100                     # 修改了参与哈希的字段
>>> p in s                        # 对象明明就在集合里……
False
>>> list(s)[0] is p
True
```

修改字段后 `p` 的哈希值变了，集合去新的哈希值对应的位置查找，自然找不到。所以：**只有不可变的对象才应该是可哈希的**。值对象（如坐标、版本号、货币金额）设计成不可变的，能避免一大类 bug。

## 五、容器协议

### 1. 序列

只要实现 `__len__` 和 `__getitem__`，一个类就具备了序列的基本能力。`__getitem__` 需要同时处理整数下标和切片：

```python
>>> class Playlist:
...     def __init__(self, songs):
...         self._songs = list(songs)
...     def __len__(self):
...         return len(self._songs)
...     def __getitem__(self, index):
...         if isinstance(index, slice):
...             return Playlist(self._songs[index])     # 切片返回同类型的对象
...         return self._songs[index]
...     def __repr__(self):
...         return f"Playlist({self._songs!r})"
...
>>> pl = Playlist(["晴天", "稻香", "七里香", "夜曲"])
>>> len(pl), pl[0], pl[-1]
(4, '晴天', '夜曲')
>>> pl[1:3]
Playlist(['稻香', '七里香'])
>>> "稻香" in pl                          # 没有 __contains__，退回到逐个迭代比较
True
>>> [s for s in pl]                       # 没有 __iter__，退回到旧式序列协议
['晴天', '稻香', '七里香', '夜曲']
>>> list(reversed(pl))                    # reversed 也能利用 __len__ + __getitem__
['夜曲', '七里香', '稻香', '晴天']
```

我们只写了两个方法，`in`、`for`、`reversed` 就都能用了，这体现了 Python 协议设计的精妙：每个操作都有合理的“退路”。当然，如果有更高效的实现方式（比如 `__contains__` 用集合实现 O(1) 查找），可以显式定义对应的方法。

### 2. 借助 collections.abc

如果希望获得完整的序列接口，可以继承 `collections.abc.Sequence`。它要求你实现 `__getitem__` 和 `__len__` 两个抽象方法，然后**免费**提供 `__contains__`、`__iter__`、`__reversed__`、`index`、`count` 等方法：

```python
>>> from collections.abc import Sequence, MutableMapping
>>> class Playlist2(Playlist, Sequence):
...     pass
...
>>> pl2 = Playlist2(["a", "b", "a"])
>>> pl2.count("a"), pl2.index("b"), isinstance(pl2, Sequence)
(2, 1, True)
```

`MutableMapping` 同理：实现 `__getitem__`、`__setitem__`、`__delitem__`、`__iter__`、`__len__` 五个方法，就能获得 `get`、`pop`、`setdefault`、`update`、`keys`、`items` 等全部字典方法。这比继承 `dict` 更安全——内置 `dict` 的 C 实现中，`update`、`__init__` 等方法**不会**调用你重写的 `__setitem__`，这是继承内置类型的常见陷阱：

```python
>>> class LowerDict(dict):
...     def __setitem__(self, key, value):
...         super().__setitem__(key.lower(), value)
...
>>> d = LowerDict(A=1)                     # __init__ 没有调用重写的 __setitem__
>>> d["B"] = 2
>>> d
{'A': 1, 'b': 2}
>>> class LowerDict2(MutableMapping):
...     def __init__(self, *args, **kwargs):
...         self._data = {}
...         self.update(*args, **kwargs)    # MutableMapping.update 会调用我们的 __setitem__
...     def __getitem__(self, key): return self._data[key.lower()]
...     def __setitem__(self, key, value): self._data[key.lower()] = value
...     def __delitem__(self, key): del self._data[key.lower()]
...     def __iter__(self): return iter(self._data)
...     def __len__(self): return len(self._data)
...
>>> d2 = LowerDict2(A=1)
>>> d2["B"] = 2
>>> dict(d2), d2["a"]
({'a': 1, 'b': 2}, 1)
```

如果确实想继承内置类型并修改其行为，标准库提供了 `collections.UserDict`、`UserList`、`UserString`，它们是用 Python 实现的包装类，所有方法都会正确地经过你重写的方法。

## 六、可调用对象

实现了 `__call__` 的对象可以像函数一样被调用。我们在第 07 篇已经用它实现过装饰器。它适合“需要维护状态的函数”：

```python
>>> class Polynomial:
...     def __init__(self, *coeffs):              # 系数从低次到高次
...         self.coeffs = coeffs
...     def __call__(self, x):
...         return sum(c * x ** i for i, c in enumerate(self.coeffs))
...
>>> f = Polynomial(1, 0, 2)                        # 1 + 2x²
>>> f(3), callable(f)
(19, True)
```

## 七、__slots__：节省内存

默认情况下，每个实例都有一个 `__dict__` 字典来存放属性。字典很灵活，但也很占内存。如果一个类会创建数以百万计的实例，并且属性是固定的，可以用 `__slots__` 声明属性列表，让实例不再使用 `__dict__`，而是把属性存放在固定的槽位中：

```python
>>> import sys, tracemalloc
>>> class PointDict:
...     def __init__(self, x, y):
...         self.x, self.y = x, y
...
>>> class PointSlots:
...     __slots__ = ("x", "y")
...     def __init__(self, x, y):
...         self.x, self.y = x, y
...
>>> def measure(cls, n=100_000):
...     tracemalloc.start()
...     objs = [cls(i, i) for i in range(n)]
...     size, _ = tracemalloc.get_traced_memory()
...     tracemalloc.stop()
...     return size // n
...
>>> measure(PointDict) > measure(PointSlots)
True
>>> p = PointSlots(1, 2)
>>> p.z = 3
Traceback (most recent call last):
  ...
AttributeError: 'PointSlots' object has no attribute 'z' and no __dict__ for setting new attributes
>>> hasattr(p, "__dict__")
False
```

在 64 位的 CPython 3.14 上，这段测量代码得到的结果是：`PointDict` 平均每个实例约 127 字节，`PointSlots` 约 87 字节（两者都包含了列表中的指针和整数对象本身的开销，具体数值随版本和平台变化）。另外，由于槽位访问不需要字典查找，属性读写也会稍快一些。

使用 `__slots__` 的注意事项：

- 实例不能再添加未声明的属性（有时这正是我们想要的）；
- 如果父类没有 `__slots__`，子类的实例依然会有 `__dict__`，节省效果就没了；子类如果要继续节省，也需要声明自己的 `__slots__`（只列出新增的属性）；
- 需要弱引用时，要把 `"__weakref__"` 加入 `__slots__`。

`__slots__` 的工作原理同样是描述符：每个槽位名在类中都对应一个“成员描述符”对象，第 14 篇会解释。值得一提的是，3.11 之后 CPython 对普通实例的 `__dict__` 也做了大量优化（属性值内联存储在对象中，只有需要时才创建真正的字典），两者的差距已经比以前小了很多。

## 八、dataclass：让 Python 替你写特殊方法

写一个“数据类”需要大量样板代码：`__init__`、`__repr__`、`__eq__`，可能还有 `__hash__` 和比较方法。3.7 引入的 `dataclasses` 模块可以根据类型注解自动生成它们：

```python
>>> from dataclasses import dataclass, field, replace, asdict
>>> @dataclass(order=True, frozen=True, slots=True)
... class Money:
...     amount: int                         # 以“分”为单位，避免浮点误差
...     currency: str = "CNY"
...
>>> a, b = Money(1050), Money(990)
>>> a
Money(amount=1050, currency='CNY')
>>> a > b, a == Money(1050), hash(a) == hash(Money(1050))
(True, True, True)
>>> a.amount = 0
Traceback (most recent call last):
  ...
dataclasses.FrozenInstanceError: cannot assign to field 'amount'
>>> replace(a, currency="USD")              # 不可变对象的“修改”：创建新对象
Money(amount=1050, currency='USD')
```

常用的参数：

| 参数 | 作用 |
|---|---|
| `eq=True`（默认） | 生成 `__eq__`，按字段元组比较 |
| `order=True` | 生成 `<`、`<=`、`>`、`>=`，按字段顺序比较 |
| `frozen=True` | 实例不可变，并自动生成与 `__eq__` 一致的 `__hash__` |
| `slots=True` | （3.10+）自动生成 `__slots__` |
| `kw_only=True` | （3.10+）所有字段都只能用关键字传参 |

注意 `dataclass` 处理哈希的方式完全遵循了本文第四节的契约：`eq=True` 且 `frozen=False` 时，`__hash__` 被设为 `None`（可变对象不应可哈希）；`frozen=True` 时才生成基于字段的哈希。

可变的默认值必须使用 `default_factory`，`dataclass` 会主动拦截第 06 篇讲过的那个陷阱：

```python
>>> @dataclass
... class Team:
...     members: list = []
...
Traceback (most recent call last):
  ...
ValueError: mutable default <class 'list'> for field members is not allowed: use default_factory
>>> @dataclass
... class Team:
...     name: str
...     members: list[str] = field(default_factory=list)
...     size: int = field(init=False)                 # 不出现在 __init__ 参数中
...     def __post_init__(self):                      # __init__ 之后自动调用，用于派生字段或校验
...         self.size = len(self.members)
...
>>> t = Team("后端组", ["张三", "李四"])
>>> t
Team(name='后端组', members=['张三', '李四'], size=2)
>>> asdict(t)
{'name': '后端组', 'members': ['张三', '李四'], 'size': 2}
```

`dataclass` 不做运行时类型检查，注解只是用来识别字段。如果需要对外部输入（如 JSON、表单）做严格的类型校验和转换，可以使用第三方库 **Pydantic**；如果需要更多高级特性，可以看看 **attrs**，它是 `dataclasses` 的灵感来源。

## 小结

- 语法与内置函数通过特殊方法实现，并且隐式调用时在**类型**上查找特殊方法。
- 每个类都应实现 `__repr__`；`__str__` 面向用户，`__format__` 支持格式规格。
- 二元运算无法处理时返回 `NotImplemented`，让 Python 尝试另一个操作数的反射方法；子类的反射方法有优先权。
- 定义 `__eq__` 会让 `__hash__` 变为 `None`；可哈希对象的相等字段必须不可变，且 `a == b` 蕴含 `hash(a) == hash(b)`。
- 实现 `__len__` + `__getitem__` 即可获得基本的序列行为；需要完整接口时继承 `collections.abc` 中的抽象基类，而不是直接继承 `dict`/`list`。
- `__slots__` 用固定槽位代替 `__dict__`，适合海量小对象。
- `dataclass` 自动生成样板方法，`frozen=True` 得到可哈希的不可变值对象。

## 练习

1. 完善本文的 `Vector`：实现 `__eq__`、`__hash__`（使其成为不可变值对象，提示：可以把属性改为只读 `property`）、`__iter__`（使 `x, y = v` 能工作）、点积运算 `@`（对应 `__matmul__`），以及 `__format__` 中的极坐标格式（如 `f"{v:p}"` 输出 `<长度, 角度>`）。
2. 实现一个 `Matrix` 类，支持 `m[i, j]` 形式的二维下标（提示：`m[i, j]` 传给 `__getitem__` 的是元组 `(i, j)`）、矩阵加法和乘法。
3. 用 `MutableMapping` 实现一个 `TTLDict`：每个键在设置后 N 秒自动过期，过期的键在访问时表现得像不存在一样。
4. 写一个实验，验证“定义了 `__eq__` 而没有定义 `__hash__` 的类，其子类如果只定义了 `__hash__`”会发生什么，并解释原因。
5. 比较 `dataclass(slots=True)`、`NamedTuple`、普通类、带 `__slots__` 的普通类四种方式创建 100 万个对象的内存占用和创建时间。

下一篇我们将讨论程序出错时会发生什么：{% post_link Python-11-Exceptions-and-Context-Managers '异常处理与上下文管理器' %}。
