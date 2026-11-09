---
title: Python 零基础入门（13）：模块，使用别人写好的代码
date: 2026-11-09 18:55:00
summary: 不用什么都自己写。本篇学习用 import 导入模块，使用 math 做数学计算、random 生成随机数、datetime 处理日期，把自己的函数放进模块，并简单了解如何用 pip 安装第三方库。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

上一篇学了函数，你可以把常用的代码打包起来反复使用。其实，世界各地的程序员早就写好了**海量**的函数，放在一起供大家免费使用。这些打包好的代码文件叫做**模块**。

Python 安装时就自带了几百个模块，涵盖数学计算、随机数、日期时间、文件管理、网络……这被称为 Python 的“**自带电池**”：拿来就能用，不用自己从零造轮子。

## 一、import：导入模块

要使用一个模块，先要用 `import`（导入）把它“请进来”：

```python
import math

print(math.sqrt(16))
print(math.pi)
```

```text
4.0
3.141592653589793
```

- `import math`：导入 math（数学）模块，**通常写在文件的最开头**；
- `math.sqrt(16)`：使用 math 模块里的 `sqrt` 函数（求平方根）。写法是**模块名 + 点 + 函数名**；
- `math.pi`：math 模块里存好的圆周率 π。

> 打个比方：模块就像一个**工具箱**，`import math` 是把“数学工具箱”搬到桌上，`math.sqrt` 是从这个箱子里拿出“开平方”这件工具。

### math 模块常用功能

| 写法 | 作用 | 例子 | 结果 |
|---|---|---|---|
| `math.sqrt(x)` | 平方根 | `math.sqrt(9)` | `3.0` |
| `math.pi` | 圆周率 | `math.pi` | `3.14159…` |
| `math.ceil(x)` | 向上取整 | `math.ceil(2.1)` | `3` |
| `math.floor(x)` | 向下取整 | `math.floor(2.9)` | `2` |

向上取整在生活中很常用：

```python
import math

people = 23
per_car = 5
cars = math.ceil(people / per_car)
print(f"{people} 个人，每辆车坐 {per_car} 人，需要 {cars} 辆车")
```

```text
23 个人，每辆车坐 5 人，需要 5 辆车
```

23 ÷ 5 = 4.6，不管余下几个人，都得多叫一辆车，所以要向上取整。

## 二、random：随机数

`random` 模块可以生成随机数，做游戏、抽奖、模拟实验时特别有用。

<!-- nocheck -->
```python
import random

print(random.randint(1, 6))      # 1 到 6 之间的随机整数（包括 1 和 6）
print(random.random())           # 0 到 1 之间的随机小数
```

可能的结果（**每次运行都不一样**）：

```text
4
0.7350118337143583
```

注意：`randint(1, 6)` 是**包括 6** 的，这和 `range` 不一样。

### 从列表里随机选

<!-- nocheck -->
```python
import random

foods = ["火锅", "麻辣烫", "饺子", "汉堡", "拉面"]
print("今天中午吃：", random.choice(foods))

cards = ["A", "2", "3", "4", "5"]
random.shuffle(cards)            # 把列表顺序打乱（洗牌）
print(cards)
```

可能的结果：

```text
今天中午吃： 饺子
['3', 'A', '5', '2', '4']
```

| 写法 | 作用 |
|---|---|
| `random.randint(a, b)` | a 到 b 之间的随机整数（包括 a 和 b） |
| `random.random()` | 0 到 1 之间的随机小数 |
| `random.choice(列表)` | 从列表中随机选一个 |
| `random.shuffle(列表)` | 打乱列表的顺序 |

### 真正的猜数字游戏

还记得第 7 篇的猜数字游戏吗？当时谜底是写死的 68。现在可以让电脑随机出题了：

<!-- norun -->
```python
import random

secret = random.randint(1, 100)
tries = 0
print("我想了一个 1 到 100 之间的数，你来猜！")

while True:
    guess = int(input("你猜是多少？"))
    tries += 1
    if guess > secret:
        print("太大了")
    elif guess < secret:
        print("太小了")
    else:
        print(f"🎉 猜对了！答案就是 {secret}，你一共猜了 {tries} 次")
        break
```

