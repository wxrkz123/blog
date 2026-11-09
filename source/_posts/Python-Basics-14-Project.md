---
title: Python 零基础入门（14）：综合项目，命令行记账本
date: 2026-11-09 18:50:00
summary: 把前面学过的变量、输入、判断、循环、列表、字典、函数、异常处理、文件读写和模块全部用上，一步一步做出一个能保存数据的记账本程序。最后聊聊学完之后该往哪里走。
tags:
  - Python
  - Python零基础
categories:
  - Python
---

恭喜你坚持到了最后一篇！这一篇我们不学新知识，而是把前面学过的东西**全部串起来**，做一个真正有用的小程序：**命令行记账本**。

它能做到：

- 记录每一笔收入和支出；
- 查看所有明细；
- 统计总收入、总支出、结余，以及每个分类花了多少钱；
- **数据保存在文件里**，关掉程序再打开，记录还在。

做完这个项目，你会发现自己已经能写出一个“像样”的程序了。

## 一、动手之前：先想清楚

写程序之前，先想清楚两件事，比直接开始敲代码要重要得多。

### 1. 程序要有哪些功能？

```text
====== 我的记账本 ======
1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：
```

一个菜单，四个功能。每个功能写成一个**函数**（第 10 篇）。

### 2. 数据怎么存？

每一笔账有四项信息：日期、类型（收入还是支出）、分类、金额。用一个**字典**（第 9 篇）表示一笔账正合适：

```python
record = {"date": "2026-11-09", "kind": "支出", "category": "餐饮", "amount": 35.5}
```

很多笔账，就放进一个**列表**（第 8 篇）里：

<!-- nocheck -->
```python
records = [
    {"date": "2026-11-08", "kind": "收入", "category": "工资", "amount": 8000.0},
    {"date": "2026-11-09", "kind": "支出", "category": "餐饮", "amount": 35.5},
]
```

保存到文件时（第 12 篇），每笔账写一行，四项信息用逗号隔开：

```text
2026-11-08,收入,工资,8000.0
2026-11-09,支出,餐饮,35.5
```

想清楚了这些，就可以一个函数一个函数地写了。

## 二、第一步：读取和保存

先写和文件打交道的两个函数。

```python
FILENAME = "ledger.csv"


def load_records():
    """从文件读取所有账目，返回一个列表"""
    records = []
    try:
        with open(FILENAME, encoding="utf-8") as f:
            for line in f:
                date, kind, category, amount = line.strip().split(",")
                records.append({
                    "date": date,
                    "kind": kind,
                    "category": category,
                    "amount": float(amount),
                })
    except FileNotFoundError:
        pass      # 第一次运行时还没有文件，返回空列表就行
    return records


def save_record(record):
    """把一笔账追加到文件末尾"""
    with open(FILENAME, "a", encoding="utf-8") as f:
        f.write(f"{record['date']},{record['kind']},{record['category']},{record['amount']}\n")
```

用到的知识：

- `try / except FileNotFoundError`（第 11 篇）：第一次运行时文件还不存在，不能让程序因此崩溃；
- `split(",")` 拆分每一行（第 8 篇），`float()` 把金额从字符串变回数字（第 4 篇）；
- 保存时用 `"a"` 追加模式（第 12 篇），每记一笔就在文件末尾加一行，不会覆盖之前的记录。

## 三、第二步：记一笔

记账时，用户可能会输错。比如金额输入了“abc”，或者类型既不是“收入”也不是“支出”。一个好用的程序，应该**提醒用户重新输入**，而不是直接崩溃。

先写一个专门负责“输入金额”的函数：

```python
def input_amount():
    """让用户输入金额，直到输入正确为止"""
    while True:
        try:
            amount = float(input("金额："))
        except ValueError:
            print("请输入数字，例如 35.5")
            continue
        if amount <= 0:
            print("金额必须大于 0")
            continue
        return amount
```

这里组合了 `while True`（第 7 篇）、`try / except`（第 11 篇）和 `continue`：输入不是数字或者不大于 0，就提示一下，然后 `continue` 回到循环开头重新输入；输入正确，就 `return` 把金额交回去（return 会直接结束函数，循环也就结束了）。

然后是“记一笔”的函数：

```python
import datetime


def add_record(records):
    """记一笔账：询问各项信息，加入列表并保存到文件"""
    date = input("日期（例如 2026-11-09，直接回车表示今天）：").strip()
    if date == "":
        date = str(datetime.date.today())

    while True:
        kind = input("类型（收入/支出）：").strip()
        if kind == "收入" or kind == "支出":
            break
        print("请输入“收入”或“支出”")

    category = input("分类（例如 餐饮、交通、工资）：").strip()
    amount = input_amount()

    record = {"date": date, "kind": kind, "category": category, "amount": amount}
    records.append(record)
    save_record(record)
    print("✅ 已记录")
```

