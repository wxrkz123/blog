---
title: Python 零基础入门（11）：看懂报错信息
date: 2026-11-09 19:05:00
summary: 报错不是失败，而是 Python 在告诉你哪里出了问题。本篇教你从下往上读懂报错信息，认识最常见的十种错误，学会用 print 找问题，以及用 try/except 让程序在出错时不崩溃。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

写程序时看到一大段英文报错，很多初学者的第一反应是：“完了，我写错了，看不懂，好可怕。”

其实**报错是你的朋友**。它不是在骂你，而是在尽力告诉你：**哪里出了问题、出了什么问题**。专业程序员每天都会看到无数次报错，区别只在于他们知道怎么读。

这一篇我们就来学习怎么读懂报错。

## 一、报错信息长什么样

来看一个例子：

<!-- raises -->
```python
name = "小明"
print(name.uper())
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(name.uper())
          ^^^^^^^^^
AttributeError: 'str' object has no attribute 'uper'. Did you mean: 'upper'?
```

在 IDLE 里，这段文字会显示成**红色**。我们一行一行来看：

| 内容 | 意思 |
|---|---|
| `Traceback (most recent call last):` | “出错了，下面是出错的经过”。这一行每次都一样，可以忽略 |
| `File "...demo.py", line 2` | 出错的**文件**和**行号**：demo.py 的**第 2 行** |
| `print(name.uper())` | 出错的那一行代码 |
| `^^^^^^^^^` | 箭头指出这一行里**具体哪个位置**有问题 |
| `AttributeError: ...` | **错误类型**和**错误说明**（最重要！） |

### 读报错的三步法

1. **先看最后一行**：冒号前面是错误类型，冒号后面是具体说明。
2. **再看行号**：`line 2` 告诉你去第几行找问题。
3. **最后看箭头**：`^^^` 指出了这一行里的具体位置。

用这个方法来读上面的报错：

1. 最后一行：`AttributeError: 'str' object has no attribute 'uper'. Did you mean: 'upper'?`，意思是“字符串没有叫 `uper` 的功能，你是不是想写 `upper`？”
2. 第 2 行；
3. 箭头指向 `name.uper`。

问题找到了：`upper` 拼错了。Python 连正确答案都告诉你了。

> 💡 在 IDLE 里，按 `Alt + G` 可以输入行号直接跳到那一行。IDLE 编辑窗口右下角也会显示光标所在的行号（`Ln: 2`）。

## 二、两大类错误

### 第一类：语法错误（程序根本跑不起来）

代码的写法不符合 Python 的规则，Python 连读都读不懂，**一行都不会执行**：

