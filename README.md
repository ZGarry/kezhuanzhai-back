# 可转债投资分析与回测系统

一个全功能的可转债（可转换债券）分析和投资策略回测系统。本系统包含了灵活的策略框架和可视化界面，帮助投资者分析可转债数据、测试投资策略并进行投资决策。

## 系统特点

- **模块化策略框架**: 基于打分器（Scorer）的灵活设计，易于扩展和定制
- **多样化策略**: 内置多种专业可转债投资策略，包括低价、双低、三低等
- **完整回测流程**: 支持交易记录、持仓管理、绩效分析
- **数据可视化**: 提供全面的数据图表和分析结果展示
- **API接口**: 提供全面的后端API，支持前端数据展示和交互

## 支持的策略类型

### 内置策略

系统内置了以下几种常见的可转债投资策略：

1. **低价策略** (`low_price`)
   - 选择价格最低的N只转债
   - 优势: 简单直接，适合弱市环境，捕捉超跌修复机会

2. **双低策略** (`double_low`)
   - 双低因子 = 转债价格 + 转股溢价率
   - 优势: 综合考虑价格和转股潜力，兼顾安全性和弹性

3. **三低策略** (`triple_low`)
   - 三低因子 = 转债价格 + 转股溢价率 + 纯债溢价率
   - 优势: 更全面评估转债价值，增加了纯债价值维度的考量

4. **收益率策略** (`yield`)
   - 选择到期收益率最高的转债
   - 优势: 追求确定性收益，适合稳健投资者

5. **波动率策略** (`volatility`)
   - 根据正股波动率选择转债
   - 高波动率策略: 追求进取性收益
   - 低波动率策略: 追求稳定性

6. **溢价率折价策略** (`premium_discount`)
   - 选择转股溢价率较低的转债
   - 优势: 关注转债与正股之间的价差，寻找转股套利机会

7. **动量策略** (`momentum`)
   - 选择近期表现较强/较弱的转债
   - 优势: 适合有明显趋势的市场环境

### 自定义策略

系统支持用户自定义策略，通过配置指定多个指标及其权重来创建个性化的打分策略。

## 使用方法

### 命令行运行

```bash
# 使用指定配置文件
python main.py --config configs/low_price_config.json

# 使用默认配置（低价策略）
python main.py
```

### 配置文件

系统支持以下配置参数:

```json
{
    "data_path": "data/cb_data.pq",      // 数据文件路径
    "start_date": "2022-01-01",          // 回测开始日期
    "end_date": "2023-12-31",            // 回测结束日期
    "initial_capital": 1000000,          // 初始资金
    "strategy_type": "low_price",        // 策略类型
    "top_n": 10,                         // 持仓数量
    "output_dir": "results/low_price",   // 结果输出目录
    "strategy_params": {                 // 策略特定参数
        "min_price": 80,                 // 最低价格限制
        "max_price": 130                 // 最高价格限制
    }
}
```

系统内置了多个策略配置示例:
- `configs/default_config.json`: 默认配置（低价策略）
- `configs/low_price_config.json`: 低价策略配置
- `configs/double_low_config.json`: 双低策略配置
- `configs/triple_low_config.json`: 三低策略配置

### API调用

```
POST /api/backtest/double_low
{
  "initial_capital": 1000000,
  "top_n": 10,
  "start_date": "2022-01-01",
  "end_date": "2023-12-31",
  "strategy_params": {
    "price_weight": 1.0,
    "premium_weight": 1.0
  }
}
```

### 代码中使用

```python
from data_manager import DataManager
from strategy_factory import create_strategy
from CustomScorer import DoubleLowScorer

# 加载数据
data_manager = DataManager("data/cb_data.pq", "2022-01-01", "2023-12-31")

# 创建策略
config = {
    "strategy_type": "double_low",
    "initial_capital": 1000000,
    "top_n": 10,
    "strategy_params": {
        "price_weight": 1.0,
        "premium_weight": 1.0
    }
}
strategy = create_strategy(config, data_manager)

# 运行回测
strategy.run_backtest()

# 分析结果
results = strategy.analyze_results()
print(results)
```

## 自定义策略示例

例如，创建一个基于价格和转债规模的自定义策略：

```python
from CustomScorer import CustomScorer
from strategy_base import BaseStrategy

# 创建自定义打分器
scorer = CustomScorer(
    name="价格+规模策略",
    indicators=['close', 'remain_size'],
    weights=[1.0, -0.5],  # 价格越低，规模越大越好
    filters={'left_years': ('>', 1)}
)

# 创建策略
strategy = BaseStrategy(
    scorer=scorer,
    initial_capital=1000000,
    top_n=10
)
```

## 技术架构

- **后端**: Python, FastAPI, Pandas
- **前端**: Next.js, TypeScript, TailwindCSS
- **数据处理**: pandas, NumPy
- **可视化**: Matplotlib（后端）, 各种前端图表组件 