/**
 * 回测相关类型定义
 */

// 回测参数
export interface BacktestParams {
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategy: string;
  maxPositions?: number;
  selectionCriteria?: string[];
  rebalancePeriod?: number;
  stopLoss?: number;
  takeProfit?: number;
  customParams?: Record<string, any>;
}

// 持仓状态
export interface Position {
  symbol: string;        // 股票代码
  quantity: number;      // 持仓数量
  cost_basis: number;    // 持仓成本
  market_value: number;  // 市场价值
  last_update: string;   // 最后更新时间
}

// 投资组合状态
export interface PortfolioState {
  total_assets: number;           // 总资产
  cash: number;                   // 现金
  positions: Record<string, Position>; // 当前持仓，key为股票代码
  timestamp: string;              // 当前时间戳
}

// 每日持仓快照
export interface DailySnapshot {
  date: string;           // 日期
  portfolio_state: PortfolioState; // 当日持仓状态
}

// 交易记录
export interface Trade {
  timestamp: string;   // 交易时间
  symbol: string;      // 交易代码
  action: 'BUY' | 'SELL'; // 交易类型
  quantity: number;    // 交易数量
  price: number;       // 交易价格
  amount: number;      // 交易金额
  commission: number;  // 交易佣金
  reason?: string;     // 交易原因
}

// 回测结果
export interface BacktestResult {
  strategy: string;             // 策略名称
  params: BacktestParams;       // 回测参数
  performance: {
    totalReturn: number;        // 总收益率
    annualReturn: number;       // 年化收益率
    maxDrawdown: number;        // 最大回撤
    sharpeRatio: number;        // 夏普比率
    volatility: number;         // 波动率
    winRate: number;            // 胜率
    profitLossRatio: number;    // 盈亏比
    alpha: number;              // 阿尔法
    beta: number;               // 贝塔
  };
  dailyReturns: Array<{date: string, return: number}>; // 每日收益率
  dailyNetValues: Array<{date: string, value: number}>; // 每日净值
  trades: Trade[];              // 交易记录
  portfolioHistory: DailySnapshot[]; // 组合历史
  finalPortfolio: PortfolioState; // 最终投资组合
  benchmarkReturn?: number;     // 基准收益率
}

// 策略类型
export interface Strategy {
  id: string;
  name: string;
  description: string;
  params: StrategyParameter[];
}

// 策略参数类型
export interface StrategyParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'select';
  label: string;
  description: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: {label: string, value: any}[];
  required?: boolean;
} 