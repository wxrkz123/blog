---
title: Python 从入门到精通（16）：类型注解与静态类型检查
date: 2026-10-07 10:40:00
summary: 渐进式类型系统的设计哲学；3.12 的泛型新语法与 type 语句、型变（为什么 list[int] 不是 list[float]）、Protocol 结构化类型、TypedDict 与 Literal、overload、用 ParamSpec 写保留签名的装饰器、TypeIs 收窄与 assert_never 穷尽检查；3.14 注解的延迟求值与 annotationlib。所有静态检查结果均由 mypy 实际运行得出。
tags:
  - Python
  - Python高级
categories:
  - Python
---

Python 是动态类型语言，但从 3.5 开始（PEP 484），它有了一套可选的**类型注解**系统。十年间，这套系统从最初的“写给工具看的注释”，成长为大型 Python 项目的标配：IDE 依靠它补全代码，mypy、Pyright 等检查器依靠它在运行前发现 bug，FastAPI、Pydantic 甚至依靠它在运行时生成数据校验和 API 文档。本篇讲解类型系统的核心概念，并用 mypy 的**真实输出**展示它到底能帮你发现哪些问题。

> 本文是「Python 从入门到精通」系列第 16 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、类型注解是什么，不是什么

```python
>>> def greet(name: str, times: int = 1) -> str:
...     return ", ".join([f"你好，{name}"] * times)
...
>>> greet("小明", 2)
'你好，小明, 你好，小明'
>>> greet(42, "x")                       # 类型完全不对，但 Python 运行时并不检查……
Traceback (most recent call last):
  ...
TypeError: can't multiply sequence by non-int of type 'str'
>>> greet.__annotations__                # 注解只是被保存了下来
{'name': <class 'str'>, 'times': <class 'int'>, 'return': <class 'str'>}
```

第二个调用确实报错了，但报错的原因是函数**内部**的乘法运算失败，而不是因为参数类型和注解不符。**Python 解释器在运行时不会检查类型注解**，注解只是附加在函数上的元数据。真正利用这些信息的是外部工具：

- **静态类型检查器**（mypy、Pyright 等）：在不运行代码的情况下分析代码，找出类型错误；
- **IDE**：提供准确的自动补全、跳转和重构；
- **运行时库**（Pydantic、FastAPI、`dataclasses`、`typer` 等）：读取注解来生成校验逻辑或接口。

这种设计被称为**渐进式类型**（gradual typing）：你可以只给一部分代码加上注解，没有注解的部分被视为 `Any`（任意类型），类型检查器对它们不做检查。这让已有的大型代码库可以逐步地引入类型。

## 二、基础语法

### 1. 常见类型的写法

```python
>>> from collections.abc import Callable, Iterable, Mapping, Sequence
>>> def demo(
...     a: int,
...     b: list[str],                         # 3.9+ 内置容器可以直接写泛型参数
...     c: dict[str, list[int]],
...     d: tuple[int, str],                   # 固定长度的元组：两个元素
...     e: tuple[float, ...],                 # 任意长度的同类型元组
...     f: int | None = None,                 # 3.10+ 联合类型；等价于 Optional[int]
...     g: Callable[[int, str], bool] | None = None,   # 接收 (int, str)、返回 bool 的可调用对象
... ) -> None: ...
...
```

在 3.9 之前，泛型容器需要写成 `typing.List[str]`、`typing.Dict[str, int]`；3.10 之前，联合类型需要写成 `Union[int, None]` 或 `Optional[int]`。现在，这些写法都已不再需要。

### 2. 参数用抽象类型，返回值用具体类型

一个重要的经验法则是：**参数类型尽可能宽泛，返回值类型尽可能具体**。

<!-- norun -->
```python
def total(prices: Iterable[float]) -> float:          # 好：列表、元组、集合、生成器都能传
    return sum(prices)

def total(prices: list[float]) -> float:              # 不好：不必要地限制了调用者
    return sum(prices)

def load_users() -> list[User]:                       # 返回具体类型，调用者能使用列表的全部方法
    ...
```

`collections.abc` 中的 `Iterable`、`Sequence`、`Mapping`、`MutableMapping` 等抽象类型，精确地表达了“我需要参数具备哪些能力”。

### 3. Any 与 object

两者都能接受任意值，但含义截然相反：

