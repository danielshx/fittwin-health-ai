import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProfile, loadMetrics, loadCalendarEvents } from "@/lib/storage";
import { computeBaseline, generateDailyPlan } from "@/lib/agentLoop";
import { UserProfile, DailyMetrics, DailyPlan, CalendarEvent } from "@/types";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/PageTransition";
import { Target, Dumbbell, Zap, Moon, CheckCircle2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function Today() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<DailyMetrics | null>(null);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);

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

    const last7 = allMetrics.slice(-7);
    const baseline = computeBaseline(allMetrics);

    const plan = generateDailyPlan(prof, today, last7, baseline);
    setDailyPlan(plan);

    // Load today's calendar events
    const allEvents = loadCalendarEvents();
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysEvents = allEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === todayStr;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    setTodayEvents(todaysEvents);
  }, [navigate]);

  if (!profile || !dailyPlan || !todayMetrics) {
    return (
      <MobileLayout title="Today">
        <div className="flex items-center justify-center h-full">
          <p>Loading your plan...</p>
        </div>
      </MobileLayout>
    );
  }

  const intensityColors = {
    Rest: "bg-secondary/10 text-secondary border-secondary/20",
    Light: "bg-success/10 text-success border-success/20",
    Moderate: "bg-primary/10 text-primary border-primary/20",
    HIIT: "bg-destructive/10 text-destructive border-destructive/20",
    Strength: "bg-warning/10 text-warning border-warning/20",
  };

  return (
    <MobileLayout title="Today's Plan">
      <PageTransition>
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold mb-1">Today's Focus</h1>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </motion.div>

          {/* Training Intensity */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Training Intensity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <Badge className={`text-lg px-6 py-2 ${intensityColors[dailyPlan.trainingIntensity]}`}>
                    {dailyPlan.trainingIntensity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Priorities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Top Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dailyPlan.priorities.map((priority, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-white">{idx + 1}</span>
                    </div>
                    <p className="text-sm flex-1 pt-1">{priority}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Micro-Interventions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-secondary" />
                  Quick Wins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dailyPlan.microInterventions.map((intervention, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <p className="text-sm flex-1">{intervention}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sleep Advice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-card bg-accent/5 border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-accent" />
                  Tonight's Sleep Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{dailyPlan.sleepAdvice}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {todayEvents.map((event, idx) => {
                      const startTime = new Date(event.start);
                      const endTime = event.end ? new Date(event.end) : null;
                      const now = new Date();
                      const isPast = now > startTime;
                      const isCurrent = endTime ? (now >= startTime && now <= endTime) : false;

                      return (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                            isCurrent 
                              ? "bg-primary/10 border-primary" 
                              : isPast 
                              ? "bg-muted/30 border-muted opacity-60" 
                              : "bg-muted/30 border-accent"
                          }`}
                        >
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs text-muted-foreground">
                              {startTime.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                            {endTime && (
                              <p className="text-xs text-muted-foreground">
                                {endTime.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              {isPast && !isCurrent && (
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                  {event.title}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 {event.location}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {isCurrent && (
                            <Badge className="bg-primary/10 text-primary shrink-0">Now</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-2">No events scheduled</p>
                    <p className="text-xs text-muted-foreground">
                      Import your calendar in Settings to see your schedule here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="h-20" />
        </div>
      </PageTransition>
    </MobileLayout>
  );
}
