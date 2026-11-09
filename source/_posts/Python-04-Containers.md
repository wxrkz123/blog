---
title: Python 从入门到精通（04）：列表、元组、字典与集合的底层实现
date: 2026-10-07 11:40:00
summary: 四大内置容器的用法与原理：列表的动态数组与 1.125 倍扩容、元组与解包、字典的紧凑哈希表与探测序列、集合运算、各操作的时间复杂度，以及深浅拷贝。附一个用纯 Python 复刻 CPython 字典探测算法的玩具哈希表。
tags:
  - Python
  - Python基础
categories:
  - Python
---

列表、元组、字典、集合是 Python 程序中出现频率最高的四种数据结构。会用它们并不难，但要写出**高效**且**没有隐藏 bug** 的代码，就必须知道它们在底层是怎么实现的：为什么 `list.append` 很快而 `list.insert(0, x)` 很慢？为什么字典查找是 O(1)？为什么列表不能当字典的键？本篇将一一回答。

> 本文是「Python 从入门到精通」系列第 04 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、容器的分类

先从全局看一下 Python 内置容器的分类：

| 类别 | 有序（按位置访问） | 可变 | 典型类型 |
|---|---|---|---|
| 序列 Sequence | 是 | 否 | `tuple`、`str`、`bytes`、`range` |
| 可变序列 MutableSequence | 是 | 是 | `list`、`bytearray`、`collections.deque` |
| 映射 Mapping | 按插入顺序迭代 | 是 | `dict` |
| 集合 Set | 否 | 是 / 否 | `set` / `frozenset` |

`collections.abc` 模块用抽象基类精确定义了这些“协议”。比如一个类型只要实现了 `__getitem__` 和 `__len__`，再继承 `collections.abc.Sequence`，就会自动获得 `__contains__`、`__iter__`、`index`、`count` 等方法。这些我们在 {% post_link Python-10-Data-Model '第 10 篇' %} 再详细展开。

## 二、列表：动态数组

### 1. 列表存的是指针

CPython 的列表是一个**动态数组**，结构大致如下（`Include/cpython/listobject.h`）：

<!-- norun -->
```c
typedef struct {
    PyObject_VAR_HEAD          /* 对象头 + ob_size（当前元素个数） */
    PyObject **ob_item;        /* 指向一块连续内存，里面是一个个对象指针 */
    Py_ssize_t allocated;      /* 已分配的槽位数（容量） */
} PyListObject;
```

关键在于：列表里存放的不是对象本身，而是**指向对象的指针**。这解释了两件事：

1. 一个列表可以同时容纳不同类型的对象（因为每个槽位都只是一个 8 字节的指针）；
2. `lst[i]` 是 O(1) 的：第 i 个指针的地址可以直接算出来。

### 2. 过度分配：为什么 append 是均摊 O(1)

如果每次 `append` 都恰好分配“刚好够用”的内存，那么每次追加都要重新分配并复制整个数组，n 次追加的总代价是 O(n²)。CPython 的做法是**过度分配**（over-allocation）：每次扩容时多申请一些空间，后续的追加就不需要再分配了。我们可以观察到这个过程：

```python
>>> import sys
>>> lst, caps, last = [], [], None
>>> for i in range(70):
...     lst.append(i)
...     cap = (sys.getsizeof(lst) - sys.getsizeof([])) // 8   # 每个指针 8 字节
...     if cap != last:
...         caps.append(cap)
...         last = cap
...
>>> caps
[4, 8, 16, 24, 32, 40, 52, 64, 76]
```

容量依次是 4、8、16、24、32、40、52、64、76……这些数字来自 `Objects/listobject.c` 中的扩容公式：

<!-- norun -->
```c
new_allocated = ((size_t)newsize + (newsize >> 3) + 6) & ~(size_t)3;
```

也就是“新容量 ≈ 需要的大小 × 1.125 + 6，再向下对齐到 4 的倍数”。比如需要放第 17 个元素时：17 + 17/8 + 6 = 25，对齐后得到 24。