- `Any` 表示“**关闭类型检查**”：你可以对 `Any` 类型的值做任何操作，检查器都不会报错。它是渐进式类型的“逃生舱”。
- `object` 表示“**任意对象，但我只知道它是个对象**”：你只能对它做所有对象都支持的操作（比如 `str(x)`），调用 `x.foo()` 会被检查器报错。

当你想表达“这个函数接受任何值”时，通常应该使用 `object`，因为它依然是类型安全的。

## 三、泛型

### 1. 3.12 的新语法

**泛型**让函数和类可以“参数化”地处理类型。3.12 引入了专门的类型参数语法（PEP 695），写起来简洁了很多：

<!-- file: generics.py -->
```python
from collections.abc import Sequence


def first[T](items: Sequence[T]) -> T:            # T 是类型参数
    return items[0]


class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()


def biggest[N: (int, float)](a: N, b: N) -> N:    # 约束：N 只能是 int 或 float
    return a if a > b else b


reveal_type(first(["a", "b"]))                    # reveal_type 让检查器打印推断出的类型
reveal_type(first((1, 2.5)))

s = Stack[int]()
s.push(1)
s.push("two")                                     # 错误！
reveal_type(s.pop())
biggest(1, "2")                                   # 错误！
```

运行 `mypy generics.py`：

<!-- mypy: generics.py -->
```text
generics.py:23: note: Revealed type is "str"
generics.py:24: note: Revealed type is "float"
generics.py:28: error: Argument 1 to "push" of "Stack" has incompatible type "str"; expected "int"  [arg-type]
generics.py:29: note: Revealed type is "int"
generics.py:30: error: Value of type variable "N" of "biggest" cannot be "object"  [type-var]
Found 2 errors in 1 file (checked 1 source file)
```

在 3.12 之前，同样的代码需要先在模块级别定义 `T = TypeVar("T")`，类还要继承 `Generic[T]`。你在老代码中会经常看到这种写法，它们的含义完全相同。

### 2. type 语句：类型别名

3.12 同时引入了 `type` 语句来定义类型别名，它的值是**惰性求值**的，所以可以引用后面才定义的类型，也可以递归定义：

```python
>>> type Vector = list[float]
>>> type JSON = dict[str, JSON] | list[JSON] | str | int | float | bool | None   # 递归类型
>>> Vector
Vector
>>> Vector.__value__
list[float]
>>> type Pair[T] = tuple[T, T]                   # 泛型别名
>>> Pair[int].__value__
tuple[T, T]
```

## 四、型变：为什么 list[int] 不是 list[float]

`int` 可以用在任何需要 `float` 的地方（类型系统规定 `int` 与 `float` 兼容）。那么 `list[int]` 可以用在需要 `list[float]` 的地方吗？直觉上可以，但答案是**不行**：

<!-- file: variance.py -->
```python
from collections.abc import Sequence


def append_half(nums: list[float]) -> None:
    nums.append(0.5)                    # 往 float 列表里加一个 float，天经地义


def average(nums: Sequence[float]) -> float:
    return sum(nums) / len(nums)


ints: list[int] = [1, 2, 3]
append_half(ints)                       # 如果允许，ints 中就混进了一个 float！
print(average(ints))                    # Sequence 是只读的，所以这里是安全的
```

<!-- mypy: variance.py -->
```text
variance.py:13: error: Argument 1 to "append_half" has incompatible type "list[int]"; expected "list[float]"  [arg-type]
variance.py:13: note: "list" is invariant -- see https://mypy.readthedocs.io/en/stable/common_issues.html#variance
variance.py:13: note: Consider using "Sequence" instead, which is covariant
Found 1 error in 1 file (checked 1 source file)
```

这就是**型变**（variance）问题：

- **不变**（invariant）：`list[int]` 和 `list[float]` 之间没有任何兼容关系。因为列表是**可变**的，如果允许把 `list[int]` 当作 `list[float]`，函数就可以往里面写入 `float`，破坏原列表的类型。
- **协变**（covariant）：`Sequence[int]` 是 `Sequence[float]` 的子类型。因为 `Sequence` 是**只读**的，只能从中取出元素，取出的 `int` 当作 `float` 使用完全没问题。
- **逆变**（contravariant）：`Callable[[float], None]` 是 `Callable[[int], None]` 的子类型。一个能处理任何 `float` 的函数，当然也能处理 `int`。所以函数类型在**参数**位置上是逆变的。

mypy 的提示也给出了解决方案：如果函数只读取参数，就把参数声明为 `Sequence` 而不是 `list`——这正是上一节“参数用抽象类型”的另一个理由。使用 3.12 新语法定义的泛型类，型变会由检查器根据类型参数的使用方式**自动推断**。

