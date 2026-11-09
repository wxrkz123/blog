---
title: Python Numpy
date: 2023-08-20 12:00:00
tags:
  - program
  - finance
categories:
  - Program
mathjax: true
rawhtml: true
---
<h2 id="Numpy介绍"><a href="#Numpy介绍" class="headerlink" title="Numpy介绍"></a>Numpy介绍</h2><p>NumPy是Python语言的一个扩展程序库。支持高阶大规模的多维数组与矩阵运算，此外也针对数组运算提供大量的数学函数函式库。</p>
<p>针对金融领域的大量矩阵运算，Numpy模块中存储多维数据、处理大型矩阵、开展随机抽样等复杂计算的功能可以完美解决金融领域许多复杂的问题。正如Numpy的random模块可以解决金融量化分析与风险管理过程中涉及基于某种分布的随机抽样，Numpy的financial模块可以测算现金流终值、现值、内含报酬率等金融问题。因此本章主要结合金融场景有的放矢地对Numpy的操作进行介绍和演示。</p>
<p><img src="../Python-Numpy/Numpy%E4%BB%8B%E7%BB%8D.png" alt="Numpy介绍"></p>
<h2 id="Numpy操作"><a href="#Numpy操作" class="headerlink" title="Numpy操作"></a>Numpy操作</h2><h3 id="1-导入numpy与检查版本"><a href="#1-导入numpy与检查版本" class="headerlink" title="1.导入numpy与检查版本"></a>1.导入numpy与检查版本</h3><pre class="line-numbers language-python" data-language="python"><code class="language-python"><span class="token keyword">import</span> numpy <span class="token keyword">as</span> np    <span class="token comment">#导入NumPy模块</span>
<span class="token keyword">print</span><span class="token punctuation">(</span>np<span class="token punctuation">.</span>__version__<span class="token punctuation">)</span>    <span class="token comment">#查看NumPy版本信息</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span></span></code></pre>

<p>这里我导入Numpy模块后将其命名为np，后续使用就基于这个命名进行。另外，我这里使用的Numpy版本是1.24.3，不同版本可能会有细微差异，不过应该不会影响使用。</p>
<h3 id="2-创建数组"><a href="#2-创建数组" class="headerlink" title="2.创建数组"></a>2.创建数组</h3><p>创建数组的方式有很多，这里简单介绍几种</p>
<h5 id="1-直接输入法"><a href="#1-直接输入法" class="headerlink" title="1.直接输入法"></a>1.直接输入法</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">a_array <span class="token operator">=</span> np<span class="token punctuation">.</span>array<span class="token punctuation">(</span>一个列表<span class="token punctuation">)</span>    <span class="token comment">#一维数组</span>
b_array <span class="token operator">=</span> np<span class="token punctuation">.</span>array<span class="token punctuation">(</span><span class="token punctuation">[</span>列表<span class="token number">1</span>，列表<span class="token number">2</span>，<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>，列表n<span class="token punctuation">]</span><span class="token punctuation">)</span>    <span class="token comment">#二维数组</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span></span></code></pre>

