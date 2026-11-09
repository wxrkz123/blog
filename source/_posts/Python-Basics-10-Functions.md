---
title: Python 零基础入门（10）：函数，把代码打包
date: 2026-11-09 19:10:00
summary: 函数就是给一段代码起个名字，想用的时候喊一声名字就行。本篇学习如何定义和调用函数、用参数传入数据、用 return 交回结果、默认参数，以及函数里的变量为什么在外面用不了。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

我们其实已经用过很多函数了：`print()`、`input()`、`len()`、`int()`、`max()`……它们都是 Python **自带的函数**。

这一篇，我们来学习**自己写函数**。

## 一、为什么需要函数？

假设你的程序里有好几个地方需要显示一条分隔线和一句标题：

```python
print("=" * 20)
print("欢迎使用本系统")
print("=" * 20)

# ……中间很多其他代码……

print("=" * 20)
print("欢迎使用本系统")
print("=" * 20)
```

同样的三行写了两遍。如果要把 `=` 改成 `*`，就得改好几个地方，很容易漏。

**函数**可以把一段代码**打包起来，起一个名字**。以后想用这段代码，只要喊一声名字就行：

```python
def show_banner():
    print("=" * 20)
    print("欢迎使用本系统")
    print("=" * 20)

show_banner()
print("……中间很多其他代码……")
show_banner()
```

```text
====================
欢迎使用本系统
====================
……中间很多其他代码……
====================
欢迎使用本系统
====================
```

要修改分隔线，只需要改函数里的一处。

> 打个比方：函数就像**菜谱**。你写好一份“番茄炒蛋”的菜谱（定义函数），以后每次想吃，照着菜谱做就行（调用函数），不用每次都重新想步骤。

## 二、定义和调用函数

### 定义函数

```text
def 函数名():
    函数里的代码
```

- `def` 是 define（定义）的缩写；
- 函数名的起名规则和变量名一样，通常用**动词开头**，说明这个函数是干什么的，比如 `show_banner`、`calculate_total`；
- 后面的**小括号**和**冒号**都不能少；
- 函数里的代码要**缩进**。

### 调用函数

定义函数只是“写好菜谱”，并不会执行里面的代码。要执行，必须**调用**它：写函数名，再加上一对小括号。

```python
def say_hello():
    print("你好！")

print("准备调用函数")
say_hello()
say_hello()
print("调用结束")
```

```text
准备调用函数
你好！
你好！
调用结束
```

注意执行顺序：Python 从上往下读，读到 `def` 时只是记住了这个函数，并不执行。直到遇见 `say_hello()`，才跳进函数里执行，执行完再回来继续往下走。

## 三、参数：给函数传入数据

上面的 `say_hello` 只能对所有人说“你好”。如果想让它对不同的人打招呼呢？可以给函数加上**参数**：

```python
def greet(name):
    print(f"你好，{name}！")

greet("小明")
greet("小红")
```

```text
你好，小明！
你好，小红！
```

- 定义时括号里的 `name` 叫**参数**，相当于函数内部的一个变量，它的值由调用的人提供；
- 调用 `greet("小明")` 时，`"小明"` 就交给了 `name`。

> 回到菜谱的比方：参数就像菜谱里的“原料”。同一份“炒蛋”菜谱，放番茄就是番茄炒蛋，放韭菜就是韭菜炒蛋。

### 多个参数

参数可以有多个，用逗号隔开。调用时按**顺序**一一对应：

```python
def introduce(name, age, city):
    print(f"我叫{name}，今年{age}岁，来自{city}")

introduce("小明", 18, "北京")
introduce("小红", 20, "上海")
```

```text
我叫小明，今年18岁，来自北京
我叫小红，今年20岁，来自上海
```

如果怕记错顺序，也可以在调用时写明参数名，这样顺序就无所谓了：

```python
def introduce(name, age, city):
    print(f"我叫{name}，今年{age}岁，来自{city}")

introduce(city="广州", name="小刚", age=19)
```

```text
我叫小刚，今年19岁，来自广州
```

### 默认参数

可以给参数一个**默认值**。调用时如果不提供这个参数，就使用默认值：

```python
def greet(name, greeting="你好"):
    print(f"{greeting}，{name}！")

greet("小明")
greet("小红", "早上好")
```

```text
你好，小明！
早上好，小红！
```

我们早就用过默认参数了：`print()` 的 `end` 参数默认是换行，所以平时 print 完会自动换行；上一篇的 `sorted(..., reverse=True)` 也是。

注意：有默认值的参数必须放在**没有**默认值的参数**后面**。

## 四、return：把结果交回来

