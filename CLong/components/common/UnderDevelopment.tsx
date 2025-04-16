import { Construction } from "lucide-react";

const UnderDevelopment = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-muted-foreground">
      <div className="flex flex-col items-center space-y-4">
        <Construction className="w-20 h-20 animate-pulse" />
        <h2 className="text-3xl font-semibold">功能开发中</h2>
        <p className="text-lg">该功能正在积极开发中，敬请期待...</p>
      </div>
    </div>
  );
};

export default UnderDevelopment; 