只改了一行，游戏就变得每次都不一样了。

## 三、datetime：日期和时间

<!-- nocheck -->
```python
import datetime

today = datetime.date.today()
now = datetime.datetime.now()
print(today)
print(now)
print(today.year, today.month, today.day)
```

可能的结果（显示的是你运行时的日期和时间）：

```text
2026-11-09
2026-11-09 19:30:12.345678
2026 11 9
```

### 日期的计算

两个日期相减，可以算出相差多少天：

```python
import datetime

start = datetime.date(2026, 1, 1)
end = datetime.date(2026, 11, 9)
diff = end - start
print(f"相差 {diff.days} 天")
```

```text
相差 312 天
```

`datetime.date(年, 月, 日)` 创建一个日期。相减得到的结果有一个 `.days`，就是相差的天数。

也可以计算“多少天以后是几号”：

```python
import datetime

start = datetime.date(2026, 11, 9)
later = start + datetime.timedelta(days=100)
print(f"100 天后是 {later}")
```

```text
100 天后是 2027-02-17
```

`timedelta` 表示“一段时间”，`timedelta(days=100)` 就是“100 天”。

### 把日期显示成想要的格式

```python
import datetime

d = datetime.date(2026, 11, 9)
print(d.strftime("%Y年%m月%d日"))
print(d.strftime("%Y/%m/%d"))
```

```text
2026年11月09日
2026/11/09
```

`strftime` 中，`%Y` 代表四位年份，`%m` 代表两位月份，`%d` 代表两位日期，其他文字原样保留。

## 四、导入的几种写法

### 写法一：import 模块

```python
import math
print(math.sqrt(25))
```

```text
5.0
```

每次使用都要写 `math.`，虽然长一点，但一看就知道 `sqrt` 是哪个模块的。**最推荐这种写法。**

### 写法二：from 模块 import 功能

```python
from math import sqrt, pi
print(sqrt(25))
print(pi)
```

```text
5.0
3.141592653589793
```

只导入需要的功能，使用时不用再写 `math.`。

### 写法三：import 模块 as 别名

```python
import datetime as dt
print(dt.date(2026, 1, 1))
```

```text
2026-01-01
```

模块名太长时，可以起一个短一点的**别名**。以后你学数据分析时会经常看到 `import pandas as pd`、`import numpy as np` 这种写法。

## 五、自己写模块

其实，**任何一个 `.py` 文件都是一个模块**。把常用的函数写在一个文件里，别的程序就可以导入它。

比如，新建一个文件 `my_tools.py`：

<!-- file: my_tools.py -->
```python
# my_tools.py：我的小工具箱

def bmi(weight, height):
    """计算 BMI"""
    return weight / height ** 2

def is_even(n):
    """判断是否是偶数"""
    return n % 2 == 0
```

然后在**同一个文件夹**里新建 `main.py`：

```python
import my_tools

print(f"{my_tools.bmi(68, 1.75):.1f}")
print(my_tools.is_even(10))
```

```text
22.2
True
```

运行 `main.py`，它就能使用 `my_tools.py` 里的函数了。注意 import 时**不写 `.py` 后缀**。

当程序越写越长时，把代码按功能拆分到不同的文件里，会让程序更容易管理。

## 六、第三方库和 pip（了解即可）

除了 Python 自带的模块，全世界的程序员还写了几十万个**第三方库**，放在一个叫 PyPI 的网站上，可以免费下载。比如：

| 库名 | 用途 |
|---|---|
| `requests` | 访问网页 |
| `pandas` | 处理表格数据（类似 Excel） |
| `matplotlib` | 画图表 |
| `openpyxl` | 读写 Excel 文件 |

安装它们要用 Python 自带的工具 **pip**。打开**命令提示符**（不是 IDLE，也不是 `>>>` 里面），输入：

```text
pip install requests
```

等它显示 `Successfully installed ...`，就安装好了，之后在代码里 `import requests` 就能使用。

> 如果下载很慢，可以使用国内的镜像，比如：`pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple`
>
> Mac 用户请使用 `pip3`。

