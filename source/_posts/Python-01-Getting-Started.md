---
title: Python 从入门到精通（01）：环境搭建与程序运行原理
date: 2026-10-07 11:55:00
summary: 安装与管理多个 Python 版本、虚拟环境到底隔离了什么、pip 与 uv 的工作方式，以及一行源码如何经过分词、语法分析、编译成字节码，最终被解释器执行。
tags:
  - Python
  - Python基础
categories:
  - Python
---

学任何语言，第一步都是把环境搭起来、写出 Hello World。但如果只停在“能跑起来”，以后遇到“pip 装了包却 import 不到”“换台机器就报错”之类的问题时就会一头雾水。本篇先把环境搭好，再一路追问下去：当你敲下 `python hello.py` 时，到底发生了什么？

> 本文是「Python 从入门到精通」系列第 01 篇，完整路线见 {% post_link Python-00-Roadmap '系列导读' %}。

## 一、Python 是什么：语言与实现

“Python”这个词其实指两样东西：

1. **Python 语言**：由《语言参考》（The Python Language Reference）定义的一套语法和语义规则。比如“`for` 循环会调用对象的 `__iter__` 方法”就是语言规则。
2. **Python 实现**：把语言规则变成能运行程序的软件。最主流的是用 C 写的 **CPython**，也就是你从 python.org 下载的那个解释器。此外还有带 JIT 编译器的 **PyPy**、运行在 JVM 上的 **GraalPy** 等。

同一段代码在不同实现上的**行为**应该一致（这是语言规范保证的），但**性能和内部机制**可以完全不同。本系列讲到内部原理时，默认都指 CPython。

```python
>>> import sys, platform
>>> sys.implementation.name          # 当前解释器的实现
'cpython'
>>> platform.python_implementation()
'CPython'
>>> sys.version_info >= (3, 14)      # 版本号是一个可以比较的命名元组
True
>>> sys.version_info[:2]
(3, 14)
```

`sys.version_info` 是一个元组，所以可以直接和 `(3, 10)` 这样的元组比较，这是在代码里判断版本的标准写法，比解析 `sys.version` 字符串可靠得多。

### Python 是“解释型语言”吗？

常有人说“Python 是解释型语言，所以慢”。这个说法不算错，但不够精确。CPython 执行代码分两步：

1. 先把源代码**编译**成一种中间形式——**字节码（bytecode）**；
2. 再由一个用 C 写的**虚拟机**（也就是解释器主循环）逐条执行字节码。

所以 CPython 其实是“编译器 + 解释器”的组合，和 Java 的“javac + JVM”在结构上很像。区别在于：Python 的编译是在运行时自动、隐式完成的，而且字节码层面几乎不做优化；JVM 则有成熟的 JIT 编译器，会把热点代码编译成机器码。

CPython 也在追赶：3.11 引入了**自适应特化解释器**（PEP 659），会根据运行时观察到的类型把通用指令替换成特化版本；3.13 起加入了实验性的 **JIT 编译器**（PEP 744）。这些内容我们会在 {% post_link Python-20-Bytecode-and-Interpreter '第 20 篇' %} 深入讨论。

## 二、安装与多版本管理

### 1. 安装方式

| 平台 | 推荐方式 | 说明 |
|---|---|---|
| Windows | python.org 安装包 或 `winget install Python.Python.3.14` | 安装时勾选 “Add python.exe to PATH”；自带 `py` 启动器 |
| macOS | python.org 安装包 或 Homebrew `brew install python@3.14` | 不要使用、也不要修改系统自带的 Python |
| Linux | 发行版包管理器 或 `uv`、`pyenv` | 系统 Python 被操作系统工具依赖，**不要用 pip 往里面装包** |

如果你需要同时使用多个版本（比如维护的老项目跑在 3.10，新项目用 3.14），推荐用 **uv** 来管理解释器：

<!-- norun -->
```bash
# 安装 uv（只需一次）
curl -LsSf https://astral.sh/uv/install.sh | sh

uv python install 3.14 3.12    # 下载并安装两个版本
uv python list                 # 查看本机可用的所有解释器
uv run --python 3.12 python -c "import sys; print(sys.version)"
```

