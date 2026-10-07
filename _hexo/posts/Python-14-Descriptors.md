---
title: Python 从入门到精通（14）：描述符与属性访问机制
date: 2026-10-07 10:50:00
summary: 揭开 property、方法绑定、classmethod、__slots__、cached_property 背后的共同原理——描述符协议。数据描述符与非数据描述符的优先级，用纯 Python 复刻 object.__getattribute__ 的完整查找算法，手写 property / classmethod / cached_property，修复类装饰器装饰方法的问题，并构建一个迷你 ORM 字段系统。
tags:
  - Python
  - Python高级
categories:
  - Python
---

在前面的文章里，我们好几次说到“这个留到第 14 篇再解释”：为什么通过实例访问函数会得到绑定方法？`property` 是怎么拦截属性读写的？`__slots__` 把属性存到哪里去了？用类实现的装饰器为什么不能装饰方法？这些问题的答案是同一个——**描述符协议**（descriptor protocol）。它是 Python 对象模型中最核心、也最优雅的机制之一。理解了描述符，你就理解了 Python 中“点号”到底做了什么。

> 本文是「Python 从入门到精通」系列第 14 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、从一个重复的问题说起

假设我们要写一个商品类，要求价格和库存都必须是非负数。用第 09 篇学过的 `property` 可以这样写：

<!-- norun -->
```python
class Product:
    def __init__(self, price, stock):
        self.price = price
        self.stock = stock

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError("price 不能为负")
        self._price = value

    @property
    def stock(self):
        return self._stock

    @stock.setter
    def stock(self, value):
        if value < 0:
            raise ValueError("stock 不能为负")
        self._stock = value
```

两个属性，几乎一模一样的代码写了两遍。如果有十个字段需要校验呢？我们需要一种方式，把“对某个属性的读写进行拦截”这个逻辑**封装成可复用的对象**——这正是描述符。

## 二、描述符协议

**描述符**是一个定义了以下任意方法的对象，并且它作为**类属性**存在：

| 方法 | 触发时机 |
|---|---|
| `__get__(self, instance, owner)` | 读取属性：`obj.attr` 或 `Class.attr` |
| `__set__(self, instance, value)` | 赋值属性：`obj.attr = value` |
| `__delete__(self, instance)` | 删除属性：`del obj.attr` |
| `__set_name__(self, owner, name)` | 类创建时，告诉描述符它被赋给了哪个名字（3.6+） |

用描述符重写上面的例子：

```python
>>> class NonNegative:
...     def __set_name__(self, owner, name):
...         self.public_name = name
...         self.private_name = "_" + name        # 真实数据存在实例的 _price / _stock 中
...     def __get__(self, instance, owner):
...         if instance is None:                   # 通过类访问（Product.price）时 instance 为 None
...             return self
...         return getattr(instance, self.private_name)
...     def __set__(self, instance, value):
...         if value < 0:
...             raise ValueError(f"{self.public_name} 不能为负，收到 {value}")
...         setattr(instance, self.private_name, value)
...
>>> class Product:
...     price = NonNegative()                      # 描述符必须是类属性
...     stock = NonNegative()
...     def __init__(self, price, stock):
...         self.price = price                     # 触发 NonNegative.__set__
...         self.stock = stock
...
>>> p = Product(99, 10)
>>> p.price, p.stock
(99, 10)
>>> p.stock = -1
Traceback (most recent call last):
  ...
ValueError: stock 不能为负，收到 -1
>>> vars(p)
{'_price': 99, '_stock': 10}
>>> Product.price
<__main__.NonNegative object at 0x...>
```

现在，无论有多少个字段，每个字段都只需要一行声明。注意几个细节：

- **描述符实例是类属性，被该类的所有实例共享**。所以描述符不能把数据存在自己身上（`self.value = value` 会让所有商品共享同一个价格！），而应该存在 `instance` 上。
- `__set_name__` 在类创建时被自动调用，让描述符知道自己的名字，这样就不必写成 `price = NonNegative("price")` 这种重复的形式。
- `__get__` 的 `instance` 参数在通过类访问时为 `None`，惯例是此时返回描述符自身。

## 三、数据描述符与非数据描述符

描述符分为两类，它们在属性查找中的优先级不同：

- **数据描述符**（data descriptor）：定义了 `__set__` 或 `__delete__`。例如 `property`、我们的 `NonNegative`、`__slots__` 生成的成员描述符。
- **非数据描述符**（non-data descriptor）：只定义了 `__get__`。例如**函数**、`classmethod`、`staticmethod`、`cached_property`。

