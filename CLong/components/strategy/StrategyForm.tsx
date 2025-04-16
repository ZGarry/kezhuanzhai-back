import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";

interface StrategyFormValues {
  name: string;
  description: string;
  parameters: {
    stopLoss: number;
    takeProfit: number;
  };
}

const StrategyForm: React.FC = () => {
  const form = useForm<StrategyFormValues>({
    defaultValues: {
      name: "",
      description: "",
      parameters: {
        stopLoss: 0,
        takeProfit: 0,
      },
    },
  });

  const onSubmit = (data: StrategyFormValues) => {
    console.log(data);
    // 这里处理策略表单提交
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">策略配置</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>策略名称</FormLabel>
                <FormControl>
                  <Input placeholder="输入策略名称" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>策略描述</FormLabel>
                <FormControl>
                  <Input placeholder="输入策略描述" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.stopLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>止损点位</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parameters.takeProfit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>止盈点位</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            保存策略
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default StrategyForm; 