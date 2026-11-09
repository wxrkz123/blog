---
title: DID 从入门到精通（00）：系列导读与学习路线
date: 2026-10-08 10:11:00
top: true
categories: Econometrics
tags: [DID]
summary: 一套从零基础到前沿方法的双重差分（DID）系统教程，共 12 篇。本篇给出完整路线图、每篇要点、阅读方法与环境准备。
---

这是「DID 从入门到精通」系列的导读篇。整个系列共 12 篇，从“相关不等于因果”这个最朴素的问题讲起，一路讲到交错 DID、异质性稳健估计量、HonestDiD 敏感性分析这些近几年的前沿方法。目标不是背公式、套命令，而是让你真正理解 **DID 在识别什么、凭什么能识别、什么时候会失效、失效了怎么办**。

<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><defs><path id="MJX-TEX-I-1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z"></path><path id="MJX-TEX-I-1D461" d="M26 385Q19 392 19 395Q19 399 22 411T27 425Q29 430 36 430T87 431H140L159 511Q162 522 166 540T173 566T179 586T187 603T197 615T211 624T229 626Q247 625 254 615T261 596Q261 589 252 549T232 470L222 433Q222 431 272 431H323Q330 424 330 420Q330 398 317 385H210L174 240Q135 80 135 68Q135 26 162 26Q197 26 230 60T283 144Q285 150 288 151T303 153H307Q322 153 322 145Q322 142 319 133Q314 117 301 95T267 48T216 6T155 -11Q125 -11 98 4T59 56Q57 64 57 83V101L92 241Q127 382 128 383Q128 385 77 385H26Z"></path><path id="MJX-TEX-I-1D44C" d="M66 637Q54 637 49 637T39 638T32 641T30 647T33 664T42 682Q44 683 56 683Q104 680 165 680Q288 680 306 683H316Q322 677 322 674T320 656Q316 643 310 637H298Q242 637 242 624Q242 619 292 477T343 333L346 336Q350 340 358 349T379 373T411 410T454 461Q546 568 561 587T577 618Q577 634 545 637Q528 637 528 647Q528 649 530 661Q533 676 535 679T549 683Q551 683 578 682T657 680Q684 680 713 681T746 682Q763 682 763 673Q763 669 760 657T755 643Q753 637 734 637Q662 632 617 587Q608 578 477 424L348 273L322 169Q295 62 295 57Q295 46 363 46Q379 46 384 45T390 35Q390 33 388 23Q384 6 382 4T366 1Q361 1 324 1T232 2Q170 2 138 2T102 1Q84 1 84 9Q84 14 87 24Q88 27 89 30T90 35T91 39T93 42T96 44T101 45T107 45T116 46T129 46Q168 47 180 50T198 63Q201 68 227 171L252 274L129 623Q128 624 127 625T125 627T122 629T118 631T113 633T105 634T96 635T83 636T66 637Z"></path><path id="MJX-TEX-I-1D437" d="M287 628Q287 635 230 637Q207 637 200 638T193 647Q193 655 197 667T204 682Q206 683 403 683Q570 682 590 682T630 676Q702 659 752 597T803 431Q803 275 696 151T444 3L430 1L236 0H125H72Q48 0 41 2T33 11Q33 13 36 25Q40 41 44 43T67 46Q94 46 127 49Q141 52 146 61Q149 65 218 339T287 628ZM703 469Q703 507 692 537T666 584T629 613T590 629T555 636Q553 636 541 636T512 636T479 637H436Q392 637 386 627Q384 623 313 339T242 52Q242 48 253 48T330 47Q335 47 349 47T373 46Q499 46 581 128Q617 164 640 212T683 339T703 469Z"></path><path id="MJX-TEX-N-28" d="M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z"></path><path id="MJX-TEX-N-31" d="M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z"></path><path id="MJX-TEX-N-29" d="M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z"></path><path id="MJX-TEX-N-30" d="M96 585Q152 666 249 666Q297 666 345 640T423 548Q460 465 460 320Q460 165 417 83Q397 41 362 16T301 -15T250 -22Q224 -22 198 -16T137 16T82 83Q39 165 39 320Q39 494 96 585ZM321 597Q291 629 250 629Q208 629 178 597Q153 571 145 525T137 333Q137 175 145 125T181 46Q209 16 250 16Q290 16 318 46Q347 76 354 130T362 333Q362 478 354 524T321 597Z"></path><path id="MJX-TEX-I-1D43A" d="M50 252Q50 367 117 473T286 641T490 704Q580 704 633 653Q642 643 648 636T656 626L657 623Q660 623 684 649Q691 655 699 663T715 679T725 690L740 705H746Q760 705 760 698Q760 694 728 561Q692 422 692 421Q690 416 687 415T669 413H653Q647 419 647 422Q647 423 648 429T650 449T651 481Q651 552 619 605T510 659Q492 659 471 656T418 643T357 615T294 567T236 496T189 394T158 260Q156 242 156 221Q156 173 170 136T206 79T256 45T308 28T353 24Q407 24 452 47T514 106Q517 114 529 161T541 214Q541 222 528 224T468 227H431Q425 233 425 235T427 254Q431 267 437 273H454Q494 271 594 271Q634 271 659 271T695 272T707 272Q721 272 721 263Q721 261 719 249Q714 230 709 228Q706 227 694 227Q674 227 653 224Q646 221 643 215T629 164Q620 131 614 108Q589 6 586 3Q584 1 581 1Q571 1 553 21T530 52Q530 53 528 52T522 47Q448 -22 322 -22Q201 -22 126 55T50 252Z"></path><path id="MJX-TEX-N-221E" d="M55 217Q55 305 111 373T254 442Q342 442 419 381Q457 350 493 303L507 284L514 294Q618 442 747 442Q833 442 888 374T944 214Q944 128 889 59T743 -11Q657 -11 580 50Q542 81 506 128L492 147L485 137Q381 -11 252 -11Q166 -11 111 57T55 217ZM907 217Q907 285 869 341T761 397Q740 397 720 392T682 378T648 359T619 335T594 310T574 285T559 263T548 246L543 238L574 198Q605 158 622 138T664 94T714 61T765 51Q827 51 867 100T907 217ZM92 214Q92 145 131 89T239 33Q357 33 456 193L425 233Q364 312 334 337Q285 380 233 380Q171 380 132 331T92 214Z"></path><path id="MJX-TEX-I-1D70F" d="M39 284Q18 284 18 294Q18 301 45 338T99 398Q134 425 164 429Q170 431 332 431Q492 431 497 429Q517 424 517 402Q517 388 508 376T485 360Q479 358 389 358T299 356Q298 355 283 274T251 109T233 20Q228 5 215 -4T186 -13Q153 -13 153 20V30L203 192Q214 228 227 272T248 336L254 357Q254 358 208 358Q206 358 197 358T183 359Q105 359 61 295Q56 287 53 286T39 284Z"></path></defs></svg>
## 为什么还要写一套 DID 教程

