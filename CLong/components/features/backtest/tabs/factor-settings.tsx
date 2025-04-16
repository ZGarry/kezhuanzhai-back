"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FactorSettings, 
  FactorInfo, 
  FilterInfo, 
  SelectedFactor, 
  FilterCondition 
} from "@/types/app-backtest";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, AlertCircle, Copy, CopyCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

// API返回类型定义
interface FactorResponse {
  status: string;
  data: {
    factors: FactorInfo[];
    filters: FilterInfo[];
  };
}

interface FactorSettingsProps {
  settings: FactorSettings;
  setSettings: (settings: FactorSettings) => void;
  backtestSettings?: {
    startDate: string;
    endDate: string;
    initialCapital: number;
    topN: number;
  };
  setBacktestSettings?: React.Dispatch<React.SetStateAction<any>>;
}

export default function FactorSettingsComponent({ 
  settings, 
  setSettings, 
  backtestSettings, 
  setBacktestSettings 
}: FactorSettingsProps) {
  const [factorList, setFactorList] = useState<FactorInfo[]>([]);
  const [filterList, setFilterList] = useState<FilterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategyJson, setStrategyJson] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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

  // 基本设置更新
  const updateSettings = (key: keyof FactorSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  // 处理因子选择变化
  const handleFactorChange = (factorId: string, isChecked: boolean) => {
    if (isChecked) {
      // 添加到自定义因子列表
      updateSettings('customFactors', [...settings.customFactors, factorId]);
      
      // 同时添加到选择因子列表，默认权重为1
      const newSelectedFactor: SelectedFactor = { id: factorId, weight: isPositiveWeight(factorId) ? 1.0 : -1.0 };
      updateSettings('selectedFactors', [...(settings.selectedFactors || []), newSelectedFactor]);
    } else {
      // 从自定义因子列表移除
      updateSettings(
        'customFactors', 
        settings.customFactors.filter(id => id !== factorId)
      );
      
      // 从选择因子列表移除
      updateSettings(
        'selectedFactors',
        (settings.selectedFactors || []).filter(factor => factor.id !== factorId)
      );
    }
    
    // 更新JSON
    generateStrategyJson();
  };

  // 判断是否应该默认为正权重（例如YTM因子是正相关的）
  const isPositiveWeight = (factorId: string): boolean => {
    // 这些因子通常是越低越好
    const negativeFactors = ['close', 'conv_prem', 'dblow']; 
    return !negativeFactors.includes(factorId);
  };

  // 更新因子权重
  const updateFactorWeight = (factorId: string, weight: number) => {
    const updatedFactors = (settings.selectedFactors || []).map(factor => {
      if (factor.id === factorId) {
        return { ...factor, weight };
      }
      return factor;
    });
    
    updateSettings('selectedFactors', updatedFactors);
    
    // 更新JSON
    generateStrategyJson();
  };

  // 添加过滤条件
  const addFilter = () => {
    if (filterList.length > 0) {
      const newFilter: FilterCondition = {
        field: filterList[0].id,
        operator: '>',
        value: 0
      };
      
      updateSettings('filters', [...(settings.filters || []), newFilter]);
      generateStrategyJson();
    }
  };

  // 删除过滤条件
  const removeFilter = (index: number) => {
    const updatedFilters = [...(settings.filters || [])];
    updatedFilters.splice(index, 1);
    updateSettings('filters', updatedFilters);
    
    // 更新JSON
    generateStrategyJson();
  };

  // 更新过滤条件
  const updateFilter = (index: number, field: string, value: any) => {
    const updatedFilters = [...(settings.filters || [])];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    updateSettings('filters', updatedFilters);
    
    // 更新JSON
    generateStrategyJson();
  };

  // 处理基本回测设置更新
  const handleBacktestSettingChange = (key: string, value: any) => {
    if (setBacktestSettings) {
      setBacktestSettings({
        ...backtestSettings,
        [key]: value
      });
    }
    generateStrategyJson();
  };

  // 生成策略JSON
  const generateStrategyJson = () => {
    // 提取指标和权重
    const indicators = (settings.selectedFactors || []).map(factor => factor.id);
    const weights = (settings.selectedFactors || []).map(factor => factor.weight);
    
    // 构建过滤条件
    const filters: Record<string, any> = {};
    (settings.filters || []).forEach(filter => {
      filters[filter.field] = [filter.operator, parseFloat(filter.value.toString())];
    });
    
    // 构建策略配置
    const strategyConfig = {
      data_path: "data/cb_data.pq",
      start_date: backtestSettings?.startDate,
      end_date: backtestSettings?.endDate,
      initial_capital: backtestSettings?.initialCapital,
      strategy_type: "custom",
      top_n: backtestSettings?.topN,
      name: "自定义策略",
      output_dir: "results/custom",
      strategy_params: {
        indicators: indicators,
        weights: weights,
        filters: filters
      }
    };
    
    setStrategyJson(JSON.stringify(strategyConfig, null, 2));
  };

  useEffect(() => {
    // 初始化settings，确保选择因子和过滤条件有默认值
    if (!settings.selectedFactors) {
      updateSettings('selectedFactors', []);
    }
    
    if (!settings.filters) {
      updateSettings('filters', []);
    }
  }, []);

  // 当参数变化时更新JSON
  useEffect(() => {
    generateStrategyJson();
  }, [settings, backtestSettings]);

  // 复制JSON到剪贴板
  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(strategyJson);
    setIsCopied(true);
    toast.create({
      title: "已复制到剪贴板",
      description: "策略配置JSON已复制到剪贴板",
      duration: 2000,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 获取因子名称
  const getFactorName = (factorId: string): string => {
    const factor = factorList.find(f => f.id === factorId);
    return factor ? factor.name : factorId;
  };

  return (
    <Tabs defaultValue="strategyBuilder" className="w-full space-y-4">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="strategyBuilder">策略构建</TabsTrigger>
        <TabsTrigger value="filterSettings">过滤条件</TabsTrigger>
        <TabsTrigger value="jsonOutput">JSON输出</TabsTrigger>
      </TabsList>
      
      <TabsContent value="strategyBuilder" className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* 基础回测参数设置 */}
            <div className="space-y-2">
              <h3 className="font-medium text-lg">基础回测参数</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>起始日期</Label>
                  <Input
                    type="date"
                    value={backtestSettings?.startDate}
                    onChange={(e) => handleBacktestSettingChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={backtestSettings?.endDate}
                    onChange={(e) => handleBacktestSettingChange('endDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>初始资金</Label>
                  <Input
                    type="number"
                    value={backtestSettings?.initialCapital}
                    onChange={(e) => handleBacktestSettingChange('initialCapital', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>持仓数量(TopN)</Label>
                  <Input
                    type="number"
                    value={backtestSettings?.topN}
                    onChange={(e) => handleBacktestSettingChange('topN', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">策略因子选择</h3>
              <p className="text-sm text-gray-500">
                选择您想要使用的因子并设置权重，正权重表示越大越好，负权重表示越小越好
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {factorList.map((factor) => (
                    <div key={factor.id} className="flex flex-col space-y-2 p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`factor-${factor.id}`}
                            checked={settings.customFactors.includes(factor.id)}
                            onCheckedChange={(checked) => handleFactorChange(factor.id, checked === true)}
                          />
                          <Label htmlFor={`factor-${factor.id}`}>
                            {factor.name} ({factor.id})
                          </Label>
                        </div>
                        <span className="text-xs text-gray-500">{factor.category}</span>
                      </div>
                      
                      {settings.customFactors.includes(factor.id) && (
                        <div className="ml-6 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">权重: {
                              settings.selectedFactors?.find(f => f.id === factor.id)?.weight.toFixed(1) || 0
                            }</span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateFactorWeight(factor.id, -1.0)}
                                className={`${
                                  settings.selectedFactors?.find(f => f.id === factor.id)?.weight === -1.0 
                                  ? 'bg-blue-100' : ''
                                }`}
                              >
                                越小越好
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateFactorWeight(factor.id, 1.0)}
                                className={`${
                                  settings.selectedFactors?.find(f => f.id === factor.id)?.weight === 1.0 
                                  ? 'bg-blue-100' : ''
                                }`}
                              >
                                越大越好
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 pt-1">
                            <Slider
                              value={[Math.abs(settings.selectedFactors?.find(f => f.id === factor.id)?.weight || 1)]}
                              min={0.1}
                              max={5}
                              step={0.1}
                              onValueChange={(values) => {
                                const currentWeight = settings.selectedFactors?.find(f => f.id === factor.id)?.weight || 1;
                                const newWeight = values[0] * (currentWeight < 0 ? -1 : 1);
                                updateFactorWeight(factor.id, newWeight);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 ml-6">
                        {factor.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="filterSettings" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">过滤条件设置</h3>
                <Button onClick={addFilter} size="sm" className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  添加条件
                </Button>
              </div>
              
              {(settings.filters || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  尚未添加过滤条件，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-4">
                  {(settings.filters || []).map((filter, index) => (
                    <div key={index} className="flex items-center space-x-2 p-4 border rounded-md">
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
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="运算符" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=">">大于 (&gt;)</SelectItem>
                          <SelectItem value="<">小于 (&lt;)</SelectItem>
                          <SelectItem value="=">等于 (=)</SelectItem>
                          <SelectItem value=">=">大于等于 (&gt;=)</SelectItem>
                          <SelectItem value="<=">小于等于 (&lt;=)</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="number"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="w-[120px]"
                      />
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="jsonOutput" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">策略JSON</h3>
                <div className="flex space-x-2">
                  <Button onClick={copyJsonToClipboard} size="sm" className="flex items-center">
                    {isCopied ? (
                      <>
                        <CopyCheck className="h-4 w-4 mr-1" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => {
                      try {
                        const blob = new Blob([strategyJson], {type: 'application/json'});
                        const href = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = href;
                        link.download = `strategy_config_${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(href);
                        toast.create({
                          title: "保存成功",
                          description: "策略配置已保存到文件",
                          variant: "success",
                          duration: 2000,
                        });
                      } catch (err) {
                        toast.create({
                          title: "保存失败",
                          description: "无法保存策略配置",
                          variant: "error",
                          duration: 2000,
                        });
                      }
                    }}
                    size="sm" 
                    className="flex items-center"
                    variant="outline"
                  >
                    保存配置
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-gray-50">
                {settings.selectedFactors?.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    请先在策略构建页选择因子
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-[400px]">
                    {strategyJson}
                  </pre>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">已选择的因子:</h4>
                {settings.selectedFactors?.length === 0 ? (
                  <div className="text-gray-500">未选择任何因子</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {settings.selectedFactors?.map((factor) => (
                      <li key={factor.id}>
                        {getFactorName(factor.id)}: 权重 {factor.weight.toFixed(1)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">过滤条件:</h4>
                {(settings.filters || []).length === 0 ? (
                  <div className="text-gray-500">未设置过滤条件</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {(settings.filters || []).map((filter, index) => {
                      const fieldInfo = filterList.find(f => f.id === filter.field);
                      return (
                        <li key={index}>
                          {fieldInfo?.name || filter.field} {filter.operator} {filter.value}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">加载策略配置</h4>
                <div className="flex items-center space-x-2">
                  <input 
                    type="file" 
                    id="load-strategy-config" 
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const config = JSON.parse(event.target?.result as string);
                            
                            // 检查是否是有效的策略配置
                            if (config.strategy_params && 
                                Array.isArray(config.strategy_params.indicators) && 
                                Array.isArray(config.strategy_params.weights)) {
                              
                              // 设置策略参数
                              const selectedFactors = config.strategy_params.indicators.map(
                                (id: string, index: number) => ({
                                  id,
                                  weight: config.strategy_params.weights[index] || 1.0
                                })
                              );
                              
                              // 提取过滤条件
                              const filters = Object.entries(config.strategy_params.filters || {}).map(
                                ([field, value]) => {
                                  const [operator, filterValue] = value as [string, number];
                                  return {
                                    field,
                                    operator,
                                    value: filterValue
                                  };
                                }
                              );
                              
                              // 更新状态
                              updateSettings('customFactors', config.strategy_params.indicators);
                              updateSettings('selectedFactors', selectedFactors);
                              updateSettings('filters', filters);
                              
                              // 更新回测设置
                              if (setBacktestSettings) {
                                setBacktestSettings({
                                  ...backtestSettings,
                                  holdingQuantity: config.top_n || 10,
                                });
                              }
                              
                              toast.create({
                                title: "加载成功",
                                description: "策略配置已成功加载",
                                variant: "success",
                                duration: 2000,
                              });
                            } else {
                              throw new Error("无效的策略配置文件");
                            }
                          } catch (err) {
                            toast.create({
                              title: "加载失败",
                              description: "无法解析策略配置文件",
                              variant: "error",
                              duration: 2000,
                            });
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <Button 
                    onClick={() => document.getElementById('load-strategy-config')?.click()}
                    variant="outline"
                    size="sm"
                  >
                    选择配置文件
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 