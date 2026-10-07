---
title: Python 从入门到精通（09）：面向对象——类、实例、继承与 MRO
date: 2026-10-07 11:15:00
summary: class 语句如何执行类体并调用 type 创建类对象；实例与类的 __dict__、属性查找顺序、可变类属性陷阱；绑定方法的产生过程、classmethod 与 staticmethod；名称改写；继承与 super()；多重继承的 C3 线性化算法（附 Python 实现）与协作式多重继承。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

Python 是一门彻底的面向对象语言——第 02 篇说过“一切皆对象”。但 Python 的面向对象又和 Java、C++ 有很大不同：类本身是运行时创建的对象，属性可以随时增删，方法只是存放在类里的普通函数，`self` 需要显式写出。本篇不罗列语法，而是带你看清这些机制是如何运作的，最后深入多重继承的 MRO 算法。

> 本文是「Python 从入门到精通」系列第 09 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、class 语句做了什么

先看一个普通的类：

```python
>>> class Dog:
...     """一只狗。"""
...     species = "Canis familiaris"          # 类属性：所有实例共享
...
...     def __init__(self, name, age):
...         self.name = name                   # 实例属性：每个实例独有
...         self.age = age
...
...     def bark(self):
...         return f"{self.name}: 汪！"
...
>>> d = Dog("旺财", 3)
>>> d.bark()
'旺财: 汪！'
```

和 `def` 一样，`class` 也是一条**可执行语句**。执行它时，Python 大致做了三件事：

1. 创建一个新的命名空间（一个字典），**像执行函数体一样执行类体**中的代码，类体中定义的变量和函数都成了这个字典里的条目；
2. 调用 `type(name, bases, namespace)` 创建类对象；
3. 把类对象绑定到类名上。

所以下面的写法和上面的 `class` 语句几乎等价：

```python
>>> def bark(self):
...     return f"{self.name}: 汪！"
...
>>> def init(self, name, age):
...     self.name, self.age = name, age
...
>>> Dog2 = type("Dog2", (), {"species": "Canis familiaris", "__init__": init, "bark": bark})
>>> Dog2("小黑", 2).bark()
'小黑: 汪！'
```

类体中可以写任意语句（循环、条件、打印），它们都会在定义类的时候执行一次。这里出现的 `type` 就是所谓的**元类**，类的完整创建过程我们留到 {% post_link Python-15-Metaclasses '第 15 篇' %} 讲解。

### 实例是如何创建的

调用 `Dog("旺财", 3)` 时，实际上发生了两步：

1. `Dog.__new__(Dog, "旺财", 3)`：**创建**一个空的实例对象（默认继承自 `object.__new__`）；
2. `instance.__init__("旺财", 3)`：**初始化**这个实例，设置属性。

`__init__` 并不是构造函数，它只是初始化器；真正“构造”对象的是 `__new__`。绝大多数时候我们只需要写 `__init__`。需要重写 `__new__` 的场景主要是：继承不可变类型（如 `int`、`str`、`tuple`，它们的值必须在创建时确定）、实现单例、控制返回的实例类型等。

```python
>>> class Celsius(float):
...     def __new__(cls, value):
...         if value < -273.15:
...             raise ValueError("低于绝对零度")
...         return super().__new__(cls, value)     # 不可变对象的值必须在 __new__ 中确定
...
>>> Celsius(36.6) + 1
37.6
>>> Celsius(-300)
Traceback (most recent call last):
  ...
ValueError: 低于绝对零度
```

## 二、属性：实例字典与类字典

### 1. 两个命名空间

实例属性和类属性分别存放在两个不同的字典里：

```python
>>> d = Dog("旺财", 3)
>>> d.__dict__                         # 实例自己的命名空间
{'name': '旺财', 'age': 3}
>>> "species" in d.__dict__, "species" in Dog.__dict__
(False, True)
>>> d.species                          # 实例字典里没有，就去类里找
'Canis familiaris'
>>> type(Dog.__dict__)                 # 类的字典是只读代理，不能直接修改
<class 'mappingproxy'>
```

