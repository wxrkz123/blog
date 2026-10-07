---
title: Python 从入门到精通（12）：模块、包与导入系统
date: 2026-10-07 11:00:00
summary: import 语句的完整流程：sys.modules 缓存、sys.path 搜索、查找器与加载器、模块规格；from-import 的“复制绑定”陷阱、包与相对导入、__main__ 与 python -m、循环导入的成因与解法；手写一个从内存加载代码的元路径查找器；最后介绍 pyproject.toml 与打包发布。
tags:
  - Python
  - Python进阶
categories:
  - Python
---

当项目从一个脚本成长为成百上千个文件时，如何组织代码就成了核心问题。Python 用**模块**和**包**来组织代码，用 `import` 语句把它们连接起来。`import` 看起来简单，背后却是一套相当精巧、而且**完全可以定制**的机制。理解它，你才能看懂“为什么 import 不到”“为什么 import 了两次”“为什么出现循环导入”这些常见问题。

> 本文是「Python 从入门到精通」系列第 12 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、模块就是对象

一个 `.py` 文件就是一个**模块**。导入之后，它在运行时表现为一个**模块对象**，文件中定义的全局变量、函数、类都成为这个对象的属性：

```python
>>> import json
>>> type(json)
<class 'module'>
>>> json.__name__
'json'
>>> json.__file__.endswith(("json/__init__.py", "json\\__init__.py"))
True
>>> callable(json.__dict__["dumps"])     # 模块的命名空间就是它的 __dict__
True
```

模块的全局命名空间就是模块对象的 `__dict__`，第 02 篇中用 `globals()` 看到的字典，正是当前模块的 `__dict__`。

## 二、import 语句做了什么

执行 `import spam` 时，Python 大致按照以下步骤工作：

1. **检查缓存**：在 `sys.modules` 字典中查找 `"spam"`。如果找到了，直接使用缓存的模块对象，跳到第 5 步。
2. **查找**：依次询问 `sys.meta_path` 中的**查找器**（finder），谁能找到名为 `spam` 的模块。找到后，查找器返回一个**模块规格**（module spec），描述了模块在哪里、该由哪个**加载器**（loader）加载。
3. **创建并缓存**：根据规格创建一个空的模块对象，并**立即**放入 `sys.modules`。
4. **执行**：加载器读取（或编译）模块的代码，在新模块的 `__dict__` 中**执行**它。
5. **绑定**：在当前命名空间中，把名字 `spam` 绑定到模块对象上。

其中有两个关键点值得反复强调：

- **模块代码只在第一次导入时执行一次**，之后的导入都直接从 `sys.modules` 中取。
- 模块是在**执行之前**就被放进 `sys.modules` 的。这个细节决定了循环导入的行为，后面会详细分析。

### 1. 模块只执行一次

我们创建一个会打印信息的模块来验证：

<!-- file: noisy.py -->
```python
print(f"正在执行 {__name__} 模块的代码")
counter = 0
```

```python
import sys

import noisy
import noisy                     # 第二次导入：不会再打印
from noisy import counter        # 也不会

print("noisy" in sys.modules, sys.modules["noisy"] is noisy)
```

```text
正在执行 noisy 模块的代码
True True
```

这意味着模块级别的代码天然就是“单例”：模块中的全局变量在整个程序中只有一份。很多时候，一个模块本身就是实现单例模式最简单的方式。

如果在交互式环境中修改了模块的源代码，希望重新加载，可以使用 `importlib.reload(module)`。但要注意它的局限：它会重新执行模块代码、更新模块对象的属性，但**其他地方已经通过 `from module import name` 拿到的旧对象不会被更新**，已经创建的旧类的实例也依然指向旧的类。所以 `reload` 只适合在交互式调试中使用。

### 2. 模块搜索路径 sys.path

默认的 `PathFinder` 查找器会在 `sys.path` 列出的目录中依次搜索模块。`sys.path` 的初始值由以下部分组成：

1. 被运行的脚本所在的目录（交互模式或 `-c` 时是当前目录；`-m` 时也是当前目录）；
2. 环境变量 `PYTHONPATH` 中的目录；
3. 标准库目录；
4. `site-packages` 目录（第三方包，由 `site` 模块添加）。

```python
>>> import sys
>>> any(p.endswith("site-packages") for p in sys.path)
True
```

**脚本目录排在最前面**，这就是第 01 篇提到的“文件名遮蔽标准库”问题的根源：如果你的项目里有一个 `random.py`，那么 `import random` 会导入你的文件而不是标准库。3.13 起，遇到这种情况时，错误信息会主动提示你可能遮蔽了标准库模块。

