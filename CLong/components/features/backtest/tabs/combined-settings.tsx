"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FactorSettings, 
  BacktestSettings,
  FactorInfo, 
  FilterInfo, 
  SelectedFactor, 
  FilterCondition 
} from "@/types/app-backtest";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, AlertCircle, ArrowDownUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/datepicker";
import { Separator } from "@/components/ui/separator";

// API返回类型定义
interface FactorResponse {
  status: string;
  data: {
    factors: FactorInfo[];
    filters: FilterInfo[];
  };
}

interface CombinedSettingsProps {
  backtestSettings: BacktestSettings;
  setBacktestSettings: (settings: BacktestSettings) => void;
  factorSettings: FactorSettings;
  setFactorSettings: (settings: FactorSettings) => void;
  onRunBacktest: () => void;
  isLoading: boolean;
}

export default function CombinedSettings({ 
  backtestSettings,
  setBacktestSettings,
  factorSettings, 
  setFactorSettings,
  onRunBacktest,
  isLoading
}: CombinedSettingsProps) {
  const [factorList, setFactorList] = useState<FactorInfo[]>([]);
  const [filterList, setFilterList] = useState<FilterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取可用因子列表
  useEffect(() => {
    const fetchFactorData = async () => {
      try {
        setLoading(true);
        const response = await api.fetchFactors() as FactorResponse;
        if (response.status === 'success') {
          setFactorList(response.data.factors);
          setFilterList(response.data.filters);
        } else {
          setError('获取因子信息失败');
        }
      } catch (error) {
        console.error('获取因子数据错误:', error);
        setError('获取因子数据出错，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchFactorData();
  }, []);

  // 更新回测设置
  const updateBacktestSettings = (key: keyof BacktestSettings, value: any) => {
    setBacktestSettings({ ...backtestSettings, [key]: value });
  };

  // 更新因子设置
  const updateFactorSettings = (key: keyof FactorSettings, value: any) => {
    setFactorSettings({ ...factorSettings, [key]: value });
  };

  // 添加新因子
  const addFactor = () => {
    // 找到一个未选择的因子
    const unusedFactors = factorList.filter(
      factor => !factorSettings.selectedFactors.some(sf => sf.id === factor.id)
    );
    
    if (unusedFactors.length > 0) {
      const newFactorId = unusedFactors[0].id;
      // 检查是否应该默认为正权重
      const isPositive = !['close', 'conv_prem', 'dblow'].includes(newFactorId);
      
      // 添加新因子到已选列表
      const newSelectedFactor: SelectedFactor = { 
        id: newFactorId, 
        weight: isPositive ? 1.0 : -1.0 
      };
      
      updateFactorSettings('selectedFactors', [
        ...(factorSettings.selectedFactors || []),
        newSelectedFactor
      ]);
    }
  };

  // 删除已选因子
  const removeFactor = (index: number) => {
    const updatedFactors = [...factorSettings.selectedFactors];
    updatedFactors.splice(index, 1);
    updateFactorSettings('selectedFactors', updatedFactors);
  };

  // 更新因子ID
  const updateFactorId = (index: number, factorId: string) => {
    const updatedFactors = [...factorSettings.selectedFactors];
    // 检查是否应该默认为正权重
    const isPositive = !['close', 'conv_prem', 'dblow'].includes(factorId);
    // 保持原来的权重方向，只更改因子ID
    const currentWeight = updatedFactors[index].weight;
    const weightSign = currentWeight >= 0 ? 1 : -1;
    const defaultWeight = isPositive ? 1.0 : -1.0;
    
    updatedFactors[index] = { 
      id: factorId, 
      weight: Math.abs(currentWeight) > 0 ? currentWeight : defaultWeight * weightSign
    };
    
    updateFactorSettings('selectedFactors', updatedFactors);
  };

  // 更新因子权重
  const updateFactorWeight = (index: number, weight: number) => {
    const updatedFactors = [...factorSettings.selectedFactors];
    updatedFactors[index] = { 
      ...updatedFactors[index], 
      weight 
    };
    updateFactorSettings('selectedFactors', updatedFactors);
  };

  // 添加过滤条件
  const addFilter = () => {
    if (filterList.length > 0) {
      const newFilter: FilterCondition = {
        field: filterList[0].id,
        operator: '>',
        value: 0
      };
      
      updateFactorSettings('filters', [...(factorSettings.filters || []), newFilter]);
    }
  };

  // 删除过滤条件
  const removeFilter = (index: number) => {
    const updatedFilters = [...(factorSettings.filters || [])];
    updatedFilters.splice(index, 1);
    updateFactorSettings('filters', updatedFilters);
  };

  // 更新过滤条件
  const updateFilter = (index: number, field: string, value: any) => {
    const updatedFilters = [...(factorSettings.filters || [])];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    updateFactorSettings('filters', updatedFilters);
  };

  // 翻转因子权重符号
  const toggleFactorWeightSign = (index: number) => {
    const updatedFactors = [...factorSettings.selectedFactors];
    updatedFactors[index] = { 
      ...updatedFactors[index], 
      weight: -updatedFactors[index].weight 
    };
    updateFactorSettings('selectedFactors', updatedFactors);
  };

  // 获取因子名称
  const getFactorName = (factorId: string): string => {
    const factor = factorList.find(f => f.id === factorId);
    return factor ? factor.name : factorId;
  };

  // 获取因子描述
  const getFactorDescription = (factorId: string): string => {
    const factor = factorList.find(f => f.id === factorId);
    return factor ? factor.description : '';
  };

  return (
    <div className="w-full space-y-6">
      {/* 基础回测参数设置 */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">基础回测参数</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>开始日期</Label>
            <DatePicker
              selected={backtestSettings.startDate}
              onChange={(date) => updateBacktestSettings('startDate', date)}
              placeholder="选择开始日期"
              className="w-full"
              defaultValue="2018-01-01"
            />
            <p className="text-xs text-muted-foreground">推荐2018-01-01到2023-12-31</p>
          </div>
          <div className="space-y-2">
            <Label>结束日期</Label>
            <DatePicker
              selected={backtestSettings.endDate}
              onChange={(date) => updateBacktestSettings('endDate', date)}
              placeholder="选择结束日期"
              className="w-full"
              defaultValue="2023-12-31"
            />
            <p className="text-xs text-muted-foreground">不要选择未来日期</p>
          </div>
          <div className="space-y-2">
            <Label>持有数量</Label>
            <Input
              type="number"
              value={backtestSettings.holdingQuantity}
              onChange={(e) => updateBacktestSettings('holdingQuantity', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>持有期限(天)</Label>
            <Input
              type="number"
              value={backtestSettings.holdingPeriod}
              onChange={(e) => updateBacktestSettings('holdingPeriod', parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>交易时点</Label>
            <Select
              value={backtestSettings.tradingTime}
              onValueChange={(value) => updateBacktestSettings('tradingTime', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择交易时点" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">开盘</SelectItem>
                <SelectItem value="close">收盘</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>对比基准</Label>
            <Select
              value={backtestSettings.benchmark}
              onValueChange={(value) => updateBacktestSettings('benchmark', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择对比基准" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sh000001">上证指数</SelectItem>
                <SelectItem value="sh000300">沪深300</SelectItem>
                <SelectItem value="sh000905">中证500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator className="my-4 opacity-30" />

      {/* 策略因子选择 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">策略因子选择</h3>
          <Button 
            onClick={addFactor} 
            size="sm" 
            variant="outline"
            disabled={loading || factorList.length === 0 || 
                      factorSettings.selectedFactors.length >= factorList.length}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            添加因子
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          选择您想要使用的因子并设置权重，正权重表示越大越好，负权重表示越小越好
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {factorSettings.selectedFactors.length === 0 ? (
              <div className="col-span-2 text-center py-4 text-muted-foreground">
                还未选择任何因子，请点击"添加因子"按钮开始构建策略
              </div>
            ) : (
              factorSettings.selectedFactors.map((factor, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col space-y-2 p-3 border rounded-md border-opacity-40 ${
                    factor.weight >= 0 
                      ? 'border-green-500 bg-green-900 bg-opacity-10' 
                      : 'border-red-500 bg-red-900 bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-3/4 pr-2">
                      <Select
                        value={factor.id}
                        onValueChange={(value) => updateFactorId(index, value)}
                      >
                        <SelectTrigger id={`factor-${index}`} className={`border-opacity-40 ${factor.weight >= 0 ? 'border-green-400' : 'border-red-400'}`}>
                          <SelectValue placeholder="选择因子" />
                        </SelectTrigger>
                        <SelectContent>
                          {factorList.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} ({f.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFactorWeightSign(index)}
                        title={factor.weight >= 0 ? "切换为负权重" : "切换为正权重"}
                        className={`border-opacity-60 ${factor.weight >= 0 ? 'border-green-500' : 'border-red-500'}`}
                      >
                        <ArrowDownUp className={`h-4 w-4 ${factor.weight >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFactor(index)}
                        title="删除因子"
                      >
                        <Trash className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground px-1">
                    {getFactorDescription(factor.id)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${factor.weight >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {factor.weight.toFixed(1)}
                    </span>
                    
                    <Slider
                      value={[Math.abs(factor.weight)]}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className={`flex-1 h-3 ${
                        factor.weight >= 0 
                          ? 'bg-gradient-to-r from-gray-800 to-green-800 border-green-600' 
                          : 'bg-gradient-to-r from-red-800 to-gray-800 border-red-600'
                      } border-opacity-30 border`}
                      onValueChange={(values) => {
                        const newWeight = values[0] * (factor.weight < 0 ? -1 : 1);
                        updateFactorWeight(index, newWeight);
                      }}
                    />
                    
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {factor.weight >= 0 ? '越大越好' : '越小越好'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Separator className="my-4 opacity-30" />

      {/* 过滤条件设置 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">过滤条件设置</h3>
          <Button onClick={addFilter} size="sm" variant="outline">
            <PlusCircle className="h-4 w-4 mr-1" />
            添加条件
          </Button>
        </div>
        
        {(factorSettings.filters || []).length === 0 ? (
          <div className="text-center py-3 text-muted-foreground">
            尚未添加过滤条件，点击上方按钮添加
          </div>
        ) : (
          <div className="space-y-2">
            {(factorSettings.filters || []).map((filter, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-opacity-30 rounded-md">
                <Select
                  value={filter.field}
                  onValueChange={(value) => updateFilter(index, 'field', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择过滤字段" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterList.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(index, 'operator', value)}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="运算符" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">大于</SelectItem>
                    <SelectItem value="<">小于</SelectItem>
                    <SelectItem value="=">等于</SelectItem>
                    <SelectItem value=">=">大于等于</SelectItem>
                    <SelectItem value="<=">小于等于</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="w-[100px]"
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(index)}
                >
                  <Trash className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button 
          onClick={onRunBacktest} 
          disabled={isLoading} 
          className="w-32"
          variant="default"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
              运行中...
            </>
          ) : (
            '运行回测'
          )}
        </Button>
      </div>
    </div>
  );
} 