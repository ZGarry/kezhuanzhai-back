"use client";

import { Card } from "../ui/card";
import StrategyForm from "../strategy/StrategyForm";

export default function Sidebar() {
  return (
    <div className="w-80 border-r border-border/40 p-4 overflow-y-auto">
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">策略配置</h2>
          <StrategyForm />
        </Card>
      </div>
    </div>
  );
}