uv 用 Rust 编写，下载的是预编译好的独立解释器，几秒钟就能装好，而且不会污染系统环境。传统方案 `pyenv` 则是下载源码在本地编译，速度慢一些，但同样可靠。

### 2. 确认你在用哪个解释器

一台机器上装了多个 Python 之后，最常见的问题是“我以为在用 A，实际在用 B”。用下面三行就能确认：

<!-- nocheck -->
```python
import sys
print(sys.executable)   # 当前解释器可执行文件的绝对路径
print(sys.version)      # 完整版本字符串，包括编译器信息
print(sys.prefix)       # 当前环境的根目录（虚拟环境里会指向虚拟环境）
```

在命令行中，`python`、`python3`、`python3.14` 可能指向完全不同的程序。Windows 上推荐使用 `py -3.14` 启动器显式选择版本；Linux/macOS 上可以用 `which -a python3` 列出 PATH 中所有同名程序。

## 三、第一个程序

### 1. 交互式解释器（REPL）

直接运行 `python` 会进入 REPL（Read-Eval-Print Loop）：读取一行、执行、打印结果、再读下一行。

```python
>>> 1 + 1
2
>>> _ * 10        # 下划线保存着上一个表达式的结果（仅在交互模式下）
20
>>> print("你好，Python")
你好，Python
```

注意：REPL 只会自动打印**表达式**的值，而且值为 `None` 时不打印。`print(...)` 的返回值就是 `None`，所以上面最后一行只看到了 `print` 自己输出的内容。

Python 3.13 起默认的 REPL 是用 Python 重写的新版本，支持多行编辑、彩色输出、`F1` 进入帮助、`F2` 浏览历史、`F3` 粘贴模式；3.14 进一步加入了**语法高亮**和导入语句的自动补全。如果你还在用旧版本，可以试试 IPython，它提供了类似的体验。

### 2. 脚本文件

把代码写进文件，就是一个脚本：

<!-- file: hello.py -->
```python
#!/usr/bin/env python3
"""我的第一个 Python 脚本。"""


def greet(name: str) -> str:
    return f"Hello, {name}!"


if __name__ == "__main__":
    print(greet("World"))
```

运行它：

<!-- norun -->
```bash
python hello.py
```

```python
import subprocess, sys
out = subprocess.run([sys.executable, "hello.py"], capture_output=True, text=True)
print(out.stdout, end="")
```

```text
Hello, World!
```

这里有几个值得注意的细节：

- 第一行 `#!/usr/bin/env python3` 叫 **shebang**，类 Unix 系统上给文件加执行权限（`chmod +x hello.py`）后，可以直接用 `./hello.py` 运行。`env` 会在 PATH 中寻找 `python3`，比写死路径更通用。
- 三引号字符串是模块的**文档字符串**（docstring），会被保存到 `__doc__` 属性中。
- `if __name__ == "__main__":` 是 Python 最常见的惯用法之一。直接运行文件时，这个模块的 `__name__` 是 `"__main__"`；被别的模块 `import` 时，`__name__` 是模块名 `"hello"`。所以这个判断可以让文件“既能当脚本运行，又能当模块导入”而不产生副作用。我们会在 {% post_link Python-12-Modules-and-Imports '第 12 篇' %} 详细讲解模块机制。

### 3. 其他几种运行方式

<!-- norun -->
```bash
python -c "print(2 ** 100)"     # 执行一段字符串
python -m http.server 8000      # 以脚本方式运行一个模块（会在 sys.path 中查找）
python -m json.tool data.json   # 很多标准库模块都有命令行接口
python -i hello.py              # 运行完脚本后进入交互模式，方便检查变量
```

`-m` 非常重要：它让 Python **按模块名**而不是文件路径去找代码，并且会把当前目录加入 `sys.path`。后面讲 pip 时你会看到，`python -m pip` 是比直接敲 `pip` 更可靠的写法。

## 四、虚拟环境：到底隔离了什么

### 1. 问题从哪里来

当你执行 `pip install requests` 时，包被安装到解释器的 **site-packages** 目录。如果所有项目共用同一个解释器，就会遇到经典的“依赖地狱”：项目 A 需要 `Django 4.2`，项目 B 需要 `Django 5.1`，而一个 site-packages 里同名的包只能有一个版本。