几个细节：

- 每个 `input` 后面都加了 `.strip()`（第 4 篇），去掉用户不小心多打的空格；
- 日期直接回车就用今天的日期，这里用到了 `datetime` 模块（第 13 篇），`str()` 把日期变成 `"2026-11-09"` 这样的字符串；
- 新的一笔账既要加进列表 `records`（这样马上就能查看），也要保存到文件（这样下次还在）。

## 四、第三步：查看明细

```python
def show_records(records):
    """显示所有账目"""
    if len(records) == 0:
        print("还没有任何记录")
        return
    for i, r in enumerate(records, start=1):
        print(f"{i}. {r['date']}  {r['kind']}  {r['category']}  {r['amount']:.2f} 元")
```

- 没有记录时，提示一下就 `return`，提前结束函数；
- `enumerate(..., start=1)`（第 8 篇）给每一笔账编上号；
- f-string 里用 `:.2f` 让金额都显示两位小数（第 4 篇）。

## 五、第四步：统计

统计是这个程序最有意思的部分：

```python
def show_summary(records):
    """统计收入、支出、结余，以及各分类的支出"""
    income = 0
    expense = 0
    by_category = {}

    for r in records:
        if r["kind"] == "收入":
            income += r["amount"]
        else:
            expense += r["amount"]
            by_category[r["category"]] = by_category.get(r["category"], 0) + r["amount"]

    print(f"总收入：{income:.2f} 元")
    print(f"总支出：{expense:.2f} 元")
    print(f"结  余：{income - expense:.2f} 元")

    if expense > 0:
        print("支出分类：")
        for category, amount in by_category.items():
            percent = amount / expense * 100
            bar = "█" * round(percent / 5)
            print(f"  {category}：{amount:.2f} 元（{percent:.1f}%）{bar}")
```

- 一次循环同时算出总收入和总支出，这是第 7 篇的**累加**；
- 每个分类花了多少钱，用的是第 9 篇字典**计数**的写法 `d[key] = d.get(key, 0) + ...`，只不过这次累加的是金额而不是次数；
- 最后用 `"█" * 数字`（第 4 篇字符串乘法）画了一个简单的条形图：每 5% 画一格。

## 六、第五步：主菜单

最后，用一个主函数把所有功能串起来：

<!-- norun -->
```python
def main():
    records = load_records()
    print("====== 我的记账本 ======")
    print(f"已读取 {len(records)} 条记录")

    while True:
        print()
        print("1. 记一笔  2. 查看明细  3. 统计  4. 退出")
        choice = input("请选择：").strip()
        if choice == "1":
            add_record(records)
        elif choice == "2":
            show_records(records)
        elif choice == "3":
            show_summary(records)
        elif choice == "4":
            print("再见，记得常来记账！")
            break
        else:
            print("请输入 1 到 4 之间的数字")


main()
```

这就是第 9 篇通讯录用过的“菜单 + `while True` + `if/elif`”结构。最后一行 `main()` 调用主函数，程序就开始运行了。

## 七、完整代码

把上面所有的部分按顺序放进一个文件，起名 `ledger.py`（**注意：import 要放在最上面**）：