两者的关键区别是：**数据描述符的优先级高于实例字典，实例字典的优先级高于非数据描述符**。

```python
>>> class Demo:
...     @property
...     def data_attr(self):               # property 是数据描述符
...         return "来自 property"
...     def method(self):                  # 函数是非数据描述符
...         return "来自方法"
...
>>> d = Demo()
>>> d.__dict__["data_attr"] = "来自实例字典"
>>> d.__dict__["method"] = lambda: "来自实例字典"
>>> d.data_attr                            # 数据描述符胜出：实例字典被无视
'来自 property'
>>> d.method()                             # 实例字典胜出：非数据描述符被遮蔽
'来自实例字典'
```

这个优先级规则不是随意设定的：

- `property` 必须是数据描述符，否则用户只要在实例上赋一个同名属性，校验逻辑就被绕过了。
- 方法必须是非数据描述符，这样才允许在单个实例上覆盖某个方法（比如在测试中为某个对象打桩）。
- 下文的 `cached_property` 正是巧妙地利用了“实例字典优先于非数据描述符”这一点来实现缓存的。

## 四、属性查找的完整算法

现在我们可以给出 `obj.attr` 的完整查找规则了。它由 `object.__getattribute__` 实现（C 代码位于 `Objects/object.c` 的 `_PyObject_GenericGetAttrWithDict`）。用纯 Python 写出来是这样的：

```python
_MISSING = object()


def find_in_mro(cls, name):
    """在类的 MRO 中查找名字，返回找到的类属性（不触发描述符）。"""
    for klass in cls.__mro__:
        if name in klass.__dict__:
            return klass.__dict__[name]
    return _MISSING


def getattribute(obj, name):
    """object.__getattribute__ 的纯 Python 等价实现。"""
    cls = type(obj)
    cls_attr = find_in_mro(cls, name)

    # 1. 类中的数据描述符：优先级最高
    if cls_attr is not _MISSING:
        cls_attr_type = type(cls_attr)
        if hasattr(cls_attr_type, "__set__") or hasattr(cls_attr_type, "__delete__"):
            return cls_attr_type.__get__(cls_attr, obj, cls)

    # 2. 实例字典
    inst_dict = getattr(obj, "__dict__", None)
    if inst_dict is not None and name in inst_dict:
        return inst_dict[name]

    # 3. 类中的非数据描述符，或普通的类属性
    if cls_attr is not _MISSING:
        if hasattr(type(cls_attr), "__get__"):
            return type(cls_attr).__get__(cls_attr, obj, cls)
        return cls_attr

    # 4. 都没找到
    raise AttributeError(f"{cls.__name__!r} object has no attribute {name!r}")


def lookup(obj, name):
    """完整的 obj.name：__getattribute__ 失败时回退到 __getattr__。"""
    try:
        return getattribute(obj, name)
    except AttributeError:
        if hasattr(type(obj), "__getattr__"):
            return type(obj).__getattr__(obj, name)
        raise


class Base:
    greeting = "你好"

    @property
    def kind(self):
        return "property"

    def method(self):
        return "method"

    def __getattr__(self, name):
        return f"__getattr__ 兜底: {name}"


b = Base()
b.__dict__["kind"] = "实例字典里的 kind"
b.__dict__["extra"] = "实例字典里的 extra"

for name in ("kind", "extra", "greeting", "missing"):
    mine, real = lookup(b, name), getattr(b, name)
    print(f"{name:<9} {mine!r:<28} 与内置一致: {mine == real}")

bound = lookup(b, "method")
print(type(bound).__name__, bound(), bound == b.method)
```

```text
kind      'property'                   与内置一致: True
extra     '实例字典里的 extra'               与内置一致: True
greeting  '你好'                         与内置一致: True
missing   '__getattr__ 兜底: missing'    与内置一致: True
method method True
```

请仔细体会这个算法中的几个细节：

1. 查找描述符时，是在**类型**（`type(obj)`）的 MRO 中查找，并且调用的是**类型上的** `__get__`：`type(cls_attr).__get__(cls_attr, obj, cls)`。描述符必须放在类里才生效，放在实例字典里的描述符不会被触发。
2. `__getattr__` **只在常规查找失败（抛出 `AttributeError`）时**才会被调用，它是一个兜底机制。