**虚拟环境**（virtual environment）的解决办法很朴素：给每个项目一个**独立的 site-packages 目录**，而解释器本身仍然共用。

### 2. 创建与使用

<!-- norun -->
```bash
python -m venv .venv            # 在当前目录创建名为 .venv 的虚拟环境

# 激活（只是为了方便，不是必需的）
source .venv/bin/activate       # Linux / macOS
.venv\Scripts\activate          # Windows

python -m pip install requests  # 装进 .venv 里
deactivate                      # 退出
```

### 3. 激活到底做了什么

很多人以为“激活”是某种神秘的魔法，其实 `activate` 脚本只做了一件主要的事：**把 `.venv/bin`（Windows 下是 `.venv\Scripts`）放到 PATH 的最前面**。这样你敲 `python` 时，Shell 先找到的就是虚拟环境里的那个。

所以，不激活也完全可以使用虚拟环境，直接写全路径即可：`.venv/bin/python script.py`。

那么，虚拟环境里的 `python` 怎么知道自己属于虚拟环境呢？关键是 `.venv/pyvenv.cfg` 这个文件：

<!-- norun -->
```ini
home = /usr/local/bin
include-system-site-packages = false
version = 3.14.0
executable = /usr/local/bin/python3.14
command = /usr/local/bin/python3.14 -m venv /path/to/project/.venv
```

解释器启动时，会检查**可执行文件所在目录的上一级**是否存在 `pyvenv.cfg`。如果存在，就把 `sys.prefix` 设置为虚拟环境目录，并据此计算出 site-packages 的位置。而 `sys.base_prefix` 仍然指向原始安装位置，标准库也是从那里加载的。下面的脚本实际创建一个虚拟环境来验证这一点：

```python
import subprocess, sys, tempfile, venv, pathlib

with tempfile.TemporaryDirectory() as d:
    venv.create(d, with_pip=False, symlinks=(sys.platform != "win32"))  # 等价于 python -m venv
    bindir = "Scripts" if sys.platform == "win32" else "bin"
    py = pathlib.Path(d, bindir, "python")
    code = "import sys; print(sys.prefix != sys.base_prefix)"
    print("虚拟环境内:", subprocess.check_output([py, "-c", code], text=True).strip())
    print("虚拟环境外:", sys.prefix != sys.base_prefix)
    print("存在 pyvenv.cfg:", pathlib.Path(d, "pyvenv.cfg").exists())
```

```text
虚拟环境内: True
虚拟环境外: False
存在 pyvenv.cfg: True
```

`sys.prefix != sys.base_prefix` 就是判断“当前是否运行在虚拟环境中”的标准方法。

### 4. 为什么推荐 `python -m pip`

`pip` 这个命令本身也是一个脚本，它会把包装进“启动它的那个解释器”的 site-packages。如果 PATH 里的 `pip` 和 `python` 不属于同一个解释器（这在装了多个版本的机器上非常常见），就会出现“pip 显示安装成功，但 import 报 `ModuleNotFoundError`”的诡异情况。

`python -m pip install xxx` 明确表示“用**这个** python 来运行 pip”，从根本上避免了不一致。

另外，较新的 Linux 发行版会在系统 Python 上标记 **PEP 668**（externally managed environment），此时直接 `pip install` 会报错 `externally-managed-environment`。这不是 bug，而是在提醒你：请使用虚拟环境，不要破坏系统 Python。

### 5. 现代工具：uv

uv 把“管理解释器、创建虚拟环境、安装依赖、锁定版本、运行脚本”整合到了一个工具里，而且速度比 pip 快一到两个数量级。一个典型的项目工作流：

<!-- norun -->
```bash
uv init myproject && cd myproject   # 生成 pyproject.toml 等项目骨架
uv add requests                     # 添加依赖：写入 pyproject.toml 并生成 uv.lock
uv run python main.py               # 自动创建/同步 .venv 后运行
uv add --dev pytest                 # 开发依赖
uv sync                             # 在另一台机器上按 uv.lock 精确还原环境
```

这里有两个文件分工明确：`pyproject.toml` 记录“我需要什么”（如 `requests>=2.31`），`uv.lock` 记录“实际装了什么”（每个包的精确版本和哈希）。前者给人看、给人改，后者保证可复现。我们会在 {% post_link Python-22-Testing-and-Engineering '第 22 篇' %} 详细讨论项目工程化。