## 五、Protocol：结构化类型

Python 的鸭子类型关注“对象能做什么”，而不是“对象是什么类”。传统的类型注解基于继承关系（名义类型，nominal typing），这与鸭子类型格格不入。**`Protocol`**（3.8，PEP 544）引入了**结构化类型**（structural typing）：只要一个类实现了协议中规定的方法，它就自动满足这个协议，**无需继承**。

<!-- file: protocols.py -->
```python
from typing import Protocol


class SupportsClose(Protocol):
    def close(self) -> None: ...


class File:                                       # 没有继承 SupportsClose
    def close(self) -> None:
        print("文件已关闭")


class Socket:
    def close(self) -> None:
        print("连接已断开")


class Robot:
    def shutdown(self) -> None: ...


def close_all(things: list[SupportsClose]) -> None:
    for t in things:
        t.close()


close_all([File(), Socket()])                    # 结构匹配，检查通过
close_all([Robot()])                             # Robot 没有 close 方法
```

<!-- mypy: protocols.py -->
```text
protocols.py:28: error: List item 0 has incompatible type "Robot"; expected "SupportsClose"  [list-item]
Found 1 error in 1 file (checked 1 source file)
```

标准库中的 `Iterable`、`Sized`、`Hashable` 等本质上都是协议。用 `@typing.runtime_checkable` 装饰的协议还可以用于 `isinstance` 检查（只检查方法是否存在，不检查签名）。在设计库的接口时，`Protocol` 往往比抽象基类更灵活：使用者不需要依赖你的库来继承某个基类。

## 六、更精确的类型

### 1. Literal、Final 与 TypedDict

<!-- file: precise.py -->
```python
from typing import Final, Literal, NotRequired, TypedDict

Mode = Literal["r", "w", "a"]                    # 只能是这几个字面量之一
MAX_RETRIES: Final = 3                            # 常量：不允许重新赋值


class Movie(TypedDict):                           # 描述“具有固定键的字典”，常用于 JSON
    title: str
    year: int
    rating: NotRequired[float]                    # 可选的键


def open_file(path: str, mode: Mode) -> None: ...


open_file("a.txt", "r")
open_file("a.txt", "rw")                          # 错误：不是合法的字面量
MAX_RETRIES = 5                                   # 错误：Final 不能重新赋值
m: Movie = {"title": "流浪地球", "year": "2019"}  # 错误：year 应该是 int
print(m["rating"])                                # 注意：mypy 不会因为可能缺失的键报错，但会知道它的类型
```

<!-- mypy: precise.py -->
```text
precise.py:17: error: Argument 2 to "open_file" has incompatible type "Literal['rw']"; expected "Literal['r', 'w', 'a']"  [arg-type]
precise.py:18: error: Cannot assign to final name "MAX_RETRIES"  [misc]
precise.py:19: error: Incompatible types (expression has type "str", TypedDict item "year" has type "int")  [typeddict-item]
Found 3 errors in 1 file (checked 1 source file)
```

`TypedDict` 在运行时就是一个普通的 `dict`，没有任何额外开销，非常适合为 JSON 数据添加类型。3.13 还增加了 `ReadOnly`，用于标记只读的键。

### 2. overload：一个函数，多种签名

当函数的返回类型取决于参数的类型或值时，可以用 `@overload` 描述每一种情况：

<!-- file: overloads.py -->
```python
from typing import Literal, overload


@overload
def fetch(raw: Literal[True]) -> bytes: ...
@overload
def fetch(raw: Literal[False] = ...) -> str: ...
def fetch(raw: bool = False) -> str | bytes:      # 真正的实现，不对外暴露
    data = b"hello"
    return data if raw else data.decode()


reveal_type(fetch())
reveal_type(fetch(raw=True))
```

<!-- mypy: overloads.py -->
```text
overloads.py:13: note: Revealed type is "str"
overloads.py:14: note: Revealed type is "bytes"
Success: no issues found in 1 source file
```

没有 `overload` 的话，两次调用的返回类型都只能是 `str | bytes`，调用者每次都要自己判断。标准库中的 `open()` 就是用 `overload` 根据 `mode` 参数返回 `TextIOWrapper` 或 `BufferedReader` 的。

## 七、为装饰器添加类型：ParamSpec

