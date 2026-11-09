---
title: Python 零基础入门（09）：字典，按名字查东西
date: 2026-11-09 19:15:00
summary: 字典像一本通讯录，通过“名字”直接查到“内容”。本篇学习字典的创建、查询、添加、修改、删除和遍历，并用它做通讯录、统计词频和管理学生信息。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

上一篇结尾，我们用两个列表分别存学生的姓名和成绩，靠编号把它们对应起来。这种做法很别扭：想查“小红考了多少分”，得先找到小红在第几个，再用这个编号去另一个列表里取成绩。

生活中我们查东西可不是这样的。查字典时，你是直接翻到那个字；查通讯录时，你是直接找那个人的名字。

Python 的**字典**（dict）就是这样一种数据：**通过“名字”直接查到“内容”。**

## 一、创建字典

字典用**大括号** `{}` 创建，里面是一对一对的数据，每一对写成 `名字: 内容`，对与对之间用逗号隔开：

```python
scores = {"小明": 88, "小红": 95, "小刚": 59}
print(scores)
```

```text
{'小明': 88, '小红': 95, '小刚': 59}
```

每一对数据中：

- 冒号**左边**的叫做**键**（key），相当于“名字”或“标签”；
- 冒号**右边**的叫做**值**（value），相当于“内容”。

这一对合起来叫做一个**键值对**。上面的字典有 3 个键值对。

元素较多时，可以分行写，更清楚：

```python
person = {
    "name": "王小明",
    "age": 18,
    "city": "上海",
}
print(person)
```

```text
{'name': '王小明', 'age': 18, 'city': '上海'}
```

最后一个键值对后面的逗号可写可不写，写上的话以后添加新的一行更方便。

## 二、查询：通过键找值

用 `字典[键]` 就能取出对应的值。和列表的区别是：方括号里写的是**键**，而不是编号：

```python
scores = {"小明": 88, "小红": 95, "小刚": 59}
print(scores["小红"])
print(scores["小刚"])
```

```text
95
59
```

想查小红的成绩，直接 `scores["小红"]`，不用管她排在第几个。

### 键不存在会怎样？

<!-- raises -->
```python
scores = {"小明": 88, "小红": 95}
print(scores["小李"])
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(scores["小李"])
          ~~~~~~^^^^^^
KeyError: '小李'
```

`KeyError` 是“键错误”，意思是字典里没有 `'小李'` 这个键。

有两种办法可以避免这个错误。

**办法一：先用 `in` 检查键是否存在**

```python
scores = {"小明": 88, "小红": 95}
name = "小李"
if name in scores:
    print(scores[name])
else:
    print(f"没有{name}的成绩")
```

```text
没有小李的成绩
```

注意：对字典用 `in`，检查的是**键**，不是值。

**办法二：用 `get()` 方法**

```python
scores = {"小明": 88, "小红": 95}
print(scores.get("小明"))
print(scores.get("小李"))
print(scores.get("小李", 0))
```

```text
88
None
0
```

`get(键)` 在键不存在时不会报错，而是返回 `None`（表示“什么都没有”）。`get(键, 默认值)` 在键不存在时返回你指定的默认值。

## 三、添加和修改

添加和修改的写法**一模一样**：`字典[键] = 值`。

- 如果键**不存在**，就是添加新的键值对；
- 如果键**已经存在**，就是修改它的值。

```python
scores = {"小明": 88, "小红": 95}

scores["小刚"] = 59      # 小刚不存在，添加
print(scores)

scores["小明"] = 92      # 小明已存在，修改
print(scores)
```

```text
{'小明': 88, '小红': 95, '小刚': 59}
{'小明': 92, '小红': 95, '小刚': 59}
```

> ⚠️ 字典里的**键不能重复**。一个键只能对应一个值，再次赋值会覆盖原来的值。就像通讯录里不能有两个完全同名的联系人。

## 四、删除

```python
scores = {"小明": 88, "小红": 95, "小刚": 59}

del scores["小刚"]
print(scores)

score = scores.pop("小明")    # 删除并交出被删的值
print(score)
print(scores)
```

```text
{'小明': 88, '小红': 95}
88
{'小红': 95}
```

- `del 字典[键]`：删除这个键值对；
- `字典.pop(键)`：删除这个键值对，并把它的值交给你。

## 五、遍历字典

### 遍历所有的键值对：items()

最常用的是 `items()`，它可以同时取出键和值：

```python
scores = {"小明": 88, "小红": 95, "小刚": 59}
for name, score in scores.items():
    print(f"{name}：{score} 分")
```

```text
小明：88 分
小红：95 分
小刚：59 分
```

`for name, score in ...` 每次循环取出一对，键放进 `name`，值放进 `score`。

### 只要键或只要值