而**类属性**的访问（`Class.attr`）由 `type.__getattribute__` 实现，规则类似，区别在于：它会在元类和类自身的 MRO 中查找，并且调用描述符时传入的 `instance` 是 `None`：`descr.__get__(None, Class)`。

赋值 `obj.attr = value` 的规则则简单得多（`object.__setattr__`）：如果类型的 MRO 中有一个**数据描述符**，调用它的 `__set__`；否则直接写入实例字典。这就是为什么只有数据描述符才能拦截赋值。

## 五、方法的真相：函数是描述符

现在终于可以解开第 09 篇留下的谜题了：**函数对象实现了 `__get__` 方法**，所以它是一个非数据描述符。当你通过实例访问一个函数时，查找算法的第 3 步调用了 `function.__get__(instance, cls)`，返回一个绑定方法：

```python
>>> class Dog:
...     def __init__(self, name):
...         self.name = name
...     def bark(self):
...         return f"{self.name}: 汪！"
...
>>> d = Dog("旺财")
>>> f = Dog.__dict__["bark"]               # 类字典中原始的函数对象
>>> hasattr(f, "__get__"), hasattr(f, "__set__")
(True, False)
>>> f.__get__(d, Dog)                      # 手动触发描述符协议
<bound method Dog.bark of <__main__.Dog object at 0x...>>
>>> f.__get__(d, Dog)()
'旺财: 汪！'
>>> f.__get__(None, Dog) is f              # 通过类访问：返回函数本身
True
```

`function.__get__` 的逻辑等价于下面这几行：

<!-- norun -->
```python
import types

class Function:
    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return types.MethodType(self, instance)     # 把函数和实例打包成绑定方法
```

这也解释了第 09 篇的现象：`d.bark is d.bark` 为 `False`，因为每次访问都会调用一次 `__get__`，创建一个新的绑定方法对象。CPython 当然会对“访问方法后立即调用”这种最常见的情况做优化（`LOAD_ATTR` 指令的一个特殊形式会直接把函数和 `self` 压栈，避免创建绑定方法对象），但语义上依然如此。

## 六、手写 property、classmethod、staticmethod

理解了描述符，内置的这几个装饰器就都不再神秘了，它们都可以用纯 Python 实现。

### 1. property

```python
>>> class MyProperty:
...     def __init__(self, fget=None, fset=None, doc=None):
...         self.fget, self.fset = fget, fset
...         self.__doc__ = doc or (fget.__doc__ if fget else None)
...     def __set_name__(self, owner, name):
...         self.name = name
...     def __get__(self, instance, owner=None):
...         if instance is None:
...             return self
...         if self.fget is None:
...             raise AttributeError(f"属性 {self.name!r} 不可读")
...         return self.fget(instance)
...     def __set__(self, instance, value):          # 总是定义 __set__，所以永远是数据描述符
...         if self.fset is None:
...             raise AttributeError(f"属性 {self.name!r} 只读")
...         self.fset(instance, value)
...     def setter(self, fset):                      # @x.setter 返回一个新的 property 对象
...         prop = type(self)(self.fget, fset, self.__doc__)
...         prop.name = self.name if hasattr(self, "name") else None
...         return prop
...
>>> class Celsius:
...     def __init__(self, degrees):
...         self.degrees = degrees
...     @MyProperty
...     def degrees(self):
...         return self._degrees
...     @degrees.setter
...     def degrees(self, value):
...         if value < -273.15:
...             raise ValueError("低于绝对零度")
...         self._degrees = value
...     @MyProperty
...     def fahrenheit(self):
...         return self._degrees * 9 / 5 + 32
...
>>> c = Celsius(100)
>>> c.fahrenheit
212.0
>>> c.fahrenheit = 0
Traceback (most recent call last):
  ...
AttributeError: 属性 'fahrenheit' 只读
>>> c.degrees = -300
Traceback (most recent call last):
  ...
ValueError: 低于绝对零度
```

注意 `@degrees.setter` 的工作方式：它并不修改原来的 property 对象，而是**返回一个新的** property，同时带有 getter 和 setter，然后这个新对象被绑定到名字 `degrees` 上，替换掉旧的。这就是为什么 setter 函数必须和 getter 同名。

### 2. classmethod 与 staticmethod

