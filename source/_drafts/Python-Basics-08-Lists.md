---
title: Python 零基础入门（08）：列表，一次存很多东西
date: 2026-11-09 19:20:00
summary: 一个变量只能存一个数据，列表可以存一整组。本篇学习列表的创建、按编号取值和修改、添加和删除元素、用 for 循环逐个处理，以及求和、排序、拆分文字等常用操作。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

假设你要记录全班 5 个同学的成绩，按目前学过的知识，只能这样写：

```python
score1 = 85
score2 = 92
score3 = 78
score4 = 90
score5 = 66
```

如果全班有 50 个人呢？写 50 个变量吗？要算平均分时，把 50 个变量加起来吗？

这时候就需要**列表**（list）了。

## 一、创建列表

列表用**方括号** `[]` 把多个数据括起来，数据之间用**逗号**隔开：

```python
scores = [85, 92, 78, 90, 66]
print(scores)
```

```text
[85, 92, 78, 90, 66]
```

一个变量 `scores`，就装下了 5 个成绩。你可以把列表想象成一排**带编号的储物柜**，每个柜子里放一样东西。列表里的每个数据叫做一个**元素**。

列表里可以放任何类型的数据：

```python
fruits = ["苹果", "香蕉", "橘子"]
prices = [3.5, 2.0, 4.8]
mixed = ["小明", 18, 1.75]     # 不同类型也可以放在一起
empty = []                     # 空列表

print(fruits)
print(len(fruits))
print(len(empty))
```

```text
['苹果', '香蕉', '橘子']
3
0
```

和字符串一样，`len()` 可以求出列表里有几个元素。

> 显示列表时，Python 会给字符串加上单引号，这只是显示方式，不用在意。

## 二、按编号取出元素

列表的编号（索引）和字符串完全一样：**从 0 开始**，`-1` 表示最后一个。

```text
fruits = ["苹果", "香蕉", "橘子", "葡萄"]
正着数：     0       1       2       3
倒着数：    -4      -3      -2      -1
```

```python
fruits = ["苹果", "香蕉", "橘子", "葡萄"]
print(fruits[0])
print(fruits[2])
print(fruits[-1])
```

```text
苹果
橘子
葡萄
```

切片也和字符串一样，**包括开始，不包括结束**：

```python
fruits = ["苹果", "香蕉", "橘子", "葡萄"]
print(fruits[1:3])
print(fruits[:2])
```

```text
['香蕉', '橘子']
['苹果', '香蕉']
```

## 三、修改元素

和字符串不同，**列表里的元素可以修改**。直接给某个编号赋新值就行：

```python
fruits = ["苹果", "香蕉", "橘子"]
fruits[1] = "西瓜"
print(fruits)
```

```text
['苹果', '西瓜', '橘子']
```

编号为 1 的“香蕉”被换成了“西瓜”。

## 四、添加元素

### append：加到最后面

`append`（英文“追加”）是最常用的添加方法：

```python
shopping = ["牛奶", "面包"]
shopping.append("鸡蛋")
shopping.append("苹果")
print(shopping)
```

```text
['牛奶', '面包', '鸡蛋', '苹果']
```

很多时候，我们会先创建一个**空列表**，然后在循环里一个一个地往里加：

<!-- stdin: 牛奶 | 面包 | 鸡蛋 | 完成 -->
```python
shopping = []
while True:
    item = input("要买什么？（输入“完成”结束）")
    if item == "完成":
        break
    shopping.append(item)

print(f"购物清单：{shopping}")
print(f"一共 {len(shopping)} 样东西")
```

```text
要买什么？（输入“完成”结束）牛奶
要买什么？（输入“完成”结束）面包
要买什么？（输入“完成”结束）鸡蛋
要买什么？（输入“完成”结束）完成
购物清单：['牛奶', '面包', '鸡蛋']
一共 3 样东西
```

### insert：插到指定位置

`insert(位置, 元素)` 把元素插入到指定编号的位置，后面的元素依次往后挪：

