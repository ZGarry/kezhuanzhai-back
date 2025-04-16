from data_manager import DataManager
from create_strategy import create_strategy

def main():
    # 创建策略
    strategy, config = create_strategy()
    data_path = config.get('data_path', 'data/cb_data.pq')
    
    # 初始化数据
    print(f"正在加载数据: {data_path}")
    data_manager = DataManager(data_path)
    
    # 运行回测
    print(f"正在使用策略: {config.get('strategy_type', 'default')}")
    strategy.run_backtest(data_manager, config)

    print("\n回测完成!")

if __name__ == '__main__':
    import time
    start_time = time.time()
    main() 
    end_time = time.time()
    print(f"回测ALL完成! 用时: {end_time - start_time} 秒")