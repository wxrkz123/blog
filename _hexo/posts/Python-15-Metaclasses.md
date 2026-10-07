---
title: Python 从入门到精通（15）：元类与类的创建过程
date: 2026-10-07 10:45:00
summary: 类是 type 的实例。逐步追踪 class 语句的完整执行流程：确定元类、__prepare__ 准备命名空间、执行类体、type.__new__ 调用 __set_name__ 与 __init_subclass__、类装饰器；元类的 __call__ 如何控制实例创建；用 __init_subclass__ 实现插件注册；完成上一篇的迷你 ORM，自动生成建表语句。
tags:
  - Python
  - Python高级
categories:
  - Python
---

“元类是比 99% 的用户需要关心的更深层的魔法。如果你在犹豫是否需要它，那你就不需要。”——Tim Peters 的这句话常被引用来劝退学习者。确实，日常开发中很少需要自己写元类。但理解元类意味着理解**类是怎么被创建出来的**，这能让你看懂 Django ORM、`enum`、`abc`、`dataclass` 等框架和标准库的工作原理，并且知道在 `__init_subclass__`、类装饰器、元类这些工具中该如何选择。

> 本文是「Python 从入门到精通」系列第 15 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、类也是对象

第 02 篇说过，在 Python 中一切皆对象，类也不例外。既然类是对象，它就必然是某个类的实例。这个“创建类的类”，就叫做**元类**（metaclass）。默认的元类是 `type`：

```python
>>> class Foo:
...     pass
...
>>> type(Foo)                  # Foo 是 type 的实例
<class 'type'>
>>> type(int), type(list), type(type)
(<class 'type'>, <class 'type'>, <class 'type'>)
>>> isinstance(Foo, type)
True
```

这里有一个看似“鸡生蛋、蛋生鸡”的循环关系：

```python
>>> type.__bases__             # type 是一个类，它继承自 object
(<class 'object'>,)
>>> type(object)               # 而 object 是 type 的实例
<class 'type'>
>>> isinstance(type, object), isinstance(object, type)
(True, True)
```

- **继承关系**（`__bases__`）：所有类都继承自 `object`，包括 `type`；
- **实例关系**（`type()`）：所有类都是 `type` 的实例，包括 `object` 和 `type` 自己。

这种循环在 Python 代码中是无法构造出来的，它是在解释器启动时由 C 代码直接“搭建”好的。

### type 的两种用法

`type` 有两种调用方式：传一个参数时，返回对象的类型；传三个参数时，**创建一个新的类**：

```python
>>> def greet(self):
...     return f"Hi, I'm {self.name}"
...
>>> Person = type("Person", (object,), {"species": "human", "greet": greet})
>>> p = Person()
>>> p.name = "Ada"
>>> p.greet(), Person.__name__, Person.__mro__
("Hi, I'm Ada", 'Person', (<class '__main__.Person'>, <class 'object'>))
```

`class` 语句本质上就是在用一种更方便的语法调用元类。

## 二、class 语句的完整执行流程

执行一条 `class` 语句时，Python 按照下面的步骤工作（详见《语言参考》3.3.3 节 “Customizing class creation”）：

1. **解析基类**：如果基类列表中有对象定义了 `__mro_entries__`，用它的返回值替换（这是 `typing.Generic[T]` 之类的写法能出现在基类列表中的原因）。
2. **确定元类**：如果显式指定了 `metaclass=...` 就用它；否则使用基类的元类。如果多个基类的元类不同，选择其中“最派生”的那个；如果它们之间没有继承关系，报错。
3. **准备命名空间**：调用 `metaclass.__prepare__(name, bases, **kwargs)`，返回一个映射对象作为类体的命名空间。默认返回一个普通的空字典。
4. **执行类体**：在这个命名空间中执行类体的代码。
5. **创建类对象**：调用 `metaclass(name, bases, namespace, **kwargs)`。默认情况下这会执行 `type.__new__` 和 `type.__init__`。其中 `type.__new__` 会：
   - 创建类对象；
   - 对命名空间中每个定义了 `__set_name__` 的属性，调用 `attr.__set_name__(cls, name)`（第 14 篇的描述符就是在这里得知自己的名字的）；
   - 调用**父类**的 `__init_subclass__(**kwargs)`。