增长因子只有 1.125，比 C++ `std::vector` 常见的 2 倍或 1.5 倍保守得多，目的是减少内存浪费。只要增长是**按比例**的（而不是每次固定加几个），均摊下来每次 `append` 的代价仍然是 O(1)：数组每扩容一次，大小就乘以一个常数，扩容的次数是 O(log n)，复制的总量是一个等比数列，求和是 O(n)。

### 3. 时间复杂度

理解了“连续的指针数组”这个结构，各操作的复杂度就不需要死记了：

| 操作 | 复杂度 | 原因 |
|---|---|---|
| `lst[i]`、`lst[i] = x`、`len(lst)` | O(1) | 直接计算地址 / 读取 `ob_size` |
| `lst.append(x)`、`lst.pop()` | 均摊 O(1) | 只动末尾 |
| `lst.insert(0, x)`、`lst.pop(0)` | O(n) | 后面的所有指针都要移动一位 |
| `x in lst`、`lst.index(x)`、`lst.remove(x)` | O(n) | 只能逐个比较 |
| `lst[a:b]` | O(b−a) | 复制切片中的指针 |
| `lst.sort()` | O(n log n) | Timsort，对部分有序的数据接近 O(n) |
| `lst + other`、`lst * k` | O(结果长度) | 创建新列表 |

一个常见的性能陷阱是把列表当队列用：

<!-- norun -->
```python
queue = list(range(100_000))
while queue:
    item = queue.pop(0)        # 每次 O(n)，整体 O(n²)
```

应该使用 `collections.deque`，它是双端队列，两端的添加和删除都是 O(1)：

```python
>>> from collections import deque
>>> q = deque([1, 2, 3])
>>> q.appendleft(0); q.append(4)
>>> q.popleft(), q.pop()
(0, 4)
>>> q
deque([1, 2, 3])
>>> deque(range(10), maxlen=3)     # 设置最大长度后，自动丢弃旧元素，适合做“最近 N 条记录”
deque([7, 8, 9], maxlen=3)
```

### 4. 排序：稳定的 Timsort

```python
>>> students = [("Bob", 85), ("Alice", 92), ("Carol", 85), ("Dave", 92)]
>>> sorted(students, key=lambda s: s[1], reverse=True)
[('Alice', 92), ('Dave', 92), ('Bob', 85), ('Carol', 85)]
```

注意分数相同的学生保持了原来的相对顺序（Alice 在 Dave 前，Bob 在 Carol 前），这就是**稳定排序**。Python 的排序保证稳定，这让“多关键字排序”可以通过多次排序实现：先按次要关键字排，再按主要关键字排。当然，更常见的写法是让 `key` 返回一个元组：

```python
>>> sorted(students, key=lambda s: (-s[1], s[0]))   # 分数降序，同分按名字升序
[('Alice', 92), ('Dave', 92), ('Bob', 85), ('Carol', 85)]
```

`key` 函数对每个元素只调用一次（结果会被缓存），比旧式的比较函数 `cmp` 高效得多。如果确实需要比较函数，可以用 `functools.cmp_to_key` 转换。

Python 使用的排序算法是 Tim Peters 在 2002 年设计的 **Timsort**：它先在数据中寻找已经有序的片段（称为 run），再把这些 run 高效地归并起来。真实世界的数据往往部分有序，所以 Timsort 在实践中表现极佳，后来也被 Java、Android、Swift 等采用。3.11 起，CPython 把归并的调度策略换成了理论上更优的 **Powersort**。

`list.sort()` 原地排序并返回 `None`，`sorted()` 返回新列表。一个常见错误是写 `lst = lst.sort()`，结果 `lst` 变成了 `None`。

### 5. 列表的常见陷阱

**陷阱一：用乘法创建嵌套列表**

```python
>>> grid = [[0] * 3] * 3
>>> grid[0][0] = 1
>>> grid                       # 三行都变了！
[[1, 0, 0], [1, 0, 0], [1, 0, 0]]
>>> grid = [[0] * 3 for _ in range(3)]   # 正确做法：每行都是新列表
>>> grid[0][0] = 1
>>> grid
[[1, 0, 0], [0, 0, 0], [0, 0, 0]]
```

