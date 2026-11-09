---
title: Python 零基础入门（04）：字符串，处理文字
date: 2026-11-09 19:40:00
summary: 文字在 Python 里叫“字符串”。本篇学习字符串的拼接、重复、长度、取出某个字、截取一段，常用的大小写转换与替换，文字和数字之间的转换，以及最好用的 f-string。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

前面我们已经用过很多次带引号的文字，比如 `"你好"`。在编程里，这种文字有一个专门的名字：**字符串**（英文 string，简写 `str`）。

为什么叫“字符串”？因为它就是把一个个字符（字、字母、数字、符号）像糖葫芦一样**串起来**：

```text
"你好呀"  →  你 - 好 - 呀
```

这一篇我们就来学习怎么处理文字。

## 一、创建字符串

用引号把文字括起来，就是一个字符串：

```python
greeting = "你好"
name = 'Alice'
empty = ""          # 空字符串：引号里什么都没有
```

### 引号里面还有引号怎么办？

如果文字本身包含双引号，外面就用单引号，反过来也一样：

```python
print('他说："今天真冷"')
print("It's a nice day")
```

```text
他说："今天真冷"
It's a nice day
```

### 换行：`\n`

在字符串里写 `\n`，显示时会变成**换行**（n 是 new line 的意思）：

```python
print("第一行\n第二行\n第三行")
```

```text
第一行
第二行
第三行
```

### 多行文字：三个引号

如果文字很长、有很多行，可以用三个引号 `"""` 把它括起来，里面怎么换行，显示时就怎么换行：

```python
poem = """床前明月光，
疑是地上霜。
举头望明月，
低头思故乡。"""
print(poem)
```

```text
床前明月光，
疑是地上霜。
举头望明月，
低头思故乡。
```

## 二、拼接和重复

### 用 `+` 把字符串连起来

```python
first = "张"
last = "三丰"
full = first + last
print(full)
print("你好，" + full + "！")
```

```text
张三丰
你好，张三丰！
```

注意和用逗号的区别：`+` 是**直接连在一起**，不加空格；`print` 里用逗号分隔，会自动加一个空格。

```python
print("Hello" + "World")
print("Hello", "World")
```

```text
HelloWorld
Hello World
```

### 用 `*` 重复字符串

字符串乘以一个整数，就是把它重复几遍：

```python
print("哈" * 5)
print("=" * 20)
```

```text
哈哈哈哈哈
====================
```

第二种写法很适合用来画分隔线。

## 三、文字和数字：最容易出错的地方

**`"18"` 和 `18` 是完全不同的两样东西！**

- `18` 是数字，可以拿来计算；
- `"18"` 是字符串，只是长得像数字的文字，就像写在纸上的“18”两个字。

看看它们做“加法”时的区别：

```python
print(18 + 2)
print("18" + "2")
```

```text
20
182
```

数字相加是计算，字符串相加是**拼接**。

那如果把数字和字符串加在一起呢？

<!-- raises -->
```python
age = 18
print("我今年" + age + "岁")
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print("我今年" + age + "岁")
          ~~~~~~~~^~~~~
TypeError: can only concatenate str (not "int") to str
```

报错了！`TypeError` 是“类型错误”，后面那句英文的意思是：“只能把字符串（str）和字符串拼接，不能和整数（int）拼接”。

Python 不知道你是想“计算”还是想“拼接”，所以干脆不让你这么做。

### 类型转换

解决办法是先把数据转换成同一种类型：

| 写法 | 作用 | 例子 | 结果 |
|---|---|---|---|
| `str(x)` | 转换成字符串 | `str(18)` | `"18"` |
| `int(x)` | 转换成整数 | `int("18")` | `18` |
| `float(x)` | 转换成小数 | `float("3.5")` | `3.5` |

```python
age = 18
print("我今年" + str(age) + "岁")

text = "100"
print(int(text) + 1)
```

```text
我今年18岁
101
```

> 下一篇学习 `input()` 时，你会经常用到 `int()`，因为用户在键盘上输入的内容，Python 拿到的永远是字符串。

## 四、f-string：最好用的拼接方法

用 `+` 拼接，要写一堆加号和引号，还得记得转换类型，很麻烦。Python 提供了一种更简单的方法，叫 **f-string**：

```python
name = "小明"
age = 18
print(f"我叫{name}，今年{age}岁")
```