```python
queue = ["小明", "小红", "小刚"]
queue.insert(1, "小李")     # 小李插队到编号 1 的位置
print(queue)
```

```text
['小明', '小李', '小红', '小刚']
```

## 五、删除元素

### remove：按内容删除

```python
fruits = ["苹果", "香蕉", "橘子", "香蕉"]
fruits.remove("香蕉")
print(fruits)
```

```text
['苹果', '橘子', '香蕉']
```

注意：`remove` 只删除**第一个**找到的元素。列表里有两个“香蕉”，只删掉了前面那个。

### pop：按编号删除，并把它交出来

```python
fruits = ["苹果", "香蕉", "橘子"]
last = fruits.pop()       # 不写编号，就删除最后一个
print(last)
print(fruits)

first = fruits.pop(0)     # 删除编号 0 的元素
print(first)
print(fruits)
```

```text
橘子
['苹果', '香蕉']
苹果
['香蕉']
```

`pop` 的特别之处在于：它删除元素的同时，还会把这个元素**交给你**，你可以把它存进变量继续使用。

## 六、判断元素是否在列表里

和字符串一样，用 `in`：

```python
fruits = ["苹果", "香蕉", "橘子"]
print("香蕉" in fruits)
print("西瓜" in fruits)

if "西瓜" not in fruits:
    print("没有西瓜")
```

```text
True
False
没有西瓜
```

`not in` 表示“不在里面”。删除元素前先用 `in` 检查一下，可以避免出错（后面“常见错误”会讲到）。

## 七、用 for 循环处理列表（最重要）

上一篇学过用 `for` 遍历字符串，`for` 同样可以**一个一个地取出列表里的元素**：

```python
fruits = ["苹果", "香蕉", "橘子"]
for fruit in fruits:
    print(f"我喜欢吃{fruit}")
```

```text
我喜欢吃苹果
我喜欢吃香蕉
我喜欢吃橘子
```

每次循环，`fruit` 就依次变成列表里的一个元素。**列表 + for 循环**是编程中最常用的组合，没有之一。

### 例子：计算平均分、找出最高分

```python
scores = [85, 92, 78, 90, 66]

total = 0
for s in scores:
    total += s
average = total / len(scores)

print(f"总分：{total}")
print(f"平均分：{average:.1f}")
```

```text
总分：411
平均分：82.2
```

其实 Python 已经准备好了现成的工具：

```python
scores = [85, 92, 78, 90, 66]
print(f"总分：{sum(scores)}")
print(f"最高分：{max(scores)}")
print(f"最低分：{min(scores)}")
print(f"平均分：{sum(scores) / len(scores):.1f}")
```

```text
总分：411
最高分：92
最低分：66
平均分：82.2
```

| 写法 | 作用 |
|---|---|
| `sum(列表)` | 求和（元素必须是数字） |
| `max(列表)` | 最大值 |
| `min(列表)` | 最小值 |
| `len(列表)` | 元素个数 |

### 例子：筛选出符合条件的元素

找出所有及格的成绩，放进一个新列表：

```python
scores = [85, 52, 78, 90, 46, 66]
passed = []
for s in scores:
    if s >= 60:
        passed.append(s)
print(f"及格的成绩：{passed}")
print(f"及格人数：{len(passed)}")
```

```text
及格的成绩：[85, 78, 90, 66]
及格人数：4
```

这种“**准备空列表 → 循环 → 符合条件就 append**”的写法，你以后会用到无数次。

### 同时需要编号和元素：enumerate

如果循环时既想要元素，又想知道它是第几个，可以用 `enumerate`：

```python
names = ["小明", "小红", "小刚"]
for i, name in enumerate(names, start=1):
    print(f"第 {i} 名：{name}")
```

```text
第 1 名：小明
第 2 名：小红
第 3 名：小刚
```

`enumerate(列表, start=1)` 会让编号从 1 开始。这样每次循环，`i` 是编号，`name` 是元素。

## 八、排序

### sort：把列表本身排好序