`[x] * 3` 复制的是**引用**，三行其实是同一个列表对象的三个引用——这正是上一篇“标签模型”的直接体现。

**陷阱二：遍历时修改列表**

```python
>>> nums = [1, 2, 2, 3, 4]
>>> for n in nums:
...     if n == 2:
...         nums.remove(n)
...
>>> nums                       # 有一个 2 没被删掉！
[1, 2, 3, 4]
```

`for` 循环内部维护着一个下标。删除第一个 2（下标 1）后，后面的元素整体前移，第二个 2 移到了下标 1，而循环的下一步访问的是下标 2，于是跳过了它。正确做法是构造一个新列表：`nums = [n for n in nums if n != 2]`，或者遍历副本 `for n in nums[:]`。

## 三、元组：不只是“不可变的列表”

### 1. 元组的两种角色

元组常被介绍为“不可变的列表”，但更准确的理解是，它有两种角色：

1. **不可变序列**：可以哈希，能做字典的键、集合的元素；
2. **记录**（record）：每个位置有固定的含义，比如 `(纬度, 经度)`、`(姓名, 年龄, 城市)`。

作为记录时，元组的长度通常是固定的，**位置本身就承载了含义**。这时 `collections.namedtuple` 或 `typing.NamedTuple` 能让代码更易读：

```python
>>> from typing import NamedTuple
>>> class Point(NamedTuple):
...     x: float
...     y: float
...
>>> p = Point(3, 4)
>>> p.x, p[1]                 # 既可以用名字，也可以用下标
(3, 4)
>>> (p.x ** 2 + p.y ** 2) ** 0.5
5.0
>>> p._replace(x=0)           # 不可变，“修改”会返回新对象
Point(x=0, y=4)
```

### 2. 打包与解包

逗号才是创建元组的关键，括号只是为了消除歧义：

```python
>>> t = 1, 2, 3           # 打包
>>> type(t)
<class 'tuple'>
>>> single = (1,)         # 单元素元组必须有逗号
>>> not_a_tuple = (1)     # 这只是加了括号的整数 1
>>> type(single), type(not_a_tuple)
(<class 'tuple'>, <class 'int'>)
```

解包（unpacking）可以作用于任何可迭代对象，而且非常灵活：

```python
>>> a, b = 1, 2
>>> a, b = b, a                       # 交换两个变量，无需临时变量
>>> a, b
(2, 1)
>>> first, *middle, last = range(6)   # 星号收集剩余元素（总是得到列表）
>>> first, middle, last
(0, [1, 2, 3, 4], 5)
>>> (name, age), city = ("Alice", 30), "Paris"    # 嵌套解包
>>> name, city
('Alice', 'Paris')
>>> for i, (k, v) in enumerate({"a": 1, "b": 2}.items()):
...     print(i, k, v)
...
0 a 1
1 b 2
```

`a, b = b, a` 是怎么做到不需要临时变量的？右边 `b, a` 先被求值并打包（CPython 会优化成直接在栈上交换，不真正创建元组），然后再依次绑定给左边的名字。

### 3. 元组为什么更快

```python
import dis

dis.dis("x = (1, 2, 3)")
```

```text
  0           RESUME                   0

  1           LOAD_CONST               2 ((1, 2, 3))
              STORE_NAME               0 (x)
              LOAD_CONST               1 (None)
              RETURN_VALUE
```

元素全是常量的元组，在**编译时**就被构造好，作为一个常量直接加载，运行时零开销。而 `[1, 2, 3]` 每次执行都要新建一个列表。此外，元组的内存是一次性分配的（元素直接跟在对象头后面，不需要像列表那样额外分配一块指针数组），CPython 还为小元组维护了一个复用缓存（free list）。所以：**数据不需要修改时，优先使用元组**。

## 四、字典：现代 Python 的基石

