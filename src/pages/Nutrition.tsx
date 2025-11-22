import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Apple, Flame, Droplets, Cookie, Beef, Clock, ChefHat, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { loadProfile, loadMetrics } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Nutrition = () => {
  const profile = loadProfile();
  const metrics = loadMetrics();
  const today = metrics[metrics.length - 1];
  
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [userPreferences, setUserPreferences] = useState("");

  // Calculate nutrition goals based on profile
  const nutritionGoals = {
    calories: profile.goal === "build_muscle" ? 2800 : profile.goal === "lose_fat" ? 2000 : 2400,
    protein: profile.goal === "build_muscle" ? 180 : profile.goal === "lose_fat" ? 160 : 150,
    carbs: profile.goal === "build_muscle" ? 350 : profile.goal === "lose_fat" ? 200 : 280,
    fats: profile.goal === "build_muscle" ? 90 : profile.goal === "lose_fat" ? 65 : 80,
    water: 3.0, // liters
  };

  // Current intake (mock data - would come from tracking)
  const currentIntake = {
    calories: today.calories || 1200,
    protein: today.protein || 45,
    carbs: today.carbs || 150,
    fats: today.fats || 40,
    water: today.water || 1.5,
  };

  const foodRecommendations = [
    {
      id: "1",
      name: "Protein Power Bowl",
      description: "Quinoa, grilled chicken, avocado, chickpeas, and mixed greens",
      calories: 520,
      protein: 45,
      carbs: 48,
      fats: 18,
      category: "lunch" as const,
      prepTime: 25,
      difficulty: "medium" as const,
      ingredients: ["quinoa", "chicken breast", "avocado", "chickpeas", "mixed greens", "olive oil", "lemon"]
    },
    {
      id: "2",
      name: "Recovery Smoothie",
      description: "Banana, spinach, protein powder, almond milk, chia seeds",
      calories: 280,
      protein: 32,
      carbs: 35,
      fats: 8,
      category: "snack" as const,
      prepTime: 5,
      difficulty: "easy" as const,
      ingredients: ["banana", "spinach", "protein powder", "almond milk", "chia seeds", "ice"]
    },
    {
      id: "3",
      name: "Salmon & Sweet Potato",
      description: "Grilled salmon with roasted sweet potato and broccoli",
      calories: 580,
      protein: 42,
      carbs: 52,
      fats: 20,
      category: "dinner" as const,
      prepTime: 35,
      difficulty: "medium" as const,
      ingredients: ["salmon fillet", "sweet potato", "broccoli", "olive oil", "garlic", "herbs"]
    },
    {
      id: "4",
      name: "Greek Yogurt Parfait",
      description: "Greek yogurt, berries, granola, honey, almonds",
      calories: 320,
      protein: 22,
      carbs: 42,
      fats: 10,
      category: "breakfast" as const,
      prepTime: 5,
      difficulty: "easy" as const,
      ingredients: ["greek yogurt", "mixed berries", "granola", "honey", "almonds"]
    },
    {
      id: "5",
      name: "Turkey & Veggie Wrap",
      description: "Whole wheat wrap with turkey, hummus, and fresh vegetables",
      calories: 420,
      protein: 35,
      carbs: 45,
      fats: 12,
      category: "lunch" as const,
      prepTime: 10,
      difficulty: "easy" as const,
      ingredients: ["whole wheat wrap", "turkey breast", "hummus", "lettuce", "tomato", "cucumber"]
    },
    {
      id: "6",
      name: "Energy Oatmeal",
      description: "Oats with banana, peanut butter, protein powder, and cinnamon",
      calories: 450,
      protein: 28,
      carbs: 58,
      fats: 14,
      category: "breakfast" as const,
      prepTime: 10,
      difficulty: "easy" as const,
      ingredients: ["oats", "banana", "peanut butter", "protein powder", "cinnamon", "milk"]
    }
  ];

  const handleOrderLieferando = () => {
    toast.info("Opening Lieferando...", {
      description: "Redirecting you to order healthy meals",
    });
    // Open Lieferando with healthy food filters
    window.open("https://www.lieferando.de/en/", "_blank");
  };

  const handleQuickOrder = async () => {
    setShowAiDialog(true);
    setAiLoading(true);
    setAiRecommendations(null);

    try {
      const { data, error } = await supabase.functions.invoke('nutrition-ai-order', {
        body: {
          nutritionGoals,
          currentIntake,
          userGoal: profile.goal === "build_muscle" ? "build muscle" : 
                    profile.goal === "lose_fat" ? "lose fat" : "maintain health",
          preferences: userPreferences || undefined
        }
      });

      if (error) {
        console.error('Error calling AI function:', error);
        
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          toast.error("Rate Limit", {
            description: "Too many requests. Please wait a moment and try again.",
          });
        } else if (error.message?.includes('credits') || error.message?.includes('402')) {
          toast.error("AI Credits Exhausted", {
            description: "Please add credits to your workspace to continue using AI features.",
          });
        } else {
          toast.error("Error", {
            description: "Failed to get AI recommendations. Please try again.",
          });
        }
        setShowAiDialog(false);
        return;
      }

      if (data?.recommendations) {
        setAiRecommendations(data.recommendations);
        toast.success("AI Analysis Complete", {
          description: "Your personalized meal recommendations are ready!",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      });
      setShowAiDialog(false);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <MobileLayout
      title="Nutrition"
    >
      <div className="space-y-6 pb-24">
        {/* AI Order Dialog */}
        <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Nutrition Assistant
              </DialogTitle>
              <DialogDescription>
                Personalized meal recommendations based on your goals
              </DialogDescription>
            </DialogHeader>
            
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="font-medium">Analyzing your nutrition needs...</p>
                  <p className="text-sm text-muted-foreground">
                    Finding the best meals for your goals
                  </p>
                </div>
              </div>
            ) : aiRecommendations ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiRecommendations}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={handleOrderLieferando} 
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Order on Lieferando
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAiDialog(false);
                      setUserPreferences("");
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Daily Goals Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="w-5 h-5" />
              Today's Nutrition
            </CardTitle>
            <CardDescription>Track your daily intake</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Calories
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentIntake.calories} / {nutritionGoals.calories}
                  </span>
                </div>
                <Progress value={(currentIntake.calories / nutritionGoals.calories) * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Beef className="w-4 h-4 text-red-500" />
                    Protein
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentIntake.protein}g / {nutritionGoals.protein}g
                  </span>
                </div>
                <Progress value={(currentIntake.protein / nutritionGoals.protein) * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-amber-500" />
                    Carbs
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentIntake.carbs}g / {nutritionGoals.carbs}g
                  </span>
                </div>
                <Progress value={(currentIntake.carbs / nutritionGoals.carbs) * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Water
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentIntake.water}L / {nutritionGoals.water}L
                  </span>
                </div>
                <Progress value={(currentIntake.water / nutritionGoals.water) * 100} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI-Powered Food Ordering
            </CardTitle>
            <CardDescription>Get personalized meal recommendations from Lieferando</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dietary Preferences (Optional)
              </label>
              <Textarea
                placeholder="E.g., vegetarian, no dairy, loves Asian food..."
                value={userPreferences}
                onChange={(e) => setUserPreferences(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleQuickOrder} 
                className="flex-1" 
                size="lg"
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Recommendations
                  </>
                )}
              </Button>
              <Button 
                onClick={handleOrderLieferando} 
                variant="outline"
                disabled={aiLoading}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              AI analyzes your remaining macros and suggests perfect meals
            </p>
          </CardContent>
        </Card>

        {/* Meal Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Meals</CardTitle>
            <CardDescription>Based on your goals and activity level</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                <TabsTrigger value="lunch">Lunch</TabsTrigger>
                <TabsTrigger value="dinner">Dinner</TabsTrigger>
              </TabsList>
              
              {["all", "breakfast", "lunch", "dinner"].map((category) => (
                <TabsContent key={category} value={category} className="space-y-4 mt-4">
                  {foodRecommendations
                    .filter((food) => category === "all" || food.category === category)
                    .map((food, index) => (
                      <motion.div
                        key={food.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{food.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{food.description}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge variant="secondary">
                                    <Flame className="w-3 h-3 mr-1" />
                                    {food.calories} cal
                                  </Badge>
                                  <Badge variant="secondary">
                                    <Beef className="w-3 h-3 mr-1" />
                                    {food.protein}g protein
                                  </Badge>
                                  <Badge variant="secondary">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {food.prepTime} min
                                  </Badge>
                                  <Badge variant={
                                    food.difficulty === "easy" ? "default" : 
                                    food.difficulty === "medium" ? "secondary" : 
                                    "outline"
                                  }>
                                    {food.difficulty}
                                  </Badge>
                                </div>
                                {selectedMeal === food.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-sm text-muted-foreground"
                                  >
                                    <p className="font-medium mb-1">Ingredients:</p>
                                    <p>{food.ingredients.join(", ")}</p>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={selectedMeal === food.id ? "secondary" : "outline"}
                              className="w-full"
                              onClick={() => setSelectedMeal(selectedMeal === food.id ? null : food.id)}
                            >
                              {selectedMeal === food.id ? "Hide Details" : "Show Details"}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Nutrition;