```python
numbers = [5, 2, 9, 1, 7]
numbers.sort()
print(numbers)

numbers.sort(reverse=True)    # 从大到小
print(numbers)
```

```text
[1, 2, 5, 7, 9]
[9, 7, 5, 2, 1]
```

`reverse=True` 表示倒序，也就是从大到小。

### sorted：得到一个排好序的新列表，原列表不变

```python
numbers = [5, 2, 9, 1, 7]
new_numbers = sorted(numbers)
print(new_numbers)
print(numbers)
```

```text
[1, 2, 5, 7, 9]
[5, 2, 9, 1, 7]
```

| | `列表.sort()` | `sorted(列表)` |
|---|---|---|
| 原列表 | 被改变 | 不变 |
| 用法 | 单独一行 `nums.sort()` | 把结果存进变量 `new = sorted(nums)` |

## 九、字符串和列表互相转换

### split：把字符串拆成列表

`split`（英文“拆分”）按指定的符号把字符串切开：

```python
text = "苹果,香蕉,橘子"
fruits = text.split(",")
print(fruits)

sentence = "I love Python"
words = sentence.split()      # 不写参数，就按空格拆分
print(words)
print(len(words))
```

```text
['苹果', '香蕉', '橘子']
['I', 'love', 'Python']
3
```

这在处理用户输入时特别有用，比如让用户一次输入多个数字：

<!-- stdin: 85 92 78 -->
```python
text = input("请输入几个成绩，用空格隔开：")
scores = []
for part in text.split():
    scores.append(int(part))
print(f"平均分是 {sum(scores) / len(scores):.1f}")
```

```text
请输入几个成绩，用空格隔开：85 92 78
平均分是 85.0
```

注意 split 拆出来的每一段还是**字符串**，要用 `int()` 转换后才能计算。

### join：把列表连成字符串

`join` 和 `split` 正好相反，写法有点特别：`"连接符".join(列表)`：

```python
fruits = ["苹果", "香蕉", "橘子"]
print("、".join(fruits))
print(" -> ".join(fruits))
```

```text
苹果、香蕉、橘子
苹果 -> 香蕉 -> 橘子
```

## 动手试试：成绩统计小程序

<!-- stdin: 小明 | 88 | 小红 | 95 | 小刚 | 59 | 完成 -->
```python
names = []
scores = []

while True:
    name = input("学生姓名（输入“完成”结束）：")
    if name == "完成":
        break
    score = int(input(f"{name}的成绩："))
    names.append(name)
    scores.append(score)

print()
print("====== 成绩单 ======")
for i in range(len(names)):
    if scores[i] >= 60:
        result = "及格"
    else:
        result = "不及格"
    print(f"{names[i]}：{scores[i]} 分（{result}）")
print("====================")
print(f"平均分：{sum(scores) / len(scores):.1f}")
print(f"最高分：{max(scores)}")
```

```text
学生姓名（输入“完成”结束）：小明
小明的成绩：88
学生姓名（输入“完成”结束）：小红
小红的成绩：95
学生姓名（输入“完成”结束）：小刚
小刚的成绩：59
学生姓名（输入“完成”结束）：完成

====== 成绩单 ======
小明：88 分（及格）
小红：95 分（及格）
小刚：59 分（不及格）
====================
平均分：80.7
最高分：95
```

这里用了两个列表，`names[i]` 和 `scores[i]` 是同一个学生的姓名和成绩。用 `range(len(names))` 产生编号 0、1、2，再用编号同时去两个列表里取值。

这种“两个列表靠编号对应”的写法有点别扭，而且容易出错。下一篇学了**字典**，就有更好的办法了。

## 新手常见错误

### 1. 编号超出范围

<!-- raises -->
```python
fruits = ["苹果", "香蕉", "橘子"]
print(fruits[3])
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(fruits[3])
          ~~~~~~^^^
IndexError: list index out of range
```

3 个元素的编号是 0、1、2。**最后一个元素的编号是长度减 1**，或者直接用 `[-1]`。

