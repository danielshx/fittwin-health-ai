import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProfile, loadMetrics, loadCalendarEvents } from "@/lib/storage";
import { computeBaseline, computeReadiness } from "@/lib/agentLoop";
import { UserProfile, DailyMetrics, Baseline, CalendarEvent } from "@/types";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PageTransition } from "@/components/PageTransition";
import { Moon, Clock, TrendingDown, TrendingUp, Calendar, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";

type SleepOption = {
  bedtime: string;
  wakeTime: string;
  sleepHours: number;
  readinessImpact: number;
  recoveryImpact: number;
  reasoning: string;
  recommendation: "ideal" | "acceptable" | "risky";
};

export default function SleepNegotiator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<DailyMetrics | null>(null);
  const [desiredBedtime, setDesiredBedtime] = useState<number>(22.5); // 10:30 PM
  const [wakeTime, setWakeTime] = useState<number>(7); // 7:00 AM
  const [sleepOptions, setSleepOptions] = useState<SleepOption[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const prof = loadProfile();
    if (!prof.onboardingComplete) {
      navigate("/onboarding");
      return;
    }
    setProfile(prof);

    const allMetrics = loadMetrics();
    const today = allMetrics[allMetrics.length - 1];
    setTodayMetrics(today);

    const base = computeBaseline(allMetrics);
    setBaseline(base);

    const events = loadCalendarEvents();
    setCalendarEvents(events);

    // Set defaults based on chronotype
    if (prof.chronotype === "early") {
      setDesiredBedtime(21.5); // 9:30 PM
      setWakeTime(6);
    } else if (prof.chronotype === "night") {
      setDesiredBedtime(23.5); // 11:30 PM
      setWakeTime(8);
    }
  }, [navigate]);

  useEffect(() => {
    if (!profile || !baseline || !todayMetrics) return;
    
    const options = generateSleepOptions();
    setSleepOptions(options);
  }, [desiredBedtime, wakeTime, profile, baseline, todayMetrics]);

  const generateSleepOptions = (): SleepOption[] => {
    if (!profile || !baseline || !todayMetrics) return [];

    const options: SleepOption[] = [];
    const sleepDebt = baseline.sleepHours * 7 - 7 * todayMetrics.sleepHours;
    const isHighStress = todayMetrics.stressScore > 70;
    const isLowRecovery = todayMetrics.hrv < baseline.hrv * 0.9;

    // Check for early morning events
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const earlyEvents = calendarEvents.filter(e => 
      e.start.startsWith(tomorrowStr) && 
      new Date(e.start).getHours() < 9
    );

    // Option 1: User's desired time
    const desiredSleep = wakeTime - desiredBedtime;
    const desiredReadinessImpact = calculateReadinessImpact(desiredSleep, sleepDebt, isHighStress);
    options.push({
      bedtime: formatTime(desiredBedtime),
      wakeTime: formatTime(wakeTime),
      sleepHours: desiredSleep,
      readinessImpact: desiredReadinessImpact,
      recoveryImpact: Math.round((desiredSleep - baseline.sleepHours) * 10),
      reasoning: `Based on your preference of ${formatTime(desiredBedtime)} bedtime`,
      recommendation: desiredSleep >= baseline.sleepHours ? "acceptable" : "risky"
    });

    // Option 2: Optimal for recovery
    const optimalSleep = baseline.sleepHours + (sleepDebt > 2 ? 0.5 : 0) + (isHighStress ? 0.5 : 0);
    const optimalBedtime = wakeTime - optimalSleep;
    const optimalReadinessImpact = calculateReadinessImpact(optimalSleep, sleepDebt, isHighStress);
    options.push({
      bedtime: formatTime(optimalBedtime),
      wakeTime: formatTime(wakeTime),
      sleepHours: optimalSleep,
      readinessImpact: optimalReadinessImpact,
      recoveryImpact: Math.round((optimalSleep - baseline.sleepHours) * 15),
      reasoning: sleepDebt > 2 
        ? `Extra sleep recommended to pay back ${sleepDebt.toFixed(1)}h sleep debt`
        : isHighStress || isLowRecovery
        ? "Extra recovery needed due to high stress or low HRV"
        : "Optimal for maintaining baseline recovery",
      recommendation: "ideal"
    });

    // Option 3: Compromise (between desired and optimal)
    if (Math.abs(desiredBedtime - optimalBedtime) > 0.5) {
      const compromiseBedtime = (desiredBedtime + optimalBedtime) / 2;
      const compromiseSleep = wakeTime - compromiseBedtime;
      const compromiseReadinessImpact = calculateReadinessImpact(compromiseSleep, sleepDebt, isHighStress);
      options.push({
        bedtime: formatTime(compromiseBedtime),
        wakeTime: formatTime(wakeTime),
        sleepHours: compromiseSleep,
        readinessImpact: compromiseReadinessImpact,
        recoveryImpact: Math.round((compromiseSleep - baseline.sleepHours) * 12),
        reasoning: "A middle ground between your preference and optimal recovery",
        recommendation: "acceptable"
      });
    }

    // Add warning for early events
    if (earlyEvents.length > 0) {
      const earliestEvent = new Date(earlyEvents[0].start);
      const suggestedWake = earliestEvent.getHours() - 1;
      const suggestedBedtime = suggestedWake - baseline.sleepHours;
      options.push({
        bedtime: formatTime(suggestedBedtime),
        wakeTime: formatTime(suggestedWake),
        sleepHours: baseline.sleepHours,
        readinessImpact: 0,
        recoveryImpact: 0,
        reasoning: `Early event tomorrow at ${earliestEvent.getHours()}:${earliestEvent.getMinutes().toString().padStart(2, '0')}`,
        recommendation: "acceptable"
      });
    }

    return options.sort((a, b) => {
      const order = { ideal: 0, acceptable: 1, risky: 2 };
      return order[a.recommendation] - order[b.recommendation];
    });
  };

  const calculateReadinessImpact = (sleepHours: number, sleepDebt: number, isHighStress: boolean): number => {
    if (!baseline) return 0;
    
    let impact = 0;
    const sleepDiff = sleepHours - baseline.sleepHours;
    
    // Base impact from sleep duration
    impact += sleepDiff * 8;
    
    // Bonus for addressing sleep debt
    if (sleepDebt > 2 && sleepDiff > 0) {
      impact += 5;
    }
    
    // Bonus for extra sleep when stressed
    if (isHighStress && sleepDiff > 0.5) {
      impact += 5;
    }
    
    return Math.round(impact);
  };

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getRecommendationIcon = (rec: "ideal" | "acceptable" | "risky") => {
    switch (rec) {
      case "ideal": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "acceptable": return <Zap className="w-5 h-5 text-warning" />;
      case "risky": return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getRecommendationColor = (rec: "ideal" | "acceptable" | "risky") => {
    switch (rec) {
      case "ideal": return "border-success bg-success/5";
      case "acceptable": return "border-warning bg-warning/5";
      case "risky": return "border-destructive bg-destructive/5";
    }
  };

  if (!profile || !baseline || !todayMetrics) {
    return (
      <MobileLayout title="Sleep Negotiator">
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Sleep Negotiator">
      <PageTransition>
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Moon className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Sleep Negotiator</h1>
            <p className="text-muted-foreground text-sm">Find your optimal bedtime</p>
          </motion.div>

          {/* Sleep Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Your Sleep Window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">When do you want to sleep?</label>
                    <Badge variant="outline">{formatTime(desiredBedtime)}</Badge>
                  </div>
                  <Slider
                    value={[desiredBedtime]}
                    onValueChange={(v) => setDesiredBedtime(v[0])}
                    min={20}
                    max={24}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>8:00 PM</span>
                    <span>Midnight</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">When do you need to wake up?</label>
                    <Badge variant="outline">{formatTime(wakeTime)}</Badge>
                  </div>
                  <Slider
                    value={[wakeTime]}
                    onValueChange={(v) => setWakeTime(v[0])}
                    min={5}
                    max={10}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>5:00 AM</span>
                    <span>10:00 AM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sleep Options */}
          <div className="space-y-3">
            <h3 className="font-bold">Recommended Options</h3>
            {sleepOptions.map((option, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <Card className={`shadow-card border-2 ${getRecommendationColor(option.recommendation)}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(option.recommendation)}
                        <Badge className={
                          option.recommendation === "ideal" ? "bg-success/10 text-success" :
                          option.recommendation === "acceptable" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }>
                          {option.recommendation === "ideal" ? "Best Choice" :
                           option.recommendation === "acceptable" ? "Good Option" :
                           "Risky"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{option.sleepHours.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">sleep</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bedtime</p>
                          <p className="text-lg font-semibold">{option.bedtime}</p>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Wake up</p>
                          <p className="text-lg font-semibold">{option.wakeTime}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{option.reasoning}</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            {option.readinessImpact >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">Readiness</span>
                          </div>
                          <p className={`font-semibold ${
                            option.readinessImpact >= 0 ? "text-success" : "text-destructive"
                          }`}>
                            {option.readinessImpact > 0 ? "+" : ""}{option.readinessImpact}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            {option.recoveryImpact >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">Recovery</span>
                          </div>
                          <p className={`font-semibold ${
                            option.recoveryImpact >= 0 ? "text-success" : "text-destructive"
                          }`}>
                            {option.recoveryImpact > 0 ? "+" : ""}{option.recoveryImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tomorrow's Schedule */}
          {calendarEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Tomorrow's Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {calendarEvents.slice(0, 3).map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                      <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="h-20" />
        </div>
      </PageTransition>
    </MobileLayout>
  );
}