6. **应用类装饰器**：从下往上依次调用。
7. **绑定名字**：把最终的结果绑定到类名上。

我们写一个“全程打印”的元类，亲眼看看这个顺序：

```python
class Tracer:
    def __set_name__(self, owner, name):
        print(f"  ⑤ __set_name__: 属性 {name!r} 被绑定到类 {owner.__name__}")


class Meta(type):
    @classmethod
    def __prepare__(mcls, name, bases, **kwargs):
        print(f"  ① __prepare__: 为 {name} 准备命名空间，kwargs={kwargs}")
        return {}

    def __new__(mcls, name, bases, namespace, **kwargs):
        print(f"  ③ Meta.__new__: 命名空间中的名字 {[k for k in namespace if not k.startswith('__')]}")
        cls = super().__new__(mcls, name, bases, namespace, **kwargs)   # 必须把 kwargs 传下去！
        print(f"  ⑦ Meta.__new__: 类对象已创建")
        return cls

    def __init__(cls, name, bases, namespace, **kwargs):
        print(f"  ⑧ Meta.__init__")
        super().__init__(name, bases, namespace, **kwargs)

    def __call__(cls, *args, **kwargs):
        print(f"  ⑪ Meta.__call__: 开始创建 {cls.__name__} 的实例")
        return super().__call__(*args, **kwargs)


class Base(metaclass=Meta):
    def __init_subclass__(cls, **kwargs):
        print(f"  ⑥ Base.__init_subclass__: 子类 {cls.__name__}，kwargs={kwargs}")


def decorator(cls):
    print(f"  ⑨ 类装饰器")
    return cls


print("开始执行 class 语句")


@decorator
class Child(Base, flavor="spicy"):
    print("  ② 执行类体")
    attr = Tracer()

    def __init__(self):
        print("  ⑫ Child.__init__")


print("  ⑩ class 语句结束，名字 Child 已绑定")
obj = Child()
```

```text
  ① __prepare__: 为 Base 准备命名空间，kwargs={}
  ③ Meta.__new__: 命名空间中的名字 []
  ⑦ Meta.__new__: 类对象已创建
  ⑧ Meta.__init__
开始执行 class 语句
  ① __prepare__: 为 Child 准备命名空间，kwargs={'flavor': 'spicy'}
  ② 执行类体
  ③ Meta.__new__: 命名空间中的名字 ['attr']
  ⑤ __set_name__: 属性 'attr' 被绑定到类 Child
  ⑥ Base.__init_subclass__: 子类 Child，kwargs={'flavor': 'spicy'}
  ⑦ Meta.__new__: 类对象已创建
  ⑧ Meta.__init__
  ⑨ 类装饰器
  ⑩ class 语句结束，名字 Child 已绑定
  ⑪ Meta.__call__: 开始创建 Child 的实例
  ⑫ Child.__init__
```

（序号 ④ 是“执行类体之后、调用元类之前”，没有对应的钩子。）有几点值得注意：

- `Base` 本身也是由 `Meta` 创建的，所以定义 `Base` 时就触发了一遍流程；而 `Base.__init_subclass__` 只对**子类**生效，定义 `Base` 自身时不会被调用。
- `Child` 没有显式声明元类，但它继承了 `Base` 的元类 `Meta`。
- `class Child(Base, flavor="spicy")` 中的关键字参数 `flavor` 被传给了 `__prepare__`、元类和 `__init_subclass__`。注意 `Meta.__new__` 中的 `super().__new__(..., **kwargs)`：`__init_subclass__` 收到的参数正是 `type.__new__` 转交过去的。如果自定义元类时忘了把 `kwargs` 传给 `type.__new__`，父类的 `__init_subclass__` 就什么也收不到——写这个例子的第一版时，我就犯了这个错误。
- `__set_name__` 和 `__init_subclass__` 都是在 `type.__new__` **内部**被调用的，所以它们发生在 `Meta.__new__` 中 `super().__new__` 返回之前。

## 三、元类的 __call__：控制实例的创建