字典是 Python 中最重要的数据结构，没有之一。模块的全局变量、对象的属性、类的方法、关键字参数……底层全都是字典。因此 CPython 对字典做了极其深入的优化。

### 1. 基本用法速览

```python
>>> d = {"apple": 3, "banana": 5}
>>> d["cherry"] = 7
>>> d.get("durian"), d.get("durian", 0)      # 不存在时返回默认值，而不是抛 KeyError
(None, 0)
>>> d.setdefault("apple", 100)               # 存在则返回现有值，不存在才设置
3
>>> d.pop("banana")
5
>>> list(d.keys()), list(d.values())
(['apple', 'cherry'], [3, 7])
>>> d | {"apple": 0, "fig": 1}               # 3.9 新增的合并运算符，右边优先
{'apple': 0, 'cherry': 7, 'fig': 1}
>>> {v: k for k, v in d.items()}             # 字典推导式：交换键和值
{3: 'apple', 7: 'cherry'}
```

`keys()`、`values()`、`items()` 返回的是**视图**（view），而不是列表。视图是动态的：字典变化时视图会同步反映。而且 `keys()` 视图支持集合运算：

```python
>>> a = {"x": 1, "y": 2, "z": 3}
>>> b = {"y": 20, "w": 40}
>>> a.keys() & b.keys(), a.keys() - b.keys()
({'y'}, {'x', 'z'})
```

### 2. 哈希表原理

字典的 O(1) 查找来自**哈希表**。基本思路是：

1. 对键调用 `hash(key)`，得到一个整数；
2. 用这个整数对表的大小取模，得到一个槽位下标；
3. 去这个槽位找。

当两个不同的键映射到同一个槽位时，就发生了**冲突**（collision）。CPython 使用**开放寻址法**解决冲突：如果槽位被占用，就按照一个确定的“探测序列”去尝试下一个槽位，直到找到空位（插入时）或找到目标键（查找时）。

查找时，找到一个非空槽位后，CPython 会先比较**哈希值**是否相等，再比较**身份**（`is`），最后才调用 `==`。因为哈希值不同的两个对象一定不相等，这样能跳过绝大部分昂贵的 `__eq__` 调用。

### 3. 用 Python 复刻 CPython 的探测序列

简单的线性探测（冲突了就看下一个槽位）容易导致数据扎堆，CPython 用的是一种更巧妙的方案（见 `Objects/dictobject.c` 中的注释）：

```python
PERTURB_SHIFT = 5


class ToyDict:
    """用 CPython 的探测算法实现的玩具哈希表（不支持删除和扩容）。"""

    def __init__(self, size=8):
        self.mask = size - 1                 # 大小是 2 的幂，取模可以用位与代替
        self.slots = [None] * size           # 每个槽位存 (hash, key, value)

    def _probe(self, key):
        h = hash(key)
        perturb = h & 0xFFFFFFFFFFFFFFFF     # 当作无符号数处理
        i = h & self.mask
        while True:
            yield i
            perturb >>= PERTURB_SHIFT
            i = (i * 5 + perturb + 1) & self.mask

    def __setitem__(self, key, value):
        for step, i in enumerate(self._probe(key)):
            slot = self.slots[i]
            if slot is None or slot[1] == key:
                self.slots[i] = (hash(key), key, value)
                print(f"put {key!r:>4}: hash={hash(key):>3} -> 槽位 {i}（探测 {step + 1} 次）")
                return

    def __getitem__(self, key):
        for i in self._probe(key):
            slot = self.slots[i]
            if slot is None:
                raise KeyError(key)
            if slot[0] == hash(key) and (slot[1] is key or slot[1] == key):
                return slot[2]


d = ToyDict()
for k in (1, 9, 17, 4):        # 1、9、17 对 8 取模都是 1，会冲突
    d[k] = str(k)
print(d[17], d[4])
print([s[1] if s else None for s in d.slots])
```

```text
put    1: hash=  1 -> 槽位 1（探测 1 次）
put    9: hash=  9 -> 槽位 6（探测 2 次）
put   17: hash= 17 -> 槽位 7（探测 3 次）
put    4: hash=  4 -> 槽位 4（探测 1 次）
17 4
[None, 1, None, None, 4, None, 9, 17]
```

