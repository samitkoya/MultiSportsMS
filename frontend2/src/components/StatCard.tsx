import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  glowClass?: string;
}

const colorMap = {
  "glass-card-glow-red": {
    card: "bg-sport-red/15 text-sport-red",
    imgbg: "bg-sport-red/10",
    icon: "text-sport-red"
  },
  "glass-card-glow-blue": {
    card: "bg-sport-blue/15 text-sport-blue",
    imgbg: "bg-sport-blue/10",
    icon: "text-sport-blue"
  },
  "glass-card-glow-green": {
    card: "bg-sport-green/15 text-sport-green",
    imgbg: "bg-sport-green/10",
    icon: "text-sport-green"
  },
  "glass-card-glow-yellow": {
    card: "bg-sport-yellow/15 text-sport-yellow",
    imgbg: "bg-sport-yellow/10",
    icon: "text-sport-yellow"
  },
};

export function StatCard({ title, value, icon: Icon, glowClass }: StatCardProps) {
  const theme = glowClass && glowClass in colorMap ? colorMap[glowClass as keyof typeof colorMap] : null;
  
  return (
    <div className={cn("flex items-center justify-between rounded-xl border-transparent p-6 transition-transform hover:scale-[1.02] shadow-sm", theme?.card)}>
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </div>
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-md", theme?.imgbg)}>
        <Icon size={35} className={theme?.icon} />
      </div>
    </div>
  );
}
