"use client";

import { useState } from 'react';
import { BacktestSettings, FactorSettings, BacktestResult } from '@/types/app-backtest';

const defaultBacktestSettings: BacktestSettings = {
  holdingPeriod: 1,
  holdingQuantity: 10,
  startDate: undefined,
  endDate: undefined,
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

  const runBacktest = async () => {
    setIsLoading(true);
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
    runBacktest
  };
} 