整数的哈希值就是它本身，所以 1、9、17 的初始槽位都是 `h & 7 = 1`，发生了冲突。我们手工追踪一下：

- 键 9：槽位 1 被占，`perturb = 9 >> 5 = 0`，下一个下标是 `(1*5 + 0 + 1) & 7 = 6`，空，放入。
- 键 17：槽位 1 被占，同理来到槽位 6，又被 9 占了；再算 `(6*5 + 0 + 1) & 7 = 7`，空，放入。

对于这几个很小的整数，`perturb` 右移一次就变成了 0，探测序列退化为 `i = (5*i + 1) mod 8`：1 → 6 → 7 → 4 → 5 → 2 → 3 → 0。可以验证，这个序列**恰好不重复地遍历了全部 8 个槽位**——数论保证了对任何 2 的幂大小的表，`5*i + 1` 递推都能做到这一点，所以只要表没满，就一定能找到空位。

那 `perturb` 有什么用？当哈希值很大时（比如字符串的哈希），只用低几位取模会丢掉高位的全部信息：两个低 3 位相同的哈希值，即使高位千差万别，也会走完全相同的探测路径，形成扎堆。`perturb` 在每一步把哈希值的**高位**逐渐混入下标计算，让这些键很快“分道扬镳”；等高位用完、`perturb` 变成 0 后，再由 `5*i + 1` 兜底保证遍历所有槽位。

### 4. 紧凑字典与有序性

在 3.6 之前，字典的哈希表直接存放 `(hash, key, value)` 三元组。为了保证足够低的冲突率，表通常有 1/3 以上的空槽，每个空槽也要占 24 字节，非常浪费。

3.6 起，CPython 采用了 Raymond Hettinger 提出的**紧凑字典**（compact dict）设计，把哈希表拆成两个数组：

```text
d = {"timmy": "red", "barry": "green", "guido": "blue"}

indices（哈希表，稀疏，每格只有 1~8 字节）:
    [None, 1, None, None, 0, None, 2, None]

entries（紧凑，按插入顺序排列）:
    0: (hash("timmy"), "timmy", "red")
    1: (hash("barry"), "barry", "green")
    2: (hash("guido"), "guido", "blue")
```

稀疏的哈希表里只存一个很小的整数（指向 `entries` 中的下标），而真正的数据按插入顺序紧凑地排列。这带来了两个好处：

1. **内存大幅减少**：空槽只占 1 个字节（表较小时下标用 `int8` 就够了），而不是 24 字节。
2. **天然保持插入顺序**：遍历字典时只需顺序遍历 `entries` 数组。

插入顺序一开始只是这个实现的“副作用”，3.7 起被正式写入了语言规范。今天你可以放心依赖“字典按插入顺序迭代”这一保证。

### 5. 扩容：保持 2/3 的负载

```python
>>> d, sizes, last = {}, [], sys.getsizeof({})
>>> for i in range(100):
...     d[i] = i
...     if sys.getsizeof(d) != last:
...         last = sys.getsizeof(d)
...         sizes.append(len(d))
...
>>> sizes          # 在插入第几个元素时发生了扩容
[1, 6, 11, 22, 43, 86]
```

空字典不分配哈希表；插入第一个元素时分配大小为 8 的表。之后，每当元素数量将要超过表大小的 **2/3** 时就扩容：8 的 2/3 约为 5，所以第 6 个元素触发扩容；新表大小 16，可容纳 10 个，所以第 11 个元素再次触发……扩容时新的表大小是“不小于当前元素数 × 3 的最小 2 的幂”，所有元素都要重新插入（rehash）。和列表一样，按比例增长保证了均摊 O(1) 的插入代价。

### 6. 什么样的对象能做键

字典要求键满足两个条件：

1. **可哈希**：实现了 `__hash__`，并且哈希值在对象生命周期内不变；
2. **相等的对象哈希值必须相同**：如果 `a == b`，那么必须有 `hash(a) == hash(b)`。

