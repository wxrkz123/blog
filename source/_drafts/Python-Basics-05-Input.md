---
title: Python 零基础入门（05）：input，和用户对话
date: 2026-11-09 19:35:00
summary: 用 input() 让程序向用户提问、接收键盘输入。重点理解“input 拿到的永远是字符串”，学会用 int() 和 float() 转换，并动手写几个能互动的小程序。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

到目前为止，我们写的程序都是“自说自话”：数据写死在代码里，每次运行结果都一样。

这一篇我们学习 `input()`，让程序可以**向用户提问，并根据用户的回答做事情**。程序从此就能和人互动了。

## 一、input 的基本用法

<!-- norun -->
```python
name = input("请问你叫什么名字？")
print(f"你好，{name}！")
```

运行这个程序（在 IDLE 里按 F5），你会看到：

```text
请问你叫什么名字？
```

然后程序就**停住了**，光标在问号后面闪烁，它在等你回答。用键盘输入 `小明`，再按**回车**：

```text
请问你叫什么名字？小明
你好，小明！
```

`input()` 做了三件事：

1. 把括号里的文字（叫做**提示语**）显示出来；
2. **暂停程序**，等用户在键盘上输入内容并按回车；
3. 把用户输入的内容交出来。我们用 `name = ...` 把它存进变量。

> 💡 本系列中，凡是需要输入的例子，运行结果里会把**你输入的内容**也一起显示出来，就像你在屏幕上实际看到的那样。比如上面的“小明”就是用户输入的。

### 提示语的小技巧

提示语后面最好留一个空格或者冒号，否则用户输入的内容会和提示语紧紧挤在一起：

<!-- stdin: 小红 -->
```python
name = input("请输入姓名：")
print(f"欢迎你，{name}")
```

```text
请输入姓名：小红
欢迎你，小红
```

## 二、最重要的一点：input 拿到的永远是字符串

来看一个“计算明年几岁”的程序：

<!-- stdin: 18 -->
<!-- raises -->
```python
age = input("你今年几岁？")
print(age + 1)
```

```text
你今年几岁？18
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(age + 1)
          ~~~~^~~
TypeError: can only concatenate str (not "int") to str
```

出错了！还记得上一篇的这个错误吗？“只能把字符串和字符串拼接”。

原因是：**不管用户输入的是什么，`input()` 交出来的都是字符串。** 用户输入 `18`，`age` 拿到的是字符串 `"18"`，而不是数字 `18`。字符串 `"18"` 加上数字 `1`，Python 当然不知道怎么办。

我们可以用 `type()` 确认一下：

<!-- stdin: 18 -->
```python
age = input("你今年几岁？")
print(type(age))
```

```text
你今年几岁？18
<class 'str'>
```

`str` 就是字符串。

### 解决办法：用 int() 转换

上一篇学过，`int()` 可以把字符串转成整数：

<!-- stdin: 18 -->
```python
age = int(input("你今年几岁？"))
print(f"明年你就 {age + 1} 岁了")
```

```text
你今年几岁？18
明年你就 19 岁了
```

`int(input("..."))` 的执行顺序是**从里往外**：

1. 先执行里面的 `input(...)`，得到字符串 `"18"`；
2. 再执行外面的 `int(...)`，把 `"18"` 变成数字 `18`；
3. 最后把 18 交给 `age`。

如果觉得一行写不清楚，也可以分两行写，效果一样：

<!-- norun -->
```python
text = input("你今年几岁？")
age = int(text)
```

### 有小数时用 float()

如果用户可能输入小数（比如身高、价格），就用 `float()`：

<!-- stdin: 1.75 -->
```python
height = float(input("请输入你的身高（米）："))
print(f"你的身高是 {height * 100} 厘米")
```

```text
请输入你的身高（米）：1.75
你的身高是 175.0 厘米
```

### 什么时候需要转换？

| 想拿用户输入来…… | 写法 |
|---|---|
| 当文字用（名字、城市等） | `input(...)`，不用转换 |
| 当整数计算（年龄、数量等） | `int(input(...))` |
| 当小数计算（身高、价格等） | `float(input(...))` |

## 三、多个输入

一个程序可以有多个 `input`，它们会按顺序一个一个地问：

<!-- stdin: 3 | 5 -->
```python
a = int(input("请输入第一个数："))
b = int(input("请输入第二个数："))
print(f"{a} + {b} = {a + b}")
print(f"{a} × {b} = {a * b}")
```

```text
请输入第一个数：3
请输入第二个数：5
3 + 5 = 8
3 × 5 = 15
```

## 四、几个互动小程序

### 程序 1：BMI 计算器

BMI（身体质量指数）= 体重（千克）÷ 身高（米）的平方。

<!-- stdin: 1.75 | 68 -->
```python
print("=== BMI 计算器 ===")
height = float(input("身高（米）："))
weight = float(input("体重（千克）："))

bmi = weight / height ** 2
print(f"你的 BMI 是 {bmi:.1f}")
```

```text
=== BMI 计算器 ===
身高（米）：1.75
体重（千克）：68
你的 BMI 是 22.2
```

（下一篇学了 `if`，我们会让它告诉你“偏瘦”“正常”还是“偏胖”。）

### 程序 2：AA 制分账

<!-- stdin: 368 | 4 -->
```python
total = float(input("这顿饭一共多少钱？"))
people = int(input("一共几个人？"))
each = total / people
print(f"每人应付 {each:.2f} 元")
```

```text
这顿饭一共多少钱？368
一共几个人？4
每人应付 92.00 元
```

### 程序 3：生成个性化问候卡