```python
scores = {"小明": 88, "小红": 95, "小刚": 59}

for name in scores:           # 直接遍历字典，得到的是键
    print(name)

print(list(scores.values()))  # 所有的值
print(sum(scores.values()))   # 值可以直接求和
```

```text
小明
小红
小刚
[88, 95, 59]
242
```

| 写法 | 得到 |
|---|---|
| `for k in 字典:` | 每个键 |
| `for v in 字典.values():` | 每个值 |
| `for k, v in 字典.items():` | 每一对键和值 |
| `len(字典)` | 键值对的个数 |

> 字典会记住键值对**添加的先后顺序**，遍历时就按这个顺序。

## 六、字典的经典用法：计数

统计一句话里每个字出现了几次，这是字典最经典的用法之一：

```python
text = "我爱北京我爱上海我爱广州"
counts = {}
for char in text:
    if char in counts:
        counts[char] += 1      # 已经见过这个字，次数加 1
    else:
        counts[char] = 1       # 第一次见到，次数设为 1
print(counts)
```

```text
{'我': 3, '爱': 3, '北': 1, '京': 1, '上': 1, '海': 1, '广': 1, '州': 1}
```

用前面学的 `get()` 可以写得更简短：

```python
text = "我爱北京我爱上海我爱广州"
counts = {}
for char in text:
    counts[char] = counts.get(char, 0) + 1
print(counts)
```

```text
{'我': 3, '爱': 3, '北': 1, '京': 1, '上': 1, '海': 1, '广': 1, '州': 1}
```

`counts.get(char, 0)` 的意思是：查一下这个字已经出现了几次，没出现过就当作 0 次。然后加 1，再存回去。

同样的方法可以统计投票结果：

```python
votes = ["张三", "李四", "张三", "王五", "张三", "李四"]
result = {}
for name in votes:
    result[name] = result.get(name, 0) + 1

for name, count in result.items():
    print(f"{name}：{count} 票")
```

```text
张三：3 票
李四：2 票
王五：1 票
```

## 七、列表和字典组合使用

真实的数据往往是**列表里装着字典**。比如一个班的学生信息，每个学生是一个字典，所有学生放在一个列表里：

```python
students = [
    {"name": "小明", "age": 18, "score": 88},
    {"name": "小红", "age": 17, "score": 95},
    {"name": "小刚", "age": 18, "score": 59},
]

for s in students:
    print(f"{s['name']}，{s['age']} 岁，成绩 {s['score']}")
```

```text
小明，18 岁，成绩 88
小红，17 岁，成绩 95
小刚，18 岁，成绩 59
```

注意 f-string 里取字典的值时，外面用了双引号，里面的键就要用**单引号** `s['name']`，避免引号冲突。

再找出成绩最好的学生：

```python
students = [
    {"name": "小明", "score": 88},
    {"name": "小红", "score": 95},
    {"name": "小刚", "score": 59},
]

best = students[0]
for s in students:
    if s["score"] > best["score"]:
        best = s
print(f"第一名是{best['name']}，{best['score']} 分")
```

```text
第一名是小红，95 分
```

字典里的值也可以是列表：

```python
person = {
    "name": "小明",
    "hobbies": ["篮球", "游泳", "编程"],
}
print(f"{person['name']}有 {len(person['hobbies'])} 个爱好")
for h in person["hobbies"]:
    print("-", h)
```

```text
小明有 3 个爱好
- 篮球
- 游泳
- 编程
```

## 动手试试：简易通讯录

<!-- stdin: 1 | 小明 | 13800001111 | 1 | 小红 | 13900002222 | 2 | 小红 | 3 | 4 -->
```python
contacts = {}

while True:
    print()
    print("1. 添加联系人  2. 查找联系人  3. 显示全部  4. 退出")
    choice = input("请选择：")

    if choice == "1":
        name = input("姓名：")
        phone = input("电话：")
        contacts[name] = phone
        print(f"已保存 {name}")
    elif choice == "2":
        name = input("要查找的姓名：")
        if name in contacts:
            print(f"{name} 的电话是 {contacts[name]}")
        else:
            print("找不到这个人")
    elif choice == "3":
        print(f"共有 {len(contacts)} 位联系人：")
        for name, phone in contacts.items():
            print(f"  {name}：{phone}")
    elif choice == "4":
        print("再见！")
        break
    else:
        print("请输入 1 到 4")
```

```text

1. 添加联系人  2. 查找联系人  3. 显示全部  4. 退出
请选择：1
姓名：小明
电话：13800001111
已保存 小明

1. 添加联系人  2. 查找联系人  3. 显示全部  4. 退出
请选择：1
姓名：小红
电话：13900002222
已保存 小红

1. 添加联系人  2. 查找联系人  3. 显示全部  4. 退出
请选择：2
要查找的姓名：小红
小红 的电话是 13900002222

1. 添加联系人  2. 查找联系人  3. 显示全部  4. 退出
请选择：3
共有 2 位联系人：
  小明：13800001111
  小红：13900002222

1. 添加联系人  2. 查找联系人  3. 显示全部  4. 退出
请选择：4
再见！
```