<!-- raises -->
```python
print("你好"
print("再见")
```

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1
    print("你好"
         ^
SyntaxError: '(' was never closed
```

意思是“第 1 行的左括号 `(` 一直没有关闭”，也就是少了右括号。

语法错误的特点：

- 没有 `Traceback` 那一行；
- 错误类型是 `SyntaxError`（语法错误）或 `IndentationError`（缩进错误）；
- 在 IDLE 里按 F5 时，会**弹出一个小窗口**，并把出错位置标成红色。

> ⚠️ 语法错误报告的行号有时会**比真正出错的地方靠后**。比如少写了右括号，Python 可能要读到下一行才发现不对劲。所以如果报错的那一行看起来没问题，**看看它的上一行**。

### 第二类：运行时错误（跑到一半出了问题）

写法没问题，但运行到某一行时出了状况，比如除以 0、找不到某个键。这种错误发生之前的代码**已经执行了**：

<!-- raises -->
```python
print("第一行正常")
print("第二行正常")
print(10 / 0)
print("这一行不会执行")
```

```text
第一行正常
第二行正常
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 3, in <module>
    print(10 / 0)
          ~~~^~~
ZeroDivisionError: division by zero
```

前两行正常显示了，第三行出错后，程序就停止了，第四行没有机会执行。

## 三、最常见的十种错误

把这张表收藏起来，遇到报错时对照着看：

| 错误类型 | 中文意思 | 常见原因 |
|---|---|---|
| `SyntaxError` | 语法错误 | 中文符号、括号或引号没配对、少了冒号、`==` 写成 `=` |
| `IndentationError` | 缩进错误 | if/for/def 后面没缩进，或者缩进不一致 |
| `NameError` | 名字错误 | 变量名/函数名拼错了，或者还没定义就使用 |
| `TypeError` | 类型错误 | 字符串和数字相加，函数参数个数不对 |
| `ValueError` | 值错误 | `int("abc")`：类型对了，但内容不合法 |
| `IndexError` | 索引错误 | 列表或字符串的编号超出范围 |
| `KeyError` | 键错误 | 字典里没有这个键 |
| `AttributeError` | 属性错误 | 方法名拼错了，或者对错误的类型用了方法 |
| `ZeroDivisionError` | 除零错误 | 除以了 0 |
| `FileNotFoundError` | 文件不存在 | 文件名写错了，或者文件不在程序所在的文件夹 |

下面挑几个最常见的详细看看。

### 中文符号：新手头号杀手

<!-- raises -->
```python
print("你好"）
```

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1
    print("你好"）
              ^
SyntaxError: invalid character '）' (U+FF09)
```

`invalid character '）'` 意思是“无效的字符 `）`”，这是一个**中文右括号**。看到 `invalid character`，就去检查是不是用了中文符号。

### NameError：名字拼错了

<!-- raises -->
```python
message = "今天放假"
print(mesage)
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(mesage)
          ^^^^^^
NameError: name 'mesage' is not defined. Did you mean: 'message'?
```

`message` 少写了一个 s。Python 很贴心地提示了正确的名字。

### TypeError 和 ValueError：类型和值

<!-- raises -->
```python
age = "18"
print(age + 1)
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(age + 1)
          ~~~~^~~
TypeError: can only concatenate str (not "int") to str
```

`TypeError` 说的是**类型**不对：字符串不能和整数相加。

<!-- raises -->
```python
age = int("十八")
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1, in <module>
    age = int("十八")
ValueError: invalid literal for int() with base 10: '十八'
```

`ValueError` 说的是**值**不对：`int()` 能接收字符串（类型没问题），但 `"十八"` 这个内容没法转换成整数。

## 四、函数里出错时的报错

如果错误发生在函数里，报错信息会更长一些：

<!-- raises -->
```python
def get_price(item):
    prices = {"苹果": 5, "香蕉": 3}
    return prices[item]

def calc_total(cart):
    total = 0
    for item in cart:
        total += get_price(item)
    return total

print("开始结算")
print(calc_total(["苹果", "橘子"]))
```

```text
开始结算
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 12, in <module>
    print(calc_total(["苹果", "橘子"]))
          ~~~~~~~~~~^^^^^^^^^^^^^^^^^^
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 8, in calc_total
    total += get_price(item)
             ~~~~~~~~~^^^^^^
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 3, in get_price
    return prices[item]
           ~~~~~~^^^^^^
KeyError: '橘子'
```

别慌，`Traceback (most recent call last)` 的意思是“出错经过如下，**最后一步在最下面**”。从上往下读，就是程序一层一层走进去的路线：

1. 第 12 行，调用了 `calc_total`；
2. 进入 `calc_total`，第 8 行，调用了 `get_price`；
3. 进入 `get_price`，第 3 行，`prices[item]` 出错了。

最后一行告诉我们：`KeyError: '橘子'`，字典里没有“橘子”。

所以，**读长报错的方法还是一样：先看最后一行，再看紧挨着它的那个 File 和行号**，那里就是最终出错的地方。上面几层只是告诉你“是怎么走到这里的”。

## 五、自己找问题：用 print 调试

有时候程序**不报错，但结果不对**。这种问题更难找，因为 Python 不会告诉你哪里错了。

最简单有效的办法是：**在可疑的地方加 print，看看变量的值是不是你以为的那样。**

比如下面这个求平均分的程序，结果明显不对：

```python
scores = [80, 90, 100]
total = 0
for s in scores:
    total = s
average = total / len(scores)
print(average)
```

```text
33.333333333333336
```

80、90、100 的平均分应该是 90，为什么是 33.3？我们在循环里加一行 print，看看每一步 `total` 是多少：

```python
scores = [80, 90, 100]
total = 0
for s in scores:
    total = s
    print("s =", s, "total =", total)    # 调试用
average = total / len(scores)
print(average)
```

```text
s = 80 total = 80
s = 90 total = 90
s = 100 total = 100
33.333333333333336
```

一看就明白了：`total` 没有累加，每次都被覆盖成了 `s`。原来是 `total += s` 写成了 `total = s`。改正后，记得**把调试用的 print 删掉**（或者在前面加 `#` 注释掉）。

这个方法虽然简单，但即使是专业程序员也天天在用。

## 六、try / except：让程序在出错时不崩溃

有些错误不是代码写错了，而是**用户输入了意想不到的内容**。比如让用户输入年龄，他偏偏输入了“十八”，程序就会因为 `ValueError` 而崩溃。

我们可以用 `try / except` 提前“接住”这种错误：

<!-- stdin: 十八 -->
```python
try:
    age = int(input("请输入年龄："))
    print(f"明年你 {age + 1} 岁")
except ValueError:
    print("请输入数字！")
print("程序继续运行")
```

```text
请输入年龄：十八
请输入数字！
程序继续运行
```

它的意思是：

- **try**（尝试）：试着执行下面这段代码；
- **except ValueError**（除非出现 ValueError）：如果执行过程中出现了 `ValueError`，不要崩溃，而是执行这里的代码。

如果用户输入正常，except 里的代码就不会执行：

<!-- stdin: 18 -->
```python
try:
    age = int(input("请输入年龄："))
    print(f"明年你 {age + 1} 岁")
except ValueError:
    print("请输入数字！")
print("程序继续运行")
```

```text
请输入年龄：18
明年你 19 岁
程序继续运行
```

### 输入错了就重新输入

把 `try / except` 和 `while True` 结合起来，就能让用户一直输入，直到输入正确为止：

<!-- stdin: 十八 | 18.5 | 18 -->
```python
while True:
    try:
        age = int(input("请输入年龄："))
        break                  # 转换成功，跳出循环
    except ValueError:
        print("输入有误，请输入一个整数")

print(f"你输入的年龄是 {age}")
```

```text
请输入年龄：十八
输入有误，请输入一个整数
请输入年龄：18.5
输入有误，请输入一个整数
请输入年龄：18
你输入的年龄是 18
```

这是一个非常实用的写法，下一篇和第 14 篇的综合项目都会用到。

### 一次接住多种错误

可以写多个 except，分别处理不同的错误：

<!-- stdin: 10 | 0 -->
```python
try:
    a = int(input("被除数："))
    b = int(input("除数："))
    print(f"结果是 {a / b}")
except ValueError:
    print("请输入整数")
except ZeroDivisionError:
    print("除数不能是 0")
```

```text
被除数：10
除数：0
除数不能是 0
```

> ⚠️ **不要用 try/except 掩盖代码里的错误。** 它是用来处理“用户输入错误”“文件不存在”这类**预料之中、又无法避免**的情况的。如果是你自己把变量名拼错了，应该去改代码，而不是用 try 把错误藏起来。

## 七、实在看不懂怎么办

1. **复制最后一行报错，去搜索引擎搜索。** 你遇到的错误，几乎一定有人遇到过。
2. **问 AI 助手**（比如 Claude）：把**完整的代码**和**完整的报错信息**一起发过去，问“为什么会出这个错，怎么改”。只发一句“报错了怎么办”是没法回答的。
3. **把代码缩小**：把和问题无关的代码先注释掉，一点一点缩小范围，直到找到出问题的那一行。

## 小结

- 报错是 Python 在帮你找问题，不用害怕。
- **读报错三步法：先看最后一行（错误类型和说明），再看行号，最后看箭头。**
- 语法错误（`SyntaxError`、`IndentationError`）会让程序一行都不执行；行号可能比真正的错误位置靠后，记得看看上一行。
- 运行时错误发生前的代码已经执行了。
- 函数里出错时，报错最下面的那个 File 和行号是最终出错的地方。
- 程序不报错但结果不对，就加 print 看看变量的值。
- `try / except` 可以接住预料之中的错误（比如用户输错），让程序不崩溃。

## 练习

**练习 1**：下面的代码运行时会报什么类型的错误？在第几行？

<!-- norun -->
```python
numbers = [1, 2, 3]
total = 0
for i in range(4):
    total += numbers[i]
print(total)
```

<details>
<summary>点击查看答案</summary>

<!-- raises -->
```python
numbers = [1, 2, 3]
total = 0
for i in range(4):
    total += numbers[i]
print(total)
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 4, in <module>
    total += numbers[i]
             ~~~~~~~^^^
IndexError: list index out of range
```

第 4 行，`IndexError`。`range(4)` 产生 0、1、2、3，但列表只有 3 个元素，编号最大是 2。改成 `range(len(numbers))`，或者直接写 `for n in numbers: total += n`。

</details>

**练习 2**：下面的代码有一个错误，你能根据报错信息找到它吗？

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2
    for i in range(3)
                     ^
SyntaxError: expected ':'
```

<details>
<summary>点击查看答案</summary>

第 2 行的 `for` 语句末尾少了冒号，应该是 `for i in range(3):`。

</details>

**练习 3**：写一个程序，让用户输入两个数，计算它们相除的结果。如果用户输入的不是数字，或者除数是 0，都要给出友好的提示并让用户重新输入。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 10 | abc | 10 | 0 | 10 | 4 -->
```python
while True:
    try:
        a = float(input("被除数："))
        b = float(input("除数："))
        print(f"结果是 {a / b}")
        break
    except ValueError:
        print("请输入数字，再来一次")
    except ZeroDivisionError:
        print("除数不能是 0，再来一次")
```

```text
被除数：10
除数：abc
请输入数字，再来一次
被除数：10
除数：0
除数不能是 0，再来一次
被除数：10
除数：4
结果是 2.5
```

</details>

---

👈 {% post_link Python-Basics-10-Functions '上一篇：函数，把代码打包' %}　｜　👉 {% post_link Python-Basics-12-Files '下一篇：读写文件' %}