```python
>>> class MyClassMethod:
...     def __init__(self, func):
...         self.func = func
...     def __get__(self, instance, owner=None):
...         if owner is None:
...             owner = type(instance)
...         return lambda *args, **kwargs: self.func(owner, *args, **kwargs)   # 绑定的是类
...
>>> class MyStaticMethod:
...     def __init__(self, func):
...         self.func = func
...     def __get__(self, instance, owner=None):
...         return self.func                                                   # 什么都不绑定
...
>>> class Pizza:
...     def __init__(self, toppings):
...         self.toppings = toppings
...     @MyClassMethod
...     def margherita(cls):
...         return cls(["番茄", "马苏里拉"])
...     @MyStaticMethod
...     def area(radius):
...         return round(3.14159 * radius ** 2, 1)
...
>>> class SpicyPizza(Pizza):
...     pass
...
>>> p = SpicyPizza.margherita()
>>> type(p).__name__, p.toppings
('SpicyPizza', ['番茄', '马苏里拉'])
>>> Pizza.area(10), p.area(10)
(314.2, 314.2)
```

三者的区别，归根结底只是 `__get__` 返回的东西不同：

| 描述符 | `__get__(instance, owner)` 返回 |
|---|---|
| 函数 | 绑定了 `instance` 的方法 |
| `classmethod` | 绑定了 `owner`（类）的方法 |
| `staticmethod` | 原始函数，什么都不绑定 |

## 七、cached_property：利用优先级实现缓存

`functools.cached_property` 是一个**非数据描述符**。它在第一次被访问时计算值，然后把结果**直接写进实例字典**，名字和属性名相同。之后再访问这个属性时，根据查找算法，实例字典优先于非数据描述符，于是直接返回缓存值，描述符的 `__get__` 再也不会被调用。整个实现简洁得惊人：

```python
>>> class cached:
...     def __init__(self, func):
...         self.func = func
...     def __set_name__(self, owner, name):
...         self.name = name
...     def __get__(self, instance, owner=None):
...         if instance is None:
...             return self
...         value = self.func(instance)
...         instance.__dict__[self.name] = value       # 写入实例字典，“遮蔽”自己
...         return value
...
>>> class Report:
...     def __init__(self, rows):
...         self.rows = rows
...     @cached
...     def summary(self):
...         print("（正在进行昂贵的计算……）")
...         return sum(self.rows)
...
>>> r = Report([1, 2, 3])
>>> r.summary
（正在进行昂贵的计算……）
6
>>> r.summary                                       # 第二次访问：直接从实例字典取，不再计算
6
>>> del r.summary                                   # 删除缓存后，下次访问会重新计算
>>> r.summary
（正在进行昂贵的计算……）
6
```

这也说明了为什么 `cached_property` 不能和 `__slots__`（没有 `__dict__`）一起使用。

## 八、__slots__ 的实现：成员描述符

第 10 篇讲到，声明了 `__slots__` 的类，实例没有 `__dict__`，属性存放在对象内部的固定槽位中。那么 `obj.x` 是如何找到槽位的？答案依然是描述符：

```python
>>> class Point:
...     __slots__ = ("x", "y")
...
>>> Point.__dict__["x"]
<member 'x' of 'Point' objects>
>>> type(Point.__dict__["x"]).__name__
'member_descriptor'
>>> hasattr(type(Point.__dict__["x"]), "__set__")    # 数据描述符
True
>>> p = Point()
>>> Point.__dict__["x"].__set__(p, 42)               # 等价于 p.x = 42
>>> p.x
42
```

创建类时，`type` 为 `__slots__` 中的每个名字生成一个**成员描述符**，它记录着该属性在对象内存中的偏移量。读写属性时，描述符直接在那个偏移位置读写指针。

## 九、修复类装饰器：让它也能装饰方法

第 07 篇留下了一个问题：用类实现的装饰器 `CountCalls` 装饰方法时，`self` 不会被传入。

```python
>>> import functools
>>> class CountCalls:
...     def __init__(self, func):
...         functools.update_wrapper(self, func)
...         self.func = func
...         self.calls = 0
...     def __call__(self, *args, **kwargs):
...         self.calls += 1
...         return self.func(*args, **kwargs)
...
>>> class Greeter:
...     @CountCalls
...     def hello(self, name):
...         return f"你好，{name}"
...
>>> Greeter().hello("小明")
Traceback (most recent call last):
  ...
TypeError: Greeter.hello() missing 1 required positional argument: 'name'
```

