import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnalysisService } from '@/lib/analysisService';

interface AnalysisResult {
  credibilityScore: number;
  classification: 'trustworthy' | 'misleading' | 'uncertain';
  factors: {
    languagePattern: number;
    sentimentAnalysis: number;
    factualConsistency: number;
    sourceReliability: number;
  };
  riskFactors: string[];
  confidenceLevel: number;
}

export const FakeNewsDetector = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress updates
      const progressUpdates = [20, 45, 70, 90, 100];
      for (let i = 0; i < progressUpdates.length; i++) {
        setProgress(progressUpdates[i]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const analysisResult = await AnalysisService.analyzeText(text);
      setResult(analysisResult);
      
      toast({
        title: "Analysis Complete",
        description: `Text classified as ${analysisResult.classification}`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the text. Please try again.",
        variant: "destructive",
      });
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'trustworthy': return 'trust-high';
      case 'misleading': return 'trust-low';
      default: return 'trust-medium';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'trustworthy': return <CheckCircle className="h-5 w-5" />;
      case 'misleading': return <AlertCircle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Real-time Analysis</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Fake News Detection System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced NLP analysis to detect misinformation and assess content credibility in real-time
          </p>
        </div>

        {/* Input Section */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-4">
            <label htmlFor="text-input" className="text-sm font-medium text-foreground">
              Enter social media post or content to analyze:
            </label>
            <Textarea
              id="text-input"
              placeholder="Paste the social media post, news article, or any text content you want to analyze for credibility..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                  Analyzing...
                </>
              ) : (
                'Analyze Content'
              )}
            </Button>
          </div>
        </Card>

        {/* Progress */}
        {isAnalyzing && (
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Classification */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-${getClassificationColor(result.classification)}/10`}>
                    {getClassificationIcon(result.classification)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold capitalize">
                      {result.classification}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {result.confidenceLevel}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {result.credibilityScore}/100
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Credibility Score
                  </p>
                </div>
              </div>
            </Card>

            {/* Analysis Breakdown */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h3 className="text-lg font-semibold mb-4">Analysis Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Language Pattern</span>
                    <span>{result.factors.languagePattern}%</span>
                  </div>
                  <Progress value={result.factors.languagePattern} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sentiment Analysis</span>
                    <span>{result.factors.sentimentAnalysis}%</span>
                  </div>
                  <Progress value={result.factors.sentimentAnalysis} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Factual Consistency</span>
                    <span>{result.factors.factualConsistency}%</span>
                  </div>
                  <Progress value={result.factors.factualConsistency} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Source Reliability</span>
                    <span>{result.factors.sourceReliability}%</span>
                  </div>
                  <Progress value={result.factors.sourceReliability} className="h-2" />
                </div>
              </div>
            </Card>

            {/* Risk Factors */}
            {result.riskFactors.length > 0 && (
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="text-lg font-semibold mb-4">Identified Risk Factors</h3>
                <div className="flex flex-wrap gap-2">
                  {result.riskFactors.map((factor, index) => (
                    <Badge key={index} variant="secondary" className="bg-trust-low/10 text-trust-low">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};