import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Download, Smartphone, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const features = [
    { icon: Heart, title: "Works Offline", description: "Access your health data anytime" },
    { icon: Smartphone, title: "Native Feel", description: "Feels like a real app" },
    { icon: Check, title: "No Store Required", description: "Install directly from browser" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-wellness rounded-3xl flex items-center justify-center shadow-glow">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Install HealthTwin</h1>
          <p className="text-muted-foreground">Your AI health companion, always with you</p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="shadow-card">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Install Button */}
        {isInstalled ? (
          <Card className="shadow-card bg-success/10 border-success">
            <CardContent className="pt-6 text-center">
              <Check className="w-12 h-12 mx-auto mb-3 text-success" />
              <h3 className="font-bold mb-2">Already Installed!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                HealthTwin is installed on your device. Open it from your home screen.
              </p>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Open App
              </Button>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button className="w-full" size="lg" onClick={handleInstall}>
            <Download className="w-5 h-5 mr-2" />
            Install Now
          </Button>
        ) : (
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Manual Install</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium mb-1">On iPhone/iPad:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tap the Share button (square with arrow)</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium mb-1">On Android:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tap the menu (three dots)</li>
                    <li>Tap "Add to Home screen" or "Install app"</li>
                    <li>Tap "Add" or "Install"</li>
                  </ol>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" onClick={() => navigate("/dashboard")}>
                Continue in Browser
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