<!-- stdin: 1 | 2026-11-08 | 收入 | 工资 | 8000 | 1 | 2026-11-08 | 支出 | 餐饮 | 35.5 | 1 | 2026-11-09 | 买菜 | 支出 | 交通 | abc | 12 | 1 | 2026-11-09 | 支出 | 餐饮 | 48 | 1 | 2026-11-09 | 支出 | 购物 | 199 | 2 | 3 | 5 | 4 -->
```python
import datetime

FILENAME = "ledger.csv"


def load_records():
    """从文件读取所有账目，返回一个列表"""
    records = []
    try:
        with open(FILENAME, encoding="utf-8") as f:
            for line in f:
                date, kind, category, amount = line.strip().split(",")
                records.append({
                    "date": date,
                    "kind": kind,
                    "category": category,
                    "amount": float(amount),
                })
    except FileNotFoundError:
        pass      # 第一次运行时还没有文件，返回空列表就行
    return records


def save_record(record):
    """把一笔账追加到文件末尾"""
    with open(FILENAME, "a", encoding="utf-8") as f:
        f.write(f"{record['date']},{record['kind']},{record['category']},{record['amount']}\n")


def input_amount():
    """让用户输入金额，直到输入正确为止"""
    while True:
        try:
            amount = float(input("金额："))
        except ValueError:
            print("请输入数字，例如 35.5")
            continue
        if amount <= 0:
            print("金额必须大于 0")
            continue
        return amount


def add_record(records):
    """记一笔账：询问各项信息，加入列表并保存到文件"""
    date = input("日期（例如 2026-11-09，直接回车表示今天）：").strip()
    if date == "":
        date = str(datetime.date.today())

    while True:
        kind = input("类型（收入/支出）：").strip()
        if kind == "收入" or kind == "支出":
            break
        print("请输入“收入”或“支出”")

    category = input("分类（例如 餐饮、交通、工资）：").strip()
    amount = input_amount()

    record = {"date": date, "kind": kind, "category": category, "amount": amount}
    records.append(record)
    save_record(record)
    print("✅ 已记录")


def show_records(records):
    """显示所有账目"""
    if len(records) == 0:
        print("还没有任何记录")
        return
    for i, r in enumerate(records, start=1):
        print(f"{i}. {r['date']}  {r['kind']}  {r['category']}  {r['amount']:.2f} 元")


def show_summary(records):
    """统计收入、支出、结余，以及各分类的支出"""
    income = 0
    expense = 0
    by_category = {}

    for r in records:
        if r["kind"] == "收入":
            income += r["amount"]
        else:
            expense += r["amount"]
            by_category[r["category"]] = by_category.get(r["category"], 0) + r["amount"]

    print(f"总收入：{income:.2f} 元")
    print(f"总支出：{expense:.2f} 元")
    print(f"结  余：{income - expense:.2f} 元")

    if expense > 0:
        print("支出分类：")
        for category, amount in by_category.items():
            percent = amount / expense * 100
            bar = "█" * round(percent / 5)
            print(f"  {category}：{amount:.2f} 元（{percent:.1f}%）{bar}")


def main():
    records = load_records()
    print("====== 我的记账本 ======")
    print(f"已读取 {len(records)} 条记录")

    while True:
        print()
        print("1. 记一笔  2. 查看明细  3. 统计  4. 退出")
        choice = input("请选择：").strip()
        if choice == "1":
            add_record(records)
        elif choice == "2":
            show_records(records)
        elif choice == "3":
            show_summary(records)
        elif choice == "4":
            print("再见，记得常来记账！")
            break
        else:
            print("请输入 1 到 4 之间的数字")


main()
```

一共 100 多行。如果一下子觉得很长，别担心，它只是由前面那几个小函数拼起来的，每个函数都只做一件事。

## 八、运行效果

按 F5 运行，下面是一次完整的使用过程。注意中间故意输错了几次（类型输入了“买菜”、金额输入了“abc”、菜单输入了“5”），看看程序是怎么应对的：

```text
====== 我的记账本 ======
已读取 0 条记录

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：1
日期（例如 2026-11-09，直接回车表示今天）：2026-11-08
类型（收入/支出）：收入
分类（例如 餐饮、交通、工资）：工资
金额：8000
✅ 已记录

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：1
日期（例如 2026-11-09，直接回车表示今天）：2026-11-08
类型（收入/支出）：支出
分类（例如 餐饮、交通、工资）：餐饮
金额：35.5
✅ 已记录

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：1
日期（例如 2026-11-09，直接回车表示今天）：2026-11-09
类型（收入/支出）：买菜
请输入“收入”或“支出”
类型（收入/支出）：支出
分类（例如 餐饮、交通、工资）：交通
金额：abc
请输入数字，例如 35.5
金额：12
✅ 已记录

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：1
日期（例如 2026-11-09，直接回车表示今天）：2026-11-09
类型（收入/支出）：支出
分类（例如 餐饮、交通、工资）：餐饮
金额：48
✅ 已记录

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：1
日期（例如 2026-11-09，直接回车表示今天）：2026-11-09
类型（收入/支出）：支出
分类（例如 餐饮、交通、工资）：购物
金额：199
✅ 已记录

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：2
1. 2026-11-08  收入  工资  8000.00 元
2. 2026-11-08  支出  餐饮  35.50 元
3. 2026-11-09  支出  交通  12.00 元
4. 2026-11-09  支出  餐饮  48.00 元
5. 2026-11-09  支出  购物  199.00 元

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：3
总收入：8000.00 元
总支出：294.50 元
结  余：7705.50 元
支出分类：
  餐饮：83.50 元（28.4%）██████
  交通：12.00 元（4.1%）█
  购物：199.00 元（67.6%）██████████████

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：5
请输入 1 到 4 之间的数字

1. 记一笔  2. 查看明细  3. 统计  4. 退出
请选择：4
再见，记得常来记账！
```

程序结束后，打开 `ledger.py` 所在的文件夹，会看到一个 `ledger.csv` 文件，里面就是刚才记的 5 笔账。再次运行程序，开头会显示“已读取 5 条记录”，选 2 就能看到之前的明细。

> 💡 `ledger.csv` 可以直接用 Excel 打开查看。如果中文显示乱码，把程序中**写文件**那一处的 `encoding="utf-8"` 改成 `encoding="utf-8-sig"` 即可（读文件那一处不用改）。

## 九、回顾：用到了哪些知识

