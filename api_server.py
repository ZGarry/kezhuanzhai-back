from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Union, Any
from datetime import datetime, date
from pydantic import BaseModel
from enum import Enum
import signal
import sys
import time
from create_strategy import create_strategy
from data_manager import DataManager
from after_backtest_report import generate_backtest_reports
import polars as pl

# 全局数据预加载
print("正在加载可转债数据...")
load_start_time = time.time()
global_data_manager = DataManager('data/cb_data.pq')
print(f"数据加载完成, 耗时: {time.time() - load_start_time:.2f}秒")

# 数据模型定义
class ConvertibleBond(BaseModel):
    code: str
    name: str
    close: float
    pct_chg: float
    volume: Optional[float]
    amount: Optional[float]
    conv_price: Optional[float]
    conv_value: Optional[float]
    conv_prem: Optional[float]
    ytm: Optional[float]
    rating: Optional[str]
    remain_size: Optional[float]
    turnover: Optional[float]
    dblow: Optional[float]
    stock_code: Optional[str]
    stock_name: Optional[str]
    stock_price: Optional[float]
    stock_pct_chg: Optional[float]
    industry: Optional[str]
    area: Optional[str]

    class Config:
        arbitrary_types_allowed = True

# 市场总览数据模型
class MarketOverview(BaseModel):
    total_bonds: int  # 可转债总数量
    total_market_value: float  # 可转债总市值(亿元)
    total_trading_amount: float  # 当日成交总额(亿元)
    avg_premium_rate: float  # 平均转股溢价率
    avg_bond_premium_rate: float  # 平均纯债溢价率
    avg_ytm: float  # 平均收益率
    latest_date: str  # 数据日期

# 分布统计数据模型
class DistributionData(BaseModel):
    premium_distribution: Dict[str, int]  # 转股溢价率分布
    ytm_distribution: Dict[str, int]  # 收益率分布
    duration_distribution: Dict[str, int]  # 剩余期限分布
    industry_distribution: Dict[str, int]  # 行业分布

# 排行榜数据模型
class RankingData(BaseModel):
    double_low_top: List[ConvertibleBond]  # 双低指标排行
    high_ytm: List[ConvertibleBond]  # 收益率最高的
    low_ytm: List[ConvertibleBond]  # 收益率最低的
    high_premium: List[ConvertibleBond]  # 转股溢价率最高的
    low_premium: List[ConvertibleBond]  # 转股溢价率最低的
    top_gainers: List[ConvertibleBond]  # 涨幅最大的
    top_losers: List[ConvertibleBond]  # 涨幅最小的
    most_active: List[ConvertibleBond]  # 成交额最高的

# 回测参数模型
class BacktestParams(BaseModel):
    initial_capital: Optional[float] = 1000000.0
    top_n: Optional[int] = 10
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    strategy_params: Optional[Dict] = {}
    output_dir: Optional[str] = None

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 存储WebSocket连接
active_connections: Dict[int, WebSocket] = {}