读取 `d.species` 时，Python 先在实例的 `__dict__` 中查找，找不到再去类（以及类的父类）中查找。（这只是简化版的规则，完整的属性查找还涉及描述符，见 {% post_link Python-14-Descriptors '第 14 篇' %}。）

**给实例属性赋值，永远只会写入实例自己的字典**，即使类中有同名属性：

```python
>>> d.species = "柴犬"                  # 在实例字典中创建了一个同名属性，“遮蔽”了类属性
>>> d.species, Dog.species
('柴犬', 'Canis familiaris')
>>> del d.species                      # 删掉实例属性后，类属性重新可见
>>> d.species
'Canis familiaris'
```

### 2. 可变类属性陷阱

如果类属性是一个可变对象，并且通过实例调用它的方法来修改，那么所有实例都会受到影响：

```python
>>> class Student:
...     courses = []                       # 错误：所有学生共享同一个列表
...     def __init__(self, name):
...         self.name = name
...     def enroll(self, course):
...         self.courses.append(course)    # 没有赋值，而是修改了类属性指向的列表
...
>>> a, b = Student("A"), Student("B")
>>> a.enroll("数学")
>>> b.courses
['数学']
```

`self.courses.append(...)` 是**读取** `self.courses`（在类中找到了那个列表）再调用它的方法，而不是赋值，所以不会在实例上创建新属性。这和上一篇的“可变默认参数”是同一个道理。正确的做法是在 `__init__` 中为每个实例创建自己的列表：`self.courses = []`。

### 3. 动态性

Python 的对象是开放的，可以在运行时随意添加属性，甚至给类添加方法：

```python
>>> d.color = "黄色"                    # 给单个实例添加属性
>>> Dog.sit = lambda self: f"{self.name} 坐下了"   # 给类添加方法，所有实例立即可用
>>> d.sit()
'旺财 坐下了'
```

这种灵活性在测试中打桩（mock）、框架开发中很有用，但在业务代码中应当克制：属性应当在 `__init__` 中集中初始化，否则读者很难知道一个对象到底有哪些属性。如果希望禁止添加任意属性（同时节省内存），可以使用 `__slots__`，我们在下一篇介绍。

## 三、方法与绑定

### 1. 方法就是类里的函数

```python
>>> Dog.__dict__["bark"]                # 在类字典里，它就是一个普通函数
<function Dog.bark at 0x...>
>>> Dog.bark(d)                         # 通过类调用时，需要手动传入 self
'旺财: 汪！'
>>> d.bark                              # 通过实例访问时，得到的是“绑定方法”
<bound method Dog.bark of <__main__.Dog object at 0x...>>
```

通过实例访问一个函数属性时，Python 会自动创建一个**绑定方法**（bound method）对象，它把函数和实例“绑”在一起。调用绑定方法时，实例会被自动作为第一个参数传入：

```python
>>> m = d.bark
>>> m.__func__ is Dog.bark, m.__self__ is d
(True, True)
>>> m()                                 # 等价于 Dog.bark(d)
'旺财: 汪！'
>>> d.bark is d.bark                    # 每次访问都会创建一个新的绑定方法对象！
False
```

这就是 `self` 的全部秘密：它不是关键字，只是一个约定俗成的参数名，绑定方法会自动把实例填进去。这种“访问时自动绑定”的行为是由**描述符协议**实现的（函数对象实现了 `__get__` 方法），第 14 篇会详细揭示。

“为什么 Python 要显式写 `self`？” Guido 专门写过文章解释：显式的 `self` 让方法就是普通函数，没有任何特殊语义；让“访问实例变量”和“访问局部变量”在语法上一目了然；也让 `Class.method(obj)` 这种调用方式和装饰器（如 `@classmethod`）的实现变得自然。

### 2. classmethod 与 staticmethod

```python
>>> from datetime import date
>>> class Person:
...     def __init__(self, name, age):
...         self.name, self.age = name, age
...
...     @classmethod
...     def from_birth_year(cls, name, year):     # 第一个参数是类本身
...         return cls(name, date.today().year - year)
...
...     @staticmethod
...     def is_adult(age):                         # 没有自动传入的参数，就是放在类里的普通函数
...         return age >= 18
...
>>> class Student(Person):
...     pass
...
>>> s = Student.from_birth_year("小明", date.today().year - 20)
>>> type(s).__name__, s.age                         # cls 是 Student，所以创建的是 Student
('Student', 20)
>>> Person.is_adult(20)
True
```

