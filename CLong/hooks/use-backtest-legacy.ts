"use client";

import { useState } from 'react';
import { BacktestSettings, FactorSettings, BacktestResult } from '@/types/app-backtest';
import { api } from '@/lib/api';

const defaultBacktestSettings: BacktestSettings = {
  holdingPeriod: 1,
  holdingQuantity: 10,
  startDate: new Date("2018-01-01"),
  endDate: new Date("2023-12-31"),
  tradingTime: 'close',
  benchmark: 'sh000001'
};

const defaultFactorSettings: FactorSettings = {
  excludeMode: 'all',
  excludeNewDays: 0,
  excludeMarket: null,
  customFactors: [],
  selectedFactors: [],
  filters: []
};

export function useBacktest() {
  const [backtestSettings, setBacktestSettings] = useState<BacktestSettings>(defaultBacktestSettings);
  const [factorSettings, setFactorSettings] = useState<FactorSettings>(defaultFactorSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 这里添加实际的回测逻辑
      // const response = await fetch('/api/backtest', {
      //   method: 'POST',
      //   body: JSON.stringify({ backtestSettings, factorSettings })
      // });
      // const data = await response.json();
      // setResult(data);
      
      // 模拟数据
      setResult({
        annualReturn: 15.8,
        maxDrawdown: -8.2,
        sharpeRatio: 1.85,
        winRate: 68.5,
        trades: [],
        returns: [],
        dates: []
      });
    } catch (error) {
      console.error('回测执行失败:', error);
      setError('回测执行失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 基于自定义策略执行回测 
   * @param strategyConfig 策略配置JSON
   */
  const runCustomStrategyBacktest = async (strategyConfig: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // 直接将策略配置发送到API - 不做任何修改
      console.log('发送给API的配置:', JSON.stringify(strategyConfig));
      const response = await api.runBacktest(strategyConfig) as { status: string; data?: any; message?: string; error?: string };
      
      console.log('API回测响应:', response);
      
      // 检查响应是否包含数据，即使status不是success
      const apiResult = response.data || response;
      
      // 完整打印API响应以便调试
      console.log('完整API响应数据:', JSON.stringify(apiResult, null, 2));
      
      // 检查是否有错误消息
      if (response.error) {
        throw new Error(response.error || '回测执行失败');
      }
      
      if (!apiResult) {
        throw new Error('回测未返回有效数据');
      }
      
      // 提取性能指标
      const performance = apiResult.performance || {};
      
      // 构建结果对象，确保格式与JSON回测一致
      const formattedResult: BacktestResult = {
        // 性能指标
        annualReturn: performance["年化收益率"] || 0,
        maxDrawdown: performance["最大回撤"] || 0,
        sharpeRatio: performance["夏普比率"] || 0,
        winRate: performance["胜率"] || 0,
        
        // 交易记录
        trades: Array.isArray(apiResult.trades) ? apiResult.trades.map((trade: any) => {
          // 日志输出交易记录结构以便调试
          console.log('解析交易记录:', trade);
          
          // 保留所有原始字段，同时添加标准字段映射
          return {
            // 标准字段 - 保留所有原始数据，并尝试映射各种变体
            symbol: trade.code || trade.symbol || trade.转债代码 || "",
            date: trade.date || trade.日期 || trade.交易日期 || "",
            type: trade.type || trade.操作 || (String(trade.操作).includes("买") ? "buy" : String(trade.操作).includes("卖") ? "sell" : "buy"),
            quantity: Number(trade.quantity || trade.数量 || trade.成交数量 || 0),
            price: Number(trade.price || trade.价格 || trade.成交价格 || 0),
            profit: Number(trade.profit || trade.收益率 || trade.收益 || 0),
            
            // 保留原始对象的所有属性
            ...trade
          };
        }) : [],
        
        // 收益率数据
        returns: Array.isArray(apiResult.portfolio_values) ? 
          apiResult.portfolio_values.map((value: number, index: number) => 
            index === 0 ? 0 : (value / apiResult.portfolio_values[0]) - 1
          ) : [],
          
        // 日期数据
        dates: Array.isArray(apiResult.dates) ? apiResult.dates : []
      };
      
      // 存储原始响应，以便组件可以访问其他属性
      (formattedResult as any).originalResponse = apiResult;
      
      setResult(formattedResult);
    } catch (error) {
      console.error('自定义策略回测执行失败:', error);
      setError(error instanceof Error ? error.message : '回测执行失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    backtestSettings,
    setBacktestSettings,
    factorSettings,
    setFactorSettings,
    isLoading,
    result,
    error,
    runBacktest,
    runCustomStrategyBacktest
  };
} 