第 07 篇写的装饰器，如果简单地注解为 `Callable[..., Any]`，被装饰函数的参数信息就全部丢失了，检查器无法再检查调用是否正确。`ParamSpec`（3.10，PEP 612）可以“捕获”一个函数的完整参数列表：

<!-- file: deco.py -->
```python
import functools
from collections.abc import Callable


def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]:    # **P 捕获参数，R 捕获返回值
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper


@logged
def add(a: int, b: int) -> int:
    return a + b


reveal_type(add)
add(1, 2)
add("1", 2)                                     # 错误能被发现，因为签名被完整保留
```

<!-- mypy: deco.py -->
```text
deco.py:18: note: Revealed type is "def (a: int, b: int) -> int"
deco.py:20: error: Argument 1 to "add" has incompatible type "str"; expected "int"  [arg-type]
Found 1 error in 1 file (checked 1 source file)
```

如果装饰器会给函数**增加**或**去掉**参数（比如自动注入一个数据库连接作为第一个参数），可以配合 `typing.Concatenate` 来描述。

## 八、类型收窄与穷尽检查

检查器会根据 `isinstance`、`is None`、`match` 等条件**收窄**（narrow）变量的类型。3.13 新增的 `TypeIs` 让你可以编写自定义的收窄函数；`assert_never` 则可以实现**穷尽检查**：确保所有可能的情况都被处理了。

<!-- file: narrowing.py -->
```python
from collections.abc import Sequence
from enum import Enum
from typing import TypeIs, assert_never


class Shape(Enum):
    CIRCLE = "circle"
    SQUARE = "square"
    TRIANGLE = "triangle"


def is_str_seq(val: Sequence[object]) -> TypeIs[Sequence[str]]:
    return all(isinstance(x, str) for x in val)


def process(val: Sequence[object]) -> None:
    if is_str_seq(val):
        reveal_type(val)                 # 在这个分支中，val 被收窄为 Sequence[str]
        print(", ".join(val))


def sides(shape: Shape) -> int:
    match shape:
        case Shape.CIRCLE:
            return 0
        case Shape.SQUARE:
            return 4
        case _:
            assert_never(shape)          # 忘了处理 TRIANGLE：检查器会报错
```

<!-- mypy: narrowing.py -->
```text
narrowing.py:18: note: Revealed type is "typing.Sequence[str]"
narrowing.py:29: error: Argument 1 to "assert_never" has incompatible type "Literal[Shape.TRIANGLE]"; expected "Never"  [arg-type]
Found 1 error in 1 file (checked 1 source file)
```

顺便一提，这个例子的第一版我写的是 `def is_str_list(val: list[object]) -> TypeIs[list[str]]`，mypy 立刻报错：`Narrowed type "list[str]" is not a subtype of input type "list[object]"`。原因正是第四节讲的型变：`TypeIs` 要求收窄后的类型必须是输入类型的子类型，而 `list` 是不变的，`list[str]` 并不是 `list[object]` 的子类型；换成协变的 `Sequence` 就没有问题了。（如果确实需要处理 `list`，可以改用限制更宽松的 `TypeGuard`。）

穷尽检查是一个极其有用的技巧：以后给 `Shape` 增加一个新成员时，所有没有处理它的 `match` 语句都会被类型检查器一一指出来，而不是在运行时才出 bug。

## 九、运行时的注解：3.14 的延迟求值

### 1. 前向引用问题

在 3.14 之前，注解在**函数定义时**就会被求值。这带来了一个经典问题——引用尚未定义的类：

<!-- norun -->
```python
class Node:
    def add_child(self, child: Node) -> None: ...   # 3.13 及以前：NameError！类体执行时 Node 还不存在
```

以前的解决办法是写成字符串 `"Node"`，或者在文件开头加上 `from __future__ import annotations`（PEP 563），让所有注解都变成字符串。

### 2. PEP 649：注解的延迟求值

3.14 采用了新的方案（PEP 649 / PEP 749）：注解不再在定义时求值，而是被编译成一个特殊的函数（`__annotate__`），只有在**真正访问** `__annotations__` 时才求值。这样，前向引用不再需要加引号，而且没有用到注解的程序完全不需要为它们付出性能代价：

```python
>>> class Node:
...     def add_child(self, child: Node) -> None: ...     # 3.14：直接引用自身，不需要引号
...
>>> Node.add_child.__annotations__
{'child': <class '__main__.Node'>, 'return': None}
>>> def f(x: UndefinedType) -> int: ...                  # 引用一个根本不存在的名字
...
>>> f.__annotations__                                    # 求值时才会报错
Traceback (most recent call last):
  ...
NameError: name 'UndefinedType' is not defined
```

