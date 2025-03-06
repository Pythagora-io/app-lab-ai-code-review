import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAnalysisStatus } from "@/api/analysis";
import { ChevronRight, FileCode, Shield, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type CategoryIcon = {
  [key: string]: React.ReactNode;
};

const categoryIcons: CategoryIcon = {
  "Best Practices": <FileCode className="h-5 w-5" />,
  "Security": <Shield className="h-5 w-5" />,
  "Performance": <Zap className="h-5 w-5" />,
};

export function Results() {
  const { id } = useParams();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const status = await getAnalysisStatus(id);
        setResults(status.results);
      } catch (err) {
        setError("Failed to load analysis results");
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <FileCode className="h-12 w-12 text-primary/50" />
          </motion.div>
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
          Analysis Results
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what we found in your repository
        </p>
      </div>

      <div className="grid gap-6">
        {results.map((category: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-700/50 shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {categoryIcons[category.category] || <CheckCircle2 className="h-5 w-5" />}
                  {category.category}
                </CardTitle>
                <Separator className="bg-zinc-200 dark:bg-zinc-700" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {category.suggestions.map((suggestion: string, i: number) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.1) + (i * 0.05) }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-zinc-700 dark:text-zinc-300">{suggestion}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}