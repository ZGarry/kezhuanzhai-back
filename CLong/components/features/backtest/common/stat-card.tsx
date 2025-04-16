import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

export default function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
} 