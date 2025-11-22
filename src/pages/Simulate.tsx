import { useState, useEffect } from "react";
import { loadProfile, loadMetrics } from "@/lib/storage";
import { computeBaseline, simulateWhatIf } from "@/lib/agentLoop";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { TrendingUp, TrendingDown, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { UserProfile, DailyMetrics, Baseline } from "@/types";

export default function Simulate() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [today, setToday] = useState<DailyMetrics | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("zone2_run");
  const [result, setResult] = useState<any>(null);

  const options = [
    { value: "zone2_run", label: "30min Zone-2 Run", emoji: "🏃" },
    { value: "hiit_session", label: "30min HIIT Session", emoji: "💪" },
    { value: "strength_session", label: "45min Strength Training", emoji: "🏋️" },
    { value: "rest_day", label: "Full Rest Day", emoji: "😴" },
    { value: "extra_sleep", label: "Extra 1hr Sleep Tonight", emoji: "🌙" },
  ];

  useEffect(() => {
    const prof = loadProfile();
    setProfile(prof);

    const metrics = loadMetrics();
    const todayMetric = metrics[metrics.length - 1];
    setToday(todayMetric);

    const base = computeBaseline(metrics);
    setBaseline(base);
  }, []);

  const handleSimulate = () => {
    if (!profile || !baseline || !today) return;

    const option = options.find((o) => o.value === selectedOption);
    if (!option) return;

    const simulation = simulateWhatIf(option.label, baseline, today);
    setResult(simulation);
  };

  if (!profile || !baseline || !today) {
    return (
      <MobileLayout title="What-If">
        <div className="flex items-center justify-center h-full">Loading...</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="What-If Simulator">
      <PageTransition>
        <div className="px-4 py-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-4">Choose Your Action</h3>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-3">
                {options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-colors ${
                      selectedOption === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-3 flex-1 cursor-pointer">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button className="w-full mt-6" size="lg" onClick={handleSimulate}>
                Simulate Impact
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {result && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Readiness Impact</p>
                    {result.readinessDelta >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-bold ${result.readinessDelta >= 0 ? "text-success" : "text-destructive"}`}>
                      {result.readinessDelta > 0 ? "+" : ""}
                      {result.readinessDelta}
                    </p>
                    <p className="text-sm text-muted-foreground">points tomorrow</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Sleep Impact</p>
                    {result.sleepDelta >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-bold ${result.sleepDelta >= 0 ? "text-success" : "text-destructive"}`}>
                      {result.sleepDelta > 0 ? "+" : ""}
                      {result.sleepDelta.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">hours tonight</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Recovery Impact</p>
                    {result.recoveryDelta >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-bold ${result.recoveryDelta >= 0 ? "text-success" : "text-destructive"}`}>
                      {result.recoveryDelta > 0 ? "+" : ""}
                      {result.recoveryDelta}
                    </p>
                    <p className="text-sm text-muted-foreground">recovery points</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-card bg-accent/5 border-accent">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">AI Explanation</p>
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
      </PageTransition>
    </MobileLayout>
  );
}
