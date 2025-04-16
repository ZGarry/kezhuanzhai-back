import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function Page() {
  const references = [
    {
      title: "Lude.cc",
      description: "Lude分析网站",
      url: "https://lude.cc/",
    },
    {
      title: "AKShare",
      description: "开源财经数据接口库，提供中文金融和经济数据",
      url: "https://akshare.akfamily.xyz/articles.html",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="py-12 sm:py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              参考链接
            </h1>
            <p className="mt-4 text-center text-muted-foreground">
              精选的外部资源和工具
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {references.map((ref, index) => (
              <a
                key={index}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border">
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="group-hover:text-primary text-lg">
                        {ref.title}
                      </CardTitle>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <CardDescription className="mt-2 text-muted-foreground">
                      {ref.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 