---
title: Python 从入门到精通（22）：测试与工程化实践
date: 2026-10-07 10:10:00
summary: 系列终篇。用 pytest 编写测试：断言改写、fixture、参数化、异常与 mock；用 Hypothesis 做基于属性的测试，并亲眼看它自动找出“满 1000 减 50”规则中的价格倒挂 bug；覆盖率、项目结构、pyproject.toml 统一配置、Ruff 与类型检查、pre-commit、GitHub Actions 持续集成，以及 pdb 调试与 3.14 的远程附加调试。
tags:
  - Python
  - Python高级
categories:
  - Python
---

写出能运行的代码只是开始。一段代码要成为可靠的**软件**，还需要测试来保证它是正确的、在修改后依然正确；需要统一的项目结构和工具链，让团队协作顺畅；需要自动化的流程，让每一次提交都经过检查。本篇是整个系列的最后一篇，我们把视角从语言本身转向工程实践，并以一个真实的“测试发现 bug”的案例作为结尾。

> 本文是「Python 从入门到精通」系列第 22 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、为什么要写测试

- **测试是安全网**：有了足够的测试，你才敢重构代码、升级依赖、优化性能（上一篇的第一条原则就是“先让程序正确”）；
- **测试是活的文档**：一个测试清楚地说明了“在这种输入下，代码应该有怎样的行为”，而且永远不会过时；
- **测试驱动更好的设计**：难以测试的代码，往往是耦合过紧、职责不清的代码。

测试通常分为几个层次，形成一个“金字塔”：底层是大量快速、独立的**单元测试**（测试单个函数或类）；中间是适量的**集成测试**（测试多个组件的协作，比如代码与真实的数据库）；顶层是少量的**端到端测试**（从用户的角度测试整个系统）。越往上，测试越慢、越脆弱、越难定位问题，所以数量应该越少。

## 二、pytest 基础

Python 标准库自带 `unittest` 模块（xUnit 风格，需要写测试类和 `self.assertEqual` 这样的方法），但社区的事实标准是 **pytest**：它让测试就是普通的函数和普通的 `assert` 语句。

### 1. 被测代码

我们以一个订单计价模块为例：

<!-- file: pricing.py -->
```python
"""一个简单的订单计价模块。"""
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Protocol


class ExchangeRates(Protocol):
    def rate(self, currency: str) -> Decimal: ...


@dataclass(frozen=True)
class Item:
    name: str
    price: Decimal
    quantity: int = 1


def subtotal(items: list[Item]) -> Decimal:
    return sum((i.price * i.quantity for i in items), Decimal("0"))


def discount(amount: Decimal, member_level: str) -> Decimal:
    """会员折扣：gold 九折，silver 九五折；折后满 1000 再减 50。"""
    rates = {"gold": Decimal("0.90"), "silver": Decimal("0.95"), "none": Decimal("1")}
    if member_level not in rates:
        raise ValueError(f"未知的会员等级: {member_level}")
    result = amount * rates[member_level]
    if result >= 1000:
        result -= 50
    return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def total_in(items: list[Item], member_level: str, currency: str, rates: ExchangeRates) -> Decimal:
    cny = discount(subtotal(items), member_level)
    return (cny / rates.rate(currency)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
```

注意金额全部使用 `Decimal`（第 02 篇），汇率服务通过 `Protocol`（第 16 篇）声明为一个依赖，由调用者传入——这让它在测试中很容易被替换。

### 2. 测试代码

pytest 会自动发现 `test_*.py` 文件中以 `test_` 开头的函数：

<!-- file: test_pricing.py -->
```python
from decimal import Decimal
from unittest.mock import Mock

import pytest

from pricing import Item, discount, subtotal, total_in


@pytest.fixture
def cart():
    """每个用到它的测试都会得到一个全新的购物车。"""
    return [Item("键盘", Decimal("299.00")), Item("鼠标", Decimal("99.50"), quantity=2)]


def test_subtotal(cart):
    assert subtotal(cart) == Decimal("498.00")


@pytest.mark.parametrize(
    ("amount", "level", "expected"),
    [
        ("100", "none", "100.00"),
        ("100", "gold", "90.00"),
        ("100", "silver", "95.00"),
        ("1200", "gold", "1030.00"),      # 1200 × 0.9 = 1080，满 1000 减 50
        ("1100", "silver", "995.00"),     # 1045 - 50 = 995
        ("0.015", "none", "0.02"),        # 四舍五入
    ],
)
def test_discount(amount, level, expected):
    assert discount(Decimal(amount), level) == Decimal(expected)


def test_unknown_level_raises():
    with pytest.raises(ValueError, match="未知的会员等级"):
        discount(Decimal("100"), "diamond")


def test_total_in_usd(cart):
    rates = Mock()
    rates.rate.return_value = Decimal("7.20")
    assert total_in(cart, "gold", "USD", rates) == Decimal("62.25")
    rates.rate.assert_called_once_with("USD")
```

