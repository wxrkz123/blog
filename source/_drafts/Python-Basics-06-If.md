---
title: Python 零基础入门（06）：if，让程序做判断
date: 2026-11-09 19:30:00
summary: 让程序根据不同情况做不同的事：比较大小、True 和 False、if / else / elif 的写法、缩进的规则，以及用 and、or、not 组合多个条件。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

生活中我们每天都在做判断：

- **如果**下雨，就带伞；**否则**就不带。
- **如果**考了 90 分以上，评为“优秀”；**如果**是 60 到 90 分，评为“及格”；**否则**评为“不及格”。

程序也需要做判断，这一篇我们就来学习 `if`（英文“如果”）。

## 一、先学会“比较”

做判断之前，先要会比较。Python 的比较符号如下：

| 符号 | 意思 | 例子 | 结果 |
|---|---|---|---|
| `>` | 大于 | `5 > 3` | `True` |
| `<` | 小于 | `5 < 3` | `False` |
| `>=` | 大于或等于 | `5 >= 5` | `True` |
| `<=` | 小于或等于 | `4 <= 3` | `False` |
| `==` | 等于 | `5 == 5` | `True` |
| `!=` | 不等于 | `5 != 3` | `True` |

比较的结果只有两种：**`True`（真，成立）** 或 **`False`（假，不成立）**。

```python
age = 20
print(age > 18)
print(age < 18)
print(age == 20)
```

```text
True
False
True
```

### 重点：`==` 和 `=` 完全不同

- `=`（一个等号）：**赋值**，把右边的东西交给左边的变量；
- `==`（两个等号）：**比较**，问“左右两边相等吗？”，回答 True 或 False。

```python
x = 5          # 赋值：让 x 等于 5
print(x == 5)  # 比较：x 等于 5 吗？
print(x == 6)  # 比较：x 等于 6 吗？
```

```text
True
False
```

这是新手最常混淆的地方，一定要记牢。

### 字符串也能比较

```python
password = "abc123"
print(password == "abc123")
print(password == "ABC123")
```

```text
True
False
```

注意大小写不同的字符串是**不相等**的。

## 二、if：如果……就……

```python
temperature = 35

if temperature > 30:
    print("今天很热")
    print("记得多喝水")

print("程序结束")
```

```text
今天很热
记得多喝水
程序结束
```

把 `temperature` 改成 `20` 再运行：

```python
temperature = 20

if temperature > 30:
    print("今天很热")
    print("记得多喝水")

print("程序结束")
```

```text
程序结束
```

这次条件 `20 > 30` 不成立，所以 if 下面那两行就**跳过不执行**了。

### if 的格式（非常重要！）

```text
if 条件:
    条件成立时要做的事
    条件成立时要做的事
后面的代码（不管条件是否成立都会执行）
```

有两个地方必须注意：

1. **条件后面要有冒号 `:`**（英文冒号）。
2. **要执行的代码必须缩进**，也就是在行首空 **4 个空格**。

### 什么是缩进？

缩进就是在一行代码的开头空几格。在 Python 里，**缩进决定了哪些代码“属于”这个 if**：

- 缩进了的行：属于 if，条件成立才执行；
- 没有缩进的行：不属于 if，总是会执行。

这就像写提纲时，小标题要比大标题往里缩一点：

```text
if temperature > 30:        ← “大标题”
    print("今天很热")        ← 属于这个 if
    print("记得多喝水")      ← 属于这个 if
print("程序结束")            ← 已经不属于 if 了
```

> 💡 在 IDLE 里，输入 `if ... :` 后按回车，下一行会**自动缩进** 4 个空格。写完 if 里面的代码后，按一下**退格键（Backspace）**就能退回到最左边。也可以按 **Tab 键**缩进，IDLE 会自动把它转换成 4 个空格。

## 三、else：否则……

如果条件不成立时也想做点什么，就用 `else`（英文“否则”）：

```python
age = 15

if age >= 18:
    print("你已经成年了")
else:
    print("你还未成年")
```

```text
你还未成年
```

`if` 和 `else` 就像岔路口，**两条路只会走一条**：条件成立走 if，不成立走 else。

注意 `else` 后面也有冒号，并且 `else` 要和 `if` **对齐**（缩进相同）。

一个实用的例子，判断奇偶数：

<!-- stdin: 7 -->
```python
number = int(input("请输入一个整数："))

if number % 2 == 0:
    print(f"{number} 是偶数")
else:
    print(f"{number} 是奇数")
```

