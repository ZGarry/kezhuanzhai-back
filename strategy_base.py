import time
import numpy as np
import pandas as pd
import polars as pl
from datetime import datetime
import matplotlib.pyplot as plt
from data_manager import DataManager
from get_top_bonds import get_top_bonds_by_score
from tiktrack import timed_stage

# 设置中文显示
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

class Position:
    """持仓类"""
    def __init__(self, code, quantity, cost, market_value, name=None):
        self.code = code
        self.name = name if name else code
        self.quantity = quantity  # 持仓数量
        self.cost = cost  # 持仓成本
        self.market_value = market_value if market_value is not None else cost  # 市场价值
        self.last_update = datetime.now()
        
        # 添加持仓成本属性，用于计算盈亏
        self.cost_basis = cost

    @property
    def average_cost(self) -> float:
        """计算平均成本"""
        return self.cost / self.quantity if self.quantity > 0 else 0
    
    def update_market_value(self, price: float):
        """更新市场价值"""
        self.market_value = self.quantity * price
        self.last_update = datetime.now()


class PortfolioState:
    """投资组合状态类"""
    def __init__(self, cash, positions, timestamp=None):
        self.total_assets = cash + sum(pos.market_value for pos in positions.values())
        self.cash = cash
        self.positions = positions
        self.timestamp = timestamp or datetime.now()


class DailySnapshot:
    """每日持仓快照"""
    def __init__(self, date, cash, positions, total_value):
        self.date = date
        self.cash = cash
        self.positions = positions.copy()
        self.total_value = total_value