注意电话号码我们存的是字符串（没有用 `int()`），因为电话号码不需要计算，而且有的号码以 0 开头，转成数字会丢掉开头的 0。

这个通讯录有个缺点：程序一关，数据就没了。第 12 篇学了文件读写，我们就能把数据保存下来。

## 新手常见错误

### 1. 查询不存在的键

`KeyError` 是使用字典时最常见的错误。不确定键是否存在时，用 `in` 先检查，或者用 `get()`。

### 2. 用编号去取字典的值

<!-- raises -->
```python
scores = {"小明": 88, "小红": 95}
print(scores[0])
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(scores[0])
          ~~~~~~^^^
KeyError: 0
```

字典没有“第 0 个”的概念，方括号里要写**键**。

### 3. 键忘了加引号

<!-- raises -->
```python
person = {"name": "小明"}
print(person[name])
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 2, in <module>
    print(person[name])
                 ^^^^
NameError: name 'name' is not defined
```

键是字符串 `"name"`，要加引号。不加引号的 `name` 会被当成变量名，而我们并没有定义这个变量。

### 4. 用 in 检查值

```python
scores = {"小明": 88}
print(88 in scores)
print(88 in scores.values())
```

```text
False
True
```

`in 字典` 检查的是**键**。想检查值，要用 `in 字典.values()`。

## 小结

- 字典用大括号创建：`{"键": 值, "键": 值}`，通过键直接查找值。
- 查询：`字典[键]`，键不存在会报 `KeyError`；`字典.get(键, 默认值)` 不会报错。
- 添加和修改都是 `字典[键] = 值`；键不能重复。
- 删除：`del 字典[键]` 或 `字典.pop(键)`。
- `in` 检查的是键是否存在。
- 遍历：`for 键, 值 in 字典.items():`
- 计数的经典写法：`counts[x] = counts.get(x, 0) + 1`。
- 列表里装字典，是表示一组记录最常见的方式。

### 列表还是字典？

| 情况 | 用什么 |
|---|---|
| 一组同类的数据，按顺序排列（成绩、购物清单） | 列表 |
| 需要通过名字查找（通讯录、单词释义、商品价格表） | 字典 |
| 一条记录的各项信息（一个人的姓名、年龄、电话） | 字典 |
| 很多条记录 | 列表里装字典 |

## 练习

**练习 1**：创建一个商品价格表字典：苹果 5 元、香蕉 3 元、橘子 4 元。让用户输入商品名，显示价格；如果商品不存在，显示“没有这个商品”。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 香蕉 -->
```python
prices = {"苹果": 5, "香蕉": 3, "橘子": 4}
item = input("你要买什么？")
if item in prices:
    print(f"{item}的价格是 {prices[item]} 元")
else:
    print("没有这个商品")
```

```text
你要买什么？香蕉
香蕉的价格是 3 元
```

</details>

**练习 2**：接着练习 1，用户买了 2 个苹果、3 个香蕉，购物车用字典表示为 `cart = {"苹果": 2, "香蕉": 3}`。计算总价。

<details>
<summary>点击查看答案</summary>

```python
prices = {"苹果": 5, "香蕉": 3, "橘子": 4}
cart = {"苹果": 2, "香蕉": 3}

total = 0
for item, count in cart.items():
    cost = prices[item] * count
    print(f"{item} × {count} = {cost} 元")
    total += cost
print(f"总价：{total} 元")
```

```text
苹果 × 2 = 10 元
香蕉 × 3 = 9 元
总价：19 元
```

</details>

**练习 3**：统计下面这段英文里每个单词出现的次数（提示：先用 `split()` 拆成单词列表）。

```python
text = "the cat and the dog and the bird"
```

<details>
<summary>点击查看答案</summary>

```python
text = "the cat and the dog and the bird"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
for word, n in counts.items():
    print(f"{word}: {n}")
```

```text
the: 3
cat: 1
and: 2
dog: 1
bird: 1
```

</details>

**练习 4**：下面的代码会显示什么？

```python
d = {"a": 1, "b": 2}
d["c"] = 3
d["a"] = 10
del d["b"]
print(d)
print(len(d))
```

<details>
<summary>点击查看答案</summary>

```text
{'a': 10, 'c': 3}
2
```

</details>

---

👈 {% post_link Python-Basics-08-Lists '上一篇：列表，一次存很多东西' %}　｜　👉 {% post_link Python-Basics-10-Functions '下一篇：函数，把代码打包' %}