在项目目录下运行 `pytest`：

<!-- norun -->
```bash
$ pytest -q
.........                                                                [100%]
9 passed in 0.72s
```

也可以在 Python 代码中调用 pytest，返回值就是退出码：

<!-- nocheck -->
```python
import pytest

raise SystemExit(pytest.main(["-q", "test_pricing.py"]))
```

5 个测试函数产生了 9 个测试用例（参数化的那个展开成了 6 个）。下面逐一解释用到的特性。

### 3. 断言改写

pytest 最神奇的地方是：你只需要写普通的 `assert`，失败时它却能显示出详细的信息。比如，产品经理澄清说“满 1000”的意思是“**超过** 1000”，我们先写一个测试来表达这个新需求：

<!-- file: test_boundary.py -->
```python
from decimal import Decimal

from pricing import discount


def test_exactly_1000_is_not_discounted():
    # 产品经理说：“满 1000”指的是“超过 1000”
    result = discount(Decimal("1000"), "none")
    assert result == Decimal("1000.00")
```

<!-- raises -->
```python
import pytest

raise SystemExit(pytest.main(["-q", "test_boundary.py"]))
```

<!-- norun -->
```text
F                                                                        [100%]
=================================== FAILURES ===================================
_____________________ test_exactly_1000_is_not_discounted ______________________

    def test_exactly_1000_is_not_discounted():
        # 产品经理说：“满 1000”指的是“超过 1000”
        result = discount(Decimal("1000"), "none")
>       assert result == Decimal("1000.00")
E       AssertionError: assert Decimal('950.00') == Decimal('1000.00')
E        +  where Decimal('1000.00') = Decimal('1000.00')

test_boundary.py:9: AssertionError
=========================== short test summary info ============================
FAILED test_boundary.py::test_exactly_1000_is_not_discounted - AssertionError...
1 failed in 0.13s
```

失败信息中直接显示了 `result` 的实际值。这是怎么做到的？还记得第 12 篇的自定义导入器吗？pytest 正是安装了一个**导入钩子**，在导入测试模块时，拦截源代码、解析成 AST（第 01 篇），把每个 `assert` 语句改写成一段记录了所有中间值的代码，再编译执行。这是我们在这个系列中学到的元编程技术的一次完美实战。

这种“先写一个失败的测试来表达需求，再修改代码让它通过”的方式，就是**测试驱动开发**（TDD）的核心循环：红 → 绿 → 重构。

### 4. fixture：测试的依赖注入

`@pytest.fixture` 定义了一个测试所需的“前置条件”。测试函数只需要**在参数中写上 fixture 的名字**，pytest 就会自动调用它并把结果传进来。这是一种依赖注入：

- 每个测试都得到一个**全新的** `cart`，测试之间互不影响；
- fixture 可以依赖其他 fixture；
- 用 `yield` 代替 `return`，`yield` 之后的代码会在测试结束后执行，用于清理（原理和第 11 篇的 `@contextmanager` 一样）；
- 通过 `scope="session"` 等参数，可以让昂贵的 fixture（比如启动一个测试数据库）在多个测试之间共享。

pytest 还内置了很多实用的 fixture：`tmp_path`（一个临时目录）、`monkeypatch`（临时修改属性、环境变量、字典项，测试后自动恢复）、`capsys`（捕获标准输出）、`caplog`（捕获日志）等。

### 5. 参数化

`@pytest.mark.parametrize` 用一组数据驱动同一个测试，每组数据都是一个独立的测试用例，失败时会分别报告。这比在一个测试里写一个循环好得多：循环中第一个失败的断言会让后面的数据都得不到测试。

### 6. 测试异常

`pytest.raises` 是一个上下文管理器，它断言代码块中**必须**抛出指定的异常，`match` 参数还会用正则表达式检查异常消息。比较浮点数时，可以使用 `pytest.approx`：`assert 0.1 + 0.2 == pytest.approx(0.3)`。

## 三、Mock：隔离外部依赖

