---
title: Python 零基础入门（12）：读写文件
date: 2026-11-09 19:00:00
summary: 程序关掉，变量里的数据就没了。本篇学习用 open() 和 with 把数据写进文件、从文件里读出来、在文件末尾追加内容，以及文件放在哪里、中文乱码怎么办，最后让通讯录能保存数据。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

到目前为止，我们程序里的所有数据都存在变量里。变量的数据存放在电脑的**内存**中，程序一结束，数据就消失了。第 9 篇的通讯录就有这个问题：辛辛苦苦录入的联系人，关掉程序就全没了。

要想**永久保存**数据，就要把它写进**文件**，存到硬盘上。下次运行程序时，再从文件里读出来。

## 一、写文件

```python
with open("hello.txt", "w", encoding="utf-8") as f:
    f.write("你好，文件！\n")
    f.write("这是第二行。\n")

print("写好了")
```

```text
写好了
```

运行后，在你的 `.py` 文件**所在的文件夹**里，会多出一个 `hello.txt`。用记事本打开它，就能看到写进去的两行字。

我们来拆解一下第一行：

```text
with open("hello.txt", "w", encoding="utf-8") as f:
```

- `open(...)`：打开一个文件；
- `"hello.txt"`：文件名；
- `"w"`：打开方式，w 是 write（写）的意思；
- `encoding="utf-8"`：用 UTF-8 编码保存文字（后面会解释为什么要写它）；
- `as f`：把打开的文件叫做 `f`，后面用 `f` 来操作它；
- `with ... :`：下面缩进的代码执行完后，**自动关闭文件**。

然后在缩进的代码里，用 `f.write(文字)` 把文字写进文件。

> 打个比方：`with open(...)` 就像打开一本笔记本，在缩进的代码里写字，写完自动合上。

### write 不会自动换行

注意每一行末尾的 `\n`。`print` 会自动换行，但 `write` **不会**。如果不写 `\n`，所有内容都会挤在一行里。

### "w" 模式会清空原来的内容

用 `"w"` 打开文件时：

- 文件**不存在**，就新建一个；
- 文件**已存在**，会先**把原来的内容全部清空**，再写入新内容。

```python
with open("hello.txt", "w", encoding="utf-8") as f:
    f.write("新内容\n")
```

再打开 `hello.txt`，你会发现原来的两行不见了，只剩下“新内容”。**使用 `"w"` 模式一定要小心，别把重要的文件覆盖了。**

### 写入数字要先转换

`write` 只能写入字符串：

```python
scores = [85, 92, 78]
with open("scores.txt", "w", encoding="utf-8") as f:
    for s in scores:
        f.write(f"{s}\n")      # 用 f-string 把数字变成字符串
```

用 f-string 或者 `str()` 转换一下就好。

## 二、读文件

### 一次读出全部内容

```python
with open("scores.txt", "r", encoding="utf-8") as f:
    content = f.read()

print(content)
```

```text
85
92
78

```

- `"r"`：read（读）的意思。`"r"` 是默认的打开方式，所以也可以省略不写；
- `f.read()`：读出文件的**全部**内容，得到一个字符串。

（最后多了一个空行，是因为文件最后一行的 `\n` 加上 print 自己的换行。）

### 一行一行地读（最常用）

文件也可以像列表一样，用 for 循环一行一行地读：

```python
with open("scores.txt", encoding="utf-8") as f:
    for line in f:
        print(repr(line))
```

```text
'85\n'
'92\n'
'78\n'
```

这里用 `repr()` 把每一行“原样”显示出来，你可以看到：**每一行末尾都带着换行符 `\n`**。处理时通常要用 `strip()` 把它去掉：

```python
total = 0
count = 0
with open("scores.txt", encoding="utf-8") as f:
    for line in f:
        score = int(line.strip())
        total += score
        count += 1

print(f"共 {count} 个成绩，平均分 {total / count:.1f}")
```

```text
共 3 个成绩，平均分 85.0
```

记住这个固定套路：**`for line in f:` → `line.strip()` → 处理这一行**。

## 三、追加内容

如果不想清空原来的内容，而是在文件**末尾接着写**，就用 `"a"` 模式（append，追加）：

```python
with open("diary.txt", "w", encoding="utf-8") as f:
    f.write("11月8日：开始学 Python\n")

with open("diary.txt", "a", encoding="utf-8") as f:
    f.write("11月9日：学会了读写文件\n")

with open("diary.txt", encoding="utf-8") as f:
    print(f.read())
```

```text
11月8日：开始学 Python
11月9日：学会了读写文件

```

三种打开方式总结：

| 模式 | 意思 | 文件不存在时 | 文件已存在时 |
|---|---|---|---|
| `"r"` | 读（默认） | 报错 | 从头读 |
| `"w"` | 写 | 新建 | **清空**后再写 |
| `"a"` | 追加 | 新建 | 在末尾接着写 |

## 四、文件放在哪里？

我们一直只写了文件名 `"hello.txt"`，Python 会去哪里找这个文件呢？

答案是：**程序的“当前工作文件夹”**。