打开任何一本经济学、金融学、管理学期刊，双重差分都是出镜率最高的因果识别方法之一：

- 某地上调最低工资，就业到底减少了没有？
- “营改增”、研发费用加计扣除等税收政策，有没有提高企业投资和创新？
- 某城市被列为低碳试点，当地企业的排放、生产率怎么变化？
- 一家公司被纳入融资融券标的，它的股价信息效率有没有提高？

这类问题有一个共同结构：**一部分个体在某个时点受到了政策冲击，另一部分没有**。DID 的思路非常直观——用没有受冲击的那组“同期变化了多少”，去推算受冲击那组“如果没受冲击会变化多少”，两者之差就是政策效应。

网上的 DID 教程很多，但大部分停留在“怎么跑命令”的层面。一旦遇到下面这类问题，只会“跑”就不够了：

- 事件研究图的前期系数都不显著，就能说平行趋势成立了吗？
- 为什么同一份数据，聚类到企业时高度显著，聚类到省份时就不显著了？
- 政策是分批实施的，`reghdfe y treat_post, absorb(id year)` 的结果还能信吗？为什么有时候它甚至会给出和真实效应相反的符号？
- Callaway-Sant'Anna、Sun-Abraham、插补法、did2s……这么多新方法，到底有什么区别，该用哪个？

