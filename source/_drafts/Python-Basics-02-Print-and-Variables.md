---
title: Python 零基础入门（02）：print 和变量
date: 2026-11-09 19:50:00
summary: 学会用 print 显示各种内容、用注释给代码写备注，理解“变量”就是贴在数据上的名字标签，以及等号在编程里的真正含义。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

上一篇我们用 `print` 让电脑显示了几句话。这一篇我们把 `print` 学得更熟练一些，然后学习编程中最基础、也最重要的概念：**变量**。

> 本篇的代码都可以在 IDLE 里新建文件、保存、按 F5 运行。

## 一、再认识一下 print

### 显示文字

要显示文字，就把文字放在引号里：

```python
print("今天是星期一")
print('单引号也可以')
```

```text
今天是星期一
单引号也可以
```

双引号 `"` 和单引号 `'` 效果一样，选一种用就行，但**左右要配对**：不能左边双引号、右边单引号。本系列统一使用双引号。

### 显示数字和算式

数字不用加引号，而且 Python 会帮你算出结果：

```python
print(2026)
print(3 + 5)
print(10 - 4)
```

```text
2026
8
6
```

### 有引号和没引号，差别很大

请仔细对比下面两行：

```python
print("3 + 5")
print(3 + 5)
```

```text
3 + 5
8
```

- 有引号：`"3 + 5"` 是一段**文字**，Python 原样照抄，不会去计算；
- 没引号：`3 + 5` 是一个**算式**，Python 会算出结果。

> 打个比方：引号就像“原话照念”。老师说“请念：3 加 5”，你会念出“3 加 5”；老师说“3 加 5 等于几”，你会回答“8”。

### 一次显示多样东西

在括号里用**英文逗号**隔开，就可以一次显示多样东西，它们之间会自动加一个空格：

```python
print("苹果", "香蕉", "橘子")
print("我有", 3, "个苹果")
```

```text
苹果 香蕉 橘子
我有 3 个苹果
```

### 显示一个空行

`print()` 括号里什么都不写，就会显示一个空行，可以用来让结果更好看：

```python
print("第一段")
print()
print("第二段")
```

```text
第一段

第二段
```

## 二、注释：写给人看的备注

在代码里，`#` 号后面的内容叫做**注释**。Python 运行时会**完全忽略**注释，它是写给人看的备注：

```python
# 这是一个打招呼的程序
print("你好")  # 这一行会显示“你好”
# print("这一行不会运行，因为它前面有 #")
```

```text
你好
```

注释有两个用途：

1. **解释代码**：过几个月回头看自己的代码，你会感谢当初写注释的自己；
2. **临时“关掉”某行代码**：在行首加个 `#`，这行就不运行了，删掉 `#` 又恢复。

> 在 IDLE 里，选中几行代码后按 `Alt + 3` 可以一次性给它们加上 `#`，按 `Alt + 4` 可以去掉。

## 三、变量：给数据起个名字

### 为什么需要变量？

假设你要写一个程序，显示一个人的信息：

```python
print("张三你好！")
print("张三今天学习了 Python")
print("张三明天继续加油")
```

```text
张三你好！
张三今天学习了 Python
张三明天继续加油
```

现在要把“张三”换成“李四”，你得改三个地方。如果有 100 个地方呢？很容易漏改。

用**变量**就能解决这个问题：

```python
name = "张三"
print(name, "你好！")
print(name, "今天学习了 Python")
print(name, "明天继续加油")
```

```text
张三 你好！
张三 今天学习了 Python
张三 明天继续加油
```

现在只要把第一行的 `"张三"` 改成 `"李四"`，下面所有地方都跟着变了。

### 变量是什么？

```python
name = "张三"
```

这行代码的意思是：**把 `"张三"` 这个数据，贴上一个叫 `name` 的标签。**

以后在代码里写 `name`，Python 就会顺着标签找到 `"张三"`。

你可以把变量想象成**贴在东西上的名字标签**：

```text
   name          age
    │             │
    ▼             ▼
 "张三"           18
```

注意 `print(name)` 和 `print("name")` 的区别：

```python
name = "张三"
print(name)
print("name")
```

```text
张三
name
```

- `name` 没有引号，是变量，Python 会找到它代表的内容 `"张三"`；
- `"name"` 有引号，是一段文字，原样显示。

### 等号不是“等于”

这是新手最需要转变的观念：**在编程里，`=` 的意思是“把右边的东西交给左边的名字”，叫做“赋值”**，而不是数学里的“等于”。

所以要从**右往左**读：

```python
age = 18      # 读作：把 18 交给 age
```

正因为如此，下面这行在数学里不成立的式子，在 Python 里完全合法：

```python
age = 18
age = age + 1
print(age)
```

```text
19
```

第二行的执行过程是：

1. 先算右边：`age + 1`，此时 age 是 18，所以结果是 19；
2. 再把 19 交给左边的 `age`。

于是 age 变成了 19。这就是“变量”这个名字的由来：**它的值是可以变的。**

### 变量可以重新赋值

给同一个变量再次赋值，标签就会从旧的数据上撕下来，贴到新的数据上：

```python
weather = "晴天"
print("今天是", weather)
weather = "下雨"
print("现在是", weather)
```

```text
今天是 晴天
现在是 下雨
```

程序是从上往下执行的，所以第一次 print 时 weather 还是“晴天”，第二次 print 时已经变成“下雨”了。

### 用变量来计算

变量里装的是数字时，可以直接拿来计算：

```python
price = 5       # 一支笔 5 元
count = 3       # 买 3 支
total = price * count
print("一共要付", total, "元")
```