最后两行输出揭示了另一个重要的事实：`Child()` 这个调用，实际上调用的是**元类**的 `__call__` 方法（因为 `Child` 是 `Meta` 的实例，“调用一个对象”就是调用它的类型的 `__call__`，这是第 10 篇讲过的规则）。

`type.__call__` 的默认实现大致是：

<!-- norun -->
```python
def __call__(cls, *args, **kwargs):
    obj = cls.__new__(cls, *args, **kwargs)
    if isinstance(obj, cls):                 # 只有返回的是 cls 的实例时，才调用 __init__
        type(obj).__init__(obj, *args, **kwargs)
    return obj
```

这就是第 09 篇中“实例创建分为 `__new__` 和 `__init__` 两步”的出处。重写元类的 `__call__`，就能完全控制实例的创建过程，比如实现单例：

```python
>>> class SingletonMeta(type):
...     _instances = {}
...     def __call__(cls, *args, **kwargs):
...         if cls not in cls._instances:
...             cls._instances[cls] = super().__call__(*args, **kwargs)
...         return cls._instances[cls]
...
>>> class AppConfig(metaclass=SingletonMeta):
...     def __init__(self):
...         print("加载配置（只会执行一次）")
...
>>> a = AppConfig()
加载配置（只会执行一次）
>>> b = AppConfig()
>>> a is b
True
```

和第 09 篇练习中“重写 `__new__` 实现单例”相比，元类的版本没有“`__init__` 被重复调用”的问题，因为第二次调用时根本不会进入 `type.__call__`。

## 四、__prepare__：定制类体的命名空间

`__prepare__` 可以返回任意的映射对象，从而**拦截类体中的每一次赋值**。下面的元类禁止在类体中重复定义同名的方法——这是一个真实存在的 bug 来源，比如复制粘贴测试方法后忘记改名，前一个测试就被悄悄覆盖了，永远不会被执行：

```python
>>> class NoDuplicatesDict(dict):
...     def __setitem__(self, key, value):
...         if key in self and not key.startswith("__"):
...             raise TypeError(f"重复定义了 {key!r}")
...         super().__setitem__(key, value)
...
>>> class StrictMeta(type):
...     @classmethod
...     def __prepare__(mcls, name, bases):
...         return NoDuplicatesDict()
...     def __new__(mcls, name, bases, namespace):
...         return super().__new__(mcls, name, bases, dict(namespace))   # type.__new__ 需要真正的 dict
...
>>> class TestOrders(metaclass=StrictMeta):
...     def test_create(self): ...
...     def test_cancel(self): ...
...     def test_create(self): ...      # 复制粘贴后忘了改名
...
Traceback (most recent call last):
  ...
TypeError: 重复定义了 'test_create'
```

在 3.6 之前（那时普通字典还不保证顺序），`__prepare__` 最常见的用途是返回一个 `OrderedDict`，以便记录类属性的定义顺序。标准库的 `enum` 模块至今仍在使用 `__prepare__` 返回一个特殊的字典 `_EnumDict`，用来实现 `auto()` 自动编号和禁止重复的成员名。

## 五、__init_subclass__：更简单的替代方案

很多过去需要元类才能实现的功能，在 3.6 引入 `__init_subclass__`（PEP 487）之后，都可以用一个普通的类方法完成。它在**每次定义子类时**被调用，非常适合实现“自动注册”：

```python
>>> class Plugin:
...     registry = {}
...     def __init_subclass__(cls, /, name=None, **kwargs):
...         super().__init_subclass__(**kwargs)          # 保持协作，把剩余参数传下去
...         key = name or cls.__name__.lower()
...         if key in Plugin.registry:
...             raise ValueError(f"插件名 {key!r} 已被占用")
...         Plugin.registry[key] = cls
...
>>> class CsvExporter(Plugin, name="csv"):
...     def export(self, rows): return "\n".join(",".join(map(str, r)) for r in rows)
...
>>> class JsonExporter(Plugin, name="json"):
...     def export(self, rows): return str(rows)
...
>>> sorted(Plugin.registry)
['csv', 'json']
>>> Plugin.registry["csv"]().export([(1, 2), (3, 4)])
'1,2\n3,4'
```