2018 年以后，计量经济学界对 DID 进行了一次大规模的反思，很多“标准做法”被重新审视。本系列会把这段方法论的演进完整讲清楚，并且 **每个结论都配有可以运行的代码和模拟数据**，让你亲眼看到“对的方法”和“错的方法”差在哪里。

## 版本约定

- 代码 **以 Python 为主、Stata 作对照**。所有 Python 代码都在本地跑通，文中给出的数字就是真实运行结果（使用模拟数据并固定了随机种子，你运行后应得到相同的结果）。
- 本系列使用的版本：Python 3.13、pandas 3.0、statsmodels 0.15、pyfixest 0.60、linearmodels 7.0、differences 0.3。
- Stata 代码依赖若干 ssc 外部命令，安装方法见下文“推荐的配套资源”。

## 路线图

整个系列分为三个阶段，每个阶段之间有明确的依赖关系，建议按顺序阅读。

```text
入门篇（01-04）  理解 DID 在识别什么，能正确地跑出一个 2×2 DID
   │   潜在结果 → 四格表 → 识别假设 → 回归与聚类标准误
   ▼
进阶篇（05-08）  掌握实证论文的标准流程
   │   双向固定效应 → 事件研究 → 稳健性检验 → 统计推断
   ▼
高级篇（09-11）  理解近年的方法论革新，应对审稿人的追问
       交错 DID 的陷阱 → 异质性稳健估计量 → 敏感性分析与研究清单
```

### 第一阶段：入门篇

| 篇目 | 主题 | 你将理解 |
| --- | --- | --- |
| 01 | {% post_link DID-01-Causal-Inference-Basics 因果推断基础：潜在结果与选择偏差 %} | 潜在结果框架、ATE 与 ATT、为什么简单对比不可靠 |
| 02 | {% post_link DID-02-Intuition-Card-Krueger DID 的直觉：四格表与最低工资研究 %} | 2×2 DID 的手算；两次相减各自消除了什么 |
| 03 | {% post_link DID-03-Identification 2×2 DID 的识别：平行趋势与三个关键假设 %} | 平行趋势、无预期效应、SUTVA；DID 与交互项回归的等价性 |
| 04 | {% post_link DID-04-Regression 用回归估计 DID：交互项、控制变量与聚类标准误 %} | 四种等价的估计方法；控制变量怎么加；标准误为什么要聚类 |

### 第二阶段：进阶篇

| 篇目 | 主题 | 你将理解 |
| --- | --- | --- |
| 05 | {% post_link DID-05-TWFE 多期 DID 与双向固定效应模型 %} | TWFE、组内变换、LSDV；高维固定效应与组别趋势的陷阱 |
| 06 | {% post_link DID-06-Event-Study 事件研究法与平行趋势检验 %} | 动态效应、基期选择、前期系数联合检验、事件研究图 |
| 07 | {% post_link DID-07-Robustness 稳健性检验工具箱：安慰剂、PSM-DID 与三重差分 %} | 每种稳健性检验在排除什么担忧，以及它们的局限 |
| 08 | {% post_link DID-08-Inference 统计推断：聚类标准误、少聚类问题与 Wild Bootstrap %} | 错误的标准误有多危险；处理组聚类太少时怎么办 |

### 第三阶段：高级篇

| 篇目 | 主题 | 你将理解 |
| --- | --- | --- |
| 09 | {% post_link DID-09-Staggered-TWFE-Problems 交错 DID 的陷阱：Goodman-Bacon 分解与负权重 %} | 政策分批实施时 TWFE 为什么会出错，甚至符号相反 |
| 10 | {% post_link DID-10-Robust-Estimators 异质性稳健估计量：CS、SA、插补法、did2s 与 Stacked DID %} | 五种新方法的思路、对照组、假设与软件实现 |
| 11 | {% post_link DID-11-Frontiers-and-Practice 前沿与实战：预检验的局限、HonestDiD 与完整研究清单 %} | 平行趋势不完全成立时怎么办；一份完整的 DID 实证清单 |

## 怎样读这个系列