```text
一共要付 15 元
```

`*` 是乘号，下一篇会详细讲各种计算。

## 四、变量名怎么起？

### 必须遵守的规则

1. 只能由**字母、数字、下划线 `_`** 组成（中文也可以，但不推荐）；
2. **不能以数字开头**：`name1` 可以，`1name` 不行；
3. **不能有空格**：`my name` 不行，要写成 `my_name`；
4. **区分大小写**：`age` 和 `Age` 是两个不同的变量；
5. 不能使用 Python 自己的“关键字”，比如 `if`、`for`、`while` 之类（后面会陆续学到）；
6. 也不要使用 `print`、`input` 这类 Python 自带功能的名字，否则这个功能就被你的变量“盖住”了（见练习 3）。

### 建议遵守的习惯

- **用有意义的英文单词**：`age` 比 `a` 好，`student_name` 比 `sn` 好；
- **多个单词用下划线连接**：`total_price`、`student_count`；
- **全部小写**。

```python
# 好的变量名
student_name = "王五"
total_price = 99

# 不好的变量名（能运行，但别人看不懂）
a = "王五"
x1 = 99
```

## 动手试试

写一个程序做“自我介绍”。先把信息存进变量，再用 print 显示出来：

```python
name = "小明"
age = 18
city = "北京"
hobby = "打篮球"

print("大家好，我叫", name)
print("我今年", age, "岁，来自", city)
print("我的爱好是", hobby)
```

```text
大家好，我叫 小明
我今年 18 岁，来自 北京
我的爱好是 打篮球
```

把变量的值换成你自己的信息，再运行一次。注意：你只需要改最上面四行，下面的 print 都不用动。这就是变量的好处。

## 新手常见错误

### 1. 变量名拼写不一致

<!-- raises -->
```python
name = "小明"
print(nam)
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(nam)
          ^^^
NameError: name 'nam' is not defined. Did you mean: 'name'?
```

最后一行 `NameError: name 'nam' is not defined` 的意思是：“我不认识 `nam` 这个名字”。因为我们定义的是 `name`，却少打了一个字母，写成了 `nam`。

Python 甚至很贴心地问你：`Did you mean: 'name'?`（你是不是想写 `name`？）

> 报错信息第 11 篇会详细讲。现在你只需要知道：**看最后一行**，它通常就说明了问题在哪。

### 2. 先使用，后定义

<!-- raises -->
```python
print(score)
score = 90
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1, in <module>
    print(score)
          ^^^^^
NameError: name 'score' is not defined
```

程序从上往下执行，运行第一行时，`score` 还没有被定义，Python 当然不认识它。**一定要先赋值，再使用。**

### 3. 把变量名放进了引号

```python
city = "上海"
print("我住在", "city")
```

```text
我住在 city
```

本想显示“我住在 上海”，结果显示了“city”，因为 `"city"` 加了引号，变成了一段普通文字。

### 4. 等号写反了

```text
18 = age      ← 错误：左边必须是变量名
age = 18      ← 正确
```

记住：等号左边是**名字**，右边是**数据**。

## 小结

- `print(...)` 可以显示文字（加引号）、数字和算式（不加引号）；用逗号隔开可以一次显示多样东西。
- `#` 后面是**注释**，Python 运行时会忽略它。
- **变量**就是贴在数据上的名字标签：`name = "张三"`。
- `=` 是**赋值**，从右往左读：把右边的结果交给左边的名字。
- `age = age + 1` 的意思是：算出 age 加 1 的结果，再交还给 age。
- 变量名用有意义的小写英文单词，多个单词用下划线连接，不能以数字开头。

## 练习

**练习 1**：下面的程序会显示什么？先自己想，再运行验证。

```python
a = 5
b = a
a = 10
print(a, b)
```

<details>
<summary>点击查看答案</summary>

```text
10 5
```

第二行 `b = a` 是把 a **当时**的值 5 交给了 b。之后 a 改成了 10，但 b 不受影响，仍然是 5。

</details>

**练习 2**：用变量写一个“购物小票”程序。苹果单价 4 元，买了 6 个，用变量 `price` 和 `count` 表示，计算并显示总价。

<details>
<summary>点击查看答案</summary>

```python
price = 4
count = 6
total = price * count
print("苹果单价：", price, "元")
print("购买数量：", count, "个")
print("应付金额：", total, "元")
```

```text
苹果单价： 4 元
购买数量： 6 个
应付金额： 24 元
```

</details>

**练习 3**：下面哪些变量名是合法的？

`my_age`、`2name`、`name2`、`my name`、`_score`、`print`

<details>
<summary>点击查看答案</summary>

- `my_age`：✅ 合法
- `2name`：❌ 不能以数字开头
- `name2`：✅ 合法
- `my name`：❌ 不能有空格
- `_score`：✅ 合法（下划线可以开头）
- `print`：⚠️ 技术上能用，但会把 print 功能“覆盖”掉，之后就没法用 print 显示东西了，**千万不要这样用**

</details>

**练习 4**：一个变量 `count` 的值是 0，请写三行代码，让它每次增加 1，最后显示 `3`。

<details>
<summary>点击查看答案</summary>

```python
count = 0
count = count + 1
count = count + 1
count = count + 1
print(count)
```

```text
3
```

（如果需要“重复做同一件事”，以后学了循环会有更好的办法。）

</details>

---

👈 {% post_link Python-Basics-01-Install '上一篇：安装 Python，写出第一个程序' %}　｜　👉 {% post_link Python-Basics-03-Numbers '下一篇：数字和计算' %}
