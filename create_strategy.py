import os
from typing import Dict, Any, Tuple
from strategy_base import BaseStrategy


def get_default_config():
    """返回默认配置"""
    return {
        "data_path": "data/cb_data.pq",
        "start_date": "2018-01-02",
        "end_date": "2024-12-31",
        "initial_capital": 1000000.0,
        "strategy_type": "custom",
        "top_n": 10,
        "name": "自定义策略",
        "output_dir": "results/custom",
        "strategy_params": {
            "indicators": ["close","conv_prem"],
            "weights": [-1.0, -1.0],
            "filters": {
                "left_years": [">", 0.5]
            }
        }
    }


def create_strategy(config: Dict[str, Any] = None) -> Tuple[BaseStrategy, Dict[str, Any]]:
    """
    创建自定义策略
    
    Args:
        config: 策略配置，包含策略类型、参数等。如果为None，则使用默认配置
    
    Returns:
        Tuple[BaseStrategy, Dict[str, Any]]: 创建的策略实例和处理后的配置
    """
    # 如果没有提供配置，使用默认配置
    if config is None:
        config = get_default_config()
    
    # 设置参数
    data_path = config.get('data_path')
    
    # 确保data_path有有效值
    if not data_path:
        data_path = 'data/cb_data.pq'
        config['data_path'] = data_path
        print(f"警告: 未指定数据路径，将使用默认路径: {data_path}")
    
    # 检查数据文件是否存在
    if not os.path.exists(data_path):
        print(f"错误: 数据文件 '{data_path}' 不存在，请检查路径是否正确")
        return None, config
    
    # 确保strategy_type有有效值
    if 'strategy_type' not in config or not config['strategy_type']:
        config['strategy_type'] = 'default'
        
    # 设置输出目录
    output_dir = config.get('output_dir', f'results/{config["strategy_type"]}')
    config['output_dir'] = output_dir
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取策略参数
    initial_capital = config.get('initial_capital', 1000000.0)
    top_n = config.get('top_n', 10)

    
    # 创建策略实例
    strategy = BaseStrategy(config.get('name', {}), initial_capital=initial_capital, top_n=top_n)
    
    return strategy, config 