```text
我叫小明，今年18岁
```

用法只有两步：

1. 在字符串的引号**前面**加一个字母 `f`；
2. 在字符串里用**大括号** `{}` 把变量名括起来，Python 会自动把它换成变量的值。

数字也不需要转换，Python 会自动处理。大括号里甚至可以写算式：

```python
price = 5
count = 3
print(f"单价{price}元，买{count}个，共{price * count}元")
```

```text
单价5元，买3个，共15元
```

### 控制小数位数

在大括号里的变量后面加上 `:.2f`，表示“保留 2 位小数”：

```python
pi = 3.1415926
print(f"圆周率约等于 {pi:.2f}")
print(f"圆周率约等于 {pi:.4f}")
```

```text
圆周率约等于 3.14
圆周率约等于 3.1416
```

`.2f` 中的 2 就是保留的位数，换成几就保留几位。这在显示金额时特别有用：

```python
total = 12.5
print(f"应付金额：{total:.2f} 元")
```

```text
应付金额：12.50 元
```

> 💡 **从现在开始，本系列显示带变量的文字时，主要使用 f-string。** 它是现在最推荐的写法。

## 五、字符串的长度

`len()` 可以数出字符串里有多少个字符（len 是 length 长度的缩写）：

```python
print(len("hello"))
print(len("你好世界"))
print(len("a b"))
print(len(""))
```

```text
5
4
3
0
```

注意空格也算一个字符，所以 `"a b"` 的长度是 3。

## 六、取出某一个字符：索引

字符串里的每个字符都有一个**编号**，叫做**索引**。重点来了：**编号是从 0 开始的！**

```text
字符串：  P   y   t   h   o   n
正着数：  0   1   2   3   4   5
倒着数： -6  -5  -4  -3  -2  -1
```

用 `字符串[编号]` 就能取出对应的字符：

```python
word = "Python"
print(word[0])
print(word[1])
print(word[5])
```

```text
P
y
n
```

**为什么从 0 开始？** 你可以把编号理解成“离开头有几步”：第一个字符就在开头，离开头 0 步，所以编号是 0。几乎所有编程语言都是这样，习惯就好。

### 倒着数：负数索引

想取最后一个字符，用 `-1`，倒数第二个用 `-2`：

```python
word = "Python"
print(word[-1])
print(word[-2])
```

```text
n
o
```

这样不管字符串多长，`[-1]` 永远是最后一个字符，非常方便。

## 七、截取一段：切片

想取出一段文字，用 `字符串[开始:结束]`，这叫**切片**：

```python
word = "Python"
print(word[0:2])
print(word[2:5])
```

```text
Py
tho
```

**切片包含开始位置，但不包含结束位置。** `word[0:2]` 取的是编号 0 和 1，不包括 2。

> 记忆方法：`[0:2]` 取出的字符个数正好是 2 - 0 = 2 个。

开始或结束可以省略：

- 省略开始：从头开始；
- 省略结束：一直取到最后。

```python
date = "2026-11-09"
year = date[:4]      # 从头取到编号 4（不含）
month = date[5:7]
day = date[8:]       # 从编号 8 取到最后
print(year)
print(month)
print(day)
```

```text
2026
11
09
```

## 八、常用的字符串操作

字符串自带很多实用的功能，写法是 `字符串.功能名()`，中间有个**点**。这种“属于某个数据的功能”叫做**方法**。

### 大小写转换

```python
text = "Hello Python"
print(text.upper())   # 全部大写
print(text.lower())   # 全部小写
```

```text
HELLO PYTHON
hello python
```

### 去掉两边的空格

用户输入时经常不小心多打空格，`strip()` 可以去掉字符串**两端**的空格：

```python
name = "   小明   "
print(f"[{name}]")
print(f"[{name.strip()}]")
```

```text
[   小明   ]
[小明]
```

（这里加方括号只是为了让你看清空格在哪。）

### 替换

`replace(旧, 新)` 把字符串里的某段文字换成另一段：

```python
sentence = "我喜欢苹果，苹果很好吃"
print(sentence.replace("苹果", "香蕉"))
```

```text
我喜欢香蕉，香蕉很好吃
```

### 判断是否包含：`in`

想知道一段文字里有没有某个词，用 `in`：