单元测试应该快速、确定、不依赖外部环境。当被测代码依赖网络服务、数据库、当前时间、随机数时，就需要用**测试替身**（test double）替换它们。

在 `test_total_in_usd` 中，我们用 `unittest.mock.Mock` 创建了一个假的汇率服务：`rates.rate.return_value` 设定返回值，`assert_called_once_with` 验证它被以正确的参数调用了一次。`Mock` 对象会“假装”拥有任何属性和方法，这既方便又危险：拼错了方法名也不会报错。所以更推荐使用 `Mock(spec=SomeClass)` 或 `create_autospec`，它们会根据真实的接口限制 mock 对象。

当依赖不是通过参数传入，而是在函数内部直接导入和调用时，需要用 `unittest.mock.patch` 临时替换它。这里有一个经典的陷阱：**要替换的是“使用者所在模块”中的名字，而不是“定义处”的名字**（这正是第 12 篇讲过的 from-import 创建新绑定的直接后果）：

<!-- norun -->
```python
# app/report.py
from datetime import datetime
def title():
    return f"日报 {datetime.now():%Y-%m-%d}"

# 测试中
with patch("app.report.datetime") as fake:      # 正确：替换 report 模块里的 datetime 名字
    ...
with patch("datetime.datetime") as fake:        # 无效：report 模块早已持有原来的对象
    ...
```

不过，大量使用 `patch` 往往是一个“设计信号”：说明代码与具体实现耦合得太紧。像本文的 `total_in` 那样把依赖作为参数传入（依赖注入），测试会简单得多。另外，mock 过多的测试只能验证“代码按某种方式调用了依赖”，而不能证明系统真的能工作——这正是需要集成测试的原因。

## 四、基于属性的测试：让计算机替你找 bug

上面的测试都是**基于例子**的：我们挑选一些输入，手工算出期望的输出。问题在于，我们只能测试自己想得到的情况。**基于属性的测试**（property-based testing）换了一种思路：不写具体的例子，而是描述代码**应该永远满足的性质**，然后让工具自动生成大量的输入去尝试推翻它。Python 中最好的工具是 **Hypothesis**。

对于折扣函数，一个看起来理所当然的性质是：**购买更贵的东西，付的钱不应该更少**。我们把它写成测试：

<!-- file: test_props.py -->
```python
from decimal import Decimal

from hypothesis import given, settings, strategies as st

from pricing import discount


@settings(max_examples=1000, derandomize=True)
@given(
    amount=st.decimals(min_value=0, max_value=5000, places=2),
    extra=st.decimals(min_value=0, max_value=100, places=2),
    level=st.sampled_from(["none", "silver", "gold"]),
)
def test_paying_more_never_costs_less(amount, extra, level):
    assert discount(amount, level) <= discount(amount + extra, level)
```

<!-- raises -->
```python
import pytest

raise SystemExit(pytest.main(["-q", "-p", "no:cacheprovider", "test_props.py"]))
```

运行结果：

<!-- norun -->
```text
amount = Decimal('950.01'), extra = Decimal('49.99'), level = 'none'

>       assert discount(amount, level) <= discount(amount + extra, level)
E       AssertionError: assert Decimal('950.01') <= Decimal('950.00')
E        +  where Decimal('950.01') = discount(Decimal('950.01'), 'none')
E        +  and   Decimal('950.00') = discount((Decimal('950.01') + Decimal('49.99')), 'none')
E       Failing test case: test_paying_more_never_costs_less(
E           amount=Decimal('950.01'),
E           extra=Decimal('49.99'),
E           level='none',
E       )
```

Hypothesis 找到了一个真实的 bug：**买 950.01 元的东西要付 950.01 元，买 1000 元的东西却只需要付 950 元！** 这就是“满减”规则造成的价格倒挂：在 950～1000 元之间，顾客多买一点反而更便宜。我们的 6 个参数化例子全部通过了，却完全没有发现这个问题。

更厉害的是，Hypothesis 在找到一个失败的输入后，会自动进行**收缩**（shrinking）：不断尝试更简单、更小的输入，直到找到一个“最小的”反例。最终报告的 `950.01 + 49.99 = 1000`，正好落在满减的边界上，一眼就能看出问题所在。（至于这是不是 bug、该如何修改，需要和产品经理讨论——但至少我们**知道**了这个问题。）

适合用基于属性的测试来检验的性质有很多：编码再解码应得到原值（往返性质）、排序结果是有序的且元素不变、优化版本与朴素版本的结果相同、函数满足交换律或幂等性……