class BaseStrategy:
    """策略基类"""
    
    def __init__(self, name , initial_capital: float = 1000000.0, top_n: int = 10):
        """初始化策略"""
        self.strategy_name = f"{name}_策略"
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.top_n = top_n
        self.positions = {}  # {code: Position}
        self.trade_records = []
        self.daily_snapshots = []
        self.portfolio_values = []
        self.dates_array = []
        self.execution_time = 0
        self.preprocessed_data = None
        self.top_bonds = None
        self.portfolio_state = None  # 添加portfolio_state属性
    
    @timed_stage("预处理所有数据")
    def preprocess_data(self, data_manager: DataManager, config):
        """预处理所有数据，提前计算得到每日TOPN的数据"""
        self.top_bonds = get_top_bonds_by_score(df = data_manager.get_all_data(), config= config)
    
    @timed_stage("获取每日关键数据")
    def _get_filtered_daily_data(self, data_manager: DataManager, current_date, top_bonds_today=None):
        """获取筛选后的每日数据，只包含TOP N和当前持仓的债券"""
        # 获取当日TOP N债券的代码
        if top_bonds_today is None:
            top_bonds_today = self.top_bonds.filter(pl.col("trade_date") == current_date)
        top_n_codes = set(top_bonds_today["code"].to_list())
        
        # 获取当前持仓的债券代码
        position_codes = set(self.positions.keys())
        
        # 合并需要关注的债券代码
        target_codes = list(top_n_codes.union(position_codes))
        
        # 如果没有需要关注的代码，返回空数据框
        if not target_codes:
            # 获取原始数据并清空内容，保留结构
            daily_data = data_manager.get_daily_data(current_date)
            return daily_data.head(0)
        
        # 获取筛选后的每日数据
        daily_data = data_manager.get_daily_data(current_date)
        filtered_data = daily_data.filter(pl.col("code").is_in(target_codes))
        
        return filtered_data
    
    def run_backtest(self, data_manager: DataManager, config):
        """运行回测"""
        start_time = time.time()
        
        # 预处理数据
        self.preprocess_data(data_manager, config=config)
        
        # 获取日期范围内的交易日期
        start_date = config.get('start_date')
        end_date = config.get('end_date')
        
        # 使用data_manager的get_trading_dates_range方法获取筛选后的交易日
        dates = data_manager.get_trading_dates_range(start_date, end_date)
        
        self.dates_array = np.array(dates)
        
        # 预先分配空间以存储每日总资产值
        self.portfolio_values = np.zeros(len(dates))
        
        for i, current_date in enumerate(dates):
            # 获取当日TOP N债券
            top_bonds_today = self.top_bonds.filter(pl.col("trade_date") == current_date)
            
            # 直接从data_manager获取当日价格字典，避免重复创建
            prices_dict = data_manager.get_daily_prices(current_date)
            
            # 以收盘价更新当前持仓的市场价值
            self._update_positions_market_value(prices_dict)

            # 计算目标持仓
            target_positions = self._calculate_target_positions(top_bonds_today, prices_dict)
            
            # 计算持仓差异并执行交易
            self._execute_rebalance(target_positions, current_date, prices_dict)
            
            # 计算当前总资产并存储
            total_market_value = sum(pos.market_value for pos in self.positions.values())
            self.portfolio_values[i] = self.cash + total_market_value
            
            # 记录每日持仓快照
            self._save_daily_snapshot(current_date)
            
            # 更新最新的投资组合状态
            self.portfolio_state = PortfolioState(
                cash=self.cash,
                positions=self.positions,
                timestamp=current_date
            )
        
        end_time = time.time()
        self.execution_time = end_time - start_time
        print(f"回测完成，耗时: {self.execution_time:.2f}秒")
        
        # 确保回测结束后保存最终投资组合状态
        if dates:
            final_date = dates[-1]
            self.portfolio_state = PortfolioState(
                cash=self.cash,
                positions=self.positions,
                timestamp=final_date
            )
    
    def _calculate_target_positions(self,top_bonds_today: pl.DataFrame, prices_dict: dict) -> dict:
        """计算目标持仓"""
        # 选择得分最高的N只转债
        return self.cal_should_have(top_bonds_today, prices_dict)

    @timed_stage("计算应该持有多少")
    def cal_should_have(self, top_bonds_today: pl.DataFrame, prices_dict: dict):
        """计算应该持有哪些转债及其数量"""            
        # 计算每只转债应分配的金额
        total_assets = self.cash + sum(pos.market_value for pos in self.positions.values())
        amount_per_bond = total_assets / self.top_n
        
        # 预先创建结果容器，减少字典重新分配
        target_positions = {}
        
        # 使用原生python迭代，减少数据转换开销
        codes = top_bonds_today['code']
        names = top_bonds_today['name']
        
        # 只在DataFrame内进行一次迭代
        for i in range(len(codes)):
            code = str(codes[i])
            price = prices_dict.get(code, 0)
            
            # 快速过滤无效价格
            if price <= 0:
                continue
                
            # 计算购买数量
            quantity = int(amount_per_bond / price)
            
            # 只添加有效数量的持仓
            if quantity > 0:
                target_positions[code] = {
                    'quantity': quantity,
                    'price': price,
                    'name': names[i]
                }
        
        return target_positions

    @timed_stage("更新持仓市值")
    def _update_positions_market_value(self, prices_dict: dict):
        """使用价格字典直接更新持仓的市场价值"""
        # 如果没有持仓，直接返回
        if not self.positions:
            return
        
        # 直接使用prices_dict更新每个持仓的市场价值
        now = datetime.now()
        for code, position in self.positions.items():
            # 从价格字典获取价格
            price = prices_dict.get(code)
            # 如果价格大于0，则更新市场价值，不然保持不变
            if price is not None and price > 0:
                # 直接计算并更新市场价值
                position.market_value = position.quantity * price
                position.last_update = now
    
    @timed_stage("执行再平衡")
    def _execute_rebalance(self, target_positions: dict, current_date: datetime, prices_dict: dict):
        """执行持仓再平衡"""
        # 替换原先的_get_price_from_data调用
        def get_price(code):
            return prices_dict.get(code, 0)
        
        # 处理需要卖出的持仓
        for code in list(self.positions.keys()):
            if code not in target_positions:
                # 需要全部卖出
                price = get_price(code)
                if price > 0:
                    self._execute_sell(code, price, current_date)
            else:
                # 需要部分卖出
                current_quantity = self.positions[code].quantity
                target_quantity = target_positions[code]['quantity']
                if current_quantity > target_quantity:
                    price = get_price(code)
                    sell_quantity = current_quantity - target_quantity
                    self._execute_sell(code, price, current_date, sell_quantity)
        
        # 处理需要买入的持仓
        for code, target in target_positions.items():
            if code not in self.positions:
                # 需要新建仓位
                self._execute_buy(code, target['quantity'], target['price'], target['name'], current_date)
            else:
                # 需要加仓
                current_quantity = self.positions[code].quantity
                target_quantity = target['quantity']
                if current_quantity < target_quantity:
                    buy_quantity = target_quantity - current_quantity
                    self._execute_buy(code, buy_quantity, target['price'], target['name'], current_date)

    @timed_stage("执行卖出操作")
    def _execute_sell(self, code: str, price: float, current_date: datetime, quantity=None):
        """执行卖出操作"""
        if code not in self.positions:
            return
        
        position = self.positions[code]
        sell_quantity = quantity if quantity else position.quantity
        sell_amount = sell_quantity * price
        
        # 计算收益
        cost_basis = position.cost / position.quantity
        profit = (price - cost_basis) * sell_quantity
        profit_rate = (price / cost_basis - 1) * 100 if cost_basis > 0 else 0
        
        # 更新现金和持仓
        self.cash += sell_amount
        
        if quantity is None or sell_quantity >= position.quantity:
            # 全部卖出
            del self.positions[code]
        else:
            # 部分卖出
            position.quantity -= sell_quantity
            position.market_value = position.quantity * price
        
        # 记录交易
        self.trade_records.append({
            '日期': current_date,
            '转债代码': code,
            '转债名称': position.name,
            '操作': '卖出',
            '数量': sell_quantity,
            '价格': price,
            '金额': sell_amount,
            '收益': profit,
            '收益率': profit_rate
        })
    
    @timed_stage("执行买入操作")
    def _execute_buy(self, code: str, quantity: int, price: float, name: str, current_date: datetime):
        """执行买入操作"""
        buy_amount = quantity * price
        
        # 检查现金是否足够
        if self.cash < buy_amount:
            # print(f"警告: 现金不足，需要 {buy_amount}，但只有 {self.cash}，买入 {code} 取消")
            return
        
        # 扣除现金
        self.cash -= buy_amount
        
        if code in self.positions:
            # 更新已有持仓
            position = self.positions[code]
            original_quantity = position.quantity
            original_cost = position.cost
            total_quantity = original_quantity + quantity
            total_cost = original_cost + buy_amount
            
            # 更新持仓
            position.cost = total_cost
            position.cost_basis = total_cost  # 更新cost_basis属性
            position.quantity = total_quantity
            position.market_value = total_quantity * price
        else:
            # 新建仓位
            position = Position(
                code=code,
                name=name,
                quantity=quantity,
                cost=buy_amount,
                market_value=buy_amount
            )
            self.positions[code] = position
            # Position构造函数已经设置了cost_basis属性
        
        # 记录交易
        self.trade_records.append({
            '日期': current_date,
            '转债代码': code,
            '转债名称': name,
            '操作': '买入',
            '数量': quantity,
            '价格': price,
            '金额': buy_amount,
            '收益': 0,
            '收益率': 0
        })
    
    @timed_stage("保存每日快照")
    def _save_daily_snapshot(self, current_date: datetime):
        """保存每日持仓快照"""
        total_value = self.cash + sum(pos.market_value for pos in self.positions.values())
        snapshot = DailySnapshot(
            date=current_date,
            cash=self.cash,
            positions=self.positions,
            total_value=total_value
        )
        self.daily_snapshots.append(snapshot)
    
    def get_trade_records(self) -> pd.DataFrame:
        """获取交易记录"""
        return pd.DataFrame(self.trade_records)
    
    def get_daily_report(self) -> pd.DataFrame:
        """获取每日持仓报告（简化版）"""
        if not self.daily_snapshots:
            return pd.DataFrame()
        
        # 构建简化的每日报告
        daily_data = []
        
        for snapshot in self.daily_snapshots:
            # 计算持仓总市值
            positions_value = sum(pos.market_value for pos in snapshot.positions.values())
            
            # 添加每日数据
            daily_data.append({
                "日期": snapshot.date,
                "现金": snapshot.cash,
                "持仓市值": positions_value,
                "总资产": snapshot.total_value,
                "持仓数量": len(snapshot.positions)
            })
        
        # 转换为DataFrame
        df = pd.DataFrame(daily_data)
        
        return df
    
    @timed_stage("分析回测结果")
    def analyze_results(self) -> dict:
        """分析回测结果，计算各项指标"""
        if len(self.portfolio_values) == 0:
            return {"error": "没有回测数据"}
        
        # 计算收益率
        returns = self.portfolio_values / self.initial_capital - 1
        final_return = returns[-1]
        
        # 计算年化收益率
        days = len(self.dates_array)
        annual_return = (1 + final_return) ** (252 / days) - 1
        
        # 计算最大回撤
        max_drawdown, max_drawdown_start, max_drawdown_end = self._calculate_max_drawdown_with_index(self.portfolio_values)
        
        # 计算夏普比率
        daily_returns = np.diff(self.portfolio_values) / self.portfolio_values[:-1]
        sharpe_ratio = self._calculate_sharpe_ratio(daily_returns)
        
        # 胜率计算
        win_trades = len([record for record in self.trade_records if record['操作'] == '卖出' and record['收益'] > 0])
        total_sell_trades = len([record for record in self.trade_records if record['操作'] == '卖出'])
        win_rate = win_trades / total_sell_trades if total_sell_trades > 0 else 0
        
        return {
            "策略名称": self.strategy_name,
            "初始资金": self.initial_capital,
            "结束净值": self.portfolio_values[-1] if len(self.portfolio_values) > 0 else 0,
            "总收益率": final_return,
            "年化收益率": annual_return,
            "最大回撤": max_drawdown,
            "夏普比率": sharpe_ratio,
            "交易次数": len(self.trade_records),
            "胜率": win_rate,
            "回测开始日期": self.dates_array[0] if len(self.dates_array) > 0 else None,
            "回测结束日期": self.dates_array[-1] if len(self.dates_array) > 0 else None,
            "回测天数": days,
            "最大回撤起始日期": self.dates_array[max_drawdown_start] if max_drawdown_start is not None else None,
            "最大回撤结束日期": self.dates_array[max_drawdown_end] if max_drawdown_end is not None else None,
            "执行耗时": self.execution_time
        }
    
    def plot_performance(self):
        """绘制净值曲线"""
        if len(self.portfolio_values) == 0 or len(self.dates_array) == 0:
            print("没有回测数据，无法绘制净值曲线")
            return
        
        # 转换日期格式以便绘图
        dates = [pd.to_datetime(date) for date in self.dates_array]
        
        # 计算策略净值序列
        nav_series = self.portfolio_values / self.initial_capital
        
        # 绘制策略曲线
        plt.figure(figsize=(12, 6))
        plt.plot(dates, nav_series, label=f"{self.strategy_name}", color='#1f77b4', linewidth=2)
        
        # 添加最大回撤标记
        max_drawdown, start_idx, end_idx = self._calculate_max_drawdown_with_index(self.portfolio_values)
        if start_idx is not None and end_idx is not None:
            # 标记最大回撤区间
            plt.axvspan(dates[start_idx], dates[end_idx], alpha=0.2, color='red')
            plt.scatter(dates[start_idx], nav_series[start_idx], color='green', s=50, zorder=5)
            plt.scatter(dates[end_idx], nav_series[end_idx], color='red', s=50, zorder=5)
        
        # 设置图表属性
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.xlabel('日期')
        plt.ylabel('净值')
        plt.title(f"{self.strategy_name} 净值曲线")
        plt.legend(loc='best')
        
        # 设置Y轴从0开始
        plt.ylim(bottom=max(0, min(nav_series) * 0.95))
        
        # 优化X轴日期显示
        plt.gcf().autofmt_xdate()
    
    def _calculate_max_drawdown_with_index(self, values):
        """计算最大回撤及其开始和结束索引"""
        max_so_far = values[0]
        max_drawdown = 0
        max_drawdown_start = None
        max_drawdown_end = None
        current_start = 0
        
        for i, value in enumerate(values):
            if value > max_so_far:
                max_so_far = value
                current_start = i
            
            drawdown = (max_so_far - value) / max_so_far if max_so_far != 0 else 0
            
            if drawdown > max_drawdown:
                max_drawdown = drawdown
                max_drawdown_start = current_start
                max_drawdown_end = i
        
        return max_drawdown, max_drawdown_start, max_drawdown_end

    def _calculate_sharpe_ratio(self, returns, risk_free_rate=0.03, trading_days=252):
        """计算夏普比率"""
        if len(returns) == 0:
            return 0
        
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0
        
        daily_risk_free = (1 + risk_free_rate) ** (1/trading_days) - 1
        
        return (mean_return - daily_risk_free) / std_return * (trading_days ** 0.5) 