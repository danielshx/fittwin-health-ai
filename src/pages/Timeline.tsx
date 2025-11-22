import { useEffect, useState } from "react";
import { loadMetrics } from "@/lib/storage";
import { DailyMetrics } from "@/types";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/PageTransition";
import { Moon, Dumbbell, Coffee, Book, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function Timeline() {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);

  useEffect(() => {
    const allMetrics = loadMetrics();
    setMetrics(allMetrics.slice(-7));
  }, []);

  const getTimeBlocks = (metric: DailyMetrics) => {
    const blocks = [];
    
    blocks.push({
      time: "Night",
      icon: Moon,
      label: `${metric.sleepHours.toFixed(1)}hrs sleep`,
      sublabel: `${metric.sleepEfficiency.toFixed(0)}% efficiency`,
      color: "bg-accent/10 border-l-accent",
    });

    blocks.push({
      time: "Morning",
      icon: Coffee,
      label: "Classes & Study",
      sublabel: `Energy: ${metric.energyScore}/5`,
      color: "bg-muted border-l-border",
    });

    if (metric.workoutMinutes > 0) {
      blocks.push({
        time: "Afternoon",
        icon: Dumbbell,
        label: `${metric.workoutMinutes}min workout`,
        sublabel: `Load: ${metric.trainingLoad.toFixed(0)}`,
        color: "bg-secondary/10 border-l-secondary",
      });
    }

    blocks.push({
      time: "Evening",
      icon: metric.stressScore > 60 ? Brain : Book,
      label: metric.stressScore > 60 ? "High stress period" : "Study session",
      sublabel: `Stress: ${metric.stressScore.toFixed(0)}/100`,
      color: metric.stressScore > 60 ? "bg-warning/10 border-l-warning" : "bg-muted border-l-border",
    });

    return blocks;
  };

  return (
    <MobileLayout title="Timeline">
      <PageTransition>
        <div className="px-4 py-4 space-y-4">
        {metrics.map((metric, idx) => {
          const date = new Date(metric.date);
          const isToday = idx === metrics.length - 1;
          
          return (
            <motion.div
              key={metric.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">
                    {isToday ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Mood {metric.moodScore}/5
                  </Badge>
                </div>
              </div>

              <Card className="shadow-soft">
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-3">
                    {getTimeBlocks(metric).map((block, blockIdx) => {
                      const Icon = block.icon;
                      return (
                        <div
                          key={blockIdx}
                          className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${block.color}`}
                        >
                          <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{block.time}</p>
                            <p className="font-medium text-sm">{block.label}</p>
                            <p className="text-xs text-muted-foreground">{block.sublabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      </PageTransition>
    </MobileLayout>
  );
}