```text
请输入一个整数：7
7 是奇数
```

还记得第 3 篇讲的取余吗？一个数除以 2 余 0，就是偶数。

## 四、elif：多种情况

如果情况不止两种，就用 `elif`（是 else if 的缩写，意思是“否则如果”）：

```python
score = 85

if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")
elif score >= 60:
    print("及格")
else:
    print("不及格")
```

```text
良好
```

Python 会**从上往下**一个一个检查条件：

1. `85 >= 90`？不成立，看下一个；
2. `85 >= 80`？成立！显示“良好”，然后**整个 if 结构就结束了**，后面的不再检查。

所以虽然 `85 >= 60` 也成立，但不会显示“及格”。**只会执行第一个成立的分支。**

`elif` 可以有任意多个，`else` 可以有也可以没有，但如果有，必须放在最后。

### 条件的顺序很重要

如果把顺序写反了：

```python
score = 95

if score >= 60:
    print("及格")
elif score >= 80:
    print("良好")
elif score >= 90:
    print("优秀")
```

```text
及格
```

95 分只得了“及格”！因为第一个条件 `95 >= 60` 就成立了，后面的都没有机会检查。**从严格到宽松排列条件**，才能得到正确结果。

## 五、组合多个条件：and、or、not

### and：并且（两个都要成立）

```python
age = 25
has_ticket = True

if age >= 18 and has_ticket:
    print("可以入场")
else:
    print("不能入场")
```

```text
可以入场
```

`and` 两边的条件**都成立**，整体才成立。只要有一个不成立，整体就不成立。

### or：或者（有一个成立就行）

```python
day = "星期六"

if day == "星期六" or day == "星期日":
    print("周末，休息！")
else:
    print("工作日，上班")
```

```text
周末，休息！
```

`or` 两边**只要有一个成立**，整体就成立。

### not：不是（取反）

```python
is_raining = False

if not is_raining:
    print("没下雨，出去玩吧")
```

```text
没下雨，出去玩吧
```

`not` 把 True 变成 False，把 False 变成 True。

### 判断是否在某个范围内

想判断分数是不是在 60 到 100 之间，可以用 `and`：

```python
score = 75
if score >= 60 and score <= 100:
    print("及格了")
```

```text
及格了
```

Python 还支持一种更像数学的写法，效果完全一样：

```python
score = 75
if 60 <= score <= 100:
    print("及格了")
```

```text
及格了
```

## 六、if 里面还可以有 if

if 里面可以再写 if，这叫**嵌套**。注意每深入一层，就要再多缩进 4 个空格：

<!-- stdin: 25 | 是 -->
```python
age = int(input("请输入年龄："))

if age >= 18:
    has_id = input("带身份证了吗？（是/否）")
    if has_id == "是":
        print("可以办理")
    else:
        print("请带身份证再来")
else:
    print("未成年人需要家长陪同")
```

```text
请输入年龄：25
带身份证了吗？（是/否）是
可以办理
```

嵌套不要太深，一般两三层就够了，太深的话代码会很难读。

## 动手试试：带评价的 BMI 计算器

上一篇我们写了一个 BMI 计算器，现在给它加上评价：

<!-- stdin: 1.75 | 68 -->
```python
height = float(input("身高（米）："))
weight = float(input("体重（千克）："))
bmi = weight / height ** 2

print(f"你的 BMI 是 {bmi:.1f}")

if bmi < 18.5:
    print("偏瘦，要多吃点哦")
elif bmi < 24:
    print("正常，继续保持")
elif bmi < 28:
    print("偏胖，注意运动")
else:
    print("肥胖，建议咨询医生")
```

```text
身高（米）：1.75
体重（千克）：68
你的 BMI 是 22.2
正常，继续保持
```

（这里使用的是国内常用的 BMI 标准。）多运行几次，输入不同的数字，看看每个分支是否都能正确执行。

## 新手常见错误

### 1. 忘了冒号

<!-- raises -->
```python
age = 20
if age > 18
    print("成年")
```

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2
    if age > 18
               ^
SyntaxError: expected ':'
```

`SyntaxError` 是“语法错误”，`expected ':'` 意思是“这里应该有一个冒号”。

> 在 IDLE 里按 F5 时，这类语法错误不会显示上面这一大段，而是**弹出一个小窗口**写着 `expected ':'`，并把出错的位置**标成红色**。两种显示方式说的是同一件事。

### 2. 忘了缩进

<!-- raises -->
```python
age = 20
if age > 18:
print("成年")
```

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 3
    print("成年")
    ^^^^^
IndentationError: expected an indented block after 'if' statement on line 2
```