<!-- stdin: 小李 | 生日 | 天天开心 -->
```python
name = input("收卡人的名字：")
event = input("什么节日：")
wish = input("你的祝福：")

print()
print("*" * 30)
print(f"  亲爱的{name}：")
print(f"  {event}快乐！")
print(f"  祝你{wish}！")
print("*" * 30)
```

```text
收卡人的名字：小李
什么节日：生日
你的祝福：天天开心

******************************
  亲爱的小李：
  生日快乐！
  祝你天天开心！
******************************
```

## 动手试试

写一个“单位换算器”：用户输入公里数，程序显示对应的米数和英里数（1 公里约等于 0.6214 英里）。

<!-- stdin: 5 -->
```python
km = float(input("请输入公里数："))
print(f"{km} 公里 = {km * 1000} 米")
print(f"{km} 公里 ≈ {km * 0.6214:.2f} 英里")
```

```text
请输入公里数：5
5.0 公里 = 5000.0 米
5.0 公里 ≈ 3.11 英里
```

你注意到了吗？输入的 `5` 被 `float()` 转换后变成了 `5.0`。如果你希望显示得更整齐，可以把前两个 `{km}` 改成 `{km:.1f}` 或 `{km:g}`（`g` 会自动去掉多余的 `.0`）。

## 新手常见错误

### 1. 忘了转换类型就做计算

前面已经详细讲过：**要计算，先转换**。看到 `TypeError: can only concatenate str (not "int") to str`，十有八九就是忘了 `int()`。

另一个隐蔽的情况是两个输入相加，**不会报错，但结果不对**：

<!-- stdin: 3 | 5 -->
```python
a = input("第一个数：")
b = input("第二个数：")
print(a + b)
```

```text
第一个数：3
第二个数：5
35
```

3 加 5 怎么等于 35？因为 `a` 和 `b` 都是字符串，`+` 做的是拼接，`"3" + "5"` 得到 `"35"`。这种错误比报错更危险，因为你可能注意不到。

### 2. 用户输入的不是数字

如果程序要求输入整数，用户却输入了别的东西：

<!-- stdin: 十八 -->
<!-- raises -->
```python
age = int(input("你今年几岁？"))
```

```text
你今年几岁？十八
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1, in <module>
    age = int(input("你今年几岁？"))
ValueError: invalid literal for int() with base 10: '十八'
```

`ValueError` 是“值错误”，意思是：“`'十八'` 不是一个能转换成整数的写法”。`int()` 只认识阿拉伯数字。

同样，如果用户输入了小数 `18.5`，`int()` 也会报这个错，因为 `"18.5"` 不是整数的写法。这种情况应该用 `float()`。

第 11 篇我们会学习如何“接住”这种错误，在用户输错时友好地提醒他重新输入，而不是让程序直接崩溃。

### 3. 忘了把结果存进变量

<!-- norun -->
```python
input("你叫什么名字？")
```

这样写，用户输入的内容就“丢掉”了，后面没法使用。要写成 `name = input("...")`。

### 4. 括号没有配对

`int(input("..."))` 结尾有**两个**右括号，一个属于 `input`，一个属于 `int`。少写一个就会报 `SyntaxError`（语法错误）。

> 💡 IDLE 有一个贴心的功能：输入右括号时，与它配对的左括号会短暂高亮，帮你检查是否配对。

## 小结

- `变量 = input("提示语")`：显示提示语，等用户输入，把输入的内容存进变量。
- **`input()` 交出来的永远是字符串**，哪怕用户输入的是数字。
- 需要计算时，用 `int(input(...))` 或 `float(input(...))` 转换。
- 嵌套的写法从里往外执行；结尾的括号要配对。
- 用户输入的内容不是合法数字时，`int()` / `float()` 会报 `ValueError`。

## 练习

**练习 1**：写一个程序，让用户输入长方形的长和宽（可能是小数），显示它的面积。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 4.5 | 2 -->
```python
length = float(input("长："))
width = float(input("宽："))
print(f"面积是 {length * width}")
```

```text
长：4.5
宽：2
面积是 9.0
```

</details>

**练习 2**：写一个程序，让用户输入出生年份，计算今年（2026 年）多少岁。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 2000 -->
```python
year = int(input("你是哪一年出生的？"))
age = 2026 - year
print(f"你今年 {age} 岁")
```

```text
你是哪一年出生的？2000
你今年 26 岁
```

第 13 篇学了 `datetime` 模块后，可以让程序自动获取今年的年份，而不是写死 2026。

</details>

**练习 3**：下面这个程序，用户输入 `10` 和 `20`，会显示什么？怎么修改才能显示 30？

<!-- norun -->
```python
x = input("x = ")
y = input("y = ")
print(x + y)
```

<details>
<summary>点击查看答案</summary>

会显示 `1020`，因为两个字符串拼接在了一起。修改方法是把输入转换成整数：

<!-- stdin: 10 | 20 -->
```python
x = int(input("x = "))
y = int(input("y = "))
print(x + y)
```

```text
x = 10
y = 20
30
```

</details>

**练习 4**：写一个“找零计算器”：用户输入商品价格和付款金额，显示应找零多少钱（保留两位小数）。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 37.5 | 50 -->
```python
price = float(input("商品价格："))
paid = float(input("付款金额："))
change = paid - price
print(f"找零 {change:.2f} 元")
```

```text
商品价格：37.5
付款金额：50
找零 12.50 元
```

</details>

---

👈 {% post_link Python-Basics-04-Strings '上一篇：字符串，处理文字' %}　｜　👉 {% post_link Python-Basics-06-If '下一篇：if，让程序做判断' %}