## 五、覆盖率

**测试覆盖率**衡量测试执行了多少比例的代码，使用 `coverage.py` 或 pytest 插件 `pytest-cov`：

<!-- norun -->
```bash
pytest --cov=pricing --cov-branch --cov-report=term-missing
```

`--cov-branch` 开启**分支覆盖率**，它不仅检查每一行是否执行过，还检查每个 `if` 的两个分支是否都走到过。`term-missing` 会列出没有被覆盖的行号。（第 20 篇介绍过，`coverage.py` 在 3.12 之后使用 `sys.monitoring` 大幅降低了统计开销。）

但要正确地看待覆盖率：**低覆盖率说明测试肯定不够，高覆盖率却不能说明测试足够好**。上面的例子中，参数化测试的分支覆盖率是 100%，却没有发现价格倒挂的问题。覆盖率是发现“完全没有测试的代码”的工具，而不是追求的目标。

## 六、项目结构与配置

一个现代 Python 项目的典型结构（第 12 篇介绍过 src 布局的好处）：

<!-- norun -->
```text
my-project/
├── pyproject.toml          # 项目元数据、依赖、所有工具的配置
├── uv.lock                 # 锁定的精确依赖版本
├── README.md
├── src/
│   └── my_project/
│       ├── __init__.py
│       └── pricing.py
└── tests/
    ├── conftest.py         # 共享的 fixture
    └── test_pricing.py
```

`pyproject.toml` 是整个项目的配置中心，各个工具的配置都可以写在这里：

<!-- norun -->
```toml
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["httpx>=0.27"]

[dependency-groups]
dev = ["pytest>=8", "pytest-cov", "hypothesis", "mypy", "ruff"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra --strict-markers"

[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM", "RUF"]   # pyflakes、isort、bugbear、pyupgrade……

[tool.mypy]
strict = true
```

用 uv（第 01 篇）管理这个项目：`uv sync` 创建虚拟环境并安装所有依赖，`uv run pytest` 运行测试，`uv add 包名` 添加依赖。`uv.lock` 应该提交到版本库中，保证所有开发者和 CI 使用完全相同的依赖版本。

## 七、代码质量工具链

| 工具 | 作用 |
|---|---|
| **Ruff** | 代码检查（linter）与格式化（formatter），一个工具替代了 Flake8、isort、Black、pyupgrade 等十几个工具，速度快几十到上百倍 |
| **mypy / Pyright** | 静态类型检查（第 16 篇） |
| **pytest** | 运行测试 |
| **pre-commit** | 在 `git commit` 之前自动运行上述检查，把问题挡在提交之前 |

Ruff 的检查规则能发现很多真实的 bug，比如本系列提到过的：可变默认参数（B006，第 06 篇）、循环中定义的函数捕获了循环变量（B023，第 07 篇的延迟绑定）、在 `except` 中丢失原始异常链（B904，第 11 篇）、遮蔽内置名字（A001，第 06 篇）。`ruff check --fix` 还能自动修复其中很大一部分。

`.pre-commit-config.yaml` 的一个例子：

<!-- norun -->
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.0              # 使用你需要的版本
    hooks:
      - id: ruff-check
        args: [--fix]
      - id: ruff-format
```

## 八、持续集成

**持续集成**（CI）让每一次推送和每一个 Pull Request 都自动运行完整的检查。下面是一个 GitHub Actions 工作流，在多个 Python 版本上运行检查和测试：

<!-- norun -->
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.12", "3.13", "3.14"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: ${{ matrix.python-version }}
      - run: uv sync --locked
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy src
      - run: uv run pytest --cov --cov-branch
```

配置好之后，再在仓库设置中把 CI 设为“合并前必须通过的检查”。从此，“在我电脑上是好的”这句话就成了历史。

## 九、调试

测试告诉你“有 bug”，调试帮你找到“bug 在哪里”。