- **`classmethod`** 最常见的用途是**替代构造器**：`dict.fromkeys`、`datetime.fromtimestamp`、`int.from_bytes` 都是类方法。因为它接收的是 `cls` 而不是写死的类名，所以子类调用时能正确地创建子类实例。
- **`staticmethod`** 和类没有任何绑定关系，只是逻辑上属于这个类的工具函数。很多时候，它写成模块级函数会更合适。

### 3. property：把方法伪装成属性

```python
>>> class Circle:
...     def __init__(self, radius):
...         self.radius = radius              # 这里也会经过 setter 的校验
...
...     @property
...     def radius(self):
...         return self._radius
...
...     @radius.setter
...     def radius(self, value):
...         if value < 0:
...             raise ValueError("半径不能为负")
...         self._radius = value
...
...     @property
...     def area(self):                        # 只读的计算属性
...         return 3.14159 * self._radius ** 2
...
>>> c = Circle(2)
>>> c.area
12.56636
>>> c.radius = -1
Traceback (most recent call last):
  ...
ValueError: 半径不能为负
>>> c.area = 10
Traceback (most recent call last):
  ...
AttributeError: property 'area' of 'Circle' object has no setter
```

`property` 是 Python 不需要 Java 式 getter/setter 的原因：一开始直接使用公开属性 `self.radius`；以后需要校验或计算时，再改成 `property`，调用方的代码 `c.radius` 一个字都不用改。

## 四、封装：约定而非强制

Python 没有 `private`、`protected` 关键字，而是依靠命名约定：

- `name`：公开属性；
- `_name`：单下划线，表示“内部使用”，外部不应该直接访问。这只是约定，解释器不会阻止，但 `from module import *` 不会导入它们，代码检查工具也会提示；
- `__name`：双下划线开头（且结尾不是双下划线），会触发**名称改写**（name mangling）。

```python
>>> class Account:
...     def __init__(self, balance):
...         self.__balance = balance
...
>>> acc = Account(100)
>>> acc.__balance
Traceback (most recent call last):
  ...
AttributeError: 'Account' object has no attribute '__balance'
>>> acc.__dict__                        # 名字被改写成了 _类名__属性名
{'_Account__balance': 100}
>>> acc._Account__balance               # 依然可以访问，只是“不方便”
100
```

名称改写的真正目的**不是**为了隐藏数据，而是为了**避免子类意外覆盖父类的内部属性**：父类的 `self.__x` 会变成 `_Parent__x`，子类的 `self.__x` 会变成 `_Child__x`，两者互不干扰。在设计会被别人继承的类库时，它很有用；在普通代码中，单下划线就足够了。Python 社区的哲学是“我们都是成年人”（we are all consenting adults）：约定清楚，然后相信使用者。

## 五、继承与 super()

### 1. 基本继承

```python
>>> class Animal:
...     def __init__(self, name):
...         self.name = name
...     def speak(self):
...         return "..."
...     def introduce(self):
...         return f"我是{self.name}，我会说：{self.speak()}"
...
>>> class Cat(Animal):
...     def __init__(self, name, indoor=True):
...         super().__init__(name)             # 调用父类的初始化
...         self.indoor = indoor
...     def speak(self):                        # 重写
...         return "喵"
...
>>> Cat("咪咪").introduce()                     # 父类的方法调用了子类重写的 speak
'我是咪咪，我会说：喵'
>>> isinstance(Cat("x"), Animal), issubclass(Cat, Animal), issubclass(Cat, object)
(True, True, True)
```

所有类最终都继承自 `object`。`introduce` 中的 `self.speak()` 会根据 `self` 的实际类型找到 `Cat.speak`，这就是**多态**。

### 2. 抽象基类

如果希望父类只定义接口、强制子类实现某些方法，可以使用 `abc` 模块：

