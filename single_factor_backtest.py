#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单因子回测分析工具
用于对所有可用因子进行单独回测，并生成对比分析报告
"""

import os
import json
import time
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from data_manager import DataManager
from create_strategy import create_strategy
from after_backtest_report import generate_backtest_reports

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

class SingleFactorBacktest:
    """单因子回测分析类"""
    
    def __init__(self, data_path: str = "data/cb_data.pq"):
        """
        初始化回测分析器
        
        Args:
            data_path: 数据文件路径
        """
        self.data_path = data_path
        self.data_manager = None
        self.results = {}
        
        # 定义所有可用因子
        self.factors = {
            # 价格类因子
            "close": {"name": "收盘价", "description": "转债收盘价", "category": "价格", "weight": -1.0},
            "open": {"name": "开盘价", "description": "转债开盘价", "category": "价格", "weight": -1.0},
            "high": {"name": "最高价", "description": "转债最高价", "category": "价格", "weight": -1.0},
            "low": {"name": "最低价", "description": "转债最低价", "category": "价格", "weight": -1.0},
            "pct_chg": {"name": "涨跌幅", "description": "当日涨跌幅", "category": "价格", "weight": 1.0},
            
            # 转债特性因子
            "conv_prem": {"name": "转股溢价率", "description": "转债价格与转股价值的溢价率", "category": "转债特性", "weight": -1.0},
            "theory_conv_prem": {"name": "理论溢价率", "description": "理论转股溢价率", "category": "转债特性", "weight": -1.0},
            "mod_conv_prem": {"name": "修正溢价率", "description": "修正转股溢价率", "category": "转债特性", "weight": -1.0},
            "bond_prem": {"name": "纯债溢价率", "description": "转债价格与纯债价值的溢价率", "category": "转债特性", "weight": -1.0},
            "ytm": {"name": "到期收益率", "description": "转债到期收益率", "category": "转债特性", "weight": 1.0},
            "dblow": {"name": "双低因子", "description": "转股溢价率和收盘价的综合指标", "category": "转债特性", "weight": -1.0},
            
            # 市场活跃度因子
            "vol": {"name": "成交量", "description": "当日成交量", "category": "市场活跃度", "weight": 1.0},
            "amount": {"name": "成交额", "description": "当日成交额", "category": "市场活跃度", "weight": 1.0},
            "turnover": {"name": "换手率", "description": "当日换手率", "category": "市场活跃度", "weight": 1.0},
            
            # 规模因子
            "remain_size": {"name": "剩余规模", "description": "债券剩余规模", "category": "规模", "weight": 1.0},
            "remain_cap": {"name": "剩余市值", "description": "债券剩余市值", "category": "规模", "weight": 1.0},
            "issue_size": {"name": "发行规模", "description": "债券发行规模", "category": "规模", "weight": 1.0},
            "cap_mv_rate": {"name": "转债市占比", "description": "转债市值占比", "category": "规模", "weight": 1.0},
            
            # 时间因子
            "left_years": {"name": "剩余年限", "description": "债券剩余年限", "category": "时间", "weight": 1.0},
            "list_days": {"name": "上市天数", "description": "债券上市天数", "category": "时间", "weight": 1.0},
            
            # 价值因子
            "pure_value": {"name": "纯债价值", "description": "债券纯债价值", "category": "价值", "weight": 1.0},
            "theory_value": {"name": "理论价值", "description": "债券理论价值", "category": "价值", "weight": 1.0},
            "option_value": {"name": "期权价值", "description": "转债期权价值", "category": "价值", "weight": 1.0},
            "theory_bias": {"name": "理论偏离度", "description": "实际价格与理论价值的偏离度", "category": "价值", "weight": -1.0},
            
            # 正股相关因子
            "pe_ttm": {"name": "市盈率TTM", "description": "正股市盈率TTM", "category": "正股", "weight": -1.0},
            "pb": {"name": "市净率", "description": "正股市净率", "category": "正股", "weight": -1.0},
            "ps_ttm": {"name": "市销率TTM", "description": "正股市销率TTM", "category": "正股", "weight": -1.0},
            "total_mv": {"name": "总市值", "description": "正股总市值", "category": "正股", "weight": 1.0},
            "circ_mv": {"name": "流通市值", "description": "正股流通市值", "category": "正股", "weight": 1.0},
            "volatility_stk": {"name": "正股波动率", "description": "正股年化波动率", "category": "正股", "weight": -1.0},
            "close_stk": {"name": "正股收盘价", "description": "正股收盘价", "category": "正股", "weight": 1.0},
            "pct_chg_stk": {"name": "正股涨跌幅", "description": "正股当日涨跌幅", "category": "正股", "weight": 1.0},
        }
        
        # 基本过滤条件
        self.basic_filters = {
            "left_years": [">", 0.5],  # 剩余年限大于0.5年
            "list_days": [">", 30],    # 上市超过30天
        }
        
    def initialize_data(self):
        """初始化数据管理器"""
        print(f"正在初始化数据管理器，加载数据: {self.data_path}")
        start_time = time.time()
        self.data_manager = DataManager(self.data_path)
        load_time = time.time() - start_time
        print(f"数据加载完成，耗时: {load_time:.2f}秒")
        
    def create_factor_config(self, factor_id: str, factor_info: Dict, 
                           start_date: str = "2020-01-01", 
                           end_date: str = "2024-12-31",
                           initial_capital: float = 1000000.0,
                           top_n: int = 10) -> Dict:
        """
        为单个因子创建配置
        
        Args:
            factor_id: 因子ID
            factor_info: 因子信息
            start_date: 回测开始日期
            end_date: 回测结束日期
            initial_capital: 初始资金
            top_n: 持仓数量
            
        Returns:
            策略配置字典
        """
        config = {
            "data_path": self.data_path,
            "start_date": start_date,
            "end_date": end_date,
            "initial_capital": initial_capital,
            "strategy_type": "custom",
            "top_n": top_n,
            "name": f"{factor_info['name']}单因子策略",
            "output_dir": f"results/single_factor/{factor_id}",
            "strategy_params": {
                "indicators": [factor_id],
                "weights": [factor_info["weight"]],
                "filters": self.basic_filters.copy()
            }
        }
        return config
        
    def run_single_factor_backtest(self, factor_id: str, factor_info: Dict, 
                                 start_date: str = "2020-01-01", 
                                 end_date: str = "2024-12-31") -> Optional[Dict]:
        """
        运行单个因子的回测
        
        Args:
            factor_id: 因子ID
            factor_info: 因子信息
            start_date: 回测开始日期
            end_date: 回测结束日期
            
        Returns:
            回测结果字典，失败时返回None
        """
        try:
            print(f"正在回测因子: {factor_id} ({factor_info['name']})")
            
            # 创建配置
            config = self.create_factor_config(factor_id, factor_info, start_date, end_date)
            
            # 确保输出目录存在
            os.makedirs(config["output_dir"], exist_ok=True)
            
            # 创建策略
            strategy, processed_config = create_strategy(config)
            if strategy is None:
                print(f"创建策略失败: {factor_id}")
                return None
                
            # 运行回测
            start_time = time.time()
            strategy.run_backtest(self.data_manager, processed_config)
            backtest_time = time.time() - start_time
            
            # 分析结果
            results = strategy.analyze_results()
            results["因子ID"] = factor_id
            results["因子名称"] = factor_info["name"]
            results["因子描述"] = factor_info["description"]
            results["因子分类"] = factor_info["category"]
            results["权重"] = factor_info["weight"]
            results["回测耗时"] = backtest_time
            
            # 生成报告
            generate_backtest_reports(strategy, config["output_dir"])
            
            # 保存配置
            config_path = os.path.join(config["output_dir"], "config.json")
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"✓ 因子 {factor_id} 回测完成，年化收益率: {results['年化收益率']:.2%}")
            return results
            
        except Exception as e:
            print(f"✗ 因子 {factor_id} 回测失败: {str(e)}")
            return None
            
    def run_all_factor_backtests(self, start_date: str = "2020-01-01", 
                               end_date: str = "2024-12-31",
                               parallel: bool = False,
                               max_workers: int = 4) -> Dict:
        """
        运行所有因子的回测
        
        Args:
            start_date: 回测开始日期
            end_date: 回测结束日期
            parallel: 是否并行运行
            max_workers: 最大工作线程数
            
        Returns:
            所有因子的回测结果字典
        """
        if self.data_manager is None:
            self.initialize_data()
            
        print(f"开始运行所有因子回测，共 {len(self.factors)} 个因子")
        print(f"回测期间: {start_date} 到 {end_date}")
        print(f"并行模式: {'是' if parallel else '否'}")
        
        all_results = {}
        total_start_time = time.time()
        
        if parallel:
            # 并行执行
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # 提交所有任务
                future_to_factor = {
                    executor.submit(self.run_single_factor_backtest, factor_id, factor_info, start_date, end_date): factor_id
                    for factor_id, factor_info in self.factors.items()
                }
                
                # 收集结果
                for future in as_completed(future_to_factor):
                    factor_id = future_to_factor[future]
                    try:
                        result = future.result()
                        if result is not None:
                            all_results[factor_id] = result
                    except Exception as e:
                        print(f"并行任务失败 {factor_id}: {str(e)}")
        else:
            # 串行执行
            for factor_id, factor_info in self.factors.items():
                result = self.run_single_factor_backtest(factor_id, factor_info, start_date, end_date)
                if result is not None:
                    all_results[factor_id] = result
                    
        total_time = time.time() - total_start_time
        print(f"\n所有因子回测完成！")
        print(f"成功回测因子数: {len(all_results)}/{len(self.factors)}")
        print(f"总耗时: {total_time:.2f}秒")
        
        self.results = all_results
        return all_results
        
    def generate_comparison_report(self, output_dir: str = "results/single_factor_analysis"):
        """
        生成因子对比分析报告
        
        Args:
            output_dir: 输出目录
        """
        if not self.results:
            print("没有回测结果，请先运行回测")
            return
            
        os.makedirs(output_dir, exist_ok=True)
        
        # 转换为DataFrame
        df = pd.DataFrame(self.results).T
        
        # 按照年化收益率排序
        df = df.sort_values('年化收益率', ascending=False)
        
        # 保存详细结果
        results_path = os.path.join(output_dir, "factor_backtest_results.csv")
        df.to_csv(results_path, encoding='utf-8-sig')
        print(f"详细结果已保存到: {results_path}")
        
        # 生成汇总报告
        self._generate_summary_report(df, output_dir)
        
        # 生成可视化图表
        self._generate_visualization(df, output_dir)
        
        # 生成分类分析
        self._generate_category_analysis(df, output_dir)
        
    def _generate_summary_report(self, df: pd.DataFrame, output_dir: str):
        """生成汇总报告"""
        summary_path = os.path.join(output_dir, "summary_report.txt")
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("可转债单因子回测分析汇总报告\n")
            f.write("=" * 60 + "\n")
            f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"回测因子数量: {len(df)}\n")
            f.write(f"回测期间: {df.iloc[0]['回测开始日期']} 到 {df.iloc[0]['回测结束日期']}\n\n")
            
            # 整体统计
            f.write("整体统计:\n")
            f.write("-" * 30 + "\n")
            f.write(f"平均年化收益率: {df['年化收益率'].mean():.2%}\n")
            f.write(f"年化收益率标准差: {df['年化收益率'].std():.2%}\n")
            f.write(f"最高年化收益率: {df['年化收益率'].max():.2%}\n")
            f.write(f"最低年化收益率: {df['年化收益率'].min():.2%}\n")
            f.write(f"平均最大回撤: {df['最大回撤'].mean():.2%}\n")
            f.write(f"平均夏普比率: {df['夏普比率'].mean():.3f}\n\n")
            
            # Top 10 因子
            f.write("年化收益率 Top 10 因子:\n")
            f.write("-" * 30 + "\n")
            for i, (_, row) in enumerate(df.head(10).iterrows(), 1):
                f.write(f"{i:2d}. {row['因子名称']:12s} | 年化收益率: {row['年化收益率']:6.2%} | "
                       f"最大回撤: {row['最大回撤']:6.2%} | 夏普比率: {row['夏普比率']:6.3f}\n")
            
            # Bottom 10 因子
            f.write("\n年化收益率 Bottom 10 因子:\n")
            f.write("-" * 30 + "\n")
            for i, (_, row) in enumerate(df.tail(10).iterrows(), 1):
                f.write(f"{i:2d}. {row['因子名称']:12s} | 年化收益率: {row['年化收益率']:6.2%} | "
                       f"最大回撤: {row['最大回撤']:6.2%} | 夏普比率: {row['夏普比率']:6.3f}\n")
            
            # 按分类统计
            f.write("\n按因子分类统计:\n")
            f.write("-" * 30 + "\n")
            category_stats = df.groupby('因子分类').agg({
                '年化收益率': ['mean', 'std', 'max', 'min'],
                '最大回撤': 'mean',
                '夏普比率': 'mean'
            }).round(4)
            
            for category in category_stats.index:
                f.write(f"{category}:\n")
                stats = category_stats.loc[category]
                f.write(f"  平均年化收益率: {stats[('年化收益率', 'mean')]:.2%}\n")
                f.write(f"  收益率标准差: {stats[('年化收益率', 'std')]:.2%}\n")
                f.write(f"  最高收益率: {stats[('年化收益率', 'max')]:.2%}\n")
                f.write(f"  最低收益率: {stats[('年化收益率', 'min')]:.2%}\n")
                f.write(f"  平均最大回撤: {stats[('最大回撤', 'mean')]:.2%}\n")
                f.write(f"  平均夏普比率: {stats[('夏普比率', 'mean')]:.3f}\n\n")
        
        print(f"汇总报告已保存到: {summary_path}")
        
    def _generate_visualization(self, df: pd.DataFrame, output_dir: str):
        """生成可视化图表"""
        # 设置图表样式
        plt.style.use('seaborn-v0_8')
        
        # 1. 年化收益率分布
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        
        # 年化收益率柱状图
        top_20 = df.head(20)
        ax1.barh(range(len(top_20)), top_20['年化收益率'], color='skyblue')
        ax1.set_yticks(range(len(top_20)))
        ax1.set_yticklabels(top_20['因子名称'], fontsize=8)
        ax1.set_xlabel('年化收益率')
        ax1.set_title('Top 20 因子年化收益率')
        ax1.grid(True, alpha=0.3)
        
        # 收益率vs回撤散点图
        scatter = ax2.scatter(df['最大回撤'], df['年化收益率'], 
                            c=df['夏普比率'], cmap='viridis', alpha=0.7)
        ax2.set_xlabel('最大回撤')
        ax2.set_ylabel('年化收益率')
        ax2.set_title('收益率 vs 最大回撤 (颜色表示夏普比率)')
        plt.colorbar(scatter, ax=ax2, label='夏普比率')
        ax2.grid(True, alpha=0.3)
        
        # 按分类的箱线图
        categories = df['因子分类'].unique()
        category_data = [df[df['因子分类'] == cat]['年化收益率'] for cat in categories]
        ax3.boxplot(category_data, labels=categories)
        ax3.set_ylabel('年化收益率')
        ax3.set_title('各分类因子年化收益率分布')
        ax3.tick_params(axis='x', rotation=45)
        ax3.grid(True, alpha=0.3)
        
        # 夏普比率分布
        ax4.hist(df['夏普比率'], bins=20, alpha=0.7, color='lightgreen', edgecolor='black')
        ax4.set_xlabel('夏普比率')
        ax4.set_ylabel('频数')
        ax4.set_title('夏普比率分布')
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        chart_path = os.path.join(output_dir, "factor_analysis_charts.png")
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"可视化图表已保存到: {chart_path}")
        
        # 2. 详细的分类对比图
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # 分类平均收益率
        category_returns = df.groupby('因子分类')['年化收益率'].mean().sort_values(ascending=False)
        axes[0,0].bar(range(len(category_returns)), category_returns.values, color='lightcoral')
        axes[0,0].set_xticks(range(len(category_returns)))
        axes[0,0].set_xticklabels(category_returns.index, rotation=45)
        axes[0,0].set_ylabel('平均年化收益率')
        axes[0,0].set_title('各分类平均年化收益率')
        axes[0,0].grid(True, alpha=0.3)
        
        # 分类平均回撤
        category_drawdown = df.groupby('因子分类')['最大回撤'].mean().sort_values(ascending=True)
        axes[0,1].bar(range(len(category_drawdown)), category_drawdown.values, color='orange')
        axes[0,1].set_xticks(range(len(category_drawdown)))
        axes[0,1].set_xticklabels(category_drawdown.index, rotation=45)
        axes[0,1].set_ylabel('平均最大回撤')
        axes[0,1].set_title('各分类平均最大回撤')
        axes[0,1].grid(True, alpha=0.3)
        
        # 分类平均夏普比率
        category_sharpe = df.groupby('因子分类')['夏普比率'].mean().sort_values(ascending=False)
        axes[1,0].bar(range(len(category_sharpe)), category_sharpe.values, color='lightblue')
        axes[1,0].set_xticks(range(len(category_sharpe)))
        axes[1,0].set_xticklabels(category_sharpe.index, rotation=45)
        axes[1,0].set_ylabel('平均夏普比率')
        axes[1,0].set_title('各分类平均夏普比率')
        axes[1,0].grid(True, alpha=0.3)
        
        # 胜率分布
        axes[1,1].hist(df['胜率'], bins=15, alpha=0.7, color='gold', edgecolor='black')
        axes[1,1].set_xlabel('胜率')
        axes[1,1].set_ylabel('频数')
        axes[1,1].set_title('胜率分布')
        axes[1,1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        category_chart_path = os.path.join(output_dir, "category_analysis_charts.png")
        plt.savefig(category_chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"分类分析图表已保存到: {category_chart_path}")
        
    def _generate_category_analysis(self, df: pd.DataFrame, output_dir: str):
        """生成分类分析"""
        category_analysis_path = os.path.join(output_dir, "category_analysis.csv")
        
        # 按分类统计
        category_stats = df.groupby('因子分类').agg({
            '年化收益率': ['count', 'mean', 'std', 'max', 'min'],
            '最大回撤': ['mean', 'std'],
            '夏普比率': ['mean', 'std'],
            '胜率': ['mean', 'std'],
            '交易次数': 'mean'
        }).round(4)
        
        category_stats.to_csv(category_analysis_path, encoding='utf-8-sig')
        print(f"分类分析已保存到: {category_analysis_path}")


def main():
    """主函数"""
    # 创建单因子回测分析器
    analyzer = SingleFactorBacktest()
    
    # 设置回测参数
    start_date = "2020-01-01"
    end_date = "2024-12-31"
    
    # 运行所有因子回测
    print("开始运行所有单因子回测分析...")
    results = analyzer.run_all_factor_backtests(
        start_date=start_date,
        end_date=end_date,
        parallel=False  # 可以设置为True启用并行
    )
    
    # 生成对比分析报告
    if results:
        print("\n开始生成分析报告...")
        analyzer.generate_comparison_report()
        print("\n所有分析完成！")
        print(f"结果保存在: results/single_factor_analysis/")
    else:
        print("没有成功的回测结果")


if __name__ == "__main__":
    main() 