### 3. 查找器、加载器与模块规格

我们可以手动调用查找过程，看看一个模块的规格长什么样：

```python
>>> import importlib.util
>>> spec = importlib.util.find_spec("json")
>>> spec.name, type(spec.loader).__name__
('json', 'SourceFileLoader')
>>> spec.submodule_search_locations is not None     # 有这个属性说明它是一个包
True
>>> importlib.util.find_spec("sys").origin          # 内置模块
'built-in'
>>> importlib.util.find_spec("no_such_module") is None
True
>>> [type(f).__name__ if not isinstance(f, type) else f.__name__ for f in sys.meta_path][:3]
['BuiltinImporter', 'FrozenImporter', 'PathFinder']
```

`sys.meta_path` 中默认有三个查找器：`BuiltinImporter` 负责编译进解释器的内置模块（如 `sys`），`FrozenImporter` 负责“冻结”模块（为了加快启动速度，部分启动必需的标准库模块被直接编译进解释器），`PathFinder` 负责在 `sys.path` 中查找文件。导入系统的每一个环节都是可以替换或扩展的，本篇后面会亲手写一个查找器。

## 三、各种 import 形式

### 1. import 与 from-import

<!-- norun -->
```python
import os.path                 # 导入 os 和 os.path，在当前命名空间绑定名字 os
import numpy as np             # 导入 numpy，绑定为名字 np
from os import path            # 导入 os，然后把 os.path 这个属性绑定为名字 path
from os.path import join, exists
from json import loads as parse_json
```

`from module import name` 的语义是：**先完整地导入 `module`，再从中取出属性 `name`，在当前命名空间中创建一个同名的绑定**。它不会“只导入模块的一部分”——整个模块的代码都会被执行。

### 2. from-import 的“复制绑定”陷阱

因为 `from module import name` 是在当前模块中**新建了一个名字**，指向那一刻 `module.name` 所指的对象，所以之后如果 `module.name` 被**重新绑定**，你的名字并不会跟着变：

<!-- file: config.py -->
```python
DEBUG = False


def enable_debug():
    global DEBUG
    DEBUG = True
```

```python
import config
from config import DEBUG

config.enable_debug()
print("from-import 得到的:", DEBUG)          # 还是旧值
print("通过模块访问的:", config.DEBUG)        # 最新值
```

```text
from-import 得到的: False
通过模块访问的: True
```

这又是第 02 篇“名字绑定”模型的直接体现。所以，对于**会在运行时变化**的模块级变量，应该通过 `module.name` 的方式访问；同样的道理，在测试中用 mock 替换某个函数时，必须替换“使用者所在模块”中的那个名字，而不是定义处的名字。

### 3. from module import * 与 __all__

`from module import *` 会导入模块中所有“公开”的名字（不以下划线开头的）。如果模块定义了 `__all__` 列表，就只导入列表中的名字：

<!-- norun -->
```python
# shapes.py
__all__ = ["Circle", "Square"]      # 明确声明公开 API

class Circle: ...
class Square: ...
def _helper(): ...                   # 不会被 import * 导入
```

在应用代码中应该避免使用 `import *`：它会让读者无法判断一个名字来自哪里，还可能悄悄覆盖已有的名字。但在包的 `__init__.py` 中“重新导出”子模块的内容时，配合 `__all__` 使用是合理的。

## 四、包

### 1. 常规包

**包**（package）是包含模块的目录，用来组织层级化的模块命名空间。一个目录中放一个 `__init__.py` 文件，它就成了一个常规包：

<!-- norun -->
```text
shop/
├── __init__.py
├── models.py
└── payment/
    ├── __init__.py
    ├── alipay.py
    └── utils.py
```

我们实际创建这样一个包：

<!-- file: shop/__init__.py -->
```python
print("初始化 shop 包")
from .models import Product          # 在包的 __init__ 中重新导出，简化使用者的导入路径

__all__ = ["Product"]
```

<!-- file: shop/models.py -->
```python
from dataclasses import dataclass


@dataclass
class Product:
    name: str
    price: int
```

<!-- file: shop/payment/__init__.py -->
```python
# 可以是空文件，它的存在就标志着 payment 是一个包
```

<!-- file: shop/payment/utils.py -->
```python
def fen_to_yuan(fen: int) -> str:
    return f"¥{fen / 100:.2f}"
```