```python
>>> from abc import ABC, abstractmethod
>>> class Shape(ABC):
...     @abstractmethod
...     def area(self): ...
...     def describe(self):
...         return f"面积为 {self.area():.2f}"
...
>>> Shape()
Traceback (most recent call last):
  ...
TypeError: Can't instantiate abstract class Shape without an implementation for abstract method 'area'
>>> class Square(Shape):
...     def __init__(self, side):
...         self.side = side
...     def area(self):
...         return self.side ** 2
...
>>> Square(3).describe()
'面积为 9.00'
```

不过 Python 更推崇**鸭子类型**：“如果它走路像鸭子、叫声像鸭子，那它就是鸭子”。函数通常不检查参数的类型，只要对象有需要的方法就行。抽象基类和后面会讲的 `typing.Protocol` 是在需要明确接口时的补充手段。

## 六、多重继承与 MRO

### 1. 菱形继承问题

Python 支持多重继承，一个类可以有多个父类。这就带来了一个问题：当多个父类中都有同名方法时，应该用哪一个？最典型的是“菱形继承”：

```text
        Base
       /    \
    Left    Right
       \    /
       Bottom
```

```python
>>> class Base:
...     def who(self): return "Base"
...
>>> class Left(Base):
...     def who(self): return "Left"
...
>>> class Right(Base):
...     def who(self): return "Right"
...
>>> class Bottom(Left, Right):
...     pass
...
>>> Bottom().who()
'Left'
>>> [c.__name__ for c in Bottom.__mro__]
['Bottom', 'Left', 'Right', 'Base', 'object']
```

Python 为每个类计算出一个线性的查找顺序，称为**方法解析顺序**（Method Resolution Order，MRO），保存在 `__mro__` 属性中。查找属性时，就按照这个顺序依次在各个类的 `__dict__` 中寻找。

### 2. C3 线性化算法

MRO 由 **C3 线性化**算法计算，它保证了三个性质：

1. **子类在父类之前**（Bottom 在 Left 和 Right 之前）；
2. **保持声明顺序**（`class Bottom(Left, Right)` 中 Left 在 Right 之前）；
3. **单调性**：如果在某个类的 MRO 中 A 在 B 之前，那么在它所有子类的 MRO 中，A 也在 B 之前。

算法的定义是递归的：

```text
L[C] = C + merge(L[B1], L[B2], ..., L[Bn], [B1, B2, ..., Bn])
```

其中 `merge` 的规则是：**依次检查各个列表的第一个元素（称为“头”），找到第一个“不出现在任何列表的尾部（除头以外的部分）”的头，把它取出来放进结果，并从所有列表中删除它；重复这个过程，直到所有列表为空。如果找不到这样的头，说明无法线性化，报错。**

手工计算一下 `Bottom` 的 MRO：

```text
L[Base]   = [Base, object]
L[Left]   = [Left, Base, object]
L[Right]  = [Right, Base, object]
L[Bottom] = Bottom + merge([Left, Base, object], [Right, Base, object], [Left, Right])

第 1 步：候选头 Left，不在任何尾部 → 取出 Left
         merge([Base, object], [Right, Base, object], [Right])
第 2 步：候选头 Base，但它在 [Right, Base, object] 的尾部 → 跳过
         候选头 Right，不在任何尾部 → 取出 Right
         merge([Base, object], [Base, object], [])
第 3 步：取出 Base，再取出 object

结果：[Bottom, Left, Right, Base, object]
```

第 2 步是关键：`Base` 不能在 `Right` 之前被取出，因为 `Right` 是 `Base` 的子类。这保证了 `Base` 中的方法不会“插队”到 `Right` 之前。用 Python 实现这个算法只需要十几行：

```python
def c3_mro(cls):
    """按照 C3 算法计算 cls 的 MRO。"""
    if cls is object:
        return [object]
    sequences = [c3_mro(base) for base in cls.__bases__] + [list(cls.__bases__)]
    result = [cls]
    while any(sequences):
        for seq in sequences:
            if not seq:
                continue
            head = seq[0]
            if not any(head in s[1:] for s in sequences):   # 不在任何列表的尾部
                break
        else:
            raise TypeError("无法建立一致的 MRO")
        result.append(head)
        for s in sequences:                                  # 从所有列表中移除这个头
            if s and s[0] is head:
                del s[0]
    return result


class A: pass
class B: pass
class C: pass
class D: pass
class E: pass
class K1(A, B, C): pass
class K2(D, B, E): pass
class K3(D, A): pass
class Z(K1, K2, K3): pass

mine = [c.__name__ for c in c3_mro(Z)]
print(mine)
print(mine == [c.__name__ for c in Z.__mro__])
```