### 1. 一定要亲手跑代码

每篇文章都用模拟数据，而且 **真实效应是已知的**。这是学习计量方法最好的方式：你可以清楚地看到一个估计量是对是错、偏了多少。建议把代码复制到 Jupyter 中逐段运行，再改改参数（样本量、效应大小、趋势差异），观察结果怎么变。

### 2. 学会查“第一手资料”

DID 的方法论进展几乎都发表在 *Journal of Econometrics*、*Review of Economic Studies*、*American Economic Review* 等期刊上。每篇文章末尾都列出了参考文献，遇到不理解的地方，回到原始论文往往比看二手解读更清楚。几篇综述尤其值得精读，见第 11 篇的推荐阅读。

### 3. 理解优先于记忆

不要背“交错 DID 要用 csdid”这样的结论，而要理解 **为什么**：TWFE 用已处理组作为对照组，在效应随时间变化时会出错；CS 只用干净的对照组，所以没有这个问题。理解了原理，遇到新方法时你也能很快判断它在解决什么问题。

### 4. 做练习

每篇文章末尾都有几道练习题，有的是推导，有的是修改模拟代码验证结论。真正掌握一个方法的标志，是能自己设计一个模拟来检验它。

## 符号约定

为了避免在不同文章里来回切换记号，这里先统一一下：

