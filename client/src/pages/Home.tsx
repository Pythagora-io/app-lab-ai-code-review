import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/useToast";
import { analyzeRepo, getAnalysisStatus } from "@/api/analysis";
import { Github, ArrowRight, AlertCircle, Code2, Sparkles, Lock, Shield, Code, Zap } from "lucide-react";
import { motion } from "framer-motion";

type AnalysisForm = {
  repoUrl: string;
};

const features = [
  {
    icon: Code2,
    title: "Best Practices Analysis",
    description: "Get recommendations for code organization and maintainability",
  },
  {
    icon: Sparkles,
    title: "Performance Insights",
    description: "Identify bottlenecks and optimization opportunities",
  },
  {
    icon: Lock,
    title: "Security Scanning",
    description: "Detect potential vulnerabilities and security issues",
  },
];

export function Home() {
  const { register, handleSubmit } = useForm<AnalysisForm>();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Set up polling when analysisId changes
  useEffect(() => {
    if (analysisId && analysisStatus === 'processing') {
      // Start polling for status updates
      startPolling();
    } else if (analysisStatus !== 'processing' && pollingIntervalRef.current) {
      // Stop polling if analysis is no longer processing
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [analysisId, analysisStatus]);

  const startPolling = () => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set up a new polling interval (every 3 seconds)
    pollingIntervalRef.current = setInterval(checkAnalysisStatus, 3000);

    // Also check immediately
    checkAnalysisStatus();
  };

  const checkAnalysisStatus = async () => {
    if (!analysisId) return;

    try {
      const status = await getAnalysisStatus(analysisId);
      setProgress(status.progress);
      setAnalysisStatus(status.status);

      // If analysis is completed, navigate to results page
      if (status.status === 'completed') {
        clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = null;
        navigate(`/explain/${analysisId}`);
      }

      // If analysis has an error, stop polling and show error
      if (status.status === 'error') {
        clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = null;
        toast({
          title: "Analysis Failed",
          description: status.error || "An unexpected error occurred during analysis",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error checking analysis status:", error);
      toast({
        title: "Error Checking Status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: AnalysisForm) => {
    if (!data.repoUrl) {
      toast({
        title: "Repository URL Required",
        description: "Please enter a GitHub repository URL",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const response = await analyzeRepo(data.repoUrl);
      setAnalysisId(response.analysisId);
      setAnalysisStatus('processing');
      setProgress(response.progress);

      toast({
        title: "Analysis Started",
        description: "Your repository is being analyzed. This may take a few minutes.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 text-center"
      >
        <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 dark:from-white dark:via-zinc-500 dark:to-white">
          GitHub Repository Analyzer
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          Enhance your code quality with AI-powered suggestions for best practices,
          performance optimization, and security improvements.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Github className="h-6 w-6" />
              Analyze Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="https://github.com/user/repo"
                    {...register("repoUrl", { required: true })}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={loading || analysisStatus === 'processing'}
                    className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500 h-12 text-lg"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || analysisStatus === 'processing'}
                  className="h-12 px-6 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-900 hover:to-black dark:from-zinc-200 dark:to-zinc-300 dark:hover:from-zinc-100 dark:hover:to-white dark:text-zinc-900 transition-all duration-300 hover:scale-105"
                >
                  {loading ? (
                    "Analyzing..."
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Bar for Repository Analysis */}
              {analysisStatus === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analyzing repository...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    This may take a few minutes depending on repository size
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
          >
            <Card className="backdrop-blur-sm bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <feature.icon className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-zinc-900 dark:text-zinc-100">
              Before analyzing a repository, make sure you've configured your GitHub token and OpenAI API key in the{" "}
              <Button
                variant="link"
                className="px-0 h-auto text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-300"
                onClick={() => navigate("/settings")}
              >
                settings page
              </Button>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}