<p>这两种方式都可以建立数组，不过常用的数组基本都不超过二维，因此直接输入法在很多场景用途都非常广泛。</p>
<h5 id="2-方法生成数组"><a href="#2-方法生成数组" class="headerlink" title="2.方法生成数组"></a>2.方法生成数组</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">np<span class="token punctuation">.</span>arange<span class="token punctuation">(</span>start<span class="token punctuation">,</span>stop<span class="token punctuation">,</span>step<span class="token punctuation">)</span>    <span class="token comment">#返回一个有终点和起点的固定步长的排列</span>
np<span class="token punctuation">.</span>linspace<span class="token punctuation">(</span>start<span class="token punctuation">,</span>stop<span class="token punctuation">,</span>num<span class="token punctuation">)</span>    <span class="token comment">#生成一个指定大小，指定数据区间的均匀分布序列</span>
np<span class="token punctuation">.</span>zeros<span class="token punctuation">(</span><span class="token punctuation">(</span>m<span class="token punctuation">,</span>n<span class="token punctuation">)</span><span class="token punctuation">)</span>    <span class="token comment">#返回一个给定形状和类型的用0填充的数组</span>
np<span class="token punctuation">.</span>ones<span class="token punctuation">(</span><span class="token punctuation">(</span>m<span class="token punctuation">,</span>n<span class="token punctuation">)</span><span class="token punctuation">)</span>    <span class="token comment">#返回一个给定形状和类型的用1填充的数组</span>
np<span class="token punctuation">.</span>eye<span class="token punctuation">(</span>N<span class="token punctuation">)</span>    <span class="token comment">#创建一个指定形状参数的单位矩阵数组</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<p>当然，通过不同方法创建的数组应用场景也会不同。在金融领域，这几个方法是比较常用的，可以迅速生成自己需要的数组。（亲测非常的好用hh）</p>
<h5 id="3-将列表转化为数组"><a href="#3-将列表转化为数组" class="headerlink" title="3.将列表转化为数组"></a>3.将列表转化为数组</h5><p>有些时候，数据都用列表进行存储，这时候我们就需要通过列表转化为数组，从而使用Numpy模块进行金融分析。</p>
<p>我们常用的方法主要有三个：</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">np<span class="token punctuation">.</span>array<span class="token punctuation">(</span>listname<span class="token punctuation">)</span>    <span class="token comment">#将列表转化为数组</span>
arrayname<span class="token punctuation">.</span>resize<span class="token punctuation">(</span>m<span class="token punctuation">,</span>n<span class="token punctuation">)</span>    <span class="token comment">#改变数组形状</span>
arrayname<span class="token punctuation">.</span>ravel<span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#数组降维</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span></span></code></pre>

<p>数组中的数据在内存里是固定的，但计算时的排列方式却可以随时更改，这也是数组的强大之处。</p>
<p>值得说的一点，<code>reshape</code>函数和<code>resize</code>函数功能相同，都可以修改数组的形状，区别是前者返回新数组，后者则直接修改原始数组。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">arraynew <span class="token operator">=</span> arrayord<span class="token punctuation">.</span>reshape<span class="token punctuation">(</span>m<span class="token punctuation">,</span>n<span class="token punctuation">)</span>    <span class="token comment">#修改数组形状</span><span aria-hidden="true" class="line-numbers-rows"><span></span></span></code></pre>

<h3 id="3-数组属性"><a href="#3-数组属性" class="headerlink" title="3.数组属性"></a>3.数组属性</h3><p>好了，说了这么多，那我们应该怎么查看数组的信息呢？下面我列出了一些比较常用的方法，非常的基础。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python"><span class="token builtin">type</span><span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#显示NumPy数组类型</span>
arrayname<span class="token punctuation">.</span>dtype    <span class="token comment">#显示数组元素的类型</span>
arrayname<span class="token punctuation">.</span>size    <span class="token comment">#显示数组元素的个数</span>
arrayname<span class="token punctuation">.</span>shape     <span class="token comment">#显示数组的形状（行数，列数）</span>
arrayname<span class="token punctuation">.</span>ndim     <span class="token comment">#显示数组的维度</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<p>数组的类型：<code>&lt;class &#39;numpy.ndarray&#39;&gt;</code>（其实，我也不知道ndarray是啥意思，可能是n维数组（？））</p>
<p>查看ndarray支持的数据类型可访问：<a href="https://numpy.org/devdocs/user/basics.types.html%EF%BC%88%E8%BF%99%E6%98%AFnumpy%E7%9A%84%E5%AE%98%E7%BD%91%EF%BC%8C%E6%94%BE%E5%BF%83%E8%BF%9B%EF%BC%89">https://numpy.org/devdocs/user/basics.types.html（这是numpy的官网，放心进）</a></p>
<p>后面那三个方法就没啥好说的，很容易理解。</p>
<h3 id="4-数组操作"><a href="#4-数组操作" class="headerlink" title="4.数组操作"></a>4.数组操作</h3><h5 id="1-切片-索引-排序"><a href="#1-切片-索引-排序" class="headerlink" title="1.切片,索引,排序"></a>1.切片,索引,排序</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">arrayname<span class="token punctuation">[</span>start<span class="token punctuation">:</span>end<span class="token punctuation">:</span>step<span class="token punctuation">,</span>start<span class="token punctuation">:</span>end<span class="token punctuation">:</span>step<span class="token punctuation">]</span>    <span class="token comment">#二维数组的切片</span>
arrayname<span class="token punctuation">[</span>m<span class="token punctuation">,</span>n<span class="token punctuation">]</span>    <span class="token comment">#二维数组的索引</span>
np<span class="token punctuation">.</span>sort<span class="token punctuation">(</span>arrayname<span class="token punctuation">,</span>axis <span class="token operator">=</span> <span class="token number">0</span><span class="token operator">/</span><span class="token number">1</span><span class="token punctuation">)</span>    <span class="token comment">#数组的排序</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span></span></code></pre>