到目前为止，我们的函数都是自己 print 出结果。但很多时候，我们希望函数**算出一个结果，交还给调用它的地方**，让调用者决定怎么用。这就要用 `return`（英文“返回”）：

```python
def add(a, b):
    return a + b

result = add(3, 5)
print(result)
print(add(10, 20) * 2)
```

```text
8
60
```

`return a + b` 的意思是：算出 `a + b`，**把结果交出去**。调用 `add(3, 5)` 的地方，就会变成这个结果 `8`。

就像 `len("hello")` 会变成 `5`、`int("18")` 会变成 `18` 一样，现在我们自己的函数也能做到了。

### return 和 print 的区别

这是初学者最容易混淆的地方：

```python
def add_print(a, b):
    print(a + b)       # 只是显示出来

def add_return(a, b):
    return a + b       # 把结果交回去

x = add_print(3, 5)
y = add_return(3, 5)
print("x =", x)
print("y =", y)
```

```text
8
x = None
y = 8
```

- `add_print` 把 8 **显示在屏幕上**，但没有交回任何东西，所以 `x` 得到的是 `None`（什么都没有）；
- `add_return` 没有显示任何东西，但把 8 **交了回来**，存进了 `y`。

> 打个比方：你请朋友帮忙算账。`print` 是他把结果**念出来**，念完就没了；`return` 是他把结果**写在纸上递给你**，你可以拿着这张纸继续用。

**一般来说，计算类的函数应该用 return**，这样结果可以继续用于别的计算，比如：

```python
def circle_area(r):
    return 3.14159 * r ** 2

total = circle_area(1) + circle_area(2)
print(f"两个圆的面积之和：{total:.2f}")
```

```text
两个圆的面积之和：15.71
```

### return 会立即结束函数

函数执行到 `return` 就会**立刻结束**，后面的代码不会执行。利用这一点，可以在 if 里提前返回：

```python
def grade(score):
    if score >= 90:
        return "优秀"
    if score >= 60:
        return "及格"
    return "不及格"

print(grade(95))
print(grade(72))
print(grade(40))
```

```text
优秀
及格
不及格
```

## 五、函数里的变量

在函数**里面**创建的变量（包括参数），只在函数里面有效，函数外面是用不了的：

<!-- raises -->
```python
def make_tea():
    hot_water = "热水"
    print(f"用{hot_water}泡茶")

make_tea()
print(hot_water)
```

```text
用热水泡茶
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 6, in <module>
    print(hot_water)
          ^^^^^^^^^
NameError: name 'hot_water' is not defined
```

`hot_water` 是在函数里创建的，函数执行完，它就消失了。这样的变量叫做**局部变量**。

> 就像厨房里用的锅碗瓢盆，做完菜就收起来了，客厅里是看不到的。

这其实是件好事：不同函数里可以放心使用同名的变量，互不干扰。**如果想把函数里的结果拿到外面用，就用 `return`。**

## 六、函数调用函数

函数里面可以调用其他函数。把大问题拆成几个小函数，每个函数只做一件事，程序就会清晰很多：

```python
def get_average(numbers):
    return sum(numbers) / len(numbers)

def get_grade(score):
    if score >= 90:
        return "优秀"
    elif score >= 60:
        return "及格"
    else:
        return "不及格"

def report(name, scores):
    avg = get_average(scores)
    print(f"{name}：平均分 {avg:.1f}，{get_grade(avg)}")

report("小明", [88, 92, 95])
report("小红", [70, 65, 58])
report("小刚", [50, 45, 60])
```

```text
小明：平均分 91.7，优秀
小红：平均分 64.3，及格
小刚：平均分 51.7，不及格
```

可以看到，函数的参数也可以是列表。

## 七、给函数写说明

在函数的第一行写一段用三个引号括起来的文字，说明这个函数是做什么的，这叫**文档字符串**：

```python
def bmi(weight, height):
    """根据体重（千克）和身高（米）计算 BMI。"""
    return weight / height ** 2

print(f"{bmi(68, 1.75):.1f}")
```

```text
22.2
```

养成写说明的好习惯，过段时间回来看代码，或者别人用你的函数时，就能很快知道它是干什么的。

## 动手试试：温度转换器

```python
def c_to_f(c):
    """摄氏度转华氏度"""
    return c * 9 / 5 + 32

def f_to_c(f):
    """华氏度转摄氏度"""
    return (f - 32) * 5 / 9

print(f"100°C = {c_to_f(100):.1f}°F")
print(f"37°C = {c_to_f(37):.1f}°F")
print(f"98.6°F = {f_to_c(98.6):.1f}°C")

print("摄氏度  华氏度")
for c in range(0, 101, 20):
    print(f"{c:>5}  {c_to_f(c):>6.1f}")
```

