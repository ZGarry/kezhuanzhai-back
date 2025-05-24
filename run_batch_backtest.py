#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量运行所有单因子回测
自动生成的脚本
"""

import os
import json
import time
from data_manager import DataManager
from create_strategy import create_strategy
from after_backtest_report import generate_backtest_reports

def run_batch_backtest():
    """批量运行回测"""
    config_dir = "configs/single_factors"
    data_manager = DataManager("data/cb_data.pq")
    
    # 获取所有配置文件
    config_files = [f for f in os.listdir(config_dir) if f.endswith('_config.json')]
    
    print(f"开始批量回测，共 {len(config_files)} 个因子")
    
    results = []
    start_time = time.time()
    
    for i, config_file in enumerate(config_files, 1):
        config_path = os.path.join(config_dir, config_file)
        
        try:
            # 加载配置
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            factor_name = config['factor_info']['factor_name']
            print(f"[{i}/{len(config_files)}] 正在回测: {factor_name}")
            
            # 运行回测
            strategy, processed_config = create_strategy(config)
            if strategy:
                strategy.run_backtest(data_manager, processed_config)
                result = strategy.analyze_results()
                result.update(config['factor_info'])
                results.append(result)
                
                # 生成报告
                generate_backtest_reports(strategy, config['output_dir'])
                print(f"✓ {factor_name} 完成，年化收益率: {result['年化收益率']:.2%}")
            else:
                print(f"✗ {factor_name} 失败")
                
        except Exception as e:
            print(f"✗ {config_file} 执行失败: {str(e)}")
    
    total_time = time.time() - start_time
    print(f"\n批量回测完成！耗时: {total_time:.2f}秒")
    
    # 保存汇总结果
    if results:
        import pandas as pd
        df = pd.DataFrame(results)
        df = df.sort_values('年化收益率', ascending=False)
        df.to_csv('results/batch_backtest_results.csv', encoding='utf-8-sig', index=False)
        print(f"结果已保存到: results/batch_backtest_results.csv")

if __name__ == "__main__":
    run_batch_backtest()
