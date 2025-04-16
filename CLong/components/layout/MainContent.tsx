"use client";

import { Card } from "../ui/card";
import BacktestTabs from "../features/backtest/backtest-tabs";

export default function MainContent() {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <Card className="p-4">
        <BacktestTabs />
      </Card>
    </div>
  );
}