```python
email = "xiaoming@example.com"
print("@" in email)
print("#" in email)
```

```text
True
False
```

`True` 表示“是”，`False` 表示“否”。这两个词在第 6 篇学 `if` 时会大量用到。

### 字符串不会被修改

注意：这些方法**不会改变原来的字符串**，而是生成一个新的字符串：

```python
text = "hello"
text.upper()
print(text)
```

```text
hello
```

`text` 还是小写的。如果想保存结果，要把它赋值给变量：

```python
text = "hello"
text = text.upper()
print(text)
```

```text
HELLO
```

## 动手试试

写一个“名片生成器”：

```python
name = "王小明"
job = "数据分析师"
phone = "13800001234"

print("=" * 24)
print(f"  姓名：{name}")
print(f"  职位：{job}")
print(f"  电话：{phone[:3]}****{phone[-4:]}")
print("=" * 24)
```

```text
========================
  姓名：王小明
  职位：数据分析师
  电话：138****1234
========================
```

电话号码那一行用切片隐藏了中间四位：`phone[:3]` 是前 3 位，`phone[-4:]` 是最后 4 位。

## 新手常见错误

### 1. 引号没有配对

```text
print("你好)       ← 少了右边的引号
print("你好')      ← 左右引号不一样
```

### 2. 字符串和数字直接用 + 拼接

前面讲过了：要么用 `str()` 转换，要么**直接用 f-string**（推荐）。

### 3. 忘了写 f

```python
name = "小明"
print("你好，{name}")
```

```text
你好，{name}
```

少了 `f`，大括号就只是普通字符，原样显示了。

### 4. 索引超出范围

<!-- raises -->
```python
word = "abc"
print(word[3])
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(word[3])
          ~~~~^^^
IndexError: string index out of range
```

`"abc"` 只有 3 个字符，编号是 0、1、2，没有 3。`IndexError: string index out of range` 意思是“字符串索引超出范围”。记住：**最后一个字符的编号是长度减 1**。

## 小结

- 字符串就是文字，用引号括起来；`\n` 表示换行，三个引号可以写多行文字。
- `+` 拼接，`*` 重复，`len()` 求长度。
- `"18"` 是文字，`18` 是数字；用 `str()`、`int()`、`float()` 互相转换。
- **f-string**：`f"我叫{name}"`，最方便的拼接方法；`{x:.2f}` 保留两位小数。
- 索引从 **0** 开始，`[-1]` 是最后一个字符。
- 切片 `[开始:结束]` 包含开始、**不包含**结束。
- 常用方法：`upper()`、`lower()`、`strip()`、`replace()`；用 `in` 判断是否包含。

## 练习

**练习 1**：下面的代码会显示什么？

```python
s = "Hello, World"
print(s[0])
print(s[-1])
print(s[7:])
print(len(s))
```

<details>
<summary>点击查看答案</summary>

```text
H
d
World
12
```

注意逗号和空格也各算一个字符。

</details>

**练习 2**：有一个变量 `filename = "report.xlsx"`，用切片取出文件的后缀名 `xlsx`（不要直接数编号，试着用负数索引）。

<details>
<summary>点击查看答案</summary>

```python
filename = "report.xlsx"
print(filename[-4:])
```

```text
xlsx
```

以后学了更多知识，还有更通用的办法（比如用 `split(".")`），第 8 篇会讲到。

</details>

**练习 3**：用 f-string 写一个程序：商品名 `"笔记本"`，单价 `12.8`，数量 `3`，显示 `笔记本 × 3，总价 38.40 元`。

<details>
<summary>点击查看答案</summary>

```python
item = "笔记本"
price = 12.8
count = 3
print(f"{item} × {count}，总价 {price * count:.2f} 元")
```

```text
笔记本 × 3，总价 38.40 元
```

</details>

**练习 4**：下面的代码会显示什么？为什么？

```python
a = "5"
b = "3"
print(a + b)
print(int(a) + int(b))
```

<details>
<summary>点击查看答案</summary>

```text
53
8
```

`a` 和 `b` 都是字符串，相加是拼接，得到 `"53"`；转换成整数后再相加，才是计算，得到 8。

</details>

---

👈 {% post_link Python-Basics-03-Numbers '上一篇：数字和计算' %}　｜　👉 {% post_link Python-Basics-05-Input '下一篇：input，和用户对话' %}