原因现在很清楚了：`Greeter.hello` 是一个 `CountCalls` 实例，它没有 `__get__` 方法，所以不是描述符。通过实例访问它时，不会发生绑定，得到的就是 `CountCalls` 对象本身，调用时 `"小明"` 被当成了 `self`。修复方法是给它加上 `__get__`，模仿函数的行为：

```python
>>> import types
>>> class CountCalls:
...     def __init__(self, func):
...         functools.update_wrapper(self, func)
...         self.func = func
...         self.calls = 0
...     def __call__(self, *args, **kwargs):
...         self.calls += 1
...         return self.func(*args, **kwargs)
...     def __get__(self, instance, owner=None):
...         if instance is None:
...             return self
...         return types.MethodType(self, instance)    # 把“自己”绑定到实例上
...
>>> class Greeter:
...     @CountCalls
...     def hello(self, name):
...         return f"你好，{name}"
...
>>> g = Greeter()
>>> g.hello("小明"), g.hello("小红")
('你好，小明', '你好，小红')
>>> Greeter.hello.calls
2
```

这也说明了为什么**用函数实现的装饰器**天然可以装饰方法：装饰器返回的 `wrapper` 是一个普通函数，函数本来就是描述符。

## 十、__getattr__、__getattribute__ 与 __setattr__

除了描述符，Python 还提供了几个在实例层面拦截属性访问的特殊方法：

- `__getattribute__(self, name)`：拦截**所有**属性读取。重写它需要非常小心，在其中访问 `self.xxx` 会再次调用它自己，造成无限递归，必须通过 `object.__getattribute__(self, name)` 或 `super().__getattribute__(name)` 访问属性。
- `__getattr__(self, name)`：只在**常规查找失败**时才被调用，安全得多，绝大多数情况下用它就够了。
- `__setattr__(self, name, value)` 和 `__delattr__`：拦截所有的赋值和删除。

一个典型的应用是**代理对象**：把所有属性访问转发给被包装的对象，同时添加额外的行为：

```python
>>> class ReadOnlyProxy:
...     def __init__(self, target):
...         object.__setattr__(self, "_target", target)   # 绕过自己的 __setattr__
...     def __getattr__(self, name):                       # 常规查找失败时，转发给目标对象
...         return getattr(self._target, name)
...     def __setattr__(self, name, value):
...         raise AttributeError(f"只读代理：不能设置 {name!r}")
...
>>> class Config:
...     def __init__(self):
...         self.debug = False
...     def describe(self):
...         return f"debug={self.debug}"
...
>>> proxy = ReadOnlyProxy(Config())
>>> proxy.debug, proxy.describe()
(False, 'debug=False')
>>> proxy.debug = True
Traceback (most recent call last):
  ...
AttributeError: 只读代理：不能设置 'debug'
```

一个常见的陷阱：如果在 `__getattr__` 中访问了一个**还没有被设置**的属性（比如在 `__init__` 完成之前，或者在反序列化时），就会再次触发 `__getattr__`，导致无限递归。上面的代码在 `__getattr__` 中访问 `self._target`，如果 `_target` 不存在，就会陷入递归，最终抛出 `RecursionError`。健壮的写法是在 `__getattr__` 中先判断 `name == "_target"` 并直接抛出 `AttributeError`。

另外要记得：**特殊方法的隐式调用会绕过这些钩子**（第 10 篇讲过，特殊方法在类型上查找），所以代理对象的 `len(proxy)`、`proxy[0]` 不会通过 `__getattr__` 转发，需要显式定义 `__len__`、`__getitem__` 等方法。

## 十一、实战：迷你 ORM 的字段系统

Django ORM、SQLAlchemy、Pydantic 等库的“声明式字段”，核心原理都是描述符。下面我们用描述符搭建一个迷你的模型系统：

