import os
import matplotlib.pyplot as plt

def generate_backtest_reports(strategy, output_dir):
    """
    生成回测后的各种报告和图表
    
    参数:
        strategy: 回测策略对象
        output_dir: 输出目录路径
    
    返回:
        dict: 包含各种报告路径的字典
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    report_files = {}
    
    # 分析结果
    results = strategy.analyze_results()
    print("\n回测结果:")
    for key, value in results.items():
        print(f"{key}: {value}")
    
    # 导出交易记录
    trade_records = strategy.get_trade_records()
    if not trade_records.empty:
        trade_file = os.path.join(output_dir, 'trade_records.csv')
        trade_records.to_csv(trade_file, index=False, encoding='utf-8-sig')
        print(f"交易记录已保存至: {trade_file}")
        report_files['trade_records'] = trade_file
    
    # 绘制净值曲线
    plt.figure(figsize=(12, 6))
    strategy.plot_performance()
    plt.title(f"{strategy.strategy_name} 净值曲线")
    plt.tight_layout()
    performance_file = os.path.join(output_dir, 'performance.png')
    plt.savefig(performance_file, dpi=300)
    plt.close()
    report_files['performance_chart'] = performance_file

    
    # 输出策略持仓报告
    report = strategy.get_daily_report()
    if not report.empty:
        report_file = os.path.join(output_dir, 'daily_report.csv')
        report.to_csv(report_file, index=False, encoding='utf-8-sig')
        print(f"每日持仓报告已保存至: {report_file}")
        report_files['daily_report'] = report_file
    
    print("\n回测报告生成完成!")
    return report_files 