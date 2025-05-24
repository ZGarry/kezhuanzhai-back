#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
因子策略配置生成器
为所有可用因子生成策略配置文件，方便批量回测
"""

import os
import json
from typing import Dict, List


class FactorConfigGenerator:
    """因子策略配置生成器"""
    
    def __init__(self):
        # 定义所有可用因子及其信息
        self.all_factors = {
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
    
    def generate_single_factor_config(self, factor_id: str, factor_info: Dict,
                                    start_date: str = "2020-01-01",
                                    end_date: str = "2024-12-31",
                                    initial_capital: float = 1000000.0,
                                    top_n: int = 10) -> Dict:
        """
        为单个因子生成配置
        
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
            "data_path": "data/cb_data.pq",
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
            },
            "factor_info": {
                "factor_id": factor_id,
                "factor_name": factor_info["name"],
                "factor_description": factor_info["description"],
                "factor_category": factor_info["category"],
                "factor_weight": factor_info["weight"]
            }
        }
        return config
    
    def generate_all_configs(self, output_dir: str = "configs/single_factors",
                           start_date: str = "2020-01-01",
                           end_date: str = "2024-12-31") -> None:
        """
        为所有因子生成配置文件
        
        Args:
            output_dir: 输出目录
            start_date: 回测开始日期
            end_date: 回测结束日期
        """
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 清理旧文件
        for file in os.listdir(output_dir):
            if file.endswith('.json'):
                os.remove(os.path.join(output_dir, file))
        
        print(f"开始生成所有因子配置文件...")
        print(f"输出目录: {output_dir}")
        print(f"因子数量: {len(self.all_factors)}")
        
        # 生成每个因子的配置文件
        for factor_id, factor_info in self.all_factors.items():
            config = self.generate_single_factor_config(
                factor_id, factor_info, start_date, end_date
            )
            
            # 保存配置文件
            config_filename = f"{factor_id}_config.json"
            config_path = os.path.join(output_dir, config_filename)
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"✓ {factor_info['name']} ({factor_id}) -> {config_filename}")
        
        # 生成汇总文件
        self._generate_summary_file(output_dir, start_date, end_date)
        
        print(f"\n所有配置文件生成完成！")
        print(f"配置文件保存在: {output_dir}")
    
    def _generate_summary_file(self, output_dir: str, start_date: str, end_date: str):
        """生成汇总文件"""
        summary = {
            "description": "可转债单因子策略配置汇总",
            "generated_time": json.dumps({"start_date": start_date, "end_date": end_date}),
            "total_factors": len(self.all_factors),
            "categories": {},
            "factors": []
        }
        
        # 按分类统计
        for factor_id, factor_info in self.all_factors.items():
            category = factor_info["category"]
            if category not in summary["categories"]:
                summary["categories"][category] = []
            summary["categories"][category].append({
                "id": factor_id,
                "name": factor_info["name"],
                "weight": factor_info["weight"]
            })
            
            summary["factors"].append({
                "id": factor_id,
                "name": factor_info["name"],
                "description": factor_info["description"],
                "category": factor_info["category"],
                "weight": factor_info["weight"],
                "config_file": f"{factor_id}_config.json"
            })
        
        # 保存汇总文件
        summary_path = os.path.join(output_dir, "factors_summary.json")
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        # 生成文本版汇总
        text_summary_path = os.path.join(output_dir, "factors_summary.txt")
        with open(text_summary_path, 'w', encoding='utf-8') as f:
            f.write("可转债单因子策略配置汇总\n")
            f.write("=" * 40 + "\n")
            f.write(f"总因子数: {len(self.all_factors)}\n")
            f.write(f"回测期间: {start_date} 到 {end_date}\n\n")
            
            f.write("按分类统计:\n")
            f.write("-" * 30 + "\n")
            for category, factors in summary["categories"].items():
                f.write(f"{category} ({len(factors)}个):\n")
                for factor in factors:
                    f.write(f"  - {factor['name']} ({factor['id']}) 权重: {factor['weight']}\n")
                f.write("\n")
        
        print(f"✓ 汇总文件生成: factors_summary.json, factors_summary.txt")
    
    def generate_batch_runner(self, output_dir: str = "configs/single_factors"):
        """生成批量运行脚本"""
        # Python批量运行脚本
        python_script = f"""#!/usr/bin/env python3
# -*- coding: utf-8 -*-
\"\"\"
批量运行所有单因子回测
自动生成的脚本
\"\"\"

import os
import json
import time
from data_manager import DataManager
from create_strategy import create_strategy
from after_backtest_report import generate_backtest_reports

def run_batch_backtest():
    \"\"\"批量运行回测\"\"\"
    config_dir = "{output_dir}"
    data_manager = DataManager("data/cb_data.pq")
    
    # 获取所有配置文件
    config_files = [f for f in os.listdir(config_dir) if f.endswith('_config.json')]
    
    print(f"开始批量回测，共 {{len(config_files)}} 个因子")
    
    results = []
    start_time = time.time()
    
    for i, config_file in enumerate(config_files, 1):
        config_path = os.path.join(config_dir, config_file)
        
        try:
            # 加载配置
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            factor_name = config['factor_info']['factor_name']
            print(f"[{{i}}/{{len(config_files)}}] 正在回测: {{factor_name}}")
            
            # 运行回测
            strategy, processed_config = create_strategy(config)
            if strategy:
                strategy.run_backtest(data_manager, processed_config)
                result = strategy.analyze_results()
                result.update(config['factor_info'])
                results.append(result)
                
                # 生成报告
                generate_backtest_reports(strategy, config['output_dir'])
                print(f"✓ {{factor_name}} 完成，年化收益率: {{result['年化收益率']:.2%}}")
            else:
                print(f"✗ {{factor_name}} 失败")
                
        except Exception as e:
            print(f"✗ {{config_file}} 执行失败: {{str(e)}}")
    
    total_time = time.time() - start_time
    print(f"\\n批量回测完成！耗时: {{total_time:.2f}}秒")
    
    # 保存汇总结果
    if results:
        import pandas as pd
        df = pd.DataFrame(results)
        df = df.sort_values('年化收益率', ascending=False)
        df.to_csv('results/batch_backtest_results.csv', encoding='utf-8-sig', index=False)
        print(f"结果已保存到: results/batch_backtest_results.csv")

if __name__ == "__main__":
    run_batch_backtest()
"""
        
        script_path = "run_batch_backtest.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(python_script)
        
        print(f"✓ 批量运行脚本生成: {script_path}")
        
        # 生成批处理文件 (Windows)
        batch_script = f"""@echo off
echo 开始批量运行可转债单因子回测...
python run_batch_backtest.py
pause
"""
        
        batch_path = "run_batch_backtest.bat"
        with open(batch_path, 'w', encoding='utf-8') as f:
            f.write(batch_script)
        
        print(f"✓ Windows批处理文件生成: {batch_path}")


def main():
    """主函数"""
    generator = FactorConfigGenerator()
    
    print("可转债单因子策略配置生成器")
    print("=" * 40)
    
    # 生成所有配置文件
    generator.generate_all_configs(
        start_date="2020-01-01",
        end_date="2024-12-31"
    )
    
    # 生成批量运行脚本
    generator.generate_batch_runner()
    
    print("\n使用说明:")
    print("1. 运行单个因子回测: python main.py (修改configs/single_factors/中的对应配置文件)")
    print("2. 批量运行所有因子: python run_batch_backtest.py")
    print("3. 快速测试主要因子: python quick_factor_test.py")
    print("4. 完整因子分析: python single_factor_backtest.py")


if __name__ == "__main__":
    main() 