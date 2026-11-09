---
title: VIM
date: 2023-08-19 12:00:00
tags:
  - program
  - computer
  - software
categories:
  - Computer
rawhtml: true
---
<h2 id="1-vim介绍"><a href="#1-vim介绍" class="headerlink" title="1.vim介绍"></a>1.vim介绍</h2><h3 id="vim编辑器有三种模式："><a href="#vim编辑器有三种模式：" class="headerlink" title="vim编辑器有三种模式："></a>vim编辑器有三种模式：</h3><p>命令模式、编辑模式、末行模式</p>
<p><strong>模式间切换方法</strong>：<br>（1）命令模式下，输入<code>:</code>后，进入末行模式<br>（2）末行模式下，按<code>esc</code>慢退、按两次<code>esc</code>快退、或者删除所有命令，可以回到命令模式<br>（3）命令模式下，按下<code>i</code>、<code>a</code>等键，可以计入编辑模式<br>（4）编辑模式下，按下<code>esc</code>，可以回到命令模式</p>
<h3 id="vim打开文件："><a href="#vim打开文件：" class="headerlink" title="vim打开文件："></a><strong>vim打开文件</strong>：</h3><table>
<thead>
<tr>
<th>Vi 使用的选项</th>
<th>说 明</th>
</tr>
</thead>
<tbody><tr>
<td>vim filename</td>
<td>打开或新建一个文件，并将光标置于第一行的首部</td>
</tr>
<tr>
<td>vim -r filename</td>
<td>恢复上次 vim 打开时崩溃的文件</td>
</tr>
<tr>
<td>vim -R filename</td>
<td>把指定的文件以只读方式放入 Vim 编辑器中</td>
</tr>
<tr>
<td>vim + filename</td>
<td>打开文件，并将光标置于最后一行的首部</td>
</tr>
<tr>
<td>vim +n filename</td>
<td>打开文件，并将光标置于第 n 行的首部</td>
</tr>
<tr>
<td>vim +&#x2F;pattern filename</td>
<td>打幵文件，并将光标置于第一个与 pattern 匹配的位置</td>
</tr>
<tr>
<td>vim -c command filename</td>
<td>在对文件进行编辑前，先执行指定的命令</td>
</tr>
</tbody></table>
<h2 id="2-命令模式"><a href="#2-命令模式" class="headerlink" title="2.命令模式"></a>2.命令模式</h2><h3 id="1-光标移动"><a href="#1-光标移动" class="headerlink" title="1.光标移动"></a>1.光标移动</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>jkhl</td>
<td>基本移动，上下左右</td>
</tr>
<tr>
<td>gg</td>
<td>光标移动到文档首行</td>
</tr>
<tr>
<td>G</td>
<td>光标移动到文档尾行</td>
</tr>
<tr>
<td>^或_</td>
<td>光标移动到行首第一个非空字符</td>
</tr>
<tr>
<td>home键或0或者g0</td>
<td>光标移动到行首第一个字符</td>
</tr>
<tr>
<td>g_</td>
<td>光标移动到行尾最后一个非空字符</td>
</tr>
<tr>
<td>end或或者 g 或者g或者<em>g</em></td>
<td>光标移动到行尾最后一个字符</td>
</tr>
<tr>
<td>gm</td>
<td>光标移动到当前行中间处</td>
</tr>
<tr>
<td>b&#x2F;B</td>
<td>光标向前移动一个单词（大写忽略&#x2F;-等等特殊字符）</td>
</tr>
<tr>
<td>w&#x2F;W</td>
<td>光标向后移动一个单词（大写忽略&#x2F;-等等特殊字符）</td>
</tr>
<tr>
<td>e&#x2F;E</td>
<td>移到单词结尾（大写忽略&#x2F;-等等特殊字符）</td>
</tr>
<tr>
<td>ctrl+b或pageUp键</td>
<td>翻屏操作，向上翻</td>
</tr>
<tr>
<td>ctrl+f或pageDn键</td>
<td>翻屏操作，向下翻</td>
</tr>
<tr>
<td>数字+G</td>
<td>快速将光标移动到指定行</td>
</tr>
<tr>
<td>&#96;.</td>
<td>移动到上次编辑处</td>
</tr>
<tr>
<td>数字+上下方向键</td>
<td>以当前光标为准，向上&#x2F;下移动n行</td>
</tr>
<tr>
<td>数字+左右方向键</td>
<td>以当前光标为准，向左&#x2F;右移动n个字符</td>
</tr>
<tr>
<td>H</td>
<td>移动到屏幕顶部</td>
</tr>
<tr>
<td>M</td>
<td>移动到屏幕中间</td>
</tr>
<tr>
<td>L</td>
<td>移动到屏幕尾部</td>
</tr>
<tr>
<td>z+Enter键</td>
<td>当前行在屏幕顶部</td>
</tr>
<tr>
<td>z+ .</td>
<td>当前行在屏幕中间</td>
</tr>
<tr>
<td>z+ -</td>
<td>当前行在屏幕底部</td>
</tr>
<tr>
<td>shift+6</td>
<td>光标移动到行首</td>
</tr>
<tr>
<td>shift+4</td>
<td>光标移动到行尾</td>
</tr>
<tr>
<td>-</td>
<td>移动到上一行第一个非空字符</td>
</tr>
<tr>
<td>+</td>
<td>移动到下一行第一个非空字符</td>
</tr>
<tr>
<td>)</td>
<td>向前移动一个句子</td>
</tr>
<tr>
<td>(</td>
<td>向后移动一个句子</td>
</tr>
<tr>
<td>}</td>
<td>向前移动一个段落</td>
</tr>
<tr>
<td>{</td>
<td>向前移动一个段落</td>
</tr>
<tr>
<td>count l</td>
<td>移动到count 列</td>
</tr>
<tr>
<td>counth</td>
<td>向左移动count 字符</td>
</tr>
<tr>
<td>countl</td>
<td>向右移动count字符</td>
</tr>
<tr>
<td>countgo</td>
<td>移动到count字符</td>
</tr>
</tbody></table>
<h3 id="2-选中内容"><a href="#2-选中内容" class="headerlink" title="2.选中内容"></a>2.选中内容</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>v</td>
<td>进行字符选中</td>
</tr>
<tr>
<td>V 或shift+v</td>
<td>进行行选中</td>
</tr>
<tr>
<td>gv</td>
<td>选中上一次选择的内容</td>
</tr>
<tr>
<td>o</td>
<td>光标移动到选中内容另一处结尾</td>
</tr>
<tr>
<td>O</td>
<td>光标移动到选中内容另一处角落</td>
</tr>
<tr>
<td>ctr + V</td>
<td>进行块选中</td>
</tr>
</tbody></table>
<h3 id="3-复制（配合粘贴命令p使用）"><a href="#3-复制（配合粘贴命令p使用）" class="headerlink" title="3.复制（配合粘贴命令p使用）"></a>3.复制（配合粘贴命令p使用）</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>y</td>
<td>复制已选中的文本到剪贴板</td>
</tr>
<tr>
<td>n+yy</td>
<td>复制光标所在行，此命令前可以加数字 n，可复制多行</td>
</tr>
<tr>
<td>yw</td>
<td>复制光标位置的单词</td>
</tr>
<tr>
<td>ctrl+v + 方向键+yy</td>
<td>ctrl+v，并按方向键选中区块，按下yy复制</td>
</tr>
</tbody></table>
<h3 id="4-剪切"><a href="#4-剪切" class="headerlink" title="4.剪切"></a>4.剪切</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>dd</td>
<td>剪切<strong>光标所在行</strong></td>
</tr>
<tr>
<td>数字+dd</td>
<td>以光标所在行为准（包含当前行），<strong>向下剪切指定行数</strong></td>
</tr>
<tr>
<td>D</td>
<td>剪切光标所在行</td>
</tr>
</tbody></table>
<h3 id="5-粘贴"><a href="#5-粘贴" class="headerlink" title="5.粘贴"></a>5.粘贴</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>p</td>
<td>将剪贴板中的内容<strong>粘贴到光标后</strong></td>
</tr>
<tr>
<td>P（大写）</td>
<td>将剪贴板中的内容<strong>粘贴到光标前</strong></td>
</tr>
</tbody></table>
<h3 id="6-删除"><a href="#6-删除" class="headerlink" title="6.删除"></a>6.删除</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>x</td>
<td>删除<strong>光标所在位置</strong>的字符</td>
</tr>
<tr>
<td>X(大写)</td>
<td>删除<strong>光标前</strong>一个字符</td>
</tr>
<tr>
<td>dd</td>
<td>删除<strong>光标所在行</strong>，删除之后，<strong>下一行上移</strong></td>
</tr>
<tr>
<td>D</td>
<td>删除<strong>光标位置到行尾</strong>的内容，删除之后，<strong>下一行不上移</strong></td>
</tr>
<tr>
<td>ndd</td>
<td>删除当前行（包括此行）后 n 行文本</td>
</tr>
<tr>
<td>dw</td>
<td>移动光标到单词的开头以删除该单词</td>
</tr>
<tr>
<td>dG</td>
<td>删除光标所在行一直到文件末尾的所有内容</td>
</tr>
<tr>
<td>:a1,a2d</td>
<td>删除从 a1 行到 a2 行的文本内容</td>
</tr>
</tbody></table>
<h3 id="7-撤销-恢复"><a href="#7-撤销-恢复" class="headerlink" title="7.撤销&#x2F;恢复"></a>7.撤销&#x2F;恢复</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>u</td>
<td>撤销</td>
</tr>
<tr>
<td>ctrl+r</td>
<td>恢复</td>
</tr>
<tr>
<td>U(大写)</td>
<td>撤销所有编辑</td>
</tr>
</tbody></table>
<h3 id="8-字符转换"><a href="#8-字符转换" class="headerlink" title="8.字符转换"></a>8.字符转换</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>~</td>
<td>转换大小写</td>
</tr>
<tr>
<td>u</td>
<td>变成小写</td>
</tr>
<tr>
<td>U</td>
<td>变成大写</td>
</tr>
</tbody></table>
<h3 id="9-编辑命令的快捷键"><a href="#9-编辑命令的快捷键" class="headerlink" title="9.编辑命令的快捷键"></a>9.编辑命令的快捷键</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>↑或ctr + p</td>
<td>上一条命令</td>
</tr>
<tr>
<td>↓或ctr + n</td>
<td>下一条命令</td>
</tr>
<tr>
<td>ctr + b</td>
<td>移动到命令行开头</td>
</tr>
<tr>
<td>ctr + e</td>
<td>移动到命令行结尾</td>
</tr>
<tr>
<td>ctr + ←</td>
<td>向左一个单词</td>
</tr>
<tr>
<td>ctr + →</td>
<td>向右一个单词</td>
</tr>
</tbody></table>
<h2 id="3-末行模式-xxx命令"><a href="#3-末行模式-xxx命令" class="headerlink" title="3.末行模式(: xxx命令)"></a>3.末行模式(: xxx命令)</h2><h3 id="1-保存-退出文件操作"><a href="#1-保存-退出文件操作" class="headerlink" title="1.保存&#x2F;退出文件操作"></a>1.保存&#x2F;退出文件操作</h3><table>
<thead>
<tr>
<th>命令</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>:wq</td>
<td>保存并退出 Vim 编辑器</td>
</tr>
<tr>
<td>:wq!</td>
<td>保存并强制退出 Vim 编辑器</td>
</tr>
<tr>
<td>:q</td>
<td>不保存就退出 Vim 编辑器</td>
</tr>
<tr>
<td>:q!</td>
<td>不保存，且强制退出 Vim 编辑器</td>
</tr>
<tr>
<td>:w</td>
<td>保存但是不退出 Vim 编辑器</td>
</tr>
<tr>
<td>:w!</td>
<td>强制保存文本</td>
</tr>
<tr>
<td>:w filename</td>
<td>另存到 filename 文件</td>
</tr>
<tr>
<td>x！</td>
<td>保存文本，并退出 Vim 编辑器</td>
</tr>
<tr>
<td>ZZ</td>
<td>直接退出 Vim 编辑器</td>
</tr>
</tbody></table>
<h3 id="2-查找：“-关键词”"><a href="#2-查找：“-关键词”" class="headerlink" title="2.查找：“&#x2F;关键词”"></a>2.查找：“&#x2F;关键词”</h3><p>在查找结果中，用<code>N</code>、<code>n</code>可以切换上下结果；输入<code>nohl</code>，可以取消高亮</p>
<table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>&#x2F;abc</td>
<td>从光标所在位置<strong>向前查找</strong>字符串 abc</td>
</tr>
<tr>
<td>&#x2F;^abc</td>
<td>查找以 abc 为行首的行</td>
</tr>
<tr>
<td>&#x2F;abc$</td>
<td>查找以 abc 为行尾的行</td>
</tr>
<tr>
<td>?abc</td>
<td>从光标所在位置<strong>向后查找</strong>字符串 abc</td>
</tr>
<tr>
<td>n或；</td>
<td>向同一方向重复上次的查找指令</td>
</tr>
<tr>
<td>N或,</td>
<td>向相反方向重复上次的查找指定</td>
</tr>
</tbody></table>
<h3 id="3-替换"><a href="#3-替换" class="headerlink" title="3.替换"></a>3.替换</h3><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>r</td>
<td>替换光标所在位置的字符</td>
</tr>
<tr>
<td>R</td>
<td>从光标所在位置开始替换字符，其输入内容会覆盖掉后面等长的文本内容，按“Esc”可以结束</td>
</tr>
<tr>
<td><code>:s/a1/a2</code></td>
<td>替换<strong>当前光标所在行第一处</strong>符合条件的内容</td>
</tr>
<tr>
<td><code>:s/a1/a2/g</code></td>
<td>替换<strong>当前光标所在行</strong>所有的 a1 都用 a2 替换</td>
</tr>
<tr>
<td><code>:%s/a1/a2</code></td>
<td>替换<strong>所有行</strong>中，<strong>第一处</strong>符合条件的内容</td>
</tr>
<tr>
<td><code>:%s/a1/a2/g</code></td>
<td>替换<strong>所有行</strong>中，<strong>所有</strong>符合条件的内容</td>
</tr>
<tr>
<td><code>:n1,n2 s/a1/a2</code></td>
<td>将文件中 <strong>n1 到 n2 行</strong>中<strong>第一处</strong> a1 都用 a2 替换</td>
</tr>
<tr>
<td><code>:n1,n2 s/a1/a2/g</code></td>
<td>将文件中 <strong>n1 到 n2 行</strong>中<strong>所有</strong> a1 都用 a2 替换</td>
</tr>
</tbody></table>
<h3 id="4-行号显示：“-set-nu”"><a href="#4-行号显示：“-set-nu”" class="headerlink" title="4.行号显示：“: set nu”;"></a>4.行号显示：“: set nu”;</h3><ol>
<li>行号显示<code>:set nu</code></li>
<li>取消行号显示：<code>:set nonu</code></li>
</ol>
<h3 id="5-文件切换"><a href="#5-文件切换" class="headerlink" title="5.文件切换"></a>5.文件切换</h3><p>使用vim打开多个文件后，在末行模式下可以进行切换。</p>
<ol>
<li>查看当前已经打开的所有文件：<code>:files</code>(%a表示激活状态，#表示上一个打开的文件)</li>
<li>切换到指定文件：<code>:open 文件名</code></li>
<li>切换到上一个文(back previous)：<code>:bp</code></li>
<li>切换到下一个文件(back next)：<code>:bn</code></li>
</ol>
<h2 id="4-编辑模式"><a href="#4-编辑模式" class="headerlink" title="4.编辑模式"></a>4.编辑模式</h2><table>
<thead>
<tr>
<th>快捷键</th>
<th>功能描述</th>
</tr>
</thead>
<tbody><tr>
<td>i</td>
<td>在当前<strong>光标所在位置插入</strong>，光标后的文本相应向右移动</td>
</tr>
<tr>
<td>I</td>
<td>在<strong>光标所在行的行首插入</strong>，行首是该行的第一个非空白字符，相当于光标移动到行首执行 i 命令</td>
</tr>
<tr>
<td>o</td>
<td>在<strong>光标所在行的下插入</strong>新的一行。光标停在空行首，等待输入文本</td>
</tr>
<tr>
<td>O（大写）</td>
<td>在<strong>光标所在行的上插入</strong>新的一行。光标停在空行的行首，等待输入文本</td>
</tr>
<tr>
<td>a</td>
<td>在当前<strong>光标所在位置之后插入</strong></td>
</tr>
<tr>
<td>A</td>
<td>在<strong>光标所在行的行尾插入</strong>，相当于光标移动到行尾再执行 a 命令</td>
</tr>
<tr>
<td>esc键</td>
<td>退出编辑模式</td>
</tr>
</tbody></table>
<h2 id="5-扩展"><a href="#5-扩展" class="headerlink" title="5.扩展"></a>5.扩展</h2><p>1.代码颜色显示：“：syntax on&#x2F;off”</p>
<p>2.<strong>vim内置计算器</strong>：<br>a.进入编辑模式<br>b.按<code>“ctrl+r</code>，光标变成引号，，输入<code>=</code>，光标转到最后一行<br>c.输入需要计算的内容，按下enter后，计算结果回替代上一步中的引号，光标恢复</p>
<p>3.<strong>vim的配置</strong><br>a.文件打开时，末行模式下输入的配置为临时配置，关闭文件后配置无效<br>b.修改个人配置文件，可以永久保存个人配置（~&#x2F;.vimrc，如果没有可以自行创建）<br>c.修改全局配置文件，对每个用户生效（vim自带，&#x2F;etc&#x2F;vimrc）</p>
<p>注：个人配置文件优先级更高，当个人配置和全局配置发生冲突时，系统以当前用户的个人配置文件为准</p>
<p>4.<strong>异常退出</strong></p>
<p>在编辑文件后，未正常保存退出时，会产生异常退出交换文件（.原文件名.swp）<br>将交换文件删除后，再次打开文件时，无提示：“#rm -f .原文件名.swp”</p>
<p>5.<strong>别名机制</strong>：自定义指令<br>Linux中，存在一个别名映射文件： ~&#x2F;.bashrc<br>修改文件内容，可以自定义指令，重新登录账号后生效</p>
<p>6.<strong>文件快捷方式</strong><br>对于深层文件，可以创建文件快捷方式，便于后续操作：#ln -s 源路径 新路径</p>
<p>7.<strong>退出方式</strong><br>（1）在vim中退出文件编辑模式，可以使用<code>:q</code>或者<code>:wq</code><br>（2）建议使用<code>:x</code>：使用效果等同于<code>wq</code>，如果文件有改动则先保存后退出；但是如果文件没有做修改，会直接退出，不会修改文件更新时间，避免用户混淆文件的修改时间</p>
