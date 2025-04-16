"use client";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {children}
    </div>
  );
}