只要定义一个继承 `Plugin` 的类，它就自动出现在注册表中，无需任何额外的注册代码。

`__init_subclass__` 还常用于**校验子类是否满足约定**：

```python
>>> class Handler:
...     def __init_subclass__(cls, **kwargs):
...         super().__init_subclass__(**kwargs)
...         if not hasattr(cls, "event_type"):
...             raise TypeError(f"{cls.__name__} 必须定义 event_type 类属性")
...
>>> class ClickHandler(Handler):
...     event_type = "click"
...
>>> class BrokenHandler(Handler):
...     pass
...
Traceback (most recent call last):
  ...
TypeError: BrokenHandler 必须定义 event_type 类属性
```

错误在**类定义时**就暴露出来，而不是等到运行时调用的那一刻。

## 六、元类冲突

一个类的元类必须是它所有基类的元类的（非严格）子类。如果两个基类有互不相关的元类，Python 无法决定用哪一个：

```python
>>> class MetaA(type): pass
...
>>> class MetaB(type): pass
...
>>> class A(metaclass=MetaA): pass
...
>>> class B(metaclass=MetaB): pass
...
>>> class C(A, B): pass
...
Traceback (most recent call last):
  ...
TypeError: metaclass conflict: the metaclass of a derived class must be a (non-strict) subclass of the metaclasses of all its bases
```

这个问题在实践中确实会遇到，比如想让一个类同时继承 `abc.ABC`（元类是 `ABCMeta`）和某个框架的基类（有自己的元类）。解决办法是定义一个同时继承两个元类的新元类：`class CombinedMeta(MetaA, MetaB): pass`。这也是“能不用元类就不用元类”的原因之一：**元类是会“传染”的**，它会影响所有子类，并且很难与其他使用元类的库组合。

## 七、实战：完成迷你 ORM

上一篇我们用描述符实现了模型字段。现在用 `__init_subclass__` 在类创建时收集字段，自动生成表名和建表语句：

```python
class Field:
    sql_type = "TEXT"

    def __init__(self, *, primary_key=False, nullable=True):
        self.primary_key, self.nullable = primary_key, nullable

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value

    def ddl(self):
        parts = [self.name, self.sql_type]
        if self.primary_key:
            parts.append("PRIMARY KEY")
        elif not self.nullable:
            parts.append("NOT NULL")
        return " ".join(parts)


class IntegerField(Field):
    sql_type = "INTEGER"


class TextField(Field):
    sql_type = "TEXT"


class Model:
    def __init_subclass__(cls, /, table=None, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.__table__ = table or cls.__name__.lower() + "s"
        # 按 MRO 从基类到子类收集字段，子类可以继承并覆盖父类的字段
        fields = {}
        for klass in reversed(cls.__mro__):
            fields.update({k: v for k, v in vars(klass).items() if isinstance(v, Field)})
        cls.__fields__ = fields

    def __init__(self, **values):
        for name in self.__fields__:
            setattr(self, name, values.get(name))

    @classmethod
    def create_table_sql(cls):
        cols = ",\n    ".join(f.ddl() for f in cls.__fields__.values())
        return f"CREATE TABLE {cls.__table__} (\n    {cols}\n);"

    def insert_sql(self):
        names = [n for n in self.__fields__ if getattr(self, n) is not None]
        marks = ", ".join("?" for _ in names)
        return (f"INSERT INTO {self.__table__} ({', '.join(names)}) VALUES ({marks})",
                tuple(getattr(self, n) for n in names))


class TimestampMixin(Model):
    created_at = TextField(nullable=False)


class Article(TimestampMixin, table="articles"):
    id = IntegerField(primary_key=True)
    title = TextField(nullable=False)
    views = IntegerField()


print(Article.create_table_sql())
print(Article(title="元类入门", created_at="2026-10-07").insert_sql())

import sqlite3

db = sqlite3.connect(":memory:")
db.execute(Article.create_table_sql())
db.execute(*Article(title="元类入门", created_at="2026-10-07", views=42).insert_sql())
print(db.execute("SELECT id, title, views FROM articles").fetchall())
```