`IndentationError` 是“缩进错误”，意思是：“第 2 行的 if 后面，应该有一段缩进的代码”。

### 3. 缩进不一致

同一个 if 里的代码，缩进必须**完全一样**：

<!-- raises -->
```python
age = 20
if age > 18:
    print("成年")
      print("可以考驾照")
```

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 4
    print("可以考驾照")
IndentationError: unexpected indent
```

`unexpected indent` 意思是“意外的缩进”：第 4 行比第 3 行多缩进了 2 个空格，Python 不知道它属于谁。**统一用 4 个空格**就不会出这种问题。

### 4. 把 `==` 写成了 `=`

<!-- raises -->
```python
password = "123456"
if password = "123456":
    print("密码正确")
```

```text
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2
    if password = "123456":
       ^^^^^^^^^^^^^^^^^^^
SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?
```

Python 提示你：“是不是想用 `==`？”判断相等，一定是**两个等号**。

### 5. 用 or 时偷懒

```python
day = "星期三"
if day == "星期六" or "星期日":
    print("周末")
```

```text
周末
```

星期三怎么成了周末？因为 `or` 的右边只写了 `"星期日"`，而不是 `day == "星期日"`。Python 会把它理解成“`day == "星期六"` 成立，或者 `"星期日"` 成立”，而一个非空的字符串在判断时总是被当作成立。正确写法是：

```python
day = "星期三"
if day == "星期六" or day == "星期日":
    print("周末")
else:
    print("工作日")
```

```text
工作日
```

## 小结

- 比较符号：`>`、`<`、`>=`、`<=`、`==`（等于）、`!=`（不等于），结果是 `True` 或 `False`。
- **`=` 是赋值，`==` 是比较。**
- `if 条件:` 后面的代码要**缩进 4 个空格**，缩进的代码只在条件成立时执行。
- `if / else`：二选一；`if / elif / else`：多选一，**只执行第一个成立的分支**。
- 多个条件从严格到宽松排列。
- `and`（都要成立）、`or`（一个成立就行）、`not`（取反）。
- 最常见的错误：忘了冒号、缩进不对、`==` 写成 `=`。

## 练习

**练习 1**：写一个程序，让用户输入一个数，判断它是正数、负数还是零。

<details>
<summary>点击查看答案</summary>

<!-- stdin: -3 -->
```python
n = float(input("请输入一个数："))
if n > 0:
    print("正数")
elif n < 0:
    print("负数")
else:
    print("零")
```

```text
请输入一个数：-3
负数
```

</details>

**练习 2**：写一个简单的登录程序。正确的用户名是 `admin`，密码是 `123456`。用户名和密码都对时显示“登录成功”，否则显示“用户名或密码错误”。

<details>
<summary>点击查看答案</summary>

<!-- stdin: admin | 123456 -->
```python
username = input("用户名：")
password = input("密码：")

if username == "admin" and password == "123456":
    print("登录成功")
else:
    print("用户名或密码错误")
```

```text
用户名：admin
密码：123456
登录成功
```

注意这里不需要 `int()`，因为我们是拿字符串和字符串比较。

</details>

**练习 3**：判断闰年。规则是：能被 4 整除但不能被 100 整除，或者能被 400 整除的年份是闰年。让用户输入年份，判断是不是闰年。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 2024 -->
```python
year = int(input("请输入年份："))

if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
    print(f"{year} 年是闰年")
else:
    print(f"{year} 年不是闰年")
```

```text
请输入年份：2024
2024 年是闰年
```

可以多试几个：2000 年是闰年，1900 年不是，2026 年也不是。

</details>

**练习 4**：下面的代码会显示什么？

```python
x = 10
if x > 5:
    print("A")
if x > 8:
    print("B")
else:
    print("C")
```

<details>
<summary>点击查看答案</summary>

```text
A
B
```

注意这里是**两个独立的 if**（第二个是 `if` 而不是 `elif`），所以两个都会检查。第一个 `10 > 5` 成立，显示 A；第二个 `10 > 8` 成立，显示 B。`else` 属于第二个 if，所以不执行。

</details>

---

👈 {% post_link Python-Basics-05-Input '上一篇：input，和用户对话' %}　｜　👉 {% post_link Python-Basics-07-Loops '下一篇：循环，让程序重复做事' %}