## 五、从源码到执行：一行代码的旅程

现在进入本篇最核心的部分。以这行代码为例：

<!-- norun -->
```python
total = price * 2  # 计算总价
```

CPython 处理它要经过下面几个阶段：

```text
源代码（文本）
   │  ① 分词 tokenize
   ▼
记号流（tokens）
   │  ② 语法分析 parse（PEG 解析器）
   ▼
抽象语法树 AST
   │  ③ 符号表分析 + ④ 编译 compile
   ▼
代码对象 code object（含字节码）
   │  ⑤ 解释执行（求值循环 ceval）
   ▼
运行结果
```

好消息是：标准库为每个阶段都提供了观察工具，我们可以亲眼看到每一步的产物。

### ① 分词：把文本切成“单词”

分词器（tokenizer）把字符流切分成有意义的最小单元，比如名字、运算符、数字、注释：

```python
import io
import tokenize

src = "total = price * 2  # 计算总价\n"
for tok in tokenize.generate_tokens(io.StringIO(src).readline):
    print(f"{tokenize.tok_name[tok.type]:<10} {tok.string!r}")
```

```text
NAME       'total'
OP         '='
NAME       'price'
OP         '*'
NUMBER     '2'
COMMENT    '# 计算总价'
NEWLINE    '\n'
ENDMARKER  ''
```

Python 用缩进表示代码块，这件事也是在分词阶段处理的：当缩进增加时，分词器会产生一个 `INDENT` 记号，缩进减少时产生 `DEDENT` 记号。所以对于后面的语法分析器来说，缩进和其他语言里的 `{` `}` 并没有本质区别。这也解释了为什么混用 Tab 和空格会导致 `TabError`——分词器无法确定缩进层级。

### ② 语法分析：构建抽象语法树

语法分析器根据语法规则，把记号流组织成一棵树。从 3.9 开始，CPython 使用 **PEG 解析器**（PEP 617）替代了旧的 LL(1) 解析器，这才让 3.10 的 `match` 语句、带括号的多行 `with` 语句等语法成为可能。

```python
>>> import ast
>>> print(ast.dump(ast.parse("total = price * 2"), indent=2))
Module(
  body=[
    Assign(
      targets=[
        Name(id='total', ctx=Store())],
      value=BinOp(
        left=Name(id='price', ctx=Load()),
        op=Mult(),
        right=Constant(value=2)))])
```

这棵树清楚地表达了代码的结构：一个赋值语句（`Assign`），目标是名字 `total`（`ctx=Store()` 表示“写入”），值是一个二元运算（`BinOp`），左边读取名字 `price`（`ctx=Load()` 表示“读取”），运算符是乘法，右边是常量 `2`。注释在这一步已经被丢弃了。

`ast` 模块不只是用来看的。很多工具都建立在它之上：代码格式化器、静态检查工具（如 Ruff、Pylint）、测试框架 pytest 的断言改写，都需要解析和修改 AST。你也可以安全地用 `ast.literal_eval` 解析字面量，而不是用危险的 `eval`：

```python
>>> ast.literal_eval("{'a': [1, 2, 3], 'b': (True, None)}")
{'a': [1, 2, 3], 'b': (True, None)}
>>> ast.literal_eval("__import__('os').system('rm -rf /')")
Traceback (most recent call last):
  ...
ValueError: malformed node or string on line 1: Call(...)
```

### ③④ 编译：生成字节码

编译器遍历 AST，先建立**符号表**（判断每个名字是局部变量、全局变量还是闭包变量），再生成字节码，打包成一个**代码对象**（code object）。内置函数 `compile` 可以直接完成从源码到代码对象的全过程：

```python
>>> code = compile("total = price * 2", "<demo>", "exec")
>>> type(code)
<class 'code'>
>>> code.co_names      # 用到的名字
('price', 'total')
>>> code.co_consts     # 用到的常量
(2, None)
```

字节码本身是一串字节，人类很难直接阅读。`dis` 模块可以把它“反汇编”成可读的指令：

```python
import dis

dis.dis(compile("total = price * 2", "<demo>", "exec"))
```