- 在 IDLE 里按 F5 运行时，当前文件夹就是 **`.py` 文件所在的文件夹**。所以最简单的做法是：**把要读的文件和 `.py` 文件放在同一个文件夹里**。
- 如果在命令提示符里用 `python 某个路径\demo.py` 运行，当前文件夹则是命令提示符**当时所在的文件夹**，这时就可能找不到文件。

也可以写出文件的完整位置（叫做**路径**）：

```text
with open(r"C:\Users\xiaoming\Desktop\data.txt", encoding="utf-8") as f:
```

在 Windows 上写路径时，记得在引号前面加一个 `r`。因为路径里的 `\` 在字符串里有特殊含义（比如 `\n` 是换行），加上 `r` 就是告诉 Python：“里面的 `\` 就是普通的斜杠，不要特殊处理”。

### 文件不存在怎么办？

<!-- raises -->
```python
with open("没有这个文件.txt", encoding="utf-8") as f:
    print(f.read())
```

```text
Traceback (most recent call last):
  File "C:\Users\xiaoming\Desktop\python学习\demo.py", line 1, in <module>
    with open("没有这个文件.txt", encoding="utf-8") as f:
         ~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: '没有这个文件.txt'
```

`FileNotFoundError` 意思是“找不到这个文件”。遇到它，先检查：

1. 文件名是否写对了，包括后缀名（`.txt`）；
2. 文件是否和 `.py` 文件在同一个文件夹里。

> Windows 默认会**隐藏文件的后缀名**，你看到的 `data` 可能其实叫 `data.txt`，也可能叫 `data.txt.txt`。建议打开文件资源管理器，点击“查看”，勾选“文件扩展名”，这样就能看到完整的文件名了。

上一篇学的 `try / except` 在这里正好派上用场：

```python
try:
    with open("notes.txt", encoding="utf-8") as f:
        print(f.read())
except FileNotFoundError:
    print("还没有笔记，先写一条吧")
```

```text
还没有笔记，先写一条吧
```

## 五、中文乱码和 encoding

你可能会好奇：为什么每次都要写 `encoding="utf-8"`？

电脑存储文字时，要把每个字变成数字，这套“文字和数字的对照规则”叫做**编码**。常见的编码有 UTF-8（现在全世界最通用的）和 GBK（较老的中文 Windows 常用）。

**用什么编码写的文件，就必须用什么编码读**，否则就会出现乱码或者报错，像这样：`浣犲ソ`。

不写 `encoding` 时，Python 会使用电脑的默认编码，而不同电脑、不同 Python 版本的默认编码可能不一样。所以：

> 💡 **养成习惯：每次 open 都写上 `encoding="utf-8"`**。这样你的程序在任何电脑上都能正确读写中文。

如果要读取别人给你的文件，用 UTF-8 读出来是乱码或报 `UnicodeDecodeError`，可以试试 `encoding="gbk"`。

## 六、保存结构化的数据

如果一行要存多项信息，比如姓名和电话，可以用一个符号把它们隔开，最常用的是**逗号**：

```python
contacts = {"小明": "13800001111", "小红": "13900002222"}

# 保存：每个联系人写一行，格式是“姓名,电话”
with open("contacts.txt", "w", encoding="utf-8") as f:
    for name, phone in contacts.items():
        f.write(f"{name},{phone}\n")

# 读取：每一行用 split(",") 拆开
loaded = {}
with open("contacts.txt", encoding="utf-8") as f:
    for line in f:
        name, phone = line.strip().split(",")
        loaded[name] = phone

print(loaded)
```

```text
{'小明': '13800001111', '小红': '13900002222'}
```

`name, phone = ...split(",")` 这种写法是把拆出来的两部分**分别**交给 `name` 和 `phone`。

用逗号隔开的文本文件，通常用 `.csv` 作为后缀名，它可以直接用 Excel 打开，是最常见的数据格式之一。（用 Excel 打开 UTF-8 编码的中文 CSV 可能显示乱码，把 encoding 改成 `"utf-8-sig"` 就能解决。）

## 动手试试：能保存的通讯录

把第 9 篇的通讯录改造一下：启动时从文件读取联系人，添加联系人后立即保存。

```python
FILENAME = "contacts.txt"

def load_contacts():
    """从文件读取联系人，文件不存在就返回空字典"""
    contacts = {}
    try:
        with open(FILENAME, encoding="utf-8") as f:
            for line in f:
                name, phone = line.strip().split(",")
                contacts[name] = phone
    except FileNotFoundError:
        pass       # pass 表示“什么都不做”
    return contacts

def save_contacts(contacts):
    """把所有联系人写入文件"""
    with open(FILENAME, "w", encoding="utf-8") as f:
        for name, phone in contacts.items():
            f.write(f"{name},{phone}\n")
```

把这两个函数放在文件开头。主程序部分：

<!-- continue -->
<!-- stdin: 1 | 小刚 | 13700003333 | 2 | 3 -->
```python
contacts = load_contacts()
print(f"已读取 {len(contacts)} 位联系人")

