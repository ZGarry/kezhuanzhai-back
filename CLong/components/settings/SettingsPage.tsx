"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Clock } from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [rotationTime, setRotationTime] = useState("09:30");
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings/rotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: isRotationEnabled,
          time: rotationTime,
        }),
      });

      if (!response.ok) {
        throw new Error('保存设置失败');
      }

      toast.success('设置已保存');
    } catch (error) {
      toast.error('保存设置失败');
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="container max-w-6xl py-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general" className="text-sm">基本设置</TabsTrigger>
          <TabsTrigger value="api" className="text-sm">API 配置</TabsTrigger>
          <TabsTrigger value="notification" className="text-sm">通知设置</TabsTrigger>
          <TabsTrigger value="docs" className="text-sm">说明文档</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>数据刷新间隔（秒）</Label>
                <Input type="number" placeholder="30" className="max-w-[200px]" />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>每日轮动</Label>
                    <div className="text-sm text-muted-foreground">
                      在指定时间执行策略轮动
                    </div>
                  </div>
                  <Switch
                    checked={isRotationEnabled}
                    onCheckedChange={setIsRotationEnabled}
                  />
                </div>
                
                <div className="flex items-end gap-4">
                  <div className="flex-grow space-y-2 max-w-[200px]">
                    <Label htmlFor="rotation-time">轮动时间</Label>
                    <div className="relative">
                      <Input
                        id="rotation-time"
                        type="time"
                        value={rotationTime}
                        onChange={(e) => setRotationTime(e.target.value)}
                        className="pl-9"
                      />
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings}>
                    保存设置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API 配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="输入您的 API Key" />
              </div>
              <div className="space-y-2">
                <Label>API Secret</Label>
                <Input type="password" placeholder="输入您的 API Secret" />
              </div>
              <Button>保存配置</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>邮件通知</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="email-notification" />
                    <Label htmlFor="email-notification">启用邮件通知</Label>
                  </div>
                  <Input type="email" placeholder="通知邮箱地址" className="mt-2" />
                </div>
                <div className="space-y-2">
                  <Label>微信通知</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="wechat-notification" />
                    <Label htmlFor="wechat-notification">启用微信通知</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>系统说明文档</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">快速开始</h2>
                    <div className="pl-4 space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        欢迎使用齿轮量化交易系统，本文档将帮助您快速了解系统的主要功能和使用方法。
                      </p>
                      
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2">1. 策略配置</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>在左侧策略配置面板中设置您的交易策略参数</li>
                            <li>支持设置止损和止盈点位</li>
                            <li>可以保存多个策略配置方案</li>
                          </ul>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2">2. 回测功能</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>选择历史数据区间进行策略回测</li>
                            <li>查看详细的回测报告和性能指标</li>
                            <li>支持多个策略的对比分析</li>
                          </ul>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2">3. 实时监控</h3>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>实时监控市场行情和策略表现</li>
                            <li>查看持仓状态和盈亏情况</li>
                            <li>设置自动预警和通知</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">API 配置说明</h2>
                    <div className="pl-4 space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        要使用实盘交易功能，您需要配置交易所的 API：
                      </p>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>在交易所申请 API Key 和 Secret</li>
                          <li>在系统 API 配置页面填入相关信息</li>
                          <li>测试 API 连接是否正常</li>
                        </ol>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">注意事项</h2>
                    <div className="pl-4">
                      <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-yellow-500">
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                          <li>请确保您了解策略的风险</li>
                          <li>建议先使用模拟盘测试策略</li>
                          <li>定期检查系统状态和日志</li>
                          <li>及时处理系统预警信息</li>
                          <li>做好资金管理和风险控制</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4">常见问题</h2>
                    <div className="pl-4 space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">策略问题</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>如何选择合适的策略参数？</li>
                          <li>为什么回测和实盘结果有差异？</li>
                          <li>如何处理策略失效的情况？</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">系统问题</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>如何处理网络连接问题？</li>
                          <li>数据延迟怎么解决？</li>
                          <li>如何备份策略配置？</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 