| 符号 | 含义 |
| --- | --- |
| <svg aria-label="i" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="0.781ex" height="1.52ex" role="img" focusable="false" viewBox="0 -661 345 672" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g></g></g></svg> | 个体（企业、个人、城市……） |
| <svg aria-label="t" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="0.817ex" height="1.441ex" role="img" focusable="false" viewBox="0 -626 361 637" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></svg> | 时间（年、季度……） |
| <svg aria-label="Y_{it}" style="vertical-align: -0.357ex;" xmlns="http://www.w3.org/2000/svg" width="2.632ex" height="1.902ex" role="img" focusable="false" viewBox="0 -683 1163.2 840.8" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g><g data-mml-node="mi" transform="translate(345,0)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></g></svg> | 个体 <svg aria-label="i" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="0.781ex" height="1.52ex" role="img" focusable="false" viewBox="0 -661 345 672" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g></g></g></svg> 在 <svg aria-label="t" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="0.817ex" height="1.441ex" role="img" focusable="false" viewBox="0 -626 361 637" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></svg> 期的观测结果 |
| <svg aria-label="D_{it}" style="vertical-align: -0.357ex;" xmlns="http://www.w3.org/2000/svg" width="3.191ex" height="1.902ex" role="img" focusable="false" viewBox="0 -683 1410.2 840.8" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D437" xlink:href="#MJX-TEX-I-1D437"></use></g><g data-mml-node="TeXAtom" transform="translate(861,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g><g data-mml-node="mi" transform="translate(345,0)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g></g></g></svg> | 处理状态，受政策影响为 1，否则为 0 |
| <svg aria-label="Y_{it}(1)" style="vertical-align: -0.566ex;" xmlns="http://www.w3.org/2000/svg" width="5.523ex" height="2.262ex" role="img" focusable="false" viewBox="0 -750 2441.2 1000" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g><g data-mml-node="mi" transform="translate(345,0)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g><g data-mml-node="mo" transform="translate(1163.2,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(1552.2,0)"><use data-c="31" xlink:href="#MJX-TEX-N-31"></use></g><g data-mml-node="mo" transform="translate(2052.2,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g></g></g></svg>、<svg aria-label="Y_{it}(0)" style="vertical-align: -0.566ex;" xmlns="http://www.w3.org/2000/svg" width="5.523ex" height="2.262ex" role="img" focusable="false" viewBox="0 -750 2441.2 1000" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D44C" xlink:href="#MJX-TEX-I-1D44C"></use></g><g data-mml-node="TeXAtom" transform="translate(614,-150) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g><g data-mml-node="mi" transform="translate(345,0)"><use data-c="1D461" xlink:href="#MJX-TEX-I-1D461"></use></g></g></g><g data-mml-node="mo" transform="translate(1163.2,0)"><use data-c="28" xlink:href="#MJX-TEX-N-28"></use></g><g data-mml-node="mn" transform="translate(1552.2,0)"><use data-c="30" xlink:href="#MJX-TEX-N-30"></use></g><g data-mml-node="mo" transform="translate(2052.2,0)"><use data-c="29" xlink:href="#MJX-TEX-N-29"></use></g></g></g></svg> | 潜在结果：接受处理 / 不接受处理时的结果 |
| <svg aria-label="G_i" style="vertical-align: -0.357ex;" xmlns="http://www.w3.org/2000/svg" width="2.518ex" height="1.952ex" role="img" focusable="false" viewBox="0 -705 1113 862.8" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mi"><use data-c="1D43A" xlink:href="#MJX-TEX-I-1D43A"></use></g><g data-mml-node="mi" transform="translate(819,-150) scale(0.707)"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g></g></g></g></svg> | 个体 <svg aria-label="i" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="0.781ex" height="1.52ex" role="img" focusable="false" viewBox="0 -661 345 672" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D456" xlink:href="#MJX-TEX-I-1D456"></use></g></g></g></svg> 首次受处理的时期（处理批次，cohort），从未处理记为 <svg aria-label="\infty" style="vertical-align: -0.025ex;" xmlns="http://www.w3.org/2000/svg" width="2.262ex" height="1.025ex" role="img" focusable="false" viewBox="0 -442 1000 453" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="221E" xlink:href="#MJX-TEX-N-221E"></use></g></g></g></svg>（代码中记为 0） |
| <svg aria-label="\tau" style="vertical-align: -0.029ex;" xmlns="http://www.w3.org/2000/svg" width="1.17ex" height="1.005ex" role="img" focusable="false" viewBox="0 -431 517 444" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><use data-c="1D70F" xlink:href="#MJX-TEX-I-1D70F"></use></g></g></g></svg> | 处理效应 |
| ATT | 处理组的平均处理效应（Average Treatment effect on the Treated） |

## 推荐的配套资源

**Python 环境**

```bash
pip install numpy pandas matplotlib statsmodels scikit-learn scipy
pip install linearmodels      # 面板数据模型
pip install pyfixest          # 高维固定效应回归，语法接近 R 的 fixest / Stata 的 reghdfe
pip install differences       # Callaway & Sant'Anna 估计量
pip install wildboottest      # wild cluster bootstrap（pyfixest 会调用）
```

**Stata 外部命令**

```stata
ssc install reghdfe, replace
ssc install ftools, replace
ssc install csdid, replace              // Callaway & Sant'Anna
ssc install drdid, replace              // 双重稳健 DID（csdid 依赖它）
ssc install did_imputation, replace     // Borusyak, Jaravel & Spiess
ssc install eventstudyinteract, replace // Sun & Abraham
ssc install did_multiplegt_dyn, replace // de Chaisemartin & D'Haultfœuille
ssc install bacondecomp, replace        // Goodman-Bacon 分解
ssc install boottest, replace           // wild cluster bootstrap
ssc install coefplot, replace
```

**书籍**

- Angrist, J. D., & Pischke, J.-S. (2009). *Mostly Harmless Econometrics*. Princeton University Press.
- Cunningham, S. (2021). *Causal Inference: The Mixtape*. Yale University Press.（免费在线版：mixtape.scunning.com）
- Huntington-Klein, N. (2021). *The Effect*. CRC Press.（免费在线版：theeffectbook.net）

**前置知识**：期望、方差、条件期望、假设检验；最小二乘回归、虚拟变量与交互项（伍德里奇《计量经济学导论》前 7 章足够）；会用 pandas 读写数据。本博客的「Python 从入门到精通」系列可以作为编程方面的补充。

## 写在最后

DID 的核心其实只有一句话：**用对照组的变化，构造处理组的反事实变化**。整个系列所有的复杂性，都来自于对这句话的追问——对照组的变化能代表反事实吗？差值是偶然的吗？对照组本身是不是“干净”的？

带着这些问题，我们从第一篇开始：{% post_link DID-01-Causal-Inference-Basics 因果推断基础：潜在结果与选择偏差 %}。
