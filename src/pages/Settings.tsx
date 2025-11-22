import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { loadProfile, saveProfile, loadCalendarEvents, saveCalendarEvents } from "@/lib/storage";
import { parseICalendar } from "@/lib/calendarParser";
import { toast } from "sonner";
import { ArrowLeft, Upload, Calendar, Trash2 } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

export default function Settings() {
  const navigate = useNavigate();
  const profile = loadProfile();
  const [examPhase, setExamPhase] = useState(profile.examPhase);
  const calendarEvents = loadCalendarEvents();

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

  const handleClearCalendar = () => {
    saveCalendarEvents([]);
    toast.success("Calendar cleared");
  };

  const handleExamPhaseToggle = (checked: boolean) => {
    setExamPhase(checked);
    saveProfile({ ...profile, examPhase: checked });
    toast.success(`Exam mode ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-hero pb-20">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <div className="space-y-4">
            {/* Calendar Import */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Calendar Integration
                </CardTitle>
                <CardDescription>
                  Import your calendar to help HealthTwin plan around your schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="calendar" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors">
                      <Upload className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">Upload Calendar File</div>
                        <div className="text-xs text-muted-foreground">
                          Supports .ics format (Google Calendar, Outlook, Apple Calendar)
                        </div>
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="calendar"
                    type="file"
                    accept=".ics"
                    className="hidden"
                    onChange={handleCalendarImport}
                  />
                </div>

                {calendarEvents.length > 0 && (
                  <div className="p-4 bg-muted rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {calendarEvents.length} events imported
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last updated: {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCalendar}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-info/10 border border-info/30 rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    <strong>How to export:</strong> Most calendar apps have an "Export" or "Download" option that creates a .ics file you can upload here.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Exam Phase */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Training Mode</CardTitle>
                <CardDescription>
                  Adjust training intensity based on your current schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between p-4 bg-muted rounded-xl">
                  <div className="flex-1 pr-4">
                    <Label htmlFor="exam" className="font-semibold">Exam/Deadline Phase</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reduce training intensity during high-stress periods
                    </p>
                  </div>
                  <Switch
                    id="exam"
                    checked={examPhase}
                    onCheckedChange={handleExamPhaseToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium capitalize">
                    {profile.goal.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Training Frequency</span>
                  <span className="font-medium">{profile.trainingFrequency}x/week</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Sleep Need</span>
                  <span className="font-medium">{profile.baselineSleepNeed}h</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