- **`breakpoint()`**：在代码中任意位置插入这个内置函数，程序运行到这里时会进入 `pdb` 调试器。常用命令：`n`（下一行）、`s`（进入函数）、`c`（继续）、`p 表达式`（打印）、`l`（显示代码）、`w`（显示调用栈）、`u`/`d`（在调用栈中上下移动）。设置环境变量 `PYTHONBREAKPOINT=0` 可以全局禁用所有 `breakpoint()`。
- **事后调试**：`python -m pdb script.py` 运行脚本，程序崩溃时会自动进入调试器，停在出错的位置，可以检查当时所有的变量；在 pytest 中使用 `pytest --pdb` 也有同样的效果。
- **3.14 新增：附加到正在运行的进程**：`python -m pdb -p <PID>` 可以直接附加到一个正在运行的 Python 进程上进行调试（基于 PEP 768 的安全外部调试接口），无需重启程序、也无需事先在代码中做任何准备。排查生产环境中“卡住”的进程时，它和第 18 篇介绍的 `python -m asyncio ps` 一样，是非常有力的工具。
- **`faulthandler`**：在程序崩溃（段错误）或卡死时打印所有线程的 Python 调用栈。`python -X faulthandler script.py` 即可启用，`faulthandler.dump_traceback_later(timeout)` 可以在超时后自动打印调用栈，非常适合排查死锁（第 17 篇）。
- **日志**：在无法使用调试器的环境中（生产环境、分布式系统），良好的日志（第 13 篇）是最主要的调试手段。

## 十、其他工程实践

- **配置与密钥**：不要把密码、API 密钥写在代码里或提交到版本库。从环境变量中读取配置，在开发环境中可以使用 `.env` 文件（并把它加入 `.gitignore`）。
- **版本号**：遵循语义化版本（Semantic Versioning）：`主版本.次版本.修订号`，不兼容的 API 修改增加主版本号。
- **弃用流程**：要删除一个公开的 API 时，先用 `warnings.warn(..., DeprecationWarning)` 或 3.13 新增的 `@warnings.deprecated` 装饰器标记它，保留至少一个版本的过渡期。在测试中运行 `python -W error::DeprecationWarning`，可以尽早发现自己的代码使用了即将被移除的接口。
- **文档**：为公开的函数和类编写文档字符串；面向使用者的文档可以用 Sphinx 或 MkDocs 生成。
- **代码评审**：工具能发现格式和一部分 bug，但设计问题、可读性问题、需求理解的偏差需要人来发现。

## 系列结语

二十三篇文章，我们从安装解释器、`print("Hello")` 出发，走过了对象模型、编码、容器的哈希表、函数与闭包、迭代器与生成器、类与数据模型、异常与上下文、模块导入，再深入到描述符、元类、类型系统、GIL 与自由线程、asyncio 的事件循环、引用计数与垃圾回收、字节码与特化解释器，最后落脚于性能优化和工程实践。

回头看，你会发现 Python 的大部分特性都建立在少数几个核心思想之上：

- **一切皆对象**，名字只是贴在对象上的标签；
- **协议优于继承**：迭代协议、描述符协议、上下文管理协议、数据模型中的各种特殊方法，让任何对象都能融入语言的语法；
- **运行时即编译时**：`def`、`class`、`import` 都是在运行时执行的语句，因此元编程如此自然；
- **函数与帧**：闭包、生成器、协程，都是对“帧可以被保存和恢复”这一机制的不同运用；
- **简单的核心 + 可扩展的边界**：解释器保持简单，性能关键的部分交给 C 扩展，导入系统、属性访问、类的创建，处处都留下了可以定制的钩子。

当你遇到一个新的库、新的特性时，试着用这些核心思想去解释它。如果能解释通，你就真正理解了它；如果解释不通，那就去读文档、读 PEP、读源码——就像这个系列一直在做的那样。

感谢你读到这里。愿你写出优雅、正确、高效的 Python 代码。

## 练习

1. 为第 04 篇练习中的 `LRUCache` 编写一套完整的 pytest 测试，包括参数化的边界测试，以及一个 Hypothesis 测试：对随机的操作序列，它的行为必须与一个“朴素但显然正确”的参考实现完全一致。
2. 修复本文的价格倒挂问题（比如改为“满 1000 减 50，但折后价格不低于 950”，或者你认为更合理的规则），并确保基于属性的测试能够通过。
3. 为你的一个小项目配置完整的工具链：`pyproject.toml` 中配置 Ruff、mypy、pytest，添加 pre-commit 钩子，编写 GitHub Actions 工作流。
4. 写一个依赖当前时间的函数（比如“判断今天是不是工作日”），分别用 `unittest.mock.patch`、`monkeypatch` 和“把时间作为参数注入”三种方式为它编写测试，比较三种方式的优劣。
5. 选择本系列中你最感兴趣的一个主题，找到对应的 CPython 源码文件或 PEP，读完它，并写一篇博客记录你的收获。
