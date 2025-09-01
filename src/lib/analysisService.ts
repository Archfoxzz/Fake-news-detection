import { pipeline } from '@huggingface/transformers';

export class AnalysisService {
  private static sentimentAnalyzer: any = null;
  private static textClassifier: any = null;

  static async initializeModels() {
    try {
      // Initialize sentiment analysis pipeline
      if (!this.sentimentAnalyzer) {
        this.sentimentAnalyzer = await pipeline(
          'sentiment-analysis',
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        );
      }

      // Initialize text classification pipeline
      if (!this.textClassifier) {
        this.textClassifier = await pipeline(
          'text-classification',
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        );
      }
    } catch (error) {
      console.error('Error initializing models:', error);
    }
  }

  static async analyzeText(text: string) {
    // Initialize models if not already done
    await this.initializeModels();

    try {
      // Perform sentiment analysis
      const sentimentResult = this.sentimentAnalyzer 
        ? await this.sentimentAnalyzer(text)
        : [{ label: 'NEUTRAL', score: 0.5 }];

      // Analyze language patterns
      const languageScore = this.analyzeLanguagePatterns(text);
      
      // Analyze factual consistency
      const factualScore = this.analyzeFactualConsistency(text);
      
      // Analyze source reliability markers
      const sourceScore = this.analyzeSourceReliability(text);

      // Get sentiment score
      const sentimentScore = sentimentResult[0]?.score || 0.5;
      const isNegativeSentiment = sentimentResult[0]?.label === 'NEGATIVE';
      
      // Calculate overall credibility score
      const credibilityScore = Math.round(
        (languageScore * 0.3 + 
         (isNegativeSentiment ? (1 - sentimentScore) * 100 : sentimentScore * 100) * 0.2 + 
         factualScore * 0.3 + 
         sourceScore * 0.2)
      );

      // Determine classification
      let classification: 'trustworthy' | 'misleading' | 'uncertain';
      if (credibilityScore >= 75) {
        classification = 'trustworthy';
      } else if (credibilityScore <= 40) {
        classification = 'misleading';
      } else {
        classification = 'uncertain';
      }

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(text, languageScore, factualScore);

      // Calculate confidence level
      const confidenceLevel = Math.round(
        Math.abs(credibilityScore - 50) * 2
      );

      return {
        credibilityScore,
        classification,
        factors: {
          languagePattern: languageScore,
          sentimentAnalysis: Math.round(sentimentScore * 100),
          factualConsistency: factualScore,
          sourceReliability: sourceScore,
        },
        riskFactors,
        confidenceLevel: Math.min(confidenceLevel, 95),
      };
    } catch (error) {
      console.error('Error during analysis:', error);
      // Return default analysis if models fail
      return this.getFallbackAnalysis(text);
    }
  }

  private static analyzeLanguagePatterns(text: string): number {
    let score = 80; // Start with neutral score

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3) score -= 20;

    // Check for excessive punctuation
    const punctuationRatio = (text.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 0) score -= 15;

    // Check for clickbait patterns
    const clickbaitPatterns = [
      /you won't believe/i,
      /shocking/i,
      /amazing/i,
      /incredible/i,
      /unbelievable/i,
      /must see/i,
      /viral/i
    ];
    const clickbaitMatches = clickbaitPatterns.filter(pattern => pattern.test(text)).length;
    score -= clickbaitMatches * 10;

    // Check for emotional language
    const emotionalWords = [
      /devastating/i,
      /outrageous/i,
      /scandal/i,
      /explosive/i,
      /bombshell/i
    ];
    const emotionalMatches = emotionalWords.filter(pattern => pattern.test(text)).length;
    score -= emotionalMatches * 8;