```text
CREATE TABLE articles (
    created_at TEXT NOT NULL,
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    views INTEGER
);
('INSERT INTO articles (created_at, title) VALUES (?, ?)', ('2026-10-07', '元类入门'))
[(1, '元类入门', 42)]
```

我们用不到一百行代码，就实现了一个能声明字段、继承字段、生成 SQL 并真正写入 SQLite 的模型系统。Django 的 `Model` 使用的是元类 `ModelBase`，做的事情本质上是一样的（当然要复杂得多：关系字段、管理器、迁移……）。在 3.6 之后的新代码中，这类需求大多用 `__init_subclass__` 就能满足。

## 八、该用哪个工具？

| 需求 | 推荐工具 |
|---|---|
| 修改或增强**一个**类 | 类装饰器（如 `@dataclass`、`@total_ordering`） |
| 对**所有子类**执行注册、校验、加工 | `__init_subclass__` |
| 让属性知道自己的名字 | 描述符的 `__set_name__` |
| 定制类体的命名空间（拦截类体中的赋值） | 元类的 `__prepare__` |
| 控制**类本身**的行为（如类的 `__repr__`、让类可迭代、类级别的运算符） | 元类 |
| 控制实例的创建过程（单例、缓存实例） | 元类的 `__call__`，或者更简单的工厂函数 |

最后一行的“让类本身支持某些操作”值得举个例子。`Enum` 类之所以可以 `for member in Color:` 遍历、可以 `len(Color)`、可以 `Color["RED"]`，是因为它的元类 `EnumType` 定义了 `__iter__`、`__len__` 和 `__getitem__`——特殊方法在**类型**上查找，而 `Color` 的类型正是 `EnumType`：

```python
>>> from enum import Enum
>>> class Color(Enum):
...     RED = 1
...     GREEN = 2
...
>>> type(Color).__name__, len(Color), [c.name for c in Color], Color["GREEN"]
('EnumType', 2, ['RED', 'GREEN'], <Color.GREEN: 2>)
>>> "__iter__" in type(Color).__dict__, "__iter__" in Color.__dict__
(True, False)
```

一般的原则是：**选择能完成任务的、最简单的那个工具**。类装饰器最简单、影响范围最小；`__init_subclass__` 次之；元类最强大，但也最复杂、最容易与其他代码冲突。

## 小结

- 类是元类的实例，默认元类是 `type`；`type(name, bases, ns)` 可以直接创建类。
- `class` 语句的流程：解析基类 → 确定元类 → `__prepare__` 准备命名空间 → 执行类体 → 调用元类创建类（期间调用 `__set_name__` 与父类的 `__init_subclass__`）→ 应用类装饰器 → 绑定名字。
- `Cls()` 调用的是元类的 `__call__`，它依次调用 `__new__` 和 `__init__`。
- `__prepare__` 可以拦截类体中的赋值；`__init_subclass__` 能以更简单的方式实现子类注册和校验。
- 元类会被子类继承，多个元类之间可能冲突；优先使用类装饰器和 `__init_subclass__`。

## 练习

1. 写一个元类 `AutoReprMeta`，自动为所有使用它的类生成 `__repr__`，内容包括 `__init__` 中所有参数的名字和值（提示：在元类的 `__call__` 中，用 `inspect.signature` 绑定参数并保存在实例上）。
2. 用 `__init_subclass__` 实现一个“接口检查”：基类声明 `required_methods = ("load", "save")`，任何子类如果没有实现这些方法，定义时就报错。与 `abc.abstractmethod` 相比，这种做法有何异同？
3. 实现一个元类，使得使用它的类的所有公开方法都自动被一个计时装饰器包装，并且这个行为对子类同样生效。
4. 扩展本文的迷你 ORM：为 `Model` 添加 `select(**conditions)` 类方法，生成参数化的 `SELECT` 语句；添加一个 `ForeignKey` 字段类型。
5. 不使用 `class` 语句，只用 `type()` 和 `types.new_class()` 创建一个与本文 `Child` 等价的类（包括元类和 `flavor="spicy"` 关键字参数），观察输出是否相同。

下一篇我们将进入 Python 类型系统的世界：{% post_link Python-16-Type-Hints '类型注解与静态类型检查' %}。