新增的 `annotationlib` 模块可以用不同的“格式”来获取注解，在名字暂时无法解析时也不会失败：

```python
>>> import annotationlib
>>> annotationlib.get_annotations(f, format=annotationlib.Format.STRING)
{'x': 'UndefinedType', 'return': 'int'}
>>> annotationlib.get_annotations(f, format=annotationlib.Format.FORWARDREF)
{'x': ForwardRef('UndefinedType', owner=<function f at 0x...>), 'return': <class 'int'>}
```

对于框架作者来说，这意味着应该使用 `annotationlib.get_annotations()`（或者 `typing.get_type_hints()`）来读取注解，而不是直接访问 `__annotations__` 属性。对于普通用户来说，`from __future__ import annotations` 在 3.14 之后基本不再需要了。

## 十、工具与实践

### 1. 类型检查器

- **mypy**：最早、最成熟的类型检查器，由 Python 社区维护，本文的所有输出都来自它。
- **Pyright**：微软开发，速度快，VS Code 的 Pylance 插件就基于它，类型推断能力很强。
- 近年来也出现了用 Rust 编写的新一代检查器（如 Astral 的 ty、Meta 的 Pyrefly），速度比传统工具快一到两个数量级，值得关注。

在 `pyproject.toml` 中配置 mypy：

<!-- norun -->
```toml
[tool.mypy]
python_version = "3.14"
strict = true                    # 开启所有严格检查
warn_unreachable = true

[[tool.mypy.overrides]]
module = ["legacy.*"]            # 老代码先不那么严格
disallow_untyped_defs = false
```

### 2. 第三方库的类型

如果第三方库自己没有提供类型注解，可以从 **typeshed** 项目发布的“存根包”中获取，比如 `pip install types-requests`。存根文件（`.pyi`）只包含签名、没有实现，专门提供给类型检查器使用。

### 3. 渐进式引入的建议

1. 先给**公共接口**（模块的公开函数、类的公开方法）加注解，它们的收益最大；
2. 在 CI 中运行类型检查，阻止新的类型错误进入代码库；
3. 新代码使用严格模式，老代码逐步迁移；
4. 不要害怕偶尔使用 `Any` 和 `# type: ignore[错误码]`，但要把它们当作需要偿还的技术债；
5. 类型注解是文档，也是设计工具：如果一个函数的类型很难写清楚，往往说明它的设计有问题。

## 小结

- 类型注解在运行时不被检查，由类型检查器、IDE 和运行时库使用；Python 采用渐进式类型。
- 参数用抽象类型（`Iterable`、`Sequence`），返回值用具体类型；“任意值”优先用 `object` 而不是 `Any`。
- 3.12 起用 `def f[T](...)`、`class C[T]`、`type Alias = ...` 定义泛型和别名。
- 可变容器是不变的（`list[int]` 不是 `list[float]`），只读容器是协变的，函数参数是逆变的。
- `Protocol` 实现结构化类型；`Literal`、`TypedDict`、`Final`、`overload` 让类型更精确；`ParamSpec` 为装饰器保留签名。
- `TypeIs` 自定义收窄，`assert_never` 实现穷尽检查。
- 3.14 起注解延迟求值，前向引用无需引号，读取注解用 `annotationlib.get_annotations()`。

## 练习

1. 为第 07 篇的 `retry` 装饰器（带参数）添加完整的类型注解，使被装饰函数的签名被保留，并用 mypy 验证。
2. 定义一个协议 `SupportsLessThan`，然后写一个泛型函数 `max_of[T: SupportsLessThan](items: Iterable[T]) -> T`，并验证它对 `int`、`str` 有效，对没有实现 `__lt__` 的类报错。
3. 用 `TypedDict` 描述 GitHub API 返回的一个仓库信息（包括嵌套的 `owner` 对象），写一个函数读取它，体会 IDE 补全带来的便利。
4. 解释为什么 `Callable[[object], None]` 可以赋值给 `Callable[[int], None]` 类型的变量，反过来却不行。写代码让 mypy 验证你的结论。
5. 选择你的一个已有项目，开启 `mypy --strict`，统计报错数量，然后修复其中一个模块的全部错误，记录你发现了哪些真正的 bug。

下一篇我们将进入并发编程的世界：{% post_link Python-17-Concurrency '线程、进程与 GIL' %}。