<!-- file: shop/payment/alipay.py -->
```python
from .utils import fen_to_yuan            # 同一个包内的模块：一个点
from ..models import Product              # 上一级包中的模块：两个点


def pay(product: Product) -> str:
    return f"支付宝支付 {product.name}：{fen_to_yuan(product.price)}"
```

```python
from shop.payment.alipay import pay
from shop import Product
import shop

print(pay(Product("键盘", 29900)))
print(shop.payment.alipay.__name__, shop.payment.__package__)
print(shop.__path__ is not None)
```

```text
初始化 shop 包
支付宝支付 键盘：¥299.00
shop.payment.alipay shop.payment
True
```

几点说明：

- 导入 `shop.payment.alipay` 时，Python 会**依次**导入 `shop`、`shop.payment`、`shop.payment.alipay`，每个包的 `__init__.py` 都会被执行一次。
- 导入子模块后，子模块会被设置为父包的属性，所以 `shop.payment.alipay` 可以直接访问。
- 包对象有一个 `__path__` 属性（一个目录列表），导入子模块时，会在这些目录中查找，而不是在 `sys.path` 中查找。

### 2. 相对导入

`from .utils import ...` 中的点表示**相对导入**：一个点表示当前包，两个点表示上一级包，以此类推。相对导入是基于模块的 `__package__` 属性（也就是“我属于哪个包”）解析的。

这带来了一个经常困扰初学者的问题：**直接以脚本方式运行包内的模块时，相对导入会失败**：

```python
import subprocess, sys

result = subprocess.run([sys.executable, "shop/payment/alipay.py"], capture_output=True, text=True)
print(result.stderr.strip().splitlines()[-1])
```

```text
ImportError: attempted relative import with no known parent package
```

因为直接运行一个文件时，它的 `__name__` 是 `"__main__"`，`__package__` 是空的，Python 不知道它属于哪个包。正确的做法是在项目根目录用 `-m` 以**模块名**运行：`python -m shop.payment.alipay`。这时 Python 会正确地把 `shop.payment` 设置为它的包，相对导入就能工作了。

### 3. `__main__.py`：让包可以直接运行

如果一个包中有 `__main__.py`，就可以用 `python -m 包名` 运行它。标准库中的 `python -m json.tool`、`python -m http.server`、`python -m venv` 都是这样实现的。

### 4. 命名空间包

3.3 起，没有 `__init__.py` 的目录也可以被导入，称为**命名空间包**（namespace package，PEP 420）。它的特殊之处在于，同名的命名空间包可以**分布在多个目录中**，Python 会把它们合并成一个包。这主要用于大型组织把一个顶级命名空间（如 `google.cloud`）拆分成多个独立发布的分发包。

对于普通项目，**请始终使用带 `__init__.py` 的常规包**。命名空间包的导入速度稍慢（需要扫描 `sys.path` 中的所有目录），而且如果目录名不小心和别的包重名，很容易引发难以排查的问题。

## 五、`if __name__ == "__main__"`

我们在第 01 篇就见过这个惯用法。现在可以完整地理解它了：

- 模块被**导入**时，`__name__` 是它的完整模块名（如 `"shop.models"`）；
- 文件被**直接运行**（`python file.py`）或通过 `python -m` 运行时，`__name__` 被设置为 `"__main__"`。

所以 `if __name__ == "__main__":` 下面的代码只在“作为程序运行”时执行，被导入时不执行。这让一个文件可以既是可复用的库，又是可执行的脚本。最佳实践是把主逻辑放在一个 `main()` 函数中：

<!-- norun -->
```python
def main() -> int:
    ...
    return 0

if __name__ == "__main__":
    raise SystemExit(main())       # 把返回值作为进程的退出码
```

还有一个容易踩的坑：被运行的脚本以 `__main__` 的名字加载，如果其他模块又以它的真实名字 `import` 它，那么同一个文件会被**执行两次**，产生两个不同的模块对象，其中的全局变量和类也是两份。所以，不要让其他模块导入你的入口脚本。

## 六、循环导入

### 1. 问题重现

模块 A 导入模块 B，模块 B 又导入模块 A，就形成了循环导入。它不一定会出错，但很容易出错：

<!-- file: orders.py -->
```python
from customers import Customer        # orders 依赖 customers


class Order:
    def __init__(self, customer: "Customer"):
        self.customer = customer
```

<!-- file: customers.py -->
```python
from orders import Order              # customers 又依赖 orders


class Customer:
    def new_order(self):
        return Order(self)
```

<!-- raises -->
```python
import orders
```

在 3.12 中运行，会得到这样的错误：

