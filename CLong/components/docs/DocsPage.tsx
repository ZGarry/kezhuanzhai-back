import React from "react";
import { Card, CardContent } from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const DocsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Card className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <CardContent className="p-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              齿轮量化交易系统使用指南
            </h1>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-xl text-muted-foreground">
                本指南将帮助您全面了解齿轮量化交易系统的各项功能和使用方法。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="getting-started" className="border rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                入门指南
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert px-6 py-4 bg-card">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">系统概述</h3>
                    <p className="text-muted-foreground">
                      齿轮量化交易系统是一个专业的量化交易平台，支持策略开发、回测和实盘交易。
                      系统采用模块化设计，包含策略管理、回测分析、实时监控等核心功能。
                    </p>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">快速开始</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li className="text-muted-foreground">注册并登录系统</li>
                      <li className="text-muted-foreground">配置交易所 API</li>
                      <li className="text-muted-foreground">创建第一个交易策略</li>
                      <li className="text-muted-foreground">进行策略回测</li>
                      <li className="text-muted-foreground">部署实盘交易</li>
                    </ol>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">系统要求</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">支持主流浏览器：Chrome、Firefox、Safari</li>
                      <li className="text-muted-foreground">建议网络带宽：10Mbps 以上</li>
                      <li className="text-muted-foreground">推荐屏幕分辨率：1920x1080 或更高</li>
                    </ul>
                  </section>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="strategy" className="border rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                策略开发指南
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert px-6 py-4 bg-card">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">策略框架</h3>
                    <p className="text-muted-foreground mb-4">
                      系统提供灵活的策略开发框架，支持多种交易策略类型：
                    </p>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">趋势跟踪策略</li>
                      <li className="text-muted-foreground">均值回归策略</li>
                      <li className="text-muted-foreground">套利策略</li>
                      <li className="text-muted-foreground">高频交易策略</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">策略参数配置</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">交易品种选择</li>
                      <li className="text-muted-foreground">时间周期设置</li>
                      <li className="text-muted-foreground">止损止盈条件</li>
                      <li className="text-muted-foreground">仓位管理规则</li>
                      <li className="text-muted-foreground">信号过滤条件</li>
                    </ul>
                  </section>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="backtest" className="border rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                回测系统使用指南
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert px-6 py-4 bg-card">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">回测配置</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">选择回测时间范围</li>
                      <li className="text-muted-foreground">设置初始资金</li>
                      <li className="text-muted-foreground">配置交易成本</li>
                      <li className="text-muted-foreground">选择数据频率</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">回测指标</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">年化收益率</li>
                      <li className="text-muted-foreground">最大回撤</li>
                      <li className="text-muted-foreground">夏普比率</li>
                      <li className="text-muted-foreground">胜率统计</li>
                      <li className="text-muted-foreground">盈亏比</li>
                    </ul>
                  </section>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="realtime" className="border rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                实盘交易指南
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert px-6 py-4 bg-card">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">实盘部署流程</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li className="text-muted-foreground">完成策略回测验证</li>
                      <li className="text-muted-foreground">配置交易所 API</li>
                      <li className="text-muted-foreground">设置交易参数</li>
                      <li className="text-muted-foreground">启动实盘监控</li>
                    </ol>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">风险提示</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">建议先使用小资金测试</li>
                      <li className="text-muted-foreground">密切关注系统运行状态</li>
                      <li className="text-muted-foreground">定期检查策略表现</li>
                      <li className="text-muted-foreground">及时处理预警信息</li>
                    </ul>
                  </section>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api" className="border rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                API 对接指南
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert px-6 py-4 bg-card">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">支持的交易所</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">Binance（币安）</li>
                      <li className="text-muted-foreground">OKX</li>
                      <li className="text-muted-foreground">Huobi（火币）</li>
                      <li className="text-muted-foreground">其他主流交易所</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">API 配置步骤</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li className="text-muted-foreground">在交易所创建 API Key</li>
                      <li className="text-muted-foreground">设置合适的 API 权限</li>
                      <li className="text-muted-foreground">在系统中配置 API 信息</li>
                      <li className="text-muted-foreground">验证 API 连接状态</li>
                    </ol>
                  </section>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq" className="border rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                常见问题
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert px-6 py-4 bg-card">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">策略相关</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">如何选择合适的策略参数？</li>
                      <li className="text-muted-foreground">为什么回测和实盘结果有差异？</li>
                      <li className="text-muted-foreground">如何处理策略失效的情况？</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-2xl font-semibold mb-4">系统相关</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li className="text-muted-foreground">如何处理网络连接问题？</li>
                      <li className="text-muted-foreground">数据延迟怎么解决？</li>
                      <li className="text-muted-foreground">如何备份策略配置？</li>
                    </ul>
                  </section>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default DocsPage; 