第二条非常关键。看这个例子：

```python
>>> {1: "int", 1.0: "float", True: "bool"}
{1: 'bool'}
```

因为 `1 == 1.0 == True`，它们的哈希值也都相同（Python 精心保证了数值类型之间的哈希一致性），所以在字典看来它们是**同一个键**：第一次插入用的键 `1` 被保留，值被后两次覆盖。

为什么列表不能做键？如果允许，把列表作为键插入字典后再修改它，它的哈希值就变了，下次用它查找时会去另一个槽位找，永远也找不到了——字典就“坏”了。可变容器因此都把 `__hash__` 设为 `None`。自定义类的哈希规则会在 {% post_link Python-10-Data-Model '第 10 篇' %} 详细讨论。

整数的哈希值有个小彩蛋：

```python
>>> hash(1), hash(-1), hash(-2)
(1, -2, -2)
```

`hash(-1)` 居然是 `-2`！因为在 CPython 的 C 代码中，`-1` 被用作“哈希函数出错”的返回值，所以任何哈希结果为 -1 的对象都会被改成 -2。这再次说明哈希冲突是正常的，字典永远会在哈希相等之后再用 `==` 确认。

### 7. 哈希随机化

```python
>>> isinstance(hash("abc"), int)
True
```

字符串的哈希值在每次启动 Python 时都不同（可以通过环境变量 `PYTHONHASHSEED` 固定）。这是 3.3 引入的安全措施：如果哈希函数是固定的，攻击者可以构造大量哈希值冲突的字符串（比如 HTTP 请求参数名），让服务器的字典退化成链表，查找从 O(1) 变成 O(n)，从而发动拒绝服务攻击。随机化之后，攻击者无法预先算出冲突的键。这也是**集合的迭代顺序**在不同运行之间可能不同的原因。

### 8. 遍历时不要修改字典的大小

```python
>>> d = {"a": 1, "b": 2}
>>> for k in d:
...     d[k + "_copy"] = 0
...
Traceback (most recent call last):
  ...
RuntimeError: dictionary changed size during iteration
```

和列表不同，字典会检测这种情况并直接报错（因为扩容会让迭代器的位置完全失效）。需要边遍历边修改时，遍历键的副本：`for k in list(d):`。

## 五、集合：只有键的字典

集合（`set`）也是哈希表实现的，可以理解为“只有键、没有值”的字典（不过 CPython 中它有独立的实现，没有采用紧凑布局，所以**集合不保证顺序**）。

```python
>>> a = {1, 2, 3, 4}
>>> b = {3, 4, 5}
>>> a | b, a & b, a - b, a ^ b       # 并集、交集、差集、对称差
({1, 2, 3, 4, 5}, {3, 4}, {1, 2}, {1, 2, 5})
>>> {1, 2} <= a                       # 子集判断
True
>>> empty = set()                     # 注意：{} 是空字典，不是空集合
>>> type({})
<class 'dict'>
```

集合的典型用途：

- **成员测试**：`x in some_set` 是 O(1)，而 `x in some_list` 是 O(n)。如果需要在循环中反复判断成员关系，先把列表转成集合，往往能带来数量级的提速。
- **去重**：`set(items)`。但集合不保证顺序，如果要**保持原顺序去重**，可以借助字典的有序性：

```python
>>> items = ["b", "a", "b", "c", "a"]
>>> list(dict.fromkeys(items))
['b', 'a', 'c']
```

`frozenset` 是不可变的集合，可以哈希，因此能作为字典的键或另一个集合的元素。

## 六、深拷贝与浅拷贝

对于嵌套的容器，“复制”有两个层次：

- **浅拷贝**（shallow copy）：创建一个新的外层容器，但里面的元素仍然是**原来对象的引用**。`lst.copy()`、`list(lst)`、`lst[:]`、`dict(d)`、`copy.copy(x)` 都是浅拷贝。
- **深拷贝**（deep copy）：递归地复制所有层级的对象，得到完全独立的副本。使用 `copy.deepcopy(x)`。