<p>这三个操作就非常的基本了，切片、索引、排序三个常用方法。类似于python列表的操作，但有一点点不一样。</p>
<p>主要的不同是<code>sort</code>函数，<code>axis</code>参数可以通过坐标轴设定来改变排序方法，<code>axis=1</code>表示横向操作，<code>axis=0</code>表示纵向操作。不输入参数时，默认按行进行排序。</p>
<h5 id="2-合并数组"><a href="#2-合并数组" class="headerlink" title="2.合并数组"></a>2.合并数组</h5><p>在金融分析的时候，我们有时候还需要对不同的数组进行合并，从而达到整合数据的目的。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">np<span class="token punctuation">.</span>append<span class="token punctuation">(</span>array_one<span class="token punctuation">,</span>array_two<span class="token punctuation">)</span>    <span class="token comment">#合并两个数组</span>
np<span class="token punctuation">.</span>concatenate<span class="token punctuation">(</span><span class="token punctuation">[</span>数组<span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">,</span><span class="token punctuation">[</span>数组<span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">,</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">,</span><span class="token punctuation">[</span>数组n<span class="token punctuation">]</span><span class="token punctuation">)</span>    <span class="token comment">#合并多个数组</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span></span></code></pre>

<p>这两个方法都可以对数组进行合并。不同的是，append函数默认是对行进行合并，concatenate函数默认对列进行合并。（append函数使用之后可能会导致数组退化为一维数组）</p>
<h5 id="3-数组计算"><a href="#3-数组计算" class="headerlink" title="3.数组计算"></a>3.数组计算</h5><p>不多废话，直接上方法</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">arrayname<span class="token punctuation">.</span><span class="token builtin">sum</span><span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#对每个数组的元素求和</span>
arrayname<span class="token punctuation">.</span><span class="token builtin">min</span><span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#求数组的元素最小值</span>
arrayname<span class="token punctuation">.</span><span class="token builtin">max</span><span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#求数组元素的最大值</span>
arrayname<span class="token punctuation">.</span>prod<span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#求数组内部元素的乘积</span>
arrayname<span class="token punctuation">.</span>mean<span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#求数组元素的均值</span>
arrayname<span class="token punctuation">.</span>var<span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#求数组元素的方差</span>
arrayname<span class="token punctuation">.</span>std<span class="token punctuation">(</span><span class="token punctuation">)</span>    <span class="token comment">#求数组元素的标准差</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<p>这几个是最常用的方法，默认是对所有元素进行操作。当然，我们也可以通过设置<code>axis参数</code>让它只针对行列进行操作。</p>
<p>下面是数组之间的计算方法，可以类比普通计算方法。这部分内容还是比较通俗易懂的。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">array_one <span class="token operator">+</span> array_two    <span class="token comment">#数组相加</span>
array_one <span class="token operator">-</span> array_two    <span class="token comment">#数组相减</span>
array_one <span class="token operator">*</span> array_two    <span class="token comment">#数组相乘</span>
array_one <span class="token operator">/</span> array_two    <span class="token comment">#数组相除</span>
<span class="token builtin">pow</span><span class="token punctuation">(</span>arrayname<span class="token punctuation">,</span>n<span class="token punctuation">)</span>    <span class="token comment">#数组的幂</span>
np<span class="token punctuation">.</span>dot<span class="token punctuation">(</span>array_one<span class="token punctuation">,</span>array_two<span class="token punctuation">)</span>    <span class="token comment">#计算两个数组的点积</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h5 id="4-矩阵操作"><a href="#4-矩阵操作" class="headerlink" title="4.矩阵操作"></a>4.矩阵操作</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">np<span class="token punctuation">.</span>corrcoef<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#查看相关系数矩阵</span>
np<span class="token punctuation">.</span>diag<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#查看矩阵对角线</span>
np<span class="token punctuation">.</span>triu<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#查看矩阵上三角</span>
np<span class="token punctuation">.</span>tril<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#查看矩阵下三角</span>
np<span class="token punctuation">.</span>trace<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#查看矩阵的迹</span>
np<span class="token punctuation">.</span>transpose<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#查看转置矩阵</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<p>同样，都是线性代数的知识，简单略过。</p>
<h3 id="5-linalg模块"><a href="#5-linalg模块" class="headerlink" title="5.linalg模块"></a>5.linalg模块</h3><p>终于到了linalg子模块的部分了，这个模块主要是用来进行线性代数的工具包。对于金融领域来说，常用的不算很多。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python"><span class="token keyword">import</span> numpy<span class="token punctuation">.</span>linalg <span class="token keyword">as</span> la    <span class="token comment">#导入linalg模块</span>
la<span class="token punctuation">.</span>det<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#矩阵行列式</span>
la<span class="token punctuation">.</span>inv<span class="token punctuation">(</span>arrayname<span class="token punctuation">)</span>    <span class="token comment">#逆矩阵</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span></span></code></pre>

<p>没错，就这两个方法，可以说关于矩阵的运算，numpy基础库就已经可以解决大部分，很多时候并不需要再引入linalg模块。</p>
<h3 id="6-random模块"><a href="#6-random模块" class="headerlink" title="6.random模块"></a>6.random模块</h3><p>哈哈哈，这个子模块可是非常常用的。不仅仅是金融领域，在平常的时候，求一些随机数的时候也经常使用。</p>
<p>random模块主要是通过生成随机种子来创建随机数，而随机种子原理是通过读取用户操作时的时间戳来生成序列。（不过到2038 年 01 月 19 日 03 时 14 分 07 秒就失效了，ee，不知道之后会咋解决这个问题，可能会有大佬想出新的方法？）</p>
<p>好了，这些大概就是random模块随机的原理，接下来，让我们看看基于特定统计分布的随机取样。</p>
<table>
<thead>
<tr>
<th align="center">函数名称</th>
<th align="center">统计分布类型</th>
</tr>
</thead>
<tbody><tr>
<td align="center">beta</td>
<td align="center">贝塔分布</td>
</tr>
<tr>
<td align="center">binomial</td>
<td align="center">二项分布</td>
</tr>
<tr>
<td align="center">chisquare</td>
<td align="center">卡方分布</td>
</tr>
<tr>
<td align="center">exponential</td>
<td align="center">指数分布</td>
</tr>
<tr>
<td align="center">f</td>
<td align="center">F分布</td>
</tr>
<tr>
<td align="center">gamma</td>
<td align="center">伽马分布</td>
</tr>
<tr>
<td align="center">geometric</td>
<td align="center">几何分布</td>
</tr>
<tr>
<td align="center">hypergeometric</td>
<td align="center">超几何分布</td>
</tr>
<tr>
<td align="center">lognormal</td>
<td align="center">对数正态分布</td>
</tr>
<tr>
<td align="center">normal</td>
<td align="center">正态分布</td>
</tr>
<tr>
<td align="center">poisson</td>
<td align="center">泊松分布</td>
</tr>
<tr>
<td align="center">standard_normal</td>
<td align="center">标准正态分布</td>
</tr>
<tr>
<td align="center">standard_t</td>
<td align="center">t分布</td>
</tr>
<tr>
<td align="center">rand</td>
<td align="center">标准均匀分布</td>
</tr>
<tr>
<td align="center">randint</td>
<td align="center">给定区间内随机抽取整数</td>
</tr>
<tr>
<td align="center">randn</td>
<td align="center">标准正态分布</td>
</tr>
</tbody></table>
<p>以上就是整理出来的随机抽样分布表。内容非常的多，这里篇幅有限，就简单介绍几个最常用的随机抽样。</p>
<h5 id="1-基于正态分布的随机抽样"><a href="#1-基于正态分布的随机抽样" class="headerlink" title="1.基于正态分布的随机抽样"></a>1.基于正态分布的随机抽样</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">x_norm <span class="token operator">=</span> npr<span class="token punctuation">.</span>normal<span class="token punctuation">(</span>mean<span class="token punctuation">,</span>std<span class="token punctuation">,</span>I<span class="token punctuation">)</span>
y_norm <span class="token operator">=</span> npr<span class="token punctuation">.</span>randn<span class="token punctuation">(</span>I<span class="token punctuation">)</span>
z_norm <span class="token operator">=</span> npr<span class="token punctuation">.</span>standard_normal<span class="token punctuation">(</span>I<span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"运用normal函数抽样的均值："</span><span class="token punctuation">,</span>x_norm<span class="token punctuation">.</span>mean<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"运用normal函数抽样的标准差："</span><span class="token punctuation">,</span>x_norm<span class="token punctuation">.</span>std<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"运用randn函数抽样的均值："</span><span class="token punctuation">,</span>y_norm<span class="token punctuation">.</span>mean<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"运用randn函数抽样的标准差："</span><span class="token punctuation">,</span>y_norm<span class="token punctuation">.</span>std<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"运用standard_normal函数抽样的均值："</span><span class="token punctuation">,</span>z_norm<span class="token punctuation">.</span>mean<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"运用standard_normal函数抽样的标准差："</span><span class="token punctuation">,</span>z_norm<span class="token punctuation">.</span>std<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<p>其中，I代表随机抽样的次数、mean代表均值、std代表标准差。</p>
<p>经过我的尝试，我觉得运用不同函数从标准正态分布中抽取的随机数，所得到的结果不算很相似。（可能是我运气不好，算出来的结果差别都不小）</p>
<h5 id="2-基于卡方分布的随机抽样"><a href="#2-基于卡方分布的随机抽样" class="headerlink" title="2.基于卡方分布的随机抽样"></a>2.基于卡方分布的随机抽样</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">chis <span class="token operator">=</span> npr<span class="token punctuation">.</span>chisquare<span class="token punctuation">(</span>freedom<span class="token punctuation">,</span>I<span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"卡方分布的均值："</span><span class="token punctuation">,</span>chis<span class="token punctuation">.</span>mean<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"卡方分布的标准差："</span><span class="token punctuation">,</span>chis<span class="token punctuation">.</span>std<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span></span></code></pre>

<p>其中，I代表随机抽样的次数、freedom代表自由度。</p>
<h5 id="3-t分布"><a href="#3-t分布" class="headerlink" title="3.t分布"></a>3.t分布</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">stan <span class="token operator">=</span> npr<span class="token punctuation">.</span>standard_t<span class="token punctuation">(</span>freedom<span class="token punctuation">,</span>I<span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"t分布的均值："</span><span class="token punctuation">,</span>stan<span class="token punctuation">.</span>mean<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">"t分布的标准差："</span><span class="token punctuation">,</span>stan<span class="token punctuation">.</span>std<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span></span></code></pre>

<p>其中，I代表随机抽样的次数、freedom代表自由度。</p>
<h3 id="7-现金流模型"><a href="#7-现金流模型" class="headerlink" title="7.现金流模型"></a>7.现金流模型</h3><p>oh，终于到了金融领域的分析模块了。</p>
<p>先简单介绍一下，针对金融产品的定价方式有3种方法：一是基于现金流贴现的定价方法，二是基于风险与收益的定价方法，三是基于无风险收益的无套利定价方法。其中，现金流贴现方法最为常用。</p>
<p>接下来，我们需要先安装numpy_financial模块。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python"><span class="token keyword">import</span> numpy_financial <span class="token keyword">as</span> npf<span aria-hidden="true" class="line-numbers-rows"><span></span></span></code></pre>

<h5 id="1-现金流终值"><a href="#1-现金流终值" class="headerlink" title="1.现金流终值"></a>1.现金流终值</h5><p><img src="../Python-Numpy/%E7%8E%B0%E9%87%91%E6%B5%81%E7%BB%88%E5%80%BC.png" alt="现金流终值"></p>
<p>现金流的终值是指一定时期内每期期末等额收付款项的复利终值之和。可用fv函数进行计算。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">npf<span class="token punctuation">.</span>fv<span class="token punctuation">(</span>rate<span class="token punctuation">,</span>nper<span class="token punctuation">,</span>pmt<span class="token punctuation">,</span>pv<span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span></span></code></pre>

<p>其中，rate指投资回报率、nper指投资整体期限、pmt指投资期间发生的固定金额现金流、pv指净现金流现值。</p>
<h5 id="2-现金流现值"><a href="#2-现金流现值" class="headerlink" title="2.现金流现值"></a>2.现金流现值</h5><p><img src="../Python-Numpy/%E7%8E%B0%E9%87%91%E6%B5%81%E7%8E%B0%E5%80%BC.png" alt="现金流现值"></p>
<p>现金流现值是指一定时期内每期期末收付款项的复利现值之和。可用pv函数进行计算。</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">npf<span class="token punctuation">.</span>pv<span class="token punctuation">(</span>rate<span class="token punctuation">,</span>nper<span class="token punctuation">,</span>pmt<span class="token punctuation">,</span>pv<span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span></span></code></pre>

<p>其中，rate指投资回报率、nper指投资整体期限、pmt指投资期间发生的固定金额现金流、pv指净现金流现值。</p>
<h5 id="3-净现值"><a href="#3-净现值" class="headerlink" title="3.净现值"></a>3.净现值</h5><p>净现值（NPV）通过计算每个投资期间的成本（负现金流）和收益（正现金流）来确定。期限通常为一年，但可以按季度，半年或数月来衡量。在计算每个时期的现金流量后，每个时期的现值（PV）是通过以定期收益率（市场规定的收益率）贴现其未来价值（见公式）来实现的。</p>
<p><img src="../Python-Numpy/%E5%87%80%E7%8E%B0%E5%80%BC%E5%85%AC%E5%BC%8F.png" alt="净现值公式"></p>
<p>净现值 &#x3D; 未来现金净流量现值-原始投资额现值</p>
<p>运用python计算项目的净现值时，可以运用numpy_financial模块的函数npv</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">npf<span class="token punctuation">.</span>npv<span class="token punctuation">(</span>rate<span class="token punctuation">,</span> values<span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span></span></code></pre>

<p>其中，参数rate代表项目的投资回报率或者贴现率、参数values代表以数组形式输入的期初和存储期每年年末的净现金流。</p>
<p><strong>内含报酬率</strong>是指能够使未来现金净流量现值等于原始投资额现值的折现率。</p>
<p>当净现值&#x3D;0时，未来现金净流量现值&#x3D;原始投资额现值。</p>
<p>运用python计算项目的净现值时，可以运用numpy_financial模块的函数irr</p>
<pre class="line-numbers language-python" data-language="python"><code class="language-python">npf<span class="token punctuation">.</span>irr<span class="token punctuation">(</span>values<span class="token punctuation">)</span><span aria-hidden="true" class="line-numbers-rows"><span></span></span></code></pre>

<p>其中，参数values代表以数组形式输入的期初和存储期每年年末的净现金流。</p>
<h5 id="4-等额本息还款"><a href="#4-等额本息还款" class="headerlink" title="4.等额本息还款"></a>4.等额本息还款</h5><pre class="line-numbers language-python" data-language="python"><code class="language-python">per <span class="token operator">=</span> np<span class="token punctuation">.</span>array<span class="token punctuation">(</span>nper<span class="token punctuation">)</span>
npf<span class="token punctuation">.</span>pmt<span class="token punctuation">(</span>rate<span class="token punctuation">,</span> nper<span class="token punctuation">,</span> pv<span class="token punctuation">)</span>    <span class="token comment">#本息还款金额</span>
npf<span class="token punctuation">.</span>ppmt<span class="token punctuation">(</span>rate<span class="token punctuation">,</span> per<span class="token punctuation">,</span> nper<span class="token punctuation">,</span> pv<span class="token punctuation">)</span>    <span class="token comment">#本息还款本金</span>
npf<span class="token punctuation">.</span>ipmt<span class="token punctuation">(</span>rate<span class="token punctuation">,</span> per<span class="token punctuation">,</span> nper<span class="token punctuation">,</span> pv<span class="token punctuation">)</span>    <span class="token comment">#本息还款利息</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span></span></code></pre>

<p>其中，rate指按揭贷款月利率、nper代表贷款的整体期限、pv代表贷款的本金金额、fv代表期末现金流、per代表逐次还款的期限（用数组表示）。</p>
<h2 id="总结"><a href="#总结" class="headerlink" title="总结"></a>总结</h2><p>综上，Numpy模块是Python在金融领域运用的必备第三方模块。在数据分析方面应用还是很广泛的。后期，我也有可能更新pandas、scipy、matplotlib等模块的金融应用。（maybe）这几个第三方库确实很好用，但是老师上课基本不讲，网络上我也没找到内容和质量好的文章，于是便写了本文。</p>
