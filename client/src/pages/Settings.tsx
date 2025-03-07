import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/useToast";
import { saveSettings, getSettings } from "@/api/settings";
import { Save, Github, Key, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type SettingsForm = {
  githubToken: string;
  openaiKey: string;
};

export function Settings() {
  const { register, handleSubmit, setValue } = useForm<SettingsForm>();
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings.githubToken) {
          setValue("githubToken", settings.githubToken);
        }
        if (settings.openaiKey) {
          setValue("openaiKey", settings.openaiKey);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings",
        });
      }
    };
    loadSettings();
  }, [setValue, toast]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await saveSettings(data);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      // Extract the specific error message from the API response
      const errorMessage = error.message || "Failed to save settings";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 dark:from-white dark:via-zinc-500 dark:to-white">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure your API keys for GitHub and OpenAI integration.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full max-w-2xl backdrop-blur-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">API Configuration</CardTitle>
            <CardDescription>
              Enter your API keys to enable repository analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="githubToken" className="text-base">GitHub Personal Access Token</Label>
                <div className="relative">
                  <Input
                    id="githubToken"
                    type="password"
                    {...register("githubToken", { required: true })}
                    className="pl-10 bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500"
                  />
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate a token with 'repo' scope from GitHub Developer Settings
                </p>
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="openaiKey" className="text-base">OpenAI API Key</Label>
                <div className="relative">
                  <Input
                    id="openaiKey"
                    type="password"
                    {...register("openaiKey", { required: true })}
                    className="pl-10 bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500"
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the OpenAI dashboard
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-900 hover:to-black dark:from-zinc-200 dark:to-zinc-300 dark:hover:from-zinc-100 dark:hover:to-white dark:text-zinc-900 transition-all duration-300 hover:scale-105"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Alert className="max-w-2xl bg-white/80 dark:bg-zinc-900/80 border-zinc-200/50 dark:border-zinc-700/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your API keys are securely stored and encrypted. They are only used to access GitHub repositories and OpenAI services.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
}