这部分现在只需要知道有这么回事。等你学完基础，想做数据分析、画图、自动化办公时，再来安装对应的库。

## 新手常见错误

### 1. 忘了 import

<!-- raises -->
```python
print(math.sqrt(16))
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1, in <module>
    print(math.sqrt(16))
          ^^^^
NameError: name 'math' is not defined. Did you forget to import 'math'?
```

Python 直接提示你：“是不是忘了导入 `math`？”

### 2. 把自己的文件命名成模块的名字

这是一个非常隐蔽的错误。如果你把自己的程序保存成 `random.py`，然后在里面写 `import random`，Python 会导入**你自己的这个文件**，而不是真正的 random 模块，于是出现各种奇怪的报错，比如：

```text
AttributeError: module 'random' has no attribute 'randint' (consider renaming 'C:\Users\xiaoming\Desktop\python学习\random.py' since it has the same name as the standard library module named 'random' and prevents importing that standard library module)
```

较新的 Python（3.13 及以后）会在括号里直接提醒你：“考虑给 `random.py` 改个名字，因为它和标准库的 random 模块同名”。旧版本只会显示前半句，更让人摸不着头脑。

**不要用 `random.py`、`math.py`、`datetime.py` 这类名字给自己的文件命名。** 如果已经这样做了，把文件改个名字，再删除同一文件夹里可能生成的 `__pycache__` 文件夹即可。

### 3. 在 `>>>` 里输入 pip

```text
>>> pip install requests
  File "<python-input-0>", line 1
    pip install requests
        ^^^^^^^
SyntaxError: invalid syntax
```

pip 是在**命令提示符**里用的命令，不是 Python 代码。先输入 `exit()` 退出 Python，再输入 pip 命令。

## 小结

- 模块是别人（或自己）写好的代码文件，用 `import 模块名` 导入，用 `模块名.功能` 使用。
- `math`：`sqrt`、`pi`、`ceil`、`floor` 等数学功能。
- `random`：`randint`、`random`、`choice`、`shuffle` 等随机功能。
- `datetime`：获取今天的日期、日期相减算天数、`timedelta` 算几天后。
- 导入的三种写法：`import x`、`from x import y`、`import x as 别名`。
- 任何 `.py` 文件都可以作为模块被导入；**不要用模块的名字给自己的文件命名**。
- 第三方库用 `pip install 库名` 安装，在命令提示符里执行。

## 练习

**练习 1**：写一个“掷骰子”程序，模拟掷两个骰子，显示每个骰子的点数和总点数。

<details>
<summary>点击查看答案</summary>

<!-- nocheck -->
```python
import random

a = random.randint(1, 6)
b = random.randint(1, 6)
print(f"骰子 1：{a}，骰子 2：{b}，总点数：{a + b}")
```

可能的结果：

```text
骰子 1：3，骰子 2：5，总点数：8
```

</details>

**练习 2**：写一个程序，计算今天距离 2027 年元旦还有多少天。

<details>
<summary>点击查看答案</summary>

<!-- nocheck -->
```python
import datetime

today = datetime.date.today()
new_year = datetime.date(2027, 1, 1)
print(f"距离 2027 年元旦还有 {(new_year - today).days} 天")
```

如果今天是 2026 年 11 月 9 日，结果是：

```text
距离 2027 年元旦还有 53 天
```

</details>

**练习 3**：写一个“随机点名”程序：有一个名单列表，随机抽出 3 个不重复的名字。（提示：可以先 `shuffle`，再取前 3 个。）

<details>
<summary>点击查看答案</summary>

<!-- nocheck -->
```python
import random

names = ["小明", "小红", "小刚", "小李", "小王", "小张"]
random.shuffle(names)
chosen = names[:3]
print("被点到的同学：", "、".join(chosen))
```

可能的结果：

```text
被点到的同学： 小李、小明、小王
```

random 模块其实还有一个现成的函数 `random.sample(names, 3)`，可以直接随机抽出 3 个不重复的元素。

</details>

---

👈 {% post_link Python-Basics-12-Files '上一篇：读写文件' %}　｜　👉 {% post_link Python-Basics-14-Project '下一篇：综合项目，命令行记账本' %}
