"use client";

import { Settings as GearIcon } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="h-16 border-b border-border/40 bg-background">
      <div className="container h-full flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <GearIcon className="h-8 w-8 text-[#3370ff]" />
          <span className="text-xl font-bold">齿轮系统</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link href="/convertible-bonds">
            <Button variant="ghost">可转债数据</Button>
          </Link>
          <Link href="/data-center">
            <Button variant="ghost">数据中心</Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost">使用指南</Button>
          </Link>
          <Link href="/references">
            <Button variant="ghost">参考链接</Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost">系统设置</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}