/**
 * 可转债相关类型定义
 */

export interface ConvertibleBond {
  // 基本信息字段
  code: string;            // 转债代码
  trade_date: string;      // 交易日期
  name: string;            // 转债简称

  // 转债价格和交易数据
  pre_close?: number;      // 前收盘价
  open?: number;           // 开盘价
  high?: number;           // 最高价
  low?: number;            // 最低价
  close?: number;          // 收盘价
  pct_chg?: number;        // 涨跌幅
  vol?: number;            // 成交量
  amount?: number;         // 成交额

  // 正股相关数据
  code_stk?: string;       // 正股代码
  pre_close_stk?: number;  // 正股前收盘价
  open_stk?: number;       // 正股开盘价
  high_stk?: number;       // 正股最高价
  low_stk?: number;        // 正股最低价
  close_stk?: number;      // 正股收盘价
  pct_chg_stk?: number;    // 正股涨跌幅
  vol_stk?: number;        // 正股成交量
  amount_stk?: number;     // 正股成交额

  // 正股估值指标
  pe_ttm?: number;         // 市盈率（TTM，亏损的PE为空）
  pb?: number;             // 市净率（总市值/净资产）
  ps_ttm?: number;         // 市销率（TTM）
  total_share?: number;    // 总股本 （万股）
  float_share?: number;    // 流通股本 （万股）
  total_mv?: number;       // 总市值 （万元）
  circ_mv?: number;        // 流通市值（万元）
  volatility_stk?: number; // 正股年化波动率

  // 转债特性指标
  is_call?: string;          // 强赎状态
  conv_price?: number;       // 转股价格
  conv_value?: number;       // 转股价值
  conv_prem?: number;        // 转股溢价率
  theory_conv_prem?: number; // 理论溢价率
  mod_conv_prem?: number;    // 修正溢价率
  dblow?: number;            // 双低因子
  issue_size?: number;       // 发行规模
  remain_size?: number;      // 剩余规模
  remain_cap?: number;       // 剩余市值
  turnover?: number;         // 换手率
  cap_mv_rate?: number;      // 转债市占比
  list_days?: number;        // 上市天数
  left_years?: number;       // 剩余年限
  ytm?: number;              // 到期收益率
  pure_value?: number;       // 纯债价值
  bond_prem?: number;        // 纯债溢价率
  option_value?: number;     // 期权价值
  theory_value?: number;     // 理论价值
  theory_bias?: number;      // 理论偏离度

  // 其他信息
  rating?: string;           // 外部评级
  yy_rating?: string;        // 三方评级
  orgform?: string;          // 企业类型
  area?: string;             // 地域
  industry_1?: string;       // 一级行业
  industry_2?: string;       // 二级行业
  industry_3?: string;       // 三级行业
  maturity_put_price?: number; // 到期赎回价格
  maturity?: number;         // 发行年限
  popularity_ranking?: number; // 热度排名
}

// API响应接口
export interface ApiResponse<T> {
  status: string;
  data: T;
  currentDate?: string;
  message?: string;
  details?: string;
}

// 市场概览数据
export interface MarketOverviewData {
  status: string;
  totalCount: number;
  averagePrice: number;
  medianPrice: number;
  averagePremium: number;
  medianPremium: number;
  callCount: number;
  currentDate: string;
}

// 分布统计数据
export interface DistributionData {
  status: string;
  currentDate: string;
  premium: {
    [range: string]: number;
  };
  price: {
    [range: string]: number;
  };
  ytm: {
    [range: string]: number;
  };
  bondPremium: {
    [range: string]: number;
  };
}

// 排行榜数据
export interface RankingData {
  status: string;
  currentDate: string;
  lowestPrice: ConvertibleBond[];
  highestPremium: ConvertibleBond[];
  lowestPremium: ConvertibleBond[];
  lowestDoubleLow: ConvertibleBond[];
  highestYtm: ConvertibleBond[];
} 