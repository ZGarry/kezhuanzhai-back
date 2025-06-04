/**
 * 旧版回测相关类型定义（从app目录移动）
 */

export interface BacktestSettings {
  holdingPeriod: number;
  holdingQuantity: number;
  startDate?: Date;
  endDate?: Date;
  tradingTime: 'open' | 'close';
  benchmark: string;
}

export interface Factor {
  id: string;
  name: string;
  expression: string;
  type: 'filter' | 'score';
}

export interface FactorSettings {
  excludeMode: 'all' | 'any';
  excludeNewDays: number;
  excludeMarket: 'sh' | 'sz' | null;
  customFactors: string[];
  selectedFactors: SelectedFactor[];
  filters: FilterCondition[];
  strategyName?: string;
}

export interface SelectedFactor {
  id: string;
  weight: number;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: number;
}

export interface FactorInfo {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface FilterInfo {
  id: string;
  name: string;
  description: string;
  operators: string[];
}

export interface Trade {
  symbol?: string;
  date?: string;
  type?: 'buy' | 'sell';
  quantity?: number;
  price?: number;
  profit?: number;
  
  // 添加支持中文字段
  转债代码?: string;
  转债名称?: string;
  日期?: string;
  操作?: string;
  价格?: number;
  数量?: number;
  收益率?: number;
  金额?: number;
  
  // 支持其他可能的字段
  [key: string]: any;
}

export interface BacktestResult {
  annualReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  volatility?: number;
  beta?: number;
  alpha?: number;
  trades: Trade[];
  returns: number[];
  dates: string[];
} 