```text
['Z', 'K1', 'K2', 'K3', 'D', 'A', 'B', 'C', 'E', 'object']
True
```

这个例子来自维基百科的 C3 词条，我们的实现和 Python 内置的结果完全一致。

### 3. 无法线性化的情况

如果继承关系存在矛盾，C3 算法会拒绝创建这个类：

```python
>>> class X: pass
...
>>> class Y(X): pass
...
>>> class Z(X, Y): pass                # 声明顺序要求 X 在 Y 前，但 Y 是 X 的子类，必须在 X 前
...
Traceback (most recent call last):
  ...
TypeError: Cannot create a consistent method resolution order (MRO) for bases X, Y
```

### 4. super() 遵循的是 MRO，而不是“父类”

这是关于 `super()` 最重要、也最容易被误解的一点：**`super()` 返回的是 MRO 中“当前类的下一个类”，而不一定是当前类的父类。**

```python
>>> class Base:
...     def __init__(self):
...         print("Base.__init__")
...
>>> class Left(Base):
...     def __init__(self):
...         print("Left.__init__")
...         super().__init__()
...
>>> class Right(Base):
...     def __init__(self):
...         print("Right.__init__")
...         super().__init__()
...
>>> class Bottom(Left, Right):
...     def __init__(self):
...         print("Bottom.__init__")
...         super().__init__()
...
>>> _ = Bottom()
Bottom.__init__
Left.__init__
Right.__init__
Base.__init__
```

`Left` 中的 `super().__init__()` 调用的是 `Right.__init__`，而 `Left` 根本不知道 `Right` 的存在！因为对于 `Bottom` 的实例来说，MRO 是 `[Bottom, Left, Right, Base, object]`，`Left` 的下一个就是 `Right`。正是这种机制保证了在菱形继承中，`Base.__init__` **只被调用一次**。如果 `Left` 和 `Right` 都直接写 `Base.__init__(self)`，`Base` 就会被初始化两次。

无参数的 `super()` 是怎么知道“当前类”和“当前实例”的？编译器在编译方法时，如果发现其中用到了 `super`，就会为它创建一个名为 `__class__` 的隐式闭包变量，指向正在定义的类；而实例就是方法的第一个参数。所以 `super()` 等价于 `super(__class__, self)`。

### 5. 协作式多重继承

既然 `super()` 调用的下一个类无法预知，那么在多重继承中，各个类的方法签名就需要互相“协作”。常见的约定是：每个类只取出自己需要的关键字参数，剩下的通过 `**kwargs` 继续传递：

```python
>>> class Shape:
...     def __init__(self, **kwargs):
...         super().__init__(**kwargs)           # object.__init__ 不接受参数，所以到这里 kwargs 必须为空
...
>>> class Colored(Shape):
...     def __init__(self, *, color="black", **kwargs):
...         self.color = color
...         super().__init__(**kwargs)
...
>>> class Positioned(Shape):
...     def __init__(self, *, x=0, y=0, **kwargs):
...         self.x, self.y = x, y
...         super().__init__(**kwargs)
...
>>> class Sprite(Colored, Positioned):
...     pass
...
>>> s = Sprite(color="red", x=10, y=20)
>>> vars(s)
{'color': 'red', 'x': 10, 'y': 20}
```

### 6. Mixin：多重继承的正确打开方式

在实践中，多重继承最常用的形式是 **Mixin**：一个只提供某项功能、不单独使用、通常也没有自己状态的小类，与一个主要的基类组合使用：

