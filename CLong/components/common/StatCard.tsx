interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
} 