while True:
    choice = input("1. 添加  2. 显示全部  3. 退出：")
    if choice == "1":
        name = input("姓名：")
        phone = input("电话：")
        contacts[name] = phone
        save_contacts(contacts)
        print("已保存")
    elif choice == "2":
        for name, phone in contacts.items():
            print(f"  {name}：{phone}")
    elif choice == "3":
        break
```

```text
已读取 2 位联系人
1. 添加  2. 显示全部  3. 退出：1
姓名：小刚
电话：13700003333
已保存
1. 添加  2. 显示全部  3. 退出：2
  小明：13800001111
  小红：13900002222
  小刚：13700003333
1. 添加  2. 显示全部  3. 退出：3
```

（这里一开始就读到了 2 位联系人，是因为上一节已经生成了 `contacts.txt`。）关掉程序再运行，你会发现联系人都还在。

`FILENAME` 全部用大写字母，是一种约定俗成的写法，表示这是一个“设定好之后不会再改的值”（叫做**常量**）。

## 新手常见错误

### 1. 用 "w" 模式误删了数据

想往文件里添加内容，却用了 `"w"`，结果原来的内容全没了。追加内容要用 `"a"`。重要的文件，操作前先备份。

### 2. 忘了 `\n`

```python
with open("test.txt", "w", encoding="utf-8") as f:
    f.write("第一行")
    f.write("第二行")

with open("test.txt", encoding="utf-8") as f:
    print(f.read())
```

```text
第一行第二行
```

### 3. 读出来的每一行都带着换行符

```python
with open("scores.txt", encoding="utf-8") as f:
    for line in f:
        print(line)
```

```text
85

92

78

```

每行之间多了一个空行：`line` 自带的 `\n` 加上 print 自己的换行，就换了两次行。用 `line.strip()` 去掉即可。

### 4. 读出来的是字符串，忘了转换

文件里读出来的都是字符串，要计算的话，别忘了 `int()` 或 `float()`。这和 `input()` 是一样的。

## 小结

- 打开文件的标准写法：`with open(文件名, 模式, encoding="utf-8") as f:`，缩进的代码执行完会自动关闭文件。
- 模式：`"r"` 读（默认）、`"w"` 写（**会清空原内容**）、`"a"` 追加。
- 写：`f.write(字符串)`，不会自动换行，要自己加 `\n`；数字要先转成字符串。
- 读：`f.read()` 读出全部；`for line in f:` 一行一行读，记得 `line.strip()`。
- 只写文件名时，文件要和 `.py` 文件放在同一个文件夹；找不到文件会报 `FileNotFoundError`。
- **每次都写 `encoding="utf-8"`**，避免中文乱码。
- 一行多项数据用逗号隔开，读取时用 `split(",")` 拆分。

## 练习

**练习 1**：写一个程序，把 1 到 10 的平方写入文件 `squares.txt`，每行一个数。然后再读出来，计算它们的总和。

<details>
<summary>点击查看答案</summary>

```python
with open("squares.txt", "w", encoding="utf-8") as f:
    for n in range(1, 11):
        f.write(f"{n * n}\n")

total = 0
with open("squares.txt", encoding="utf-8") as f:
    for line in f:
        total += int(line.strip())
print(f"总和是 {total}")
```

```text
总和是 385
```

</details>

**练习 2**：写一个“每日一句”程序，每次运行时让用户输入一句话，追加到 `words.txt` 末尾，然后显示文件里一共有多少句话。

<details>
<summary>点击查看答案</summary>

<!-- stdin: 今天也要加油 -->
```python
sentence = input("今天想说什么？")
with open("words.txt", "a", encoding="utf-8") as f:
    f.write(sentence + "\n")

count = 0
with open("words.txt", encoding="utf-8") as f:
    for line in f:
        count += 1
print(f"你已经记录了 {count} 句话")
```

```text
今天想说什么？今天也要加油
你已经记录了 1 句话
```

每运行一次，句子数就会加一。

</details>

**练习 3**：有一个成绩文件 `grades.csv`，内容如下（每行是“姓名,成绩”）：

```text
小明,88
小红,95
小刚,59
```

写程序读取这个文件，显示每个人的成绩，并找出最高分的同学。（先用练习里学的方法把这三行写入文件，再读取。）

<details>
<summary>点击查看答案</summary>

```python
with open("grades.csv", "w", encoding="utf-8") as f:
    f.write("小明,88\n小红,95\n小刚,59\n")

best_name = ""
best_score = -1
with open("grades.csv", encoding="utf-8") as f:
    for line in f:
        name, score = line.strip().split(",")
        score = int(score)
        print(f"{name}：{score}")
        if score > best_score:
            best_name = name
            best_score = score

print(f"最高分：{best_name}，{best_score} 分")
```

```text
小明：88
小红：95
小刚：59
最高分：小红，95 分
```

</details>

---

👈 {% post_link Python-Basics-11-Errors '上一篇：看懂报错信息' %}　｜　👉 {% post_link Python-Basics-13-Modules '下一篇：模块，使用别人写好的代码' %}