```python
>>> import json
>>> class JsonMixin:
...     def to_json(self):
...         return json.dumps(vars(self), ensure_ascii=False)
...
>>> class ReprMixin:
...     def __repr__(self):
...         args = ", ".join(f"{k}={v!r}" for k, v in vars(self).items())
...         return f"{type(self).__name__}({args})"
...
>>> class User(JsonMixin, ReprMixin):
...     def __init__(self, name, email):
...         self.name, self.email = name, email
...
>>> u = User("小王", "wang@example.com")
>>> u
User(name='小王', email='wang@example.com')
>>> u.to_json()
'{"name": "小王", "email": "wang@example.com"}'
```

Django 的类视图、`socketserver` 模块的 `ThreadingMixIn` 都大量使用了这种模式。

## 七、组合优于继承

继承是一种很强的耦合：子类依赖父类的实现细节，父类的修改可能悄悄破坏子类（这被称为“脆弱基类问题”）。在面向对象设计中有一条广为流传的原则：**优先使用组合，而不是继承**。

- 当两者是 **“是一个”**（is-a）关系，并且子类确实需要父类的**全部**接口时，使用继承。比如 `Cat` 是一种 `Animal`。
- 当两者是 **“有一个”**（has-a）关系，或者只是想复用一部分功能时，使用组合：把另一个对象作为属性，并把需要的调用委托给它。

```python
>>> class Stack:
...     """用组合实现的栈：只暴露栈需要的操作，而不是继承 list 的全部方法。"""
...     def __init__(self):
...         self._items = []
...     def push(self, item):
...         self._items.append(item)
...     def pop(self):
...         return self._items.pop()
...     def __len__(self):
...         return len(self._items)
...
>>> s = Stack(); s.push(1); s.push(2)
>>> s.pop(), len(s)
(2, 1)
```

如果 `Stack` 继承 `list`，那么用户就可以调用 `insert(0, x)`、`sort()` 等方法，破坏“栈”的语义。

最后，并不是所有东西都需要写成类。如果一个“类”只有 `__init__` 和一个方法，它很可能应该是一个函数；如果只是用来存放数据，`dataclass` 或 `NamedTuple` 更合适。

## 小结

- `class` 是可执行语句：执行类体得到命名空间，再调用 `type(name, bases, ns)` 创建类对象。
- 创建实例分两步：`__new__` 创建，`__init__` 初始化。
- 实例属性在实例的 `__dict__` 中，类属性在类的 `__dict__` 中；赋值总是写入实例字典；可变的类属性会被所有实例共享。
- 通过实例访问函数会得到绑定方法，它自动传入 `self`；`classmethod` 传入类，`staticmethod` 什么都不传。
- 双下划线触发名称改写，目的是避免子类命名冲突，而非真正的私有。
- MRO 由 C3 线性化算法计算；`super()` 调用的是 MRO 中的下一个类，而不是父类，这是协作式多重继承的基础。
- 优先使用组合；多重继承主要以 Mixin 的形式使用。

## 练习

1. 写一个 `Temperature` 类，内部以摄氏度存储，提供 `celsius`、`fahrenheit`、`kelvin` 三个可读写的 `property`，任何一个被设置时其他两个都自动更新，并拒绝低于绝对零度的值。
2. 不运行代码，手工用 C3 算法计算下面 `F` 的 MRO，再用本文的 `c3_mro` 函数验证：
   <!-- norun -->
   ```python
   class A: pass
   class B(A): pass
   class C(A): pass
   class D(B, C): pass
   class E(C, B): pass
   class F(D, E): pass
   ```
   结果是什么？为什么？
3. 实现一个单例基类 `Singleton`，使得任何继承它的类都只能有一个实例（提示：重写 `__new__`，并考虑 `__init__` 会被重复调用的问题）。
4. 解释为什么 `d.bark is d.bark` 是 `False`，而 `d.bark == d.bark` 是 `True`。
5. 设计一个 `LoggingMixin`，为任何类添加 `self.log(msg)` 方法，日志前缀自动包含类名和对象的 `id`；把它和本文的 `JsonMixin` 一起混入一个类中，并检查这个类的 MRO。

下一篇我们将学习如何让自定义对象表现得像内置类型一样自然：{% post_link Python-10-Data-Model '数据模型与魔术方法' %}。