```python
>>> import copy
>>> original = {"name": "Alice", "tags": ["admin", "dev"]}
>>> shallow = copy.copy(original)
>>> deep = copy.deepcopy(original)
>>> original["tags"].append("ops")
>>> shallow["tags"]            # 浅拷贝共享了内层列表
['admin', 'dev', 'ops']
>>> deep["tags"]               # 深拷贝不受影响
['admin', 'dev']
```

`deepcopy` 内部维护一个 `memo` 字典，记录已经复制过的对象。这让它能正确处理**循环引用**和**共享引用**：同一个对象在副本中也只会被复制一次。

```python
>>> a = [1, 2]
>>> a.append(a)               # a 包含了自己
>>> a
[1, 2, [...]]
>>> b = copy.deepcopy(a)      # 不会无限递归
>>> b[2] is b
True
```

深拷贝的代价很高，而且对文件、锁、数据库连接这类对象的“复制”往往没有意义。在设计上，更好的做法通常是使用不可变数据结构，从根本上避免“被意外修改”的问题。

3.13 新增了 `copy.replace()`，为“创建一个修改了部分字段的副本”提供了统一接口，支持命名元组、数据类、`datetime` 等：

```python
>>> from datetime import date
>>> copy.replace(date(2026, 10, 7), day=1)
datetime.date(2026, 10, 1)
```

## 七、如何选择容器

| 需求 | 推荐 |
|---|---|
| 有序、经常在末尾增删、按位置访问 | `list` |
| 两端增删（队列、滑动窗口） | `collections.deque` |
| 固定结构的记录、作为字典键 | `tuple` / `NamedTuple` |
| 通过键快速查找 | `dict` |
| 计数 | `collections.Counter` |
| 键不存在时自动创建默认值 | `collections.defaultdict` |
| 快速成员测试、去重、集合运算 | `set` / `frozenset` |
| 始终有序的集合、按顺序取第 k 小 | 第三方库 `sortedcontainers` |
| 优先队列（反复取最小值） | `heapq` |
| 大量同类型数值 | `array.array` 或 NumPy |

## 小结

- 列表是存放对象指针的动态数组，按约 1.125 倍过度分配，`append` 均摊 O(1)，头部增删 O(n)。
- 元组既是不可变序列又是记录；常量元组在编译时构造；解包语法强大而灵活。
- 字典是开放寻址的哈希表，3.6 起采用“稀疏下标数组 + 紧凑条目数组”的设计，天然有序；负载超过 2/3 时扩容。
- 键必须可哈希，且相等的对象哈希值必须相同；`1`、`1.0`、`True` 是同一个键。
- 集合也是哈希表，成员测试 O(1)，但不保证顺序。
- 浅拷贝只复制外层；`deepcopy` 递归复制并能处理循环引用。

## 练习

1. 完善本文的 `ToyDict`：支持删除操作。注意：开放寻址的哈希表**不能**简单地把槽位置为空，否则会打断其他键的探测链。CPython 是怎么解决这个问题的？（提示：搜索 “dummy entry”。）
2. 写一个函数，比较 `x in list` 和 `x in set` 在 10 万个元素下的查找耗时（使用 `timeit` 模块），并解释结果。
3. 实现一个 `LRUCache` 类，要求 `get` 和 `put` 都是 O(1)。提示：可以利用字典的有序性，或者 `collections.OrderedDict` 的 `move_to_end` 方法。
4. 解释为什么 `sorted(["10", "9", "100"])` 的结果是 `['10', '100', '9']`，并写出按数值大小排序的代码。
5. 下面代码的输出是什么？为什么？
   ```python
   d = {}
   d[1] = "a"
   d[1.0] = "b"
   d[True] = "c"
   print(d, len(d))
   ```

下一篇我们将学习如何用条件、循环、推导式和模式匹配来组织程序逻辑：{% post_link Python-05-Control-Flow '流程控制、推导式与模式匹配' %}。