```python
class Field:
    """所有字段的基类：负责名字绑定、存储和类型校验。"""

    expected_type = object

    def __init__(self, *, default=None, required=True):
        self.default, self.required = default, required

    def __set_name__(self, owner, name):
        self.name = name
        owner._fields = {**getattr(owner, "_fields", {}), name: self}   # 在模型类上登记字段

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return instance.__dict__.get(self.name, self.default)

    def __set__(self, instance, value):
        if value is None and not self.required:
            instance.__dict__[self.name] = None
            return
        if not isinstance(value, self.expected_type):
            raise TypeError(f"{self.name} 需要 {self.expected_type.__name__}，收到 {type(value).__name__}")
        self.validate(value)
        instance.__dict__[self.name] = value      # 数据描述符优先，所以可以放心地用同名的键存储

    def validate(self, value):
        pass


class IntegerField(Field):
    expected_type = int

    def __init__(self, *, min_value=None, max_value=None, **kwargs):
        super().__init__(**kwargs)
        self.min_value, self.max_value = min_value, max_value

    def validate(self, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"{self.name} 不能小于 {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"{self.name} 不能大于 {self.max_value}")


class StringField(Field):
    expected_type = str

    def __init__(self, *, max_length=None, **kwargs):
        super().__init__(**kwargs)
        self.max_length = max_length

    def validate(self, value):
        if self.max_length is not None and len(value) > self.max_length:
            raise ValueError(f"{self.name} 长度不能超过 {self.max_length}")


class Model:
    def __init__(self, **kwargs):
        for name, field in self._fields.items():
            if name in kwargs:
                setattr(self, name, kwargs.pop(name))
            elif field.required and field.default is None:
                raise TypeError(f"缺少必填字段 {name}")
        if kwargs:
            raise TypeError(f"未知字段 {', '.join(kwargs)}")

    def __repr__(self):
        args = ", ".join(f"{n}={getattr(self, n)!r}" for n in self._fields)
        return f"{type(self).__name__}({args})"


class User(Model):
    name = StringField(max_length=8)
    age = IntegerField(min_value=0, max_value=150)
    email = StringField(required=False)


print(User(name="张三", age=30))
print(list(User._fields))
for bad in ({"name": "李四", "age": -5}, {"name": "王五", "age": "30"}, {"age": 20}):
    try:
        User(**bad)
    except (TypeError, ValueError) as e:
        print(f"{type(e).__name__}: {e}")
```

```text
User(name='张三', age=30, email=None)
['name', 'age', 'email']
ValueError: age 不能小于 0
TypeError: age 需要 int，收到 str
TypeError: 缺少必填字段 name
```

字段类负责“一个属性”的全部逻辑：名字、默认值、类型检查、取值范围；模型类则通过 `__set_name__` 登记的 `_fields` 了解自己有哪些字段。要让 `Model` 根据字段自动生成数据库表、SQL 语句，下一步就需要在**类创建的时候**做更多的事情——那是下一篇元类的主题。

## 小结

- 描述符是定义了 `__get__`/`__set__`/`__delete__` 的类属性，`__set_name__` 让它知道自己的名字。
- 定义了 `__set__` 或 `__delete__` 的是数据描述符，优先级高于实例字典；只有 `__get__` 的是非数据描述符，优先级低于实例字典。
- 属性查找顺序：类型 MRO 中的数据描述符 → 实例字典 → 非数据描述符或普通类属性 → `__getattr__`。
- 函数是非数据描述符，`__get__` 返回绑定方法；`classmethod`、`staticmethod`、`property`、`cached_property`、`__slots__` 都是描述符。
- 类实现的装饰器需要定义 `__get__` 才能正确装饰方法。
- 优先使用 `__getattr__` 而不是 `__getattribute__`；特殊方法的隐式调用会绕过它们。

## 练习

1. 实现一个 `Typed` 描述符，使 `x = Typed(int)` 声明的属性只能被赋值为整数；再实现 `Typed(list[int])`，检查列表中的每个元素（提示：查看 `typing.get_origin` 和 `typing.get_args`）。
2. 实现一个 `LazyProperty`，功能类似 `cached_property`，但是是**线程安全**的：多个线程同时首次访问时，计算函数只执行一次。
3. 写一个 `History` 描述符，记录属性每一次被赋的值，并提供 `obj.history_of("attr")` 的方式查询历史（思考：历史记录应该存在哪里？）。
4. 用本文的 `getattribute` 函数为基础，再写一个 `setattribute(obj, name, value)` 的纯 Python 实现，并用 `property`、普通属性、`__slots__` 三种情况测试它与内置行为是否一致。
5. 解释下面代码的输出，并说明为什么：
   <!-- norun -->
   ```python
   class A:
       x = property(lambda self: "property")
   a = A()
   a.__dict__["x"] = "instance"
   A.x = "class attribute"
   print(a.x)
   ```

下一篇我们将研究“类是如何被创建出来的”：{% post_link Python-15-Metaclasses '元类与类的创建过程' %}。