```text
100°C = 212.0°F
37°C = 98.6°F
98.6°F = 37.0°C
摄氏度  华氏度
    0    32.0
   20    68.0
   40   104.0
   60   140.0
   80   176.0
  100   212.0
```

f-string 里的 `:>5` 表示“占 5 个字符的宽度，靠右对齐”，`:>6.1f` 表示“占 6 个字符的宽度、靠右对齐、保留 1 位小数”。用它们可以让表格对得整整齐齐。

## 新手常见错误

### 1. 定义了函数但没有调用

```python
def say_hello():
    print("你好")
```

运行后什么都没有显示。定义函数只是“写菜谱”，还要写 `say_hello()` 去调用它。

### 2. 调用时忘了括号

```python
def say_hello():
    print("你好")

say_hello
```

只写函数名不加括号，函数不会执行。**调用函数一定要加括号**，哪怕括号里什么都没有。

### 3. 先调用，后定义

<!-- raises -->
```python
say_hello()

def say_hello():
    print("你好")
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1, in <module>
    say_hello()
    ^^^^^^^^^
NameError: name 'say_hello' is not defined
```

程序从上往下执行，调用时函数还没定义。**函数要先定义，再调用**，通常把所有函数写在文件的最上面。

### 4. 参数个数不对

<!-- raises -->
```python
def add(a, b):
    return a + b

print(add(1))
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 4, in <module>
    print(add(1))
          ~~~^^^
TypeError: add() missing 1 required positional argument: 'b'
```

`missing 1 required positional argument: 'b'` 意思是“缺少 1 个必需的参数 b”。函数要两个参数，只给了一个。

### 5. 用了 print 却以为是 return

<!-- raises -->
```python
def double(n):
    print(n * 2)

result = double(5)
print(result + 1)
```

运行时会先显示 `10`，然后报错 `TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'`。因为函数没有 return，`result` 是 `None`，`None` 不能和数字相加。把 `print(n * 2)` 改成 `return n * 2` 就好了。

## 小结

- 函数是**打包好、有名字的一段代码**，定义一次，可以调用很多次。
- 定义：`def 函数名(参数):`，里面的代码要缩进；调用：`函数名(参数)`，**一定要加括号**。
- **参数**是传给函数的数据；可以有多个参数，可以设置默认值，调用时可以写明参数名。
- **return** 把结果交回给调用的地方，并立即结束函数；没有 return 的函数返回 `None`。
- **print 是显示，return 是交回**，计算类的函数应该用 return。
- 函数里的变量是局部变量，在函数外面用不了。
- 把大问题拆成多个小函数，每个函数只做一件事。

## 练习

**练习 1**：写一个函数 `is_even(n)`，如果 n 是偶数返回 `True`，否则返回 `False`。

<details>
<summary>点击查看答案</summary>

```python
def is_even(n):
    return n % 2 == 0

print(is_even(4))
print(is_even(7))
```

```text
True
False
```

`n % 2 == 0` 本身就是 True 或 False，所以可以直接 return，不用写 if。

</details>

**练习 2**：写一个函数 `max_of_three(a, b, c)`，返回三个数中最大的那个（不要用 `max()`）。

<details>
<summary>点击查看答案</summary>

```python
def max_of_three(a, b, c):
    biggest = a
    if b > biggest:
        biggest = b
    if c > biggest:
        biggest = c
    return biggest

print(max_of_three(3, 9, 5))
print(max_of_three(10, 2, 7))
```

```text
9
10
```

</details>

**练习 3**：写一个函数 `count_vowels(text)`，统计一个英文字符串里元音字母（a、e、i、o、u）的个数。

<details>
<summary>点击查看答案</summary>

```python
def count_vowels(text):
    count = 0
    for ch in text.lower():
        if ch in "aeiou":
            count += 1
    return count

print(count_vowels("Hello World"))
print(count_vowels("Python Programming"))
```

```text
3
4
```

`text.lower()` 先把字母都变成小写，这样大写的元音也能统计到。`ch in "aeiou"` 判断这个字母是否在字符串 `"aeiou"` 里。

</details>

**练习 4**：下面的代码会显示什么？

```python
def f(x, y=10):
    return x + y

print(f(1))
print(f(1, 2))
print(f(y=5, x=3))
```

<details>
<summary>点击查看答案</summary>

```text
11
3
8
```

</details>

---

👈 {% post_link Python-Basics-09-Dicts '上一篇：字典，按名字查东西' %}　｜　👉 {% post_link Python-Basics-11-Errors '下一篇：看懂报错信息' %}
