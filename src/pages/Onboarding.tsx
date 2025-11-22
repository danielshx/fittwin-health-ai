import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { saveProfile, saveCalendarEvents } from "@/lib/storage";
import { parseICalendar } from "@/lib/calendarParser";
import { UserProfile } from "@/types";
import { ArrowRight, Heart, ArrowLeft, Upload, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: "",
    age: undefined,
    goal: "maintain",
    chronotype: "normal",
    trainingFrequency: 3,
    baselineSleepNeed: 8,
    examPhase: false,
  });

  const handleCalendarImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ics')) {
      toast.error("Please upload a valid .ics calendar file");
      return;
    }

    try {
      const text = await file.text();
      const events = parseICalendar(text);
      saveCalendarEvents(events);
      toast.success(`Imported ${events.length} calendar events`);
    } catch (error) {
      toast.error("Failed to parse calendar file");
      console.error(error);
    }
  };

  const handleComplete = () => {
    const completeProfile: UserProfile = {
      name: profile.name || "User",
      age: profile.age,
      goal: profile.goal!,
      chronotype: profile.chronotype!,
      trainingFrequency: profile.trainingFrequency!,
      baselineSleepNeed: profile.baselineSleepNeed!,
      examPhase: profile.examPhase!,
      onboardingComplete: true,
    };
    saveProfile(completeProfile);
    navigate("/dashboard");
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          {step > 1 && (
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {step} of {totalSteps}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-wellness rounded-3xl flex items-center justify-center shadow-glow">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Welcome to FitTwin</h1>
                <p className="text-muted-foreground">Let's personalize your experience</p>
              </div>

              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="name">What's your name?</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter your name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age (optional)</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age || ""}
                      onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                      placeholder="Enter your age"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="mb-3 block">What's your fitness goal?</Label>
                    <RadioGroup
                      value={profile.goal}
                      onValueChange={(value) => setProfile({ ...profile, goal: value as any })}
                      className="space-y-3"
                    >
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${profile.goal === "lose_fat" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="lose_fat" id="lose_fat" />
                        <Label htmlFor="lose_fat" className="flex-1 cursor-pointer">Lose Fat</Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${profile.goal === "build_muscle" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="build_muscle" id="build_muscle" />
                        <Label htmlFor="build_muscle" className="flex-1 cursor-pointer">Build Muscle</Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${profile.goal === "maintain" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="maintain" id="maintain" />
                        <Label htmlFor="maintain" className="flex-1 cursor-pointer">Maintain Health</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Sleep & Training</h2>
                <p className="text-muted-foreground">Help us understand your routine</p>
              </div>

              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label className="mb-3 block">When do you prefer to sleep?</Label>
                    <RadioGroup
                      value={profile.chronotype}
                      onValueChange={(value) => setProfile({ ...profile, chronotype: value as any })}
                      className="space-y-3"
                    >
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${profile.chronotype === "early" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="early" id="early" />
                        <Label htmlFor="early" className="flex-1 cursor-pointer">
                          <div>Early Bird</div>
                          <div className="text-xs text-muted-foreground">Prefer early mornings</div>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${profile.chronotype === "normal" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="normal" id="normal" />
                        <Label htmlFor="normal" className="flex-1 cursor-pointer">
                          <div>Normal</div>
                          <div className="text-xs text-muted-foreground">Flexible schedule</div>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${profile.chronotype === "night" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="night" id="night" />
                        <Label htmlFor="night" className="flex-1 cursor-pointer">
                          <div>Night Owl</div>
                          <div className="text-xs text-muted-foreground">Prefer late nights</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="training">Weekly Training Sessions</Label>
                    <Input
                      id="training"
                      type="number"
                      min="0"
                      max="7"
                      value={profile.trainingFrequency}
                      onChange={(e) => setProfile({ ...profile, trainingFrequency: parseInt(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleep">How much sleep do you need? (hours)</Label>
                    <Input
                      id="sleep"
                      type="number"
                      min="6"
                      max="10"
                      step="0.5"
                      value={profile.baselineSleepNeed}
                      onChange={(e) => setProfile({ ...profile, baselineSleepNeed: parseFloat(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Final Step</h2>
                <p className="text-muted-foreground">Just a few more details</p>
              </div>

              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between p-4 bg-muted rounded-xl">
                    <div className="flex-1 pr-4">
                      <Label htmlFor="exam" className="font-semibold">In exam/deadline phase?</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        We'll adjust training intensity accordingly
                      </p>
                    </div>
                    <Switch
                      id="exam"
                      checked={profile.examPhase}
                      onCheckedChange={(checked) => setProfile({ ...profile, examPhase: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="calendar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">Import Calendar (Optional)</div>
                          <div className="text-sm text-muted-foreground">
                            Upload .ics file to sync your schedule
                          </div>
                        </div>
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Label>
                    <Input
                      id="calendar-upload"
                      type="file"
                      accept=".ics"
                      className="hidden"
                      onChange={handleCalendarImport}
                    />
                    <p className="text-xs text-muted-foreground px-1">
                      You can also import your calendar later in Settings
                    </p>
                  </div>
                  
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
                    <p className="text-sm font-medium mb-2">⚠️ Important</p>
                    <p className="text-xs text-muted-foreground">
                      FitTwin is not medical advice. All data stays local in your browser. For serious
                      symptoms, always consult a healthcare professional.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="px-4 pb-8 pt-4 border-t bg-card/95 backdrop-blur">
        <Button
          className="w-full"
          size="lg"
          onClick={() => (step === 3 ? handleComplete() : setStep(step + 1))}
          disabled={step === 1 && !profile.name}
        >
          {step === 3 ? "Get Started" : "Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