```text
ImportError: cannot import name 'Order' from partially initialized module 'orders'
(most likely due to a circular import)
```

按照前面讲的导入步骤，逐步分析发生了什么：

1. `import orders`：创建空模块 `orders`，放入 `sys.modules`，开始执行 `orders.py`；
2. 第一行 `from customers import Customer`：创建空模块 `customers`，放入 `sys.modules`，开始执行 `customers.py`；
3. `customers.py` 的第一行 `from orders import Order`：`orders` 已经在 `sys.modules` 中了（第 1 步放进去的），所以**不会**再次执行它，而是直接从中取 `Order` 属性——但 `orders.py` 此时才执行到第一行，`Order` 类还没有被定义！于是报错。

错误信息中的 “partially initialized module”（部分初始化的模块）精确地描述了这个状态。这也解释了为什么模块要在**执行之前**就放进 `sys.modules`：如果不这样做，循环导入就会变成无限递归。

不过，如果你在 3.13 或 3.14 中运行同样的代码，看到的可能是另一条信息：

```text
ImportError: cannot import name 'Order' from 'orders' (consider renaming '.../orders.py'
if it has the same name as a library you intended to import)
```

这是 3.13 新增的“遮蔽检测”提示：当出错的模块位于脚本目录（`sys.path[0]`）中时，解释器会猜测你可能用自己的文件遮蔽了某个同名的库。在循环导入的场景下，这个猜测是错误的，反而掩盖了真正的原因。所以，看到 “cannot import name X from Y” 时，除了检查命名冲突，也一定要想一想是不是存在循环导入。

### 2. 解决方法

1. **重新设计，消除循环依赖**（最佳方案）：循环导入往往意味着模块的职责划分有问题。可以把双方共同依赖的部分提取到第三个模块中，或者合并这两个模块。
2. **改用 `import module` 形式并延迟访问属性**：把 `from orders import Order` 改为 `import orders`，然后在函数内部使用 `orders.Order`。这样导入时只需要模块对象存在即可，属性在函数**被调用时**才去访问，那时两个模块都已经执行完毕了。
3. **把导入移到函数内部**：只在真正需要时才导入。
4. **仅为类型注解而导入时，使用 `TYPE_CHECKING`**：

<!-- norun -->
```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:                      # 类型检查器会执行这个分支，运行时则不会
    from customers import Customer

class Order:
    def __init__(self, customer: "Customer"):   # 注解使用字符串（或依赖 3.14 的延迟求值）
        self.customer = customer
```

3.14 中，注解默认是**延迟求值**的（PEP 649），注解中引用尚未导入的名字不再会在运行时出错，这让第 4 种方法变得更加自然。我们会在 {% post_link Python-16-Type-Hints '第 16 篇' %} 详细介绍。

## 七、深入：自定义导入器

导入系统的每个环节都可以扩展。下面我们实现一个**元路径查找器**，让 Python 能够从一个内存中的字典里导入模块——这和 pytest 改写断言、从 zip 文件导入模块、从网络导入插件的原理是一样的：

```python
import importlib.abc
import importlib.util
import sys

SOURCES = {
    "virtual_math": "PI = 3.14159\ndef area(r):\n    return PI * r * r\n",
    "virtual_greet": "from virtual_math import area\nMSG = f'半径为 2 的圆面积约为 {area(2):.2f}'\n",
}


class DictFinder(importlib.abc.MetaPathFinder):
    """查找器：判断模块是否存在，返回模块规格。"""

    def find_spec(self, fullname, path, target=None):
        if fullname in SOURCES:
            return importlib.util.spec_from_loader(fullname, DictLoader(), origin="<memory>")
        return None                                   # 返回 None：交给下一个查找器


class DictLoader(importlib.abc.Loader):
    """加载器：在模块的命名空间中执行代码。"""

    def create_module(self, spec):
        return None                                   # 使用默认的模块创建方式

    def exec_module(self, module):
        print(f"[DictLoader] 加载 {module.__name__}")
        code = compile(SOURCES[module.__name__], f"<memory:{module.__name__}>", "exec")
        exec(code, module.__dict__)


sys.meta_path.insert(0, DictFinder())                # 放在最前面，优先于文件系统

import virtual_greet

print(virtual_greet.MSG)
print(virtual_greet.__spec__.origin)
```

```text
[DictLoader] 加载 virtual_greet
[DictLoader] 加载 virtual_math
半径为 2 的圆面积约为 12.57
<memory>
```

