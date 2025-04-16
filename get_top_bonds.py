import polars as pl
import json
from datetime import datetime


def get_top_bonds_by_score(df, config):
    """
    根据配置文件计算多因子排名，并获取每个交易日得分最高的可转债
    
    参数:
    df (polars.DataFrame): 输入的数据框
    config (dict): 策略配置参数，包含以下关键字:
        - start_date (str): 起始日期 YYYY-MM-DD
        - end_date (str): 结束日期 YYYY-MM-DD
        - top_n (int): 每天选择的转债数量
        - strategy_params (dict): 策略参数，包含:
            - indicators (list): 用于排名的指标列名列表
            - weights (list): 对应指标的权重列表 (-1表示负相关，1表示正相关)
            - filters (dict): 前置筛选条件，如 {"left_years": [">", 0.5]}
    
    返回:
    polars.DataFrame: 包含每个交易日得分最高的N只可转债的DataFrame
    """
    # 解析配置参数
    start_date = config.get("start_date")
    end_date = config.get("end_date")
    top_n = config.get("top_n", 10)
    strategy_params = config.get("strategy_params", {})
    indicators = strategy_params.get("indicators", [])
    weights = strategy_params.get("weights", [])
    filters = strategy_params.get("filters", {})
     
    # 1. 日期过滤
    filtered_df = df
    filtered_df = filtered_df.filter(
        pl.col('trade_date') >= pl.lit(start_date).str.to_datetime()
    )
    filtered_df = filtered_df.filter(
        pl.col('trade_date') <= pl.lit(end_date).str.to_datetime()
    )
    
    # 2. 应用前置过滤条件
    for column, condition in filters.items():
        operator, value = condition
        if operator == ">":
            filtered_df = filtered_df.filter(pl.col(column) > value)
        elif operator == ">=":
            filtered_df = filtered_df.filter(pl.col(column) >= value)
        elif operator == "<":
            filtered_df = filtered_df.filter(pl.col(column) < value)
        elif operator == "<=":
            filtered_df = filtered_df.filter(pl.col(column) <= value)
        elif operator == "==":
            filtered_df = filtered_df.filter(pl.col(column) == value)
        elif operator == "!=":
            filtered_df = filtered_df.filter(pl.col(column) != value)
    
    # 3. 计算各个指标的排名
    rank_expressions = []
    for i, indicator in enumerate(indicators):        
        # 根据权重确定排序方向
        # 负权重(-1)表示较小值更好，使用descending=True获取更高排名
        # 正权重(1)表示较大值更好，使用descending=False获取更高排名
        weight = weights[i]
        descending = weight < 0
        
        rank_expr = (
            pl.col(indicator)
                .rank(descending=descending)
                .over('trade_date')
                .alias(f'rank_{indicator}')
        )
        rank_expressions.append(rank_expr)
    
    # 4. 添加排名列
    ranked_df = filtered_df.with_columns(rank_expressions)
    
    # 5. 计算综合得分 (权重绝对值 * 排名，然后相加)
    score_expr = None
    for i, indicator in enumerate(indicators):
        weight_abs = abs(weights[i])
        if score_expr is None:
            score_expr = (pl.col(f'rank_{indicator}') * weight_abs)
        else:
            score_expr = score_expr + (pl.col(f'rank_{indicator}') * weight_abs)
    
    ranked_df = ranked_df.with_columns([
        score_expr.alias('score')
    ])
    
    # 6. 根据分组获取每个日期得分最高的前N条记录
    # 由于我们的分数是根据排名计算的，分数越小表示综合排名越靠前
    top_n_df = ranked_df.sort(['trade_date', 'score'], descending=[False, True]).group_by('trade_date').head(top_n)
    
    return top_n_df


# 示例用法
if __name__ == "__main__":
    # 配置示例
    config = {
        "data_path": "data/cb_data.pq",
        "start_date": "2020-01-01",
        "end_date": "2022-12-31",
        "initial_capital": 1000000.0,
        "strategy_type": "custom",
        "top_n": 10,
        "output_dir": "results/custom",
        "strategy_params": {
            "name": "低价策略",
            "indicators": ["close"],
            "weights": [-1.0],
            "filters": {
                "left_years": [">", 0.5]
            }
        }
    }
    
    # 假设df是已经加载的polars DataFrame
    # df = pl.read_parquet("cb_data.pq")
    # top10_df = get_top_bonds_by_score(df, config)
    # print(top10_df)