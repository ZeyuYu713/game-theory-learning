# 博弈论学习笔记 · Game Theory Learning

按九讲知识体系整理博弈论的基本概念、经济直觉、均衡推导与标准习题。当前包括 <strong>9 份知识笔记、172 道章节习题、8 道跨讲综合题</strong>，均以可独立阅读的文字和演算为主。

## 从哪里开始

- [模型识别、均衡概念和公式速查](guides/model-selection-and-solving.md)：遇到陌生题型时，先确认信息结构和适用解法。
- [九讲题型导航与考前重点题](guides/exam-topic-index.md)：按知识点查典型题号、常见误区和跨章节辨析，并提供三道完整示范题。
- [图解博弈论：九讲可视化入口](visuals/README.md)：通过支付矩阵、最佳反应曲线、博弈树与状态图理解模型。
- 按下表进入各讲笔记与题库，先做题、再对照完整求解过程。

## 九讲知识框架

| 讲次 | 主题 | 习题数 | 学习资料 |
| --- | --- | ---: | --- |
| Lecture 1 | Strategic-Form Games I：策略式博弈、优势策略、纳什均衡 | 16 | [笔记](notes/lecture-01-strategic-form-games.md) · [习题](exercises/lecture-01-exercises.md) |
| Lecture 2 | Strategic-Form Games II：最佳反应、Cournot、Bertrand、位置竞争 | 17 | [笔记](notes/lecture-02-strategic-form-games.md) · [习题](exercises/lecture-02-exercises.md) |
| Lecture 3 | Mixed Strategies：混合策略与混合策略纳什均衡 | 16 | [笔记](notes/lecture-03-mixed-strategies.md) · [习题](exercises/lecture-03-exercises.md) |
| Lecture 4 | Extensive-Form Games：动态博弈、逆向归纳、SPNE | 21 | [笔记](notes/lecture-04-extensive-form-games.md) · [习题](exercises/lecture-04-exercises.md) |
| Lecture 5 | Repeated Games：有限与无限重复博弈 | 20 | [笔记](notes/lecture-05-repeated-games.md) · [习题](exercises/lecture-05-exercises.md) |
| Lecture 6 | Bargaining：讨价还价与交替报价 | 20 | [笔记](notes/lecture-06-bargaining.md) · [习题](exercises/lecture-06-exercises.md) |
| Lecture 7 | Bayesian Games：类型、信念与贝叶斯纳什均衡 | 20 | [笔记](notes/lecture-07-bayesian-games.md) · [习题](exercises/lecture-07-exercises.md) |
| Lecture 8 | Dynamic Bayesian Games：信号、序贯理性与动态贝叶斯博弈 | 18 | [笔记](notes/lecture-08-dynamic-bayesian-games.md) · [习题](exercises/lecture-08-exercises.md) |
| Lecture 9 | Cooperative Games：联盟、核心与合作博弈 | 24 | [笔记](notes/lecture-09-cooperative-games.md) · [习题](exercises/lecture-09-exercises.md) |
| <strong>合计</strong> | <strong>九讲</strong> | <strong>172</strong> | [跨讲综合训练（8 题）](guides/comprehensive-practice.md) |

## 图解博弈论

新增独立漫画专题：[为什么有些威胁根本不可信？｜市场进入博弈](visuals/credible-threat-market-entry.md)。含六格配图、完整策略、逆向归纳、NE/SPNE 核算与两道逐步解析的练习；不占用九讲原有编号。


新增 [九讲图解学习专区](visuals/README.md)。以图形解释均衡的形成机制，包含：

- [Cournot 最佳反应函数与纳什均衡交点](visuals/02-market-competition.md)：原创精确 SVG 坐标图，区分同时产量与先后产量。
- [混合策略无差异条件与期望收益交点](visuals/03-mixed-strategies.md)：原创 SVG 曲线，说明为什么计算的是对手的混合概率。
- [动态博弈树与子博弈精炼](visuals/04-extensive-form.md)、[重复博弈触发状态图](visuals/05-repeated-games.md)，以及信息不完全博弈和合作博弈的图解。

图解与原有九讲笔记、习题相互链接，适合先读图再推导公式。

## 学习方式

每讲尽量保持相同结构：

1. <strong>基本概念</strong>：明确博弈参与者、行动、策略、信息结构与支付。
2. <strong>求解方法</strong>：从最佳反应或逆向归纳出发，逐步计算均衡。
3. <strong>经典案例</strong>：把模型放回企业竞争、谈判、合同等实际情境。
4. <strong>标准练习</strong>：先独立完成题目，再对照逐步解析与易错点。

数学公式使用 GitHub 原生 MathJax 渲染；博弈树采用 Mermaid，均可直接在 GitHub 页面阅读。

## 综合训练与内容校验

- [九讲原始课件知识点覆盖核查](guides/slide-coverage-audit.md)：按原始九份 PDF 的 529 页顺序，对照笔记与 172 道习题，标明已覆盖、部分覆盖和待补充内容，并列出增补优先级。
- [九讲跨章节综合练习与完整答案](guides/comprehensive-practice.md)：将模型识别、均衡计算和经济解释合并练习。
- [考前题型与重点练习索引](guides/exam-topic-index.md)：按题型找到最值得做的原题与逐步解析，并对照跨讲概念。
- [九讲代表性习题的独立核算记录](guides/calculation-audit.md)：逐讲列出重新计算的方法、关键数值和已补写的解析，附可重复运行的检验脚本。
- [模型识别与公式速查](guides/model-selection-and-solving.md)：混合策略的五步最佳反应检查、弱支配与边界均衡、扩展式博弈的 NE 与 SPNE 检验、重复博弈中的期限与惩罚策略，以及讨价还价中的异质折现递推和复合拒绝条件。

如需在本地检查 Markdown 和 GitHub 公式格式，可执行：

```bash
node scripts/check-docs.mjs
node scripts/normalize-math.mjs --check
node scripts/verify-exercises.mjs
```

第一条命令还会检查各讲题号是否连续、每题是否出现答案段、Markdown 表格列数及覆盖核查表与真实题数是否一致。
第三条命令独立复算十组代表性模型，涵盖九讲中的纯策略、混合策略、动态博弈、折现谈判、贝叶斯信念、联盟分配等题型。

格式约定：正文用 `<strong>内容</strong>` 加粗；行内公式采用 GitHub 支持的数学定界符；独立公式使用 `math` 代码块，分式始终写全括号。