我们只写了两个小类：查找器负责回答“这个模块在哪儿”，加载器负责“在模块的命名空间中执行代码”。`virtual_greet` 内部的 `from virtual_math import area` 也自然地走了我们的查找器。现在你应该能理解，为什么说 Python 的导入系统是“可以编程的”了。

## 八、导入的性能

导入并不免费：查找文件、读取 `.pyc`、执行模块代码都需要时间。对于命令行工具，启动时间直接影响用户体验。几个常用的分析与优化手段：

- 用 `python -X importtime -c "import 你的模块"` 查看每个模块的导入耗时（第 01 篇介绍过）；
- 把只在部分代码路径中使用的重量级依赖（如 `pandas`、`matplotlib`）的导入**移到函数内部**；
- 避免在模块的顶层执行耗时操作（读取大文件、建立网络连接、复杂计算），把它们放到函数中按需执行；
- 标准库提供了 `importlib.util.LazyLoader`，可以让模块在第一次访问属性时才真正执行。

## 九、打包与发布

最后简单介绍如何把你的包分享给别人。现代 Python 项目使用 **`pyproject.toml`** 作为统一的配置文件（PEP 517、518、621）。推荐使用 **src 布局**：

<!-- norun -->
```text
my-project/
├── pyproject.toml
├── README.md
├── src/
│   └── my_package/
│       ├── __init__.py
│       └── cli.py
└── tests/
    └── test_cli.py
```

把包放在 `src/` 目录下，可以保证测试运行的是**安装后的包**，而不是碰巧因为当前目录在 `sys.path` 中而被导入的源码目录，从而尽早发现打包配置的错误。

一个最小的 `pyproject.toml`：

<!-- norun -->
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "0.1.0"
description = "一个示例包"
requires-python = ">=3.12"
dependencies = ["requests>=2.31"]

[project.scripts]
my-tool = "my_package.cli:main"      # 安装后会生成一个名为 my-tool 的命令行程序
```

然后：

<!-- norun -->
```bash
uv build                    # 生成 dist/ 下的 .whl（wheel，二进制分发）和 .tar.gz（源码分发）
uv pip install -e .         # 可编辑安装：修改源码后无需重新安装即可生效
uv publish                  # 上传到 PyPI
```

这里有两个容易混淆的名字：**分发包名**（`pyproject.toml` 中的 `name`，用于 `pip install`，如 `my-package`）和**导入包名**（目录名，用于 `import`，如 `my_package`）。它们可以不同，比如 `pip install scikit-learn` 后要 `import sklearn`，`pip install pillow` 后要 `import PIL`。

## 小结

- 模块是对象，模块的命名空间就是它的 `__dict__`。
- `import` 的流程：查 `sys.modules` 缓存 → 用查找器得到模块规格 → 创建模块并**先**放入 `sys.modules` → 执行模块代码 → 绑定名字。模块代码只执行一次。
- `sys.path` 决定了搜索位置，脚本目录排在最前，小心命名冲突。
- `from m import x` 在当前模块创建新的绑定，`m.x` 之后被重新绑定时不会同步。
- 包是带 `__init__.py` 的目录；相对导入依赖 `__package__`，因此包内模块应该用 `python -m` 运行。
- 循环导入失败的根源是“部分初始化的模块”；首选通过重构消除循环。
- 导入系统由查找器和加载器组成，可以通过 `sys.meta_path` 自由扩展。
- 使用 `pyproject.toml` + src 布局来打包项目。

## 练习

1. 写一个函数 `who_imports(module_name)`，在程序运行的某一时刻，列出 `sys.modules` 中所有直接引用了该模块对象的模块（提示：遍历每个模块的 `__dict__`）。
2. 修改本文的 `orders`/`customers` 例子，分别用“`import module` 延迟访问”和“提取公共模块”两种方式消除循环导入错误。
3. 扩展 `DictFinder`，让它支持包：`SOURCES` 中的 `"pkg/__init__"` 和 `"pkg/sub"` 能够被 `import pkg.sub` 正确导入（提示：包的模块规格需要设置 `submodule_search_locations`）。
4. 实现一个查找器，在导入任何名字以 `legacy_` 开头的模块时，发出一个 `DeprecationWarning`，但不影响正常导入。
5. 为你自己的一个小工具编写 `pyproject.toml`，使用 `[project.scripts]` 生成命令行入口，在一个新的虚拟环境中安装并运行它。

下一篇我们将巡游 Python 标准库中最实用的那些模块：{% post_link Python-13-Standard-Library '标准库精选' %}。