def signal_handler(sig, frame):
    print("\n优雅关闭服务器...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# 定义策略类型枚举
class StrategyType(str, Enum):
    LOW_PRICE = "low_price"
    DOUBLE_LOW = "double_low"
    TRIPLE_LOW = "triple_low"
    YIELD = "yield"
    VOLATILITY = "volatility"
    CUSTOM = "custom"

@app.get("/api/convertible-bonds", response_model=Dict[str, Union[str, List]])
async def get_convertible_bonds(date: Optional[str] = None):
    """获取可转债数据，可选择特定日期"""
    try:
        # 获取数据管理器
        data_manager = global_data_manager
        
        # 初始化变量存储当前数据日期
        current_date_str = None
        
        # 根据是否有日期参数决定获取哪天的数据
        if date:
            try:
                # 尝试解析日期
                query_date = datetime.strptime(date, "%Y-%m-%d")
                # 检查日期是否是有效的交易日
                if query_date not in data_manager.trading_dates:
                    # 找到最近的交易日
                    all_dates = sorted(data_manager.trading_dates)
                    valid_date = None
                    for d in all_dates:
                        if d <= query_date:
                            valid_date = d
                    if valid_date:
                        query_date = valid_date
                    else:
                        # 如果没有更早的交易日，使用第一个交易日
                        query_date = all_dates[0] if all_dates else None
                
                if query_date:
                    # 记录当前数据日期
                    current_date_str = query_date.strftime("%Y-%m-%d")
                    
                    # 获取特定日期的数据
                    daily_data = data_manager.get_daily_data(query_date)
                    if daily_data is None or daily_data.is_empty():
                        return {"status": "error", "message": f"找不到日期 {date} 的数据"}
                else:
                    # 如果无法确定有效日期，回退到获取最新数据
                    daily_data = data_manager.get_daily_data(data_manager.trading_dates[-1])
                    # 获取最新交易日期
                    latest_date = data_manager.trading_dates[-1]
                    current_date_str = latest_date.strftime("%Y-%m-%d")
            except ValueError:
                # 日期格式错误，返回错误信息
                return {"status": "error", "message": f"日期格式无效: {date}，请使用YYYY-MM-DD格式"}
        else:
            # 获取最新的可转债数据
            daily_data = data_manager.get_daily_data(data_manager.trading_dates[-1])
            # 获取最新交易日期
            latest_date = data_manager.trading_dates[-1]
            current_date_str = latest_date.strftime("%Y-%m-%d")
        
        # 直接将Polars DataFrame转换为JSON可序列化的字典列表
        bonds_data = daily_data.to_dicts()
        
        # 处理datetime类型以确保JSON可序列化
        for bond in bonds_data:
            for key, value in bond.items():
                if isinstance(value, (datetime, date)):
                    bond[key] = value.isoformat()
            
        return {
            "status": "success", 
            "data": bonds_data,
            "currentDate": current_date_str
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"获取可转债数据失败: {str(e)}\n{error_detail}")

@app.get("/api/field-info")
async def get_field_info():
    """获取字段信息"""
    try:
        # 从数据管理器中获取列信息
        field_info = {
            "basic": ["code", "name", "trade_date"],
            "price": ["pre_close", "open", "high", "low", "close", "pct_chg", "vol", "amount"],
            "stock": ["code_stk", "pre_close_stk", "open_stk", "high_stk", "low_stk", "close_stk", "pct_chg_stk", "vol_stk", "amount_stk"],
            "valuation": ["pe_ttm", "pb", "ps_ttm", "total_share", "float_share", "total_mv", "circ_mv", "volatility_stk"],
            "convertible": ["is_call", "conv_price", "conv_value", "conv_prem", "theory_conv_prem", "mod_conv_prem", "dblow", "issue_size", "remain_size", "remain_cap", "turnover", "cap_mv_rate", "list_days", "left_years", "ytm", "pure_value", "bond_prem", "option_value", "theory_value", "theory_bias"],
            "others": ["rating", "yy_rating", "orgform", "area", "industry_1", "industry_2", "industry_3", "maturity_put_price", "maturity", "popularity_ranking"]
        }
        return {"status": "success", "data": field_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取字段信息失败: {str(e)}")

@app.post("/api/backtest")
async def run_backtest(strategy_type: StrategyType, params: BacktestParams):
    """运行回测策略并返回结果"""
    start_time = time.time()  # 记录开始时间
    
    try:
        # 创建完整的策略配置字典
        config = {
            "strategy_type": strategy_type.value,
            "initial_capital": params.initial_capital,
            "top_n": params.top_n,
            "start_date": params.start_date,
            "end_date": params.end_date,
            "strategy_params": params.strategy_params
        }
        
        # 设置输出目录
        if params.output_dir:
            config["output_dir"] = params.output_dir
        else:
            config["output_dir"] = f"results/{strategy_type.value}_{int(time.time())}"
        
        # 创建策略实例和处理后的配置
        strategy, config = create_strategy(config)
        
        # 使用全局数据管理器，不再基于日期筛选
        data_manager = global_data_manager
        
        # 运行回测，传入config参数
        strategy.run_backtest(data_manager, config=config)
        
        # 生成回测报告和图表
        report_files = generate_backtest_reports(strategy, config["output_dir"])
        
        # 构建最小化处理的结果字典
        # 直接返回原始数据格式，让前端来适应
        result = {
            "performance": strategy.analyze_results(),
            "trades": strategy.get_trade_records().to_dict(orient='records'),
            "daily": strategy.get_daily_report().to_dict(orient='records'),
            "report_files": report_files,
            "portfolio_values": strategy.portfolio_values.tolist() if hasattr(strategy, 'portfolio_values') and len(strategy.portfolio_values) > 0 else [],
            "dates": [date_obj.strftime('%Y-%m-%d') if isinstance(date_obj, (datetime, date)) else str(date_obj) 
                     for date_obj in strategy.dates_array] if hasattr(strategy, 'dates_array') and len(strategy.dates_array) > 0 else [],
            "portfolio_state": None,  # 将被下面赋值
            "execution_time": time.time() - start_time
        }
        
        # 添加投资组合状态，如果存在的话
        if hasattr(strategy, 'portfolio_state') and strategy.portfolio_state:
            # 将PortfolioState对象转换为字典
            positions_dict = {}
            if hasattr(strategy.portfolio_state, 'positions'):
                for code, position in strategy.portfolio_state.positions.items():
                    positions_dict[code] = {
                        "code": position.code,
                        "name": position.name,
                        "quantity": position.quantity,
                        "cost_basis": position.cost_basis,
                        "market_value": position.market_value
                    }
            
            result["portfolio_state"] = {
                "total_assets": strategy.portfolio_state.total_assets,
                "cash": strategy.portfolio_state.cash,
                "positions": positions_dict,
                "timestamp": strategy.portfolio_state.timestamp.strftime("%Y-%m-%d") if hasattr(strategy.portfolio_state, 'timestamp') else None
            }
        
        return result
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/market-overview", response_model=MarketOverview)
async def get_market_overview(date: Optional[str] = None):
    """获取市场总览数据"""
    try:
        # 获取数据管理器
        data_manager = global_data_manager
        
        # 根据是否有日期参数决定获取哪天的数据
        current_date = None
        if date:
            try:
                query_date = datetime.strptime(date, "%Y-%m-%d")
                all_dates = sorted(data_manager.trading_dates)
                valid_date = None
                for d in all_dates:
                    if d <= query_date:
                        valid_date = d
                if valid_date:
                    current_date = valid_date
                else:
                    current_date = all_dates[0] if all_dates else None
            except ValueError:
                # 日期格式错误，使用最新日期
                current_date = data_manager.trading_dates[-1]
        else:
            # 使用最新日期
            current_date = data_manager.trading_dates[-1]
        
        # 获取当日数据
        daily_data = data_manager.get_daily_data(current_date)
        
        if daily_data is None or daily_data.is_empty():
            raise HTTPException(status_code=404, detail="数据不存在")
        
        # 计算市场总览数据
        total_bonds = daily_data.height
        
        # 总市值 (亿元)
        remain_size_col = daily_data.get_column('remain_size')
        total_market_value = remain_size_col.sum() / 100  # 假设remain_size单位为亿元
        
        # 当日成交总额 (亿元)
        amount_col = daily_data.get_column('amount')
        total_trading_amount = amount_col.sum() / 100000000  # 假设amount单位为元
        
        # 平均转股溢价率
        conv_prem_col = daily_data.get_column('conv_prem')
        avg_premium_rate = conv_prem_col.mean()
        
        # 平均纯债溢价率
        bond_prem_col = daily_data.get_column('bond_prem')
        avg_bond_premium_rate = bond_prem_col.mean()
        
        # 平均收益率
        ytm_col = daily_data.get_column('ytm')
        avg_ytm = ytm_col.mean()
        
        # 格式化日期
        date_str = current_date.strftime("%Y-%m-%d")
        
        return MarketOverview(
            total_bonds=total_bonds,
            total_market_value=round(float(total_market_value), 2),
            total_trading_amount=round(float(total_trading_amount), 2),
            avg_premium_rate=round(float(avg_premium_rate), 2),
            avg_bond_premium_rate=round(float(avg_bond_premium_rate), 2),
            avg_ytm=round(float(avg_ytm), 2),
            latest_date=date_str
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取市场总览数据失败: {str(e)}")

@app.get("/api/distribution-data", response_model=DistributionData)
async def get_distribution_data(date: Optional[str] = None):
    """获取分布统计数据"""
    try:
        # 获取数据管理器
        data_manager = global_data_manager
        
        # 根据是否有日期参数决定获取哪天的数据
        current_date = None
        if date:
            try:
                query_date = datetime.strptime(date, "%Y-%m-%d")
                all_dates = sorted(data_manager.trading_dates)
                valid_date = None
                for d in all_dates:
                    if d <= query_date:
                        valid_date = d
                if valid_date:
                    current_date = valid_date
                else:
                    current_date = all_dates[0] if all_dates else None
            except ValueError:
                # 日期格式错误，使用最新日期
                current_date = data_manager.trading_dates[-1]
        else:
            # 使用最新日期
            current_date = data_manager.trading_dates[-1]
        
        # 获取当日数据
        daily_data = data_manager.get_daily_data(current_date)
        
        if daily_data is None or daily_data.is_empty():
            raise HTTPException(status_code=404, detail="数据不存在")
        
        # 转股溢价率分布
        premium_counts = {
            "-20": 0,
            "0-10": 0,
            "10-20": 0,
            "20-30": 0,
            "30-40": 0,
            "40-50": 0,
            "50-100": 0,
            "100+": 0
        }
        
        conv_prem_col = daily_data.get_column('conv_prem')
        for premium in conv_prem_col:
            if premium < 0:
                premium_counts["-20"] += 1
            elif premium < 10:
                premium_counts["0-10"] += 1
            elif premium < 20:
                premium_counts["10-20"] += 1
            elif premium < 30:
                premium_counts["20-30"] += 1
            elif premium < 40:
                premium_counts["30-40"] += 1
            elif premium < 50:
                premium_counts["40-50"] += 1
            elif premium < 100:
                premium_counts["50-100"] += 1
            else:
                premium_counts["100+"] += 1
        
        # 收益率分布
        ytm_counts = {
            "<0": 0,
            "0-1": 0,
            "1-2": 0,
            "2-3": 0,
            "3-4": 0,
            "4-5": 0,
            "5+": 0
        }
        
        ytm_col = daily_data.get_column('ytm')
        for ytm in ytm_col:
            if ytm is None:
                continue
            if ytm < 0:
                ytm_counts["<0"] += 1
            elif ytm < 1:
                ytm_counts["0-1"] += 1
            elif ytm < 2:
                ytm_counts["1-2"] += 1
            elif ytm < 3:
                ytm_counts["2-3"] += 1
            elif ytm < 4:
                ytm_counts["3-4"] += 1
            elif ytm < 5:
                ytm_counts["4-5"] += 1
            else:
                ytm_counts["5+"] += 1
        
        # 剩余期限分布
        duration_counts = {
            "<1": 0,
            "1-2": 0,
            "2-3": 0,
            "3-4": 0,
            "4-5": 0,
            "5+": 0
        }
        
        left_years_col = daily_data.get_column('left_years')
        for duration in left_years_col:
            if duration is None:
                continue
            if duration < 1:
                duration_counts["<1"] += 1
            elif duration < 2:
                duration_counts["1-2"] += 1
            elif duration < 3:
                duration_counts["2-3"] += 1
            elif duration < 4:
                duration_counts["3-4"] += 1
            elif duration < 5:
                duration_counts["4-5"] += 1
            else:
                duration_counts["5+"] += 1
        
        # 行业分布
        industry_counts = {}
        industry_col = daily_data.get_column('industry_1')
        for industry in industry_col:
            if industry is None:
                continue
            if industry not in industry_counts:
                industry_counts[industry] = 0
            industry_counts[industry] += 1
        
        # 只保留前10个行业
        sorted_industries = sorted(industry_counts.items(), key=lambda x: x[1], reverse=True)
        top_industries = {k: v for k, v in sorted_industries[:10]}
        
        return DistributionData(
            premium_distribution=premium_counts,
            ytm_distribution=ytm_counts,
            duration_distribution=duration_counts,
            industry_distribution=top_industries
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分布统计数据失败: {str(e)}")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    """WebSocket连接处理"""
    await websocket.accept()
    active_connections[client_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            # 处理接收到的数据
            response_data = {
                "message": "数据已接收", 
                "timestamp": str(datetime.now())
            }
            await websocket.send_json(response_data)
    except:
        if client_id in active_connections:
            del active_connections[client_id]

@app.get("/api/ranking-data", response_model=RankingData)
async def get_ranking_data(date: Optional[str] = None, limit: int = 10):
    """获取排行榜数据"""
    try:
        # 获取数据管理器
        data_manager = global_data_manager
        
        # 根据是否有日期参数决定获取哪天的数据
        current_date = None
        if date:
            try:
                query_date = datetime.strptime(date, "%Y-%m-%d")
                all_dates = sorted(data_manager.trading_dates)
                valid_date = None
                for d in all_dates:
                    if d <= query_date:
                        valid_date = d
                if valid_date:
                    current_date = valid_date
                else:
                    current_date = all_dates[0] if all_dates else None
            except ValueError:
                # 日期格式错误，使用最新日期
                current_date = data_manager.trading_dates[-1]
        else:
            # 使用最新日期
            current_date = data_manager.trading_dates[-1]
        
        # 获取当日数据
        daily_data = data_manager.get_daily_data(current_date)
        
        if daily_data is None or daily_data.is_empty():
            raise HTTPException(status_code=404, detail="数据不存在")
        
        # 转换格式函数
        def format_bond(row):
            return {
                "code": row.get('code', ''),
                "name": row.get('name', ''),
                "close": row.get('close', 0.0),
                "pct_chg": row.get('pct_chg', 0.0),
                "volume": row.get('vol', None),
                "amount": row.get('amount', None),
                "conv_price": row.get('conv_price', None),
                "conv_value": row.get('conv_value', None),
                "conv_prem": row.get('conv_prem', None),
                "ytm": row.get('ytm', None),
                "rating": row.get('rating', None),
                "remain_size": row.get('remain_size', None),
                "turnover": row.get('turnover', None),
                "dblow": row.get('dblow', None),
                "stock_code": row.get('code_stk', ''),
                "stock_name": row.get('name_stk', None),
                "stock_price": row.get('close_stk', 0.0),
                "stock_pct_chg": row.get('pct_chg_stk', 0.0),
                "industry": row.get('industry_1', None),
                "area": row.get('area', None)
            }
        
        # 双低指标排行
        double_low_df = daily_data.select(['code', 'dblow']).sort('dblow')
        double_low_top = []
        for i, code in enumerate(double_low_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            double_low_top.append(ConvertibleBond(**format_bond(row)))
        
        # 收益率最高的
        high_ytm_df = daily_data.select(['code', 'ytm']).sort('ytm', descending=True)
        high_ytm = []
        for i, code in enumerate(high_ytm_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            high_ytm.append(ConvertibleBond(**format_bond(row)))
        
        # 收益率最低的
        low_ytm_df = daily_data.select(['code', 'ytm']).sort('ytm')
        low_ytm = []
        for i, code in enumerate(low_ytm_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            low_ytm.append(ConvertibleBond(**format_bond(row)))
        
        # 转股溢价率最高的
        high_premium_df = daily_data.select(['code', 'conv_prem']).sort('conv_prem', descending=True)
        high_premium = []
        for i, code in enumerate(high_premium_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            high_premium.append(ConvertibleBond(**format_bond(row)))
        
        # 转股溢价率最低的
        low_premium_df = daily_data.select(['code', 'conv_prem']).sort('conv_prem')
        low_premium = []
        for i, code in enumerate(low_premium_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            low_premium.append(ConvertibleBond(**format_bond(row)))
        
        # 涨幅最大的
        top_gainers_df = daily_data.select(['code', 'pct_chg']).sort('pct_chg', descending=True)
        top_gainers = []
        for i, code in enumerate(top_gainers_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            top_gainers.append(ConvertibleBond(**format_bond(row)))
        
        # 涨幅最小的
        top_losers_df = daily_data.select(['code', 'pct_chg']).sort('pct_chg')
        top_losers = []
        for i, code in enumerate(top_losers_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            top_losers.append(ConvertibleBond(**format_bond(row)))
        
        # 成交额最高的
        most_active_df = daily_data.select(['code', 'amount']).sort('amount', descending=True)
        most_active = []
        for i, code in enumerate(most_active_df.get_column('code')[:limit]):
            row = daily_data.filter(pl.col('code') == code).row(0, named=True)
            most_active.append(ConvertibleBond(**format_bond(row)))
        
        return RankingData(
            double_low_top=double_low_top,
            high_ytm=high_ytm,
            low_ytm=low_ytm,
            high_premium=high_premium,
            low_premium=low_premium,
            top_gainers=top_gainers,
            top_losers=top_losers,
            most_active=most_active
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取排行榜数据失败: {str(e)}")

@app.get("/portfolio_state")
async def get_portfolio_state():
    """获取投资组合状态（示例数据）"""
    portfolio_state = {
        "total_assets": 1000000.0,
        "cash": 500000.0,
        "positions": {
            "123123": {  # 可转债代码
                "symbol": "123123",
                "name": "测试转债",
                "quantity": 100,
                "cost_basis": 100.0,
                "market_value": 10500.0,
                "last_update": str(datetime.now())
            }
        },
        "timestamp": str(datetime.now())
    }
    return portfolio_state

# 兼容旧版API
@app.get("/api/backtest/{strategy_name}")
async def run_backtest_legacy(strategy_name: str):
    """旧版回测API，兼容性保留"""
    return await run_backtest(
        strategy_type=StrategyType(strategy_name), 
        params=BacktestParams(
            initial_capital=1000000.0,
            top_n=10,
            output_dir=f"results/{strategy_name}_legacy_{int(time.time())}"
        )
    )

# 添加新的POST方法端点，支持前端JSON配置
@app.post("/api/backtest/{strategy_name}")
async def run_backtest_with_params(strategy_name: str, params: BacktestParams):
    """接收前端参数化请求的回测API"""
    try:
        # 转换策略类型
        strategy_enum = StrategyType(strategy_name)
        # 调用基础回测函数
        return await run_backtest(
            strategy_type=strategy_enum, 
            params=params
        )
    except ValueError:
        # 处理无效的策略类型
        raise HTTPException(
            status_code=400, 
            detail=f"无效的策略类型: {strategy_name}。有效选项: {[e.value for e in StrategyType]}"
        )
    except Exception as e:
        # 处理其他异常
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/factors")
async def get_available_factors():
    """获取所有可用的因子列表"""
    try:
        # 定义可用因子列表
        factors = [
            {"id": "close", "name": "收盘价", "description": "转债收盘价", "category": "price"},
            {"id": "conv_prem", "name": "转股溢价率", "description": "转债价格与转股价值的溢价率", "category": "convertible"},
            {"id": "ytm", "name": "到期收益率", "description": "转债到期收益率", "category": "convertible"},
            {"id": "dblow", "name": "双低因子", "description": "转股溢价率和收盘价的综合指标", "category": "convertible"},
            {"id": "pct_chg", "name": "涨跌幅", "description": "当日涨跌幅", "category": "price"},
            {"id": "vol", "name": "成交量", "description": "当日成交量", "category": "price"},
            {"id": "amount", "name": "成交额", "description": "当日成交额", "category": "price"},
            {"id": "turnover", "name": "换手率", "description": "当日换手率", "category": "convertible"},
            {"id": "remain_size", "name": "剩余规模", "description": "债券剩余规模", "category": "convertible"},
            {"id": "remain_cap", "name": "剩余市值", "description": "债券剩余市值", "category": "convertible"},
            {"id": "bond_prem", "name": "纯债溢价率", "description": "转债价格与纯债价值的溢价率", "category": "convertible"},
            {"id": "left_years", "name": "剩余年限", "description": "债券剩余年限", "category": "convertible"},
            {"id": "list_days", "name": "上市天数", "description": "债券上市天数", "category": "convertible"},
        ]
        
        # 定义可用的过滤条件
        filters = [
            {"id": "left_years", "name": "剩余年限", "description": "债券剩余年限", "operators": [">", "<", "=", ">=", "<="]},
            {"id": "list_days", "name": "上市天数", "description": "债券上市天数", "operators": [">", "<", "=", ">=", "<="]},
            {"id": "close", "name": "收盘价", "description": "转债收盘价", "operators": [">", "<", "=", ">=", "<="]},
            {"id": "conv_prem", "name": "转股溢价率", "description": "转债价格与转股价值的溢价率", "operators": [">", "<", "=", ">=", "<="]},
            {"id": "ytm", "name": "到期收益率", "description": "转债到期收益率", "operators": [">", "<", "=", ">=", "<="]},
            {"id": "dblow", "name": "双低因子", "description": "转股溢价率和收盘价的综合指标", "operators": [">", "<", "=", ">=", "<="]},
        ]
        
        return {
            "status": "success", 
            "data": {
                "factors": factors,
                "filters": filters
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取因子列表失败: {str(e)}")

@app.get("/api/trading-dates", response_model=Dict[str, Any])
async def get_trading_dates():
    """获取可用的交易日期范围"""
    try:
        # 获取数据管理器
        data_manager = global_data_manager
        
        # 获取所有交易日期
        trading_dates = data_manager.get_trading_dates()
        
        if not trading_dates:
            raise HTTPException(status_code=404, detail="没有可用的交易日期")
        
        # 格式化日期为字符串
        start_date = trading_dates[0].strftime("%Y-%m-%d")
        end_date = trading_dates[-1].strftime("%Y-%m-%d")
        all_dates = [date.strftime("%Y-%m-%d") for date in trading_dates]
        
        return {
            "status": "success",
            "data": {
                "start_date": start_date,
                "end_date": end_date,
                "all_dates": all_dates,
                "total_days": len(trading_dates)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取交易日期失败: {str(e)}")

def main():
    # 创建策略
    strategy, config = create_strategy()
    data_path = config.get('data_path', 'data/cb_data.pq')
    start_date = config.get('start_date')
    end_date = config.get('end_date')
    output_dir = config.get('output_dir', 'results/default')
    
    # 初始化数据
    print(f"正在加载数据: {data_path}")
    data_manager = DataManager(data_path)
    
    # 运行回测
    print(f"正在使用策略: {config.get('strategy_type', 'default')}")
    strategy.run_backtest(data_manager, config)
    
    # 生成回测报告和图表
    generate_backtest_reports(strategy, output_dir)
    print("\n回测完成!")

if __name__ == "__main__":
    import uvicorn
    print("正在启动API服务器...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
