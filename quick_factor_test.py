#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速单因子回测测试工具
用于快速测试几个主要因子的回测效果
"""

import os
import json
import time
import pandas as pd
from typing import Dict, List

from data_manager import DataManager
from create_strategy import create_strategy


class QuickFactorTest:
    """快速因子测试类"""
    
    def __init__(self, data_path: str = "data/cb_data.pq"):
        self.data_path = data_path
        self.data_manager = None
        
        # 定义主要测试因子
        self.test_factors = {
            "close": {"name": "收盘价", "weight": -1.0, "category": "价格"},
            "conv_prem": {"name": "转股溢价率", "weight": -1.0, "category": "转债特性"},
            "ytm": {"name": "到期收益率", "weight": 1.0, "category": "转债特性"},
            "dblow": {"name": "双低因子", "weight": -1.0, "category": "转债特性"},
            "bond_prem": {"name": "纯债溢价率", "weight": -1.0, "category": "转债特性"},
            "turnover": {"name": "换手率", "weight": 1.0, "category": "市场活跃度"},
            "amount": {"name": "成交额", "weight": 1.0, "category": "市场活跃度"},
            "remain_size": {"name": "剩余规模", "weight": 1.0, "category": "规模"},
            "left_years": {"name": "剩余年限", "weight": 1.0, "category": "时间"},
            "pe_ttm": {"name": "市盈率", "weight": -1.0, "category": "正股"},
        }
        
        # 基本过滤条件
        self.basic_filters = {
            "left_years": [">", 0.5],  # 剩余年限大于0.5年
            "list_days": [">", 30],    # 上市超过30天
        }
    
    def initialize_data(self):
        """初始化数据管理器"""
        print(f"正在加载数据: {self.data_path}")
        start_time = time.time()
        self.data_manager = DataManager(self.data_path)
        load_time = time.time() - start_time
        print(f"数据加载完成，耗时: {load_time:.2f}秒")
    
    def test_single_factor(self, factor_id: str, factor_info: Dict,
                          start_date: str = "2022-01-01",
                          end_date: str = "2024-12-31") -> Dict:
        """测试单个因子"""
        try:
            print(f"\n正在测试因子: {factor_id} ({factor_info['name']})")
            
            # 创建配置
            config = {
                "data_path": self.data_path,
                "start_date": start_date,
                "end_date": end_date,
                "initial_capital": 1000000.0,
                "strategy_type": "custom",
                "top_n": 10,
                "name": f"{factor_info['name']}单因子策略",
                "output_dir": f"results/quick_test/{factor_id}",
                "strategy_params": {
                    "indicators": [factor_id],
                    "weights": [factor_info["weight"]],
                    "filters": self.basic_filters.copy()
                }
            }
            
            # 确保输出目录存在
            os.makedirs(config["output_dir"], exist_ok=True)
            
            # 创建并运行策略
            strategy, processed_config = create_strategy(config)
            if strategy is None:
                return {"error": f"创建策略失败: {factor_id}"}
            
            start_time_backtest = time.time()
            strategy.run_backtest(self.data_manager, processed_config)
            backtest_time = time.time() - start_time_backtest
            
            # 分析结果
            results = strategy.analyze_results()
            results.update({
                "因子ID": factor_id,
                "因子名称": factor_info["name"],
                "因子分类": factor_info["category"],
                "权重": factor_info["weight"],
                "回测耗时": backtest_time
            })
            
            print(f"✓ 年化收益率: {results['年化收益率']:.2%}, "
                  f"最大回撤: {results['最大回撤']:.2%}, "
                  f"夏普比率: {results['夏普比率']:.3f}")
            
            return results
            
        except Exception as e:
            error_msg = f"✗ 因子 {factor_id} 测试失败: {str(e)}"
            print(error_msg)
            return {"error": error_msg}
    
    def run_quick_test(self, start_date: str = "2022-01-01", 
                      end_date: str = "2024-12-31") -> pd.DataFrame:
        """运行快速测试"""
        if self.data_manager is None:
            self.initialize_data()
        
        print(f"开始快速因子测试，共 {len(self.test_factors)} 个因子")
        print(f"测试期间: {start_date} 到 {end_date}")
        print("=" * 60)
        
        results = []
        total_start_time = time.time()
        
        for factor_id, factor_info in self.test_factors.items():
            result = self.test_single_factor(factor_id, factor_info, start_date, end_date)
            if "error" not in result:
                results.append(result)
        
        total_time = time.time() - total_start_time
        print(f"\n快速测试完成！耗时: {total_time:.2f}秒")
        
        if results:
            # 转换为DataFrame并排序
            df = pd.DataFrame(results)
            df = df.sort_values('年化收益率', ascending=False)
            
            # 保存结果
            output_dir = "results/quick_test"
            os.makedirs(output_dir, exist_ok=True)
            
            results_path = os.path.join(output_dir, "quick_test_results.csv")
            df.to_csv(results_path, encoding='utf-8-sig', index=False)
            
            # 生成简要报告
            self._generate_quick_report(df, output_dir)
            
            return df
        else:
            print("没有成功的测试结果")
            return pd.DataFrame()
    
    def _generate_quick_report(self, df: pd.DataFrame, output_dir: str):
        """生成快速报告"""
        report_path = os.path.join(output_dir, "quick_report.txt")
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("可转债单因子快速测试报告\n")
            f.write("=" * 40 + "\n")
            f.write(f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"测试因子数: {len(df)}\n\n")
            
            f.write("因子排名 (按年化收益率):\n")
            f.write("-" * 40 + "\n")
            
            for i, (_, row) in enumerate(df.iterrows(), 1):
                f.write(f"{i:2d}. {row['因子名称']:10s} | "
                       f"年化收益率: {row['年化收益率']:6.2%} | "
                       f"最大回撤: {row['最大回撤']:6.2%} | "
                       f"夏普比率: {row['夏普比率']:6.3f}\n")
            
            f.write(f"\n平均年化收益率: {df['年化收益率'].mean():.2%}")
            f.write(f"\n平均最大回撤: {df['最大回撤'].mean():.2%}")
            f.write(f"\n平均夏普比率: {df['夏普比率'].mean():.3f}")
        
        print(f"\n快速报告已保存到: {report_path}")
        
        # 打印到控制台
        print("\n" + "=" * 60)
        print("快速测试结果汇总:")
        print("=" * 60)
        print(f"{'排名':<4} {'因子名称':<12} {'年化收益率':<10} {'最大回撤':<10} {'夏普比率':<8}")
        print("-" * 60)
        
        for i, (_, row) in enumerate(df.iterrows(), 1):
            print(f"{i:<4} {row['因子名称']:<12} {row['年化收益率']:>8.2%} "
                  f"{row['最大回撤']:>8.2%} {row['夏普比率']:>8.3f}")


def main():
    """主函数"""
    tester = QuickFactorTest()
    
    # 运行快速测试（使用较短的时间段）
    df = tester.run_quick_test(
        start_date="2022-01-01", 
        end_date="2024-12-31"
    )
    
    if not df.empty:
        print(f"\n测试完成！结果已保存到 results/quick_test/")
        
        # 显示前5名因子
        print(f"\nTop 5 表现最佳的因子:")
        top_5 = df.head(5)
        for i, (_, row) in enumerate(top_5.iterrows(), 1):
            print(f"{i}. {row['因子名称']} - 年化收益率: {row['年化收益率']:.2%}")


if __name__ == "__main__":
    main() 