### 2. 删除不存在的元素

<!-- raises -->
```python
fruits = ["苹果", "香蕉"]
fruits.remove("西瓜")
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    fruits.remove("西瓜")
    ~~~~~~~~~~~~~^^^^^^^^
ValueError: list.remove(x): x not in list
```

意思是“要删除的东西不在列表里”。删除前可以先用 `if "西瓜" in fruits:` 检查一下。

### 3. 把 sort() 的结果赋值给变量

```python
numbers = [3, 1, 2]
result = numbers.sort()
print(result)
```

```text
None
```

`sort()` 是直接把原列表排好序，它本身不交出任何东西。`None` 是 Python 里表示“什么都没有”的特殊值。想得到新列表，要用 `sorted(numbers)`；或者先 `numbers.sort()`，再使用 `numbers`。

### 4. append 一次加多个

```text
fruits.append("苹果", "香蕉")    ← 错误：append 一次只能加一个
```

要加多个，就调用多次 `append`，或者用 `fruits.extend(["苹果", "香蕉"])`。

## 小结

- 列表用方括号 `[]` 创建，元素之间用逗号隔开，可以存任意多个数据。
- 编号从 0 开始，`[-1]` 是最后一个；切片 `[开始:结束]` 不包括结束。
- **列表可以修改**：`列表[编号] = 新值`。
- 添加：`append()` 加到最后，`insert()` 插到指定位置。
- 删除：`remove()` 按内容删，`pop()` 按编号删并交出被删的元素。
- `in` / `not in` 判断元素在不在列表里。
- **`for 元素 in 列表:`** 逐个处理元素，是最常用的写法。
- `sum()`、`max()`、`min()`、`len()`；`sort()` 改变原列表，`sorted()` 返回新列表。
- `split()` 把字符串拆成列表，`join()` 把列表连成字符串。

## 练习

**练习 1**：有一个列表 `nums = [3, 8, 1, 9, 4]`，不用 `max()`，自己用 for 循环找出最大值。

<details>
<summary>点击查看答案</summary>

```python
nums = [3, 8, 1, 9, 4]
biggest = nums[0]          # 先假设第一个最大
for n in nums:
    if n > biggest:
        biggest = n        # 发现更大的，就换成它
print(biggest)
```

```text
9
```

这就是 `max()` 内部的工作原理。

</details>

**练习 2**：有一个列表 `words = ["apple", "banana", "kiwi", "cherry", "fig"]`，找出所有长度大于 4 的单词，放进新列表并显示。

<details>
<summary>点击查看答案</summary>

```python
words = ["apple", "banana", "kiwi", "cherry", "fig"]
long_words = []
for w in words:
    if len(w) > 4:
        long_words.append(w)
print(long_words)
```

```text
['apple', 'banana', 'cherry']
```

</details>

**练习 3**：下面的代码会显示什么？

```python
a = [1, 2, 3]
a.append(4)
a[0] = 10
a.pop(1)
print(a)
```

<details>
<summary>点击查看答案</summary>

```text
[10, 3, 4]
```

一步一步看：`[1, 2, 3]` → append 后 `[1, 2, 3, 4]` → 修改编号 0 后 `[10, 2, 3, 4]` → 删除编号 1 的元素（2）后 `[10, 3, 4]`。

</details>

**练习 4**：让用户输入一句英文，统计里面有几个单词，并把单词按字母顺序排序后显示。

<details>
<summary>点击查看答案</summary>

<!-- stdin: the quick brown fox jumps -->
```python
sentence = input("请输入一句英文：")
words = sentence.split()
print(f"一共有 {len(words)} 个单词")
words.sort()
print(" ".join(words))
```

```text
请输入一句英文：the quick brown fox jumps
一共有 5 个单词
brown fox jumps quick the
```

</details>

---

👈 {% post_link Python-Basics-07-Loops '上一篇：循环，让程序重复做事' %}　｜　👉 {% post_link Python-Basics-09-Dicts '下一篇：字典，按名字查东西' %}