| 知识点 | 在哪里用到 | 对应篇目 |
|---|---|---|
| print、变量 | 到处都是 | 02 |
| 数字计算 | 累加金额、计算百分比 | 03 |
| 字符串、f-string | strip、split、格式化输出、画条形图 | 04 |
| input、类型转换 | 输入各项信息，float() 转换金额 | 05 |
| if / elif / else | 菜单选择、判断收入还是支出 | 06 |
| while、for、break、continue | 主菜单循环、输入检查、遍历账目 | 07 |
| 列表、enumerate | 存放所有账目、编号显示 | 08 |
| 字典、get 计数 | 表示一笔账、按分类统计 | 09 |
| 函数、return | 每个功能一个函数 | 10 |
| try / except | 金额输错、文件不存在 | 11 |
| 文件读写 | 读取和保存账目 | 12 |
| 模块 | datetime 获取今天日期 | 13 |

**你学过的每一篇，都在这个程序里派上了用场。**

## 十、挑战：自己改进它

真正的进步来自于自己动手改。下面是一些改进方向，从易到难，挑你感兴趣的试试：

1. **⭐ 显示收支符号**：查看明细时，收入显示 `+8000.00`，支出显示 `-35.50`。
2. **⭐ 分类里有逗号怎么办？** 如果用户在分类里输入了英文逗号，比如 `餐饮,早饭`，保存后再读取就会出错（试试看会报什么错）。想办法在保存前把英文逗号替换掉（提示：`replace`）。
3. **⭐⭐ 按月统计**：让用户输入月份（如 `2026-11`），只统计这个月的账目。（提示：`r["date"].startswith("2026-11")`，或者用切片 `r["date"][:7]`。）
4. **⭐⭐ 删除一笔账**：增加菜单项“5. 删除”，让用户输入编号删除对应的账目。删除后要把**整个列表**重新写入文件（用 `"w"` 模式）。
5. **⭐⭐⭐ 预算提醒**：设定每月预算，统计时如果本月支出超过预算，显示提醒。
6. **⭐⭐⭐ 分类按金额排序**：统计时让花钱最多的分类排在最前面。（这需要用到 `sorted` 的 `key` 参数，可以自己搜索一下“Python sorted key”，学会查资料也是一项重要的技能。）

## 十一、学完之后，下一步学什么？

恭喜你完成了「Python 零基础入门」全部 15 篇！回头看看，你已经掌握了编程中最核心的概念：变量、判断、循环、数据结构、函数、异常、文件。**这些概念在所有编程语言里都是相通的。**

接下来可以选择的方向：

### 方向一：继续深入学习 Python

本站的「Python 从入门到精通」系列会带你理解 Python 更深层的内容。现在的你再去读，会轻松很多。建议的阅读顺序：

1. {% post_link Python-02-Objects-and-Variables '变量、对象与内置类型' %}：变量到底是什么，为什么说“变量是标签”；
2. {% post_link Python-04-Containers '列表、元组、字典与集合' %}：本系列没讲的元组和集合；
3. {% post_link Python-05-Control-Flow '流程控制、推导式与模式匹配' %}：用一行代码生成列表的“推导式”；
4. {% post_link Python-06-Functions '函数——参数、作用域与一等对象' %}：函数的更多高级用法；
5. {% post_link Python-09-OOP-Classes '面向对象——类、实例、继承' %}：编程中另一个非常重要的思想；
6. {% post_link Python-11-Exceptions-and-Context-Managers '异常处理与上下文管理器' %}：`with` 语句背后的原理。

完整的路线见 {% post_link Python-00-Roadmap '「从入门到精通」系列导读' %}。遇到看不懂的地方，跳过去也没关系，以后再回来看。

### 方向二：用 Python 做点实际的事

- **数据分析**：学习 `pandas`（处理表格）和 `matplotlib`（画图），处理 Excel 数据会变得非常轻松；
- **自动化办公**：批量重命名文件、批量处理 Excel 和 Word 文档；
- **网络爬虫**：用 `requests` 获取网页上的数据；
- **做小游戏**：用 `pygame` 做 2D 游戏。

选一个你感兴趣的方向，找一个实际的小需求，动手去做。**做项目是最好的学习方法。**

### 最后的建议

- **每天写一点代码**，哪怕只有 10 分钟。编程像外语，长时间不用就会生疏。
- **遇到问题先自己想办法**：读报错、加 print、搜索、问 AI。解决问题的能力，就是编程能力本身。
- **不要怕犯错**。你在这个系列里看到的每一个“新手常见错误”，每个程序员都犯过很多次。

祝你在编程的路上越走越远！🎉

---

👈 {% post_link Python-Basics-13-Modules '上一篇：模块，使用别人写好的代码' %}　｜　🏠 {% post_link Python-Basics-00-Guide '回到系列目录' %}
