import polars as pl
import os
import re
from tiktrack import timed_stage# 导入共享工具模块中的计时装饰器
from datetime import datetime


class DataManager:
    """数据管理器，用于加载和管理可转债数据"""
    
    def __init__(self, data_path, date_column=None):
        """初始化数据管理器
        
        Args:
            data_path: 数据文件路径
            date_column: 日期列名，默认为None（自动检测）
        """
        self.data_path = data_path
        self.date_column = date_column
        
        # 加载数据
        print(f"正在加载数据: {data_path}")
        self._load_data(data_path)
        
        # 检查数据结构
        self._handle_data_structure()
        
        # 创建每日数据缓存
        self.daily_data_cache = {}
        
        # 创建每日价格字典缓存 - 新增
        self.daily_prices_cache = {}
        
        # 预处理和缓存每日数据
        self._preprocess_daily_data()
        
        print(f"数据加载完成，共有 {self.data.height} 条记录，{len(self.trading_dates)} 个交易日")
    
    @timed_stage("数据文件加载")
    def _load_data(self, data_path):
        """加载数据"""
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"数据文件不存在: {data_path}")
            
        # 根据文件扩展名决定加载方式
        if data_path.endswith('.pq') or data_path.endswith('.parquet'):
            self.data = pl.read_parquet(data_path)
        elif data_path.endswith('.csv'):
            self.data = pl.read_csv(data_path)
        else:
            raise ValueError(f"不支持的文件格式: {data_path}")
        
        # 输出数据结构信息
        print(f"数据列: {self.data.columns}")
    
    @timed_stage("数据结构处理")
    def _handle_data_structure(self):
        self.date_column = "trade_date" 
        # 确保日期列是datetime类型
        try:
            self.data = self.data.with_columns(pl.col(self.date_column).cast(pl.Datetime))
        except Exception as e:
            print(f"将日期列转换为datetime类型失败: {e}")
        
        # 提取所有交易日期并排序
        self.trading_dates = sorted(self.data.get_column(self.date_column).unique().to_list())

    
    def get_trading_dates(self):
        """获取所有交易日期"""
        return self.trading_dates
    
    @timed_stage("预处理每日数据")
    def _preprocess_daily_data(self):
        """预处理和缓存每个交易日的数据"""
        print(f"开始预处理每日数据，共 {len(self.trading_dates)} 个交易日...")
        
        total_dates = len(self.trading_dates)
        
        for i, date in enumerate(self.trading_dates):
            # 筛选当日数据
            daily_data = self.data.filter(pl.col(self.date_column) == date)
            
            # 缓存处理后的数据
            self.daily_data_cache[date] = daily_data
            
            # 预处理并缓存价格字典 - 新增
            self._preprocess_daily_prices(date, daily_data)
    
    def _preprocess_daily_prices(self, date, daily_data):
        """预处理并缓存每日价格字典 - 新增方法"""
        # 提取代码和收盘价
        code_close_df = daily_data.select(["code", "close"])
        
        # 创建价格字典
        prices_dict = {}
        for row in code_close_df.iter_rows(named=True):
            code = str(row["code"])
            price = row["close"]
            prices_dict[code] = float(price) if price is not None else 0
        
        # 缓存价格字典
        self.daily_prices_cache[date] = prices_dict
    
    @timed_stage("获取每日价格字典")
    def get_daily_prices(self, date):
        """获取指定日期的价格字典 - 新增方法
        
        Args:
            date: 日期
            
        Returns:
            dict: 键为代码，值为收盘价的字典
        """
        if isinstance(date, str):
            date = datetime.fromisoformat(date)
        
        # 优先从缓存中获取价格字典
        if date in self.daily_prices_cache:
            return self.daily_prices_cache[date]
        
        # 如果缓存中没有，则尝试找最近的日期
        if len(self.trading_dates) > 0:
            nearest_date = min(self.trading_dates, key=lambda x: abs((x - date).total_seconds()))
            print(f"警告: {date} 无价格数据，使用最近日期 {nearest_date}")
            
            # 检查最近的日期是否在缓存中
            if nearest_date in self.daily_prices_cache:
                return self.daily_prices_cache[nearest_date]
        
        # 如果缓存中没有，则临时创建价格字典
        print(f"警告: 日期 {date} 的价格数据不在缓存中，将实时处理")
        daily_data = self.get_daily_data(date)
        
        # 创建临时价格字典
        code_close_df = daily_data.select(["code", "close"])
        prices_dict = {}
        for row in code_close_df.iter_rows(named=True):
            code = str(row["code"])
            price = row["close"]
            prices_dict[code] = float(price) if price is not None else 0
        
        return prices_dict
    
    @timed_stage("获取每日数据")
    def get_daily_data(self, date) -> pl.DataFrame:
        """获取指定日期的数据
        
        Args:
            date: 日期
            
        Returns:
            当日数据DataFrame，以代码为索引，返回polars.DataFrame格式
        """
        if isinstance(date, str):
            date = datetime.fromisoformat(date)
        
        # 优先从缓存中获取数据
        if date in self.daily_data_cache:
            return self.daily_data_cache[date]
        
        # 如果缓存中没有，尝试找最近的日期
        if len(self.trading_dates) > 0:
            nearest_date = min(self.trading_dates, key=lambda x: abs((x - date).total_seconds()))
            print(f"警告: {date} 无数据，使用最近日期 {nearest_date}")
            
            # 检查最近的日期是否在缓存中
            if nearest_date in self.daily_data_cache:
                return self.daily_data_cache[nearest_date]
        
        # 如果缓存中没有，则重新处理数据（这种情况应该很少发生）
        print(f"警告: 日期 {date} 的数据不在缓存中，将实时处理")
        daily_data = self.data.filter(pl.col(self.date_column) == date)
        
        # 如果当日数据为空，返回最近的日期数据
        if daily_data.is_empty() and len(self.trading_dates) > 0:
            nearest_date = min(self.trading_dates, key=lambda x: abs((x - date).total_seconds()))
            print(f"警告: {date} 无数据，使用最近日期 {nearest_date}")
            daily_data = self.data.filter(pl.col(self.date_column) == nearest_date)

        return daily_data
    
    def get_all_data(self) -> pl.DataFrame:
        """获取所有数据（包含所有交易日）
        
        Returns:
            pl.DataFrame: 包含所有交易日数据的DataFrame
        """
        return self.data.clone()
        
    def get_trading_dates_range(self, start_date=None, end_date=None):
        """获取指定日期范围内的交易日列表
        
        Args:
            start_date: 开始日期，可以是datetime对象或ISO格式字符串(YYYY-MM-DD)
            end_date: 结束日期，可以是datetime对象或ISO格式字符串(YYYY-MM-DD)
            
        Returns:
            list: 日期范围内的交易日列表
        """
        # 获取所有交易日
        all_dates = self.get_trading_dates()
        
        # 如果未指定日期范围，返回所有交易日
        if not start_date and not end_date:
            return all_dates
        
        # 转换start_date和end_date为datetime类型（如果它们是字符串）
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date)
        
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date)
        
        # 筛选日期范围内的交易日
        filtered_dates = []
        for date in all_dates:
            if start_date and date < start_date:
                continue
            if end_date and date > end_date:
                continue
            filtered_dates.append(date)
        
        # 打印筛选结果信息
        if filtered_dates:
            print(f"筛选后的交易日期: {len(filtered_dates)} 天 (从 {filtered_dates[0].strftime('%Y-%m-%d')} 到 {filtered_dates[-1].strftime('%Y-%m-%d')})")
        else:
            print("警告: 筛选后没有交易日符合条件")
            
        return filtered_dates