```text
  0           RESUME                   0

  1           LOAD_NAME                0 (price)
              LOAD_SMALL_INT           2
              BINARY_OP                5 (*)
              STORE_NAME               1 (total)
              LOAD_CONST               1 (None)
              RETURN_VALUE
```

（不同版本的指令名可能略有不同，以上是 3.14 的输出。）逐行解读：

- `RESUME`：标记函数/模块开始执行的位置，供解释器做一些检查，可以忽略。
- `LOAD_NAME price`：查找名字 `price` 对应的对象，压入**值栈**。
- `LOAD_SMALL_INT 2`：把小整数 `2` 压栈（3.14 新增的指令，专门用于小整数，省去查常量表的开销）。
- `BINARY_OP *`：弹出栈顶两个值，相乘，结果压栈。
- `STORE_NAME total`：弹出栈顶值，绑定到名字 `total`。
- `LOAD_CONST None` + `RETURN_VALUE`：模块代码执行完毕，返回 `None`。

可以看到，CPython 的虚拟机是一个**基于栈的虚拟机**：指令通过一个值栈传递操作数，而不是像真实 CPU 那样使用寄存器。

### ⑤ 解释执行

最后，解释器的核心——位于 CPython 源码 `Python/ceval.c` 中的求值循环——逐条取出字节码指令，根据指令类型执行相应的 C 代码。简化后的逻辑大致是：

<!-- norun -->
```c
for (;;) {
    opcode = NEXT_INSTRUCTION();
    switch (opcode) {
        case LOAD_NAME:  /* 查找名字，压栈 */ break;
        case BINARY_OP:  /* 弹出两个操作数，计算，压栈 */ break;
        case STORE_NAME: /* 弹栈，绑定名字 */ break;
        /* …… 几百种指令 …… */
    }
}
```

这里也藏着“Python 为什么慢”的一部分答案：`BINARY_OP *` 这一条指令，在运行时才知道两个操作数是什么类型（整数？浮点数？字符串？自定义对象？），每次执行都要做类型检查和方法分派。而 C 语言在编译时就确定了类型，乘法只需要一条机器指令。3.11 的特化解释器正是针对这一点做优化的：如果它发现某条 `BINARY_OP` 总是作用于两个整数，就把它替换成专门处理整数的快速版本。

### .pyc 文件：字节码缓存

编译虽然很快，但对大型项目来说，每次启动都重新编译所有模块仍然是浪费。所以 CPython 在**导入**模块时，会把编译结果缓存到 `__pycache__` 目录下的 `.pyc` 文件中，比如 `__pycache__/hello.cpython-314.pyc`。文件名里的 `cpython-314` 叫 **cache tag**，保证不同版本的解释器不会误用彼此的缓存：

```python
>>> import sys, importlib.util
>>> sys.implementation.cache_tag
'cpython-314'
>>> importlib.util.cache_from_source("hello.py")
'__pycache__/hello.cpython-314.pyc'
```

关于 `.pyc`，有几个常见误解需要澄清：

1. **直接运行的脚本不会生成 `.pyc`**。`python hello.py` 中的 `hello.py` 每次都会重新编译，只有被 `import` 的模块才会被缓存。
2. **`.pyc` 不会让代码运行得更快**，只会让**加载**更快，因为它省去的是编译步骤，执行的字节码是一样的。
3. `.pyc` 文件头部记录了魔数（magic number，标识字节码格式版本）和源文件的修改时间与大小。导入时如果发现源文件变了，会自动重新编译。
4. `.pyc` **不是加密**，用反编译工具可以还原出大部分源码，不要指望靠它来保护代码。

## 六、解释器启动时还做了什么

在执行你的第一行代码之前，解释器已经忙碌了一阵子：初始化内置类型、创建 `builtins` 模块和 `sys` 模块、根据环境变量和 `pyvenv.cfg` 计算 `sys.path`，然后自动导入 `site` 模块，把 site-packages 加入搜索路径。

你可以用 `-X importtime` 观察启动时导入了哪些模块、各花了多少时间：

<!-- norun -->
```bash
python -X importtime -c "pass" 2>&1 | tail -5
```

几个有用的启动选项：

| 选项 | 作用 |
|---|---|
| `-I` | 隔离模式：忽略 `PYTHON*` 环境变量，不把脚本目录和用户 site-packages 加入 `sys.path`，适合运行不信任目录里的代码 |
| `-S` | 不自动导入 `site` 模块 |
| `-B` | 不写 `.pyc` 文件 |
| `-O` | 优化模式：去掉 `assert` 语句，`__debug__` 变为 `False` |
| `-W error` | 把警告变成异常，适合在测试中发现弃用用法 |
| `-X dev` | 开发模式：开启更多运行时检查和警告，强烈推荐在开发和测试时使用 |

其中 `-O` 值得特别提醒：**永远不要用 `assert` 做参数校验或权限检查**，因为在 `-O` 模式下它们会被整个删除。

## 七、Python 之禅与代码风格

在 REPL 中输入 `import this`，会打印出 Tim Peters 写的《Python 之禅》（PEP 20）。其中几条深刻地影响了语言设计：

<!-- norun -->
```text
Beautiful is better than ugly.          优美胜于丑陋
Explicit is better than implicit.       明了胜于晦涩
Simple is better than complex.          简单胜于复杂
Readability counts.                     可读性很重要
There should be one-- and preferably only one --obvious way to do it.
                                        应该有一种——最好只有一种——显而易见的做法
```

代码风格方面，**PEP 8** 是社区公认的规范：4 个空格缩进、函数和变量用 `snake_case`、类名用 `CapWords`、常量用 `UPPER_CASE`、每行不宜过长等。你不需要背下来，交给工具就好：**Ruff** 可以同时完成格式化（`ruff format`）和代码检查（`ruff check`），速度极快，是目前最主流的选择。

## 八、常见问题速查

| 现象 | 原因与解决 |
|---|---|
| `pip install` 成功但 `import` 报 `ModuleNotFoundError` | pip 和 python 不属于同一个解释器。用 `python -m pip`，并用 `sys.executable` 确认 |
| `error: externally-managed-environment` | 系统 Python 受 PEP 668 保护。请创建虚拟环境 |
| `TabError: inconsistent use of tabs and spaces` | 混用了 Tab 和空格。让编辑器把 Tab 统一转换为 4 个空格 |
| 文件名叫 `random.py` 后，`import random` 行为异常 | 脚本所在目录排在 `sys.path` 最前面，你的文件“遮蔽”了标准库。不要用标准库模块名给自己的文件命名 |
| Windows 上输入 `python` 打开了应用商店 | 系统的“应用执行别名”在作怪，在设置中关闭它，或使用 `py` 启动器 |

## 小结

- “Python”既指语言规范，也指具体实现；CPython 是官方实现，它先把源码编译成字节码，再由基于栈的虚拟机执行。
- 虚拟环境的本质是“共用解释器，独立 site-packages”，关键文件是 `pyvenv.cfg`；激活只是修改 PATH。
- 用 `python -m pip` 而不是裸 `pip`；新项目可以直接使用 uv 管理解释器、依赖和锁文件。
- 源码 → 记号 → AST → 字节码 → 执行，每个阶段都可以用 `tokenize`、`ast`、`compile`、`dis` 观察。
- `.pyc` 只缓存导入模块的编译结果，加快的是加载而不是执行。

## 练习

1. 用 `uv` 或 `pyenv` 安装两个不同的 Python 版本，分别为它们创建虚拟环境，并用 `sys.executable` 和 `sys.prefix` 验证你确实运行在预期的环境中。
2. 写一个模块 `mymod.py` 并在另一个脚本中导入它，观察 `__pycache__` 目录的生成。修改 `mymod.py` 后再次运行，`.pyc` 的修改时间有什么变化？用 `python -B` 运行又会怎样？
3. 对下面三行代码分别执行 `dis.dis(compile(..., "<s>", "exec"))`，比较它们的字节码，并解释差异：`x = 1 + 2`、`x = a + b`、`x = [1, 2, 3]`。（提示：注意第一行，编译器做了什么“偷懒”的事？）
4. 用 `ast.parse` 解析一段包含 `if` 和 `for` 的代码，然后写一个继承 `ast.NodeVisitor` 的类，统计其中函数调用（`ast.Call`）出现的次数。

下一篇，我们将深入 Python 最核心的概念——对象模型：{% post_link Python-02-Objects-and-Variables '变量、对象与内置类型' %}。