    return Math.max(0, Math.min(100, score));
  }

  private static analyzeFactualConsistency(text: string): number {
    let score = 75; // Start with neutral score

    // Check for specific claims without sources
    const hasNumbers = /\d+%|\d+\.\d+%|\$\d+|\d+ (million|billion|thousand)/i.test(text);
    const hasSources = /(according to|source:|study shows|research indicates)/i.test(text);
    
    if (hasNumbers && !hasSources) score -= 25;

    // Check for absolute statements
    const absolutePatterns = [
      /always/i,
      /never/i,
      /everyone/i,
      /nobody/i,
      /all .* are/i,
      /completely/i,
      /totally/i
    ];
    const absoluteMatches = absolutePatterns.filter(pattern => pattern.test(text)).length;
    score -= absoluteMatches * 10;

    // Check for conspiracy indicators
    const conspiracyPatterns = [
      /they don't want you to know/i,
      /hidden truth/i,
      /cover.?up/i,
      /mainstream media/i,
      /wake up/i
    ];
    const conspiracyMatches = conspiracyPatterns.filter(pattern => pattern.test(text)).length;
    score -= conspiracyMatches * 15;

    return Math.max(0, Math.min(100, score));
  }

  private static analyzeSourceReliability(text: string): number {
    let score = 60; // Start with neutral score

    // Check for credible source indicators
    const crediblePatterns = [
      /\.edu/,
      /\.gov/,
      /reuters/i,
      /associated press/i,
      /bbc/i,
      /peer.?reviewed/i,
      /journal/i,
      /university/i
    ];
    const credibleMatches = crediblePatterns.filter(pattern => pattern.test(text)).length;
    score += credibleMatches * 15;

    // Check for unreliable source indicators
    const unreliablePatterns = [
      /blog/i,
      /facebook post/i,
      /twitter/i,
      /anonymous source/i,
      /leaked/i,
      /exclusive/i
    ];
    const unreliableMatches = unreliablePatterns.filter(pattern => pattern.test(text)).length;
    score -= unreliableMatches * 10;

    // Check for lack of attribution
    if (!/said|according|reported|stated/i.test(text)) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static identifyRiskFactors(text: string, languageScore: number, factualScore: number): string[] {
    const riskFactors: string[] = [];

    if (languageScore < 50) {
      riskFactors.push('Suspicious language patterns detected');
    }

    if (factualScore < 50) {
      riskFactors.push('Lack of factual substantiation');
    }

    if (/you won't believe|shocking|amazing/i.test(text)) {
      riskFactors.push('Clickbait-style language');
    }

    if (/(they don't want you to know|hidden truth|cover.?up)/i.test(text)) {
      riskFactors.push('Conspiracy-style rhetoric');
    }

    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3) {
      riskFactors.push('Excessive capitalization');
    }

    if (/[!?]{2,}/g.test(text)) {
      riskFactors.push('Excessive punctuation');
    }

    if (!/said|according|reported|stated/i.test(text) && text.length > 100) {
      riskFactors.push('No attribution to sources');
    }

    return riskFactors;
  }

  private static getFallbackAnalysis(text: string) {
    // Simple fallback analysis when models fail
    const wordCount = text.split(' ').length;
    const hasQuestionMarks = (text.match(/\?/g) || []).length;
    const hasExclamation = (text.match(/!/g) || []).length;
    
    const credibilityScore = Math.max(30, Math.min(85, 
      70 - (hasQuestionMarks * 5) - (hasExclamation * 3) + Math.min(wordCount / 10, 15)
    ));

    let classification: 'trustworthy' | 'misleading' | 'uncertain';
    if (credibilityScore >= 75) {
      classification = 'trustworthy';
    } else if (credibilityScore <= 40) {
      classification = 'misleading';
    } else {
      classification = 'uncertain';
    }

    return {
      credibilityScore: Math.round(credibilityScore),
      classification,
      factors: {
        languagePattern: this.analyzeLanguagePatterns(text),
        sentimentAnalysis: 60,
        factualConsistency: this.analyzeFactualConsistency(text),
        sourceReliability: this.analyzeSourceReliability(text),
      },
      riskFactors: this.identifyRiskFactors(text, 60, 60),
      confidenceLevel: 75,
    };
  }
}