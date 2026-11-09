---
title: Python Numpy
typora-root-url: Python Numpy
mathjax: true
top: false
cover: false
date: 2023-08-20 21:19:02
categories: Program
tags:
	- program
	- finance
---

## Numpy介绍

NumPy是Python语言的一个扩展程序库。支持高阶大规模的多维数组与矩阵运算，此外也针对数组运算提供大量的数学函数函式库。

针对金融领域的大量矩阵运算，Numpy模块中存储多维数据、处理大型矩阵、开展随机抽样等复杂计算的功能可以完美解决金融领域许多复杂的问题。正如Numpy的random模块可以解决金融量化分析与风险管理过程中涉及基于某种分布的随机抽样，Numpy的financial模块可以测算现金流终值、现值、内含报酬率等金融问题。因此本章主要结合金融场景有的放矢地对Numpy的操作进行介绍和演示。

![Numpy介绍](Numpy介绍.png)

## Numpy操作

### 1.导入numpy与检查版本

```python
import numpy as np    #导入NumPy模块
print(np.__version__)    #查看NumPy版本信息
```

这里我导入Numpy模块后将其命名为np，后续使用就基于这个命名进行。另外，我这里使用的Numpy版本是1.24.3，不同版本可能会有细微差异，不过应该不会影响使用。

### 2.创建数组

创建数组的方式有很多，这里简单介绍几种

##### 1.直接输入法

```python
a_array = np.array(一个列表)    #一维数组
b_array = np.array([列表1，列表2，...，列表n])    #二维数组
```

这两种方式都可以建立数组，不过常用的数组基本都不超过二维，因此直接输入法在很多场景用途都非常广泛。

##### 2.方法生成数组

```python
np.arange(start,stop,step)    #返回一个有终点和起点的固定步长的排列
np.linspace(start,stop,num)    #生成一个指定大小，指定数据区间的均匀分布序列
np.zeros((m,n))    #返回一个给定形状和类型的用0填充的数组
np.ones((m,n))    #返回一个给定形状和类型的用1填充的数组
np.eye(N)    #创建一个指定形状参数的单位矩阵数组
```

当然，通过不同方法创建的数组应用场景也会不同。在金融领域，这几个方法是比较常用的，可以迅速生成自己需要的数组。（亲测非常的好用hh）

##### 3.将列表转化为数组

有些时候，数据都用列表进行存储，这时候我们就需要通过列表转化为数组，从而使用Numpy模块进行金融分析。

我们常用的方法主要有三个：

```python
np.array(listname)    #将列表转化为数组
arrayname.resize(m,n)    #改变数组形状
arrayname.ravel()    #数组降维
```

数组中的数据在内存里是固定的，但计算时的排列方式却可以随时更改，这也是数组的强大之处。

值得说的一点，`reshape`函数和`resize`函数功能相同，都可以修改数组的形状，区别是前者返回新数组，后者则直接修改原始数组。

```python
arraynew = arrayord.reshape(m,n)    #修改数组形状
```

### 3.数组属性

好了，说了这么多，那我们应该怎么查看数组的信息呢？下面我列出了一些比较常用的方法，非常的基础。

```python
type(arrayname)    #显示NumPy数组类型
arrayname.dtype    #显示数组元素的类型
arrayname.size    #显示数组元素的个数
arrayname.shape     #显示数组的形状（行数，列数）
arrayname.ndim     #显示数组的维度
```

数组的类型：`<class 'numpy.ndarray'>`（其实，我也不知道ndarray是啥意思，可能是n维数组（？））

查看ndarray支持的数据类型可访问：https://numpy.org/devdocs/user/basics.types.html（这是numpy的官网，放心进）

后面那三个方法就没啥好说的，很容易理解。

### 4.数组操作

##### 1.切片,索引,排序

```python
arrayname[start:end:step,start:end:step]    #二维数组的切片
arrayname[m,n]    #二维数组的索引
np.sort(arrayname,axis = 0/1)    #数组的排序
```

这三个操作就非常的基本了，切片、索引、排序三个常用方法。类似于python列表的操作，但有一点点不一样。

主要的不同是`sort`函数，`axis`参数可以通过坐标轴设定来改变排序方法，`axis=1`表示横向操作，`axis=0`表示纵向操作。不输入参数时，默认按行进行排序。

##### 2.合并数组

在金融分析的时候，我们有时候还需要对不同的数组进行合并，从而达到整合数据的目的。

```python
np.append(array_one,array_two)    #合并两个数组
np.concatenate([数组1],[数组2],...,[数组n])    #合并多个数组
```

这两个方法都可以对数组进行合并。不同的是，append函数默认是对行进行合并，concatenate函数默认对列进行合并。（append函数使用之后可能会导致数组退化为一维数组）

##### 3.数组计算

不多废话，直接上方法

```python
arrayname.sum()    #对每个数组的元素求和
arrayname.min()    #求数组的元素最小值
arrayname.max()    #求数组元素的最大值
arrayname.prod()    #求数组内部元素的乘积
arrayname.mean()    #求数组元素的均值
arrayname.var()    #求数组元素的方差
arrayname.std()    #求数组元素的标准差
```

这几个是最常用的方法，默认是对所有元素进行操作。当然，我们也可以通过设置`axis参数`让它只针对行列进行操作。

下面是数组之间的计算方法，可以类比普通计算方法。这部分内容还是比较通俗易懂的。

```python
array_one + array_two    #数组相加
array_one - array_two    #数组相减
array_one * array_two    #数组相乘
array_one / array_two    #数组相除
pow(arrayname,n)    #数组的幂
np.dot(array_one,array_two)    #计算两个数组的点积
```

##### 4.矩阵操作

```python
np.corrcoef(arrayname)    #查看相关系数矩阵
np.diag(arrayname)    #查看矩阵对角线
np.triu(arrayname)    #查看矩阵上三角
np.tril(arrayname)    #查看矩阵下三角
np.trace(arrayname)    #查看矩阵的迹
np.transpose(arrayname)    #查看转置矩阵
```

同样，都是线性代数的知识，简单略过。

### 5.linalg模块

终于到了linalg子模块的部分了，这个模块主要是用来进行线性代数的工具包。对于金融领域来说，常用的不算很多。

```python
import numpy.linalg as la    #导入linalg模块
la.det(arrayname)    #矩阵行列式
la.inv(arrayname)    #逆矩阵
```

没错，就这两个方法，可以说关于矩阵的运算，numpy基础库就已经可以解决大部分，很多时候并不需要再引入linalg模块。

### 6.random模块

哈哈哈，这个子模块可是非常常用的。不仅仅是金融领域，在平常的时候，求一些随机数的时候也经常使用。

random模块主要是通过生成随机种子来创建随机数，而随机种子原理是通过读取用户操作时的时间戳来生成序列。（不过到2038 年 01 月 19 日 03 时 14 分 07 秒就失效了，ee，不知道之后会咋解决这个问题，可能会有大佬想出新的方法？）

好了，这些大概就是random模块随机的原理，接下来，让我们看看基于特定统计分布的随机取样。

|    函数名称     |      统计分布类型      |
| :-------------: | :--------------------: |
|      beta       |        贝塔分布        |
|    binomial     |        二项分布        |
|    chisquare    |        卡方分布        |
|   exponential   |        指数分布        |
|        f        |         F分布          |
|      gamma      |        伽马分布        |
|    geometric    |        几何分布        |
| hypergeometric  |       超几何分布       |
|    lognormal    |      对数正态分布      |
|     normal      |        正态分布        |
|     poisson     |        泊松分布        |
| standard_normal |      标准正态分布      |
|   standard_t    |         t分布          |
|      rand       |      标准均匀分布      |
|     randint     | 给定区间内随机抽取整数 |
|      randn      |      标准正态分布      |

以上就是整理出来的随机抽样分布表。内容非常的多，这里篇幅有限，就简单介绍几个最常用的随机抽样。

##### 1.基于正态分布的随机抽样

```python
x_norm = npr.normal(mean,std,I)
y_norm = npr.randn(I)
z_norm = npr.standard_normal(I)
print("运用normal函数抽样的均值：",x_norm.mean())
print("运用normal函数抽样的标准差：",x_norm.std())
print("运用randn函数抽样的均值：",y_norm.mean())
print("运用randn函数抽样的标准差：",y_norm.std())
print("运用standard_normal函数抽样的均值：",z_norm.mean())
print("运用standard_normal函数抽样的标准差：",z_norm.std())
```

其中，I代表随机抽样的次数、mean代表均值、std代表标准差。

经过我的尝试，我觉得运用不同函数从标准正态分布中抽取的随机数，所得到的结果不算很相似。（可能是我运气不好，算出来的结果差别都不小）

##### 2.基于卡方分布的随机抽样

```python
chis = npr.chisquare(freedom,I)
print("卡方分布的均值：",chis.mean())
print("卡方分布的标准差：",chis.std())
```

其中，I代表随机抽样的次数、freedom代表自由度。

##### 3.t分布

```python
stan = npr.standard_t(freedom,I)
print("t分布的均值：",stan.mean())
print("t分布的标准差：",stan.std())
```

其中，I代表随机抽样的次数、freedom代表自由度。

### 7.现金流模型

oh，终于到了金融领域的分析模块了。

先简单介绍一下，针对金融产品的定价方式有3种方法：一是基于现金流贴现的定价方法，二是基于风险与收益的定价方法，三是基于无风险收益的无套利定价方法。其中，现金流贴现方法最为常用。

接下来，我们需要先安装numpy_financial模块。

```python
import numpy_financial as npf
```

##### 1.现金流终值

![现金流终值](现金流终值.png)

现金流的终值是指一定时期内每期期末等额收付款项的复利终值之和。可用fv函数进行计算。

```python
npf.fv(rate,nper,pmt,pv)
```

其中，rate指投资回报率、nper指投资整体期限、pmt指投资期间发生的固定金额现金流、pv指净现金流现值。

##### 2.现金流现值

![现金流现值](现金流现值.png)

现金流现值是指一定时期内每期期末收付款项的复利现值之和。可用pv函数进行计算。

```python
npf.pv(rate,nper,pmt,pv)
```

其中，rate指投资回报率、nper指投资整体期限、pmt指投资期间发生的固定金额现金流、pv指净现金流现值。

##### 3.净现值

净现值（NPV）通过计算每个投资期间的成本（负现金流）和收益（正现金流）来确定。期限通常为一年，但可以按季度，半年或数月来衡量。在计算每个时期的现金流量后，每个时期的现值（PV）是通过以定期收益率（市场规定的收益率）贴现其未来价值（见公式）来实现的。

![净现值公式](净现值公式.png)

净现值 = 未来现金净流量现值-原始投资额现值

运用python计算项目的净现值时，可以运用numpy_financial模块的函数npv

```python
npf.npv(rate, values)
```

其中，参数rate代表项目的投资回报率或者贴现率、参数values代表以数组形式输入的期初和存储期每年年末的净现金流。

**内含报酬率**是指能够使未来现金净流量现值等于原始投资额现值的折现率。

当净现值=0时，未来现金净流量现值=原始投资额现值。

运用python计算项目的净现值时，可以运用numpy_financial模块的函数irr

```python
npf.irr(values)
```

其中，参数values代表以数组形式输入的期初和存储期每年年末的净现金流。

##### 4.等额本息还款

```python
per = np.array(nper)
npf.pmt(rate, nper, pv)    #本息还款金额
npf.ppmt(rate, per, nper, pv)    #本息还款本金
npf.ipmt(rate, per, nper, pv)    #本息还款利息
```

其中，rate指按揭贷款月利率、nper代表贷款的整体期限、pv代表贷款的本金金额、fv代表期末现金流、per代表逐次还款的期限（用数组表示）。

## 总结

综上，Numpy模块是Python在金融领域运用的必备第三方模块。在数据分析方面应用还是很广泛的。后期，我也有可能更新pandas、scipy、matplotlib等模块的金融应用。（maybe）这几个第三方库确实很好用，但是老师上课基本不讲，网络上我也没找到内容和质量好的文章，于是便写了本文。

