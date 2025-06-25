import Exa from 'exa-js';
import OpenAI from 'openai';
import { UserPreferences } from '@/types';

let exa: Exa | null = null;
let openai: OpenAI | null = null;

function getExaClient(): Exa {
  if (!exa) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error('EXA_API_KEY environment variable is not set');
    }
    exa = new Exa(apiKey);
  }
  return exa;
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export interface EnhancedJobResult {
  url: string;
  title: string;
  content: string;
  company: string;
  location: string;
  salary?: string;
  experienceLevel?: string;
  jobType?: string;
  skills?: string;
  score: number;
  publishedDate?: string;
  applyMethod?: string;
  companySize?: string;
  benefits?: string[];
  remotePolicy?: string;
}

// Simplified and more reliable search function
export async function enhancedJobSearch(
  query: string, 
  preferences: UserPreferences,
  numResults: number = 25
): Promise<EnhancedJobResult[]> {
  console.log(`🚀 Starting enhanced job search for: ${query}`);
  
  try {
    // Single, reliable search strategy to start
    const searchQuery = buildSimpleJobQuery(query, preferences);
    console.log(`🔍 Search query: ${searchQuery}`);
    
    const searchResults = await getExaClient().searchAndContents(searchQuery, {
      type: 'neural',
      numResults: numResults,
      text: { 
        includeHtmlTags: false,
        maxCharacters: 4000
      },
      // Simplified domain list - most reliable job sites
      includeDomains: [
        'linkedin.com',
        'indeed.com', 
        'glassdoor.com',
        'monster.com',
        'dice.com',
        'ziprecruiter.com',
        'lever.co',
        'greenhouse.io',
        'workable.com'
      ],
      // Simple text filters
      includeText: ['apply'],
      excludeText: ['expired'],
      useAutoprompt: true
    });

    console.log(`✅ Found ${searchResults.results.length} raw results`);
    
    if (searchResults.results.length === 0) {
      console.log('❌ No results from Exa search');
      return [];
    }

    // Process results with relaxed validation
    const processedJobs: EnhancedJobResult[] = [];
    
    for (const result of searchResults.results) {
      try {
        // Relaxed validation - just check basics
        if (isBasicJobPosting(result)) {
          const enrichedJob = await createJobResult(result, preferences, query);
          if (enrichedJob) {
            processedJobs.push(enrichedJob);
          }
        }
      } catch (error) {
        console.warn('Failed to process job:', error);
        // Continue processing other results
      }
    }

    console.log(`📊 Processed ${processedJobs.length} valid jobs`);
    
    // Sort by score and return
    return processedJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, numResults);
      
  } catch (error) {
    console.error('Enhanced search error:', error);
    throw error;
  }
}

// Simplified query builder
function buildSimpleJobQuery(query: string, preferences: UserPreferences): string {
  let searchQuery = `${query} hiring`;
  
  if (preferences.location && preferences.location !== 'Remote') {
    searchQuery += ` ${preferences.location}`;
  }
  
  if (preferences.location === 'Remote' || preferences.jobType?.includes('Remote')) {
    searchQuery += ` remote`;
  }
  
  return searchQuery;
}

// Relaxed validation - just check if it looks like a job
function isBasicJobPosting(result: any): boolean {
  const title = (result.title || '').toLowerCase();
  const content = (result.text || '').toLowerCase();
  const url = (result.url || '').toLowerCase();
  
  // Very basic checks
  if (!title || !content || content.length < 200) {
    return false;
  }
  
  // Check if URL or content suggests it's a job
  const jobIndicators = [
    'job', 'career', 'position', 'role', 'hiring', 
    'apply', 'opportunity', 'opening', 'vacancy'
  ];
  
  const hasJobIndicator = jobIndicators.some(indicator => 
    title.includes(indicator) || 
    url.includes(indicator) || 
    content.substring(0, 500).includes(indicator)
  );
  
  return hasJobIndicator;
}

// Create job result with safe extraction
async function createJobResult(
  result: any, 
  preferences: UserPreferences,
  query?: string
): Promise<EnhancedJobResult | null> {
  try {
    const content = result.text || '';
    
    // Extract basic info without AI for speed
    const company = extractCompany(result, content);
    const location = extractLocation(content, preferences);
    const salary = extractSalary(content);
    
    // Calculate simple score
    const score = calculateSimpleScore(result, preferences, content, query);
    
    return {
      url: result.url,
      title: result.title || 'Untitled Position',
      content: content.substring(0, 4000), // Limit content size
      company: company || 'Unknown Company',
      location: location || 'Unknown',
      salary: salary || 'Not specified',
      experienceLevel: 'Not specified',
      jobType: 'Not specified',
      skills: extractSkills(content),
      score: score,
      publishedDate: result.publishedDate,
      applyMethod: 'See job posting',
      companySize: 'Unknown',
      benefits: [],
      remotePolicy: extractRemotePolicy(content)
    };
  } catch (error) {
    console.error('Error creating job result:', error);
    return null;
  }
}

// Extract company from URL or title
function extractCompany(result: any, content: string): string {
  // Try to extract from URL patterns
  const url = result.url || '';
  
  // Common patterns
  if (url.includes('linkedin.com/jobs')) {
    const match = result.title?.match(/at\s+(.+?)$/i);
    if (match) return match[1].trim();
  }
  
  if (url.includes('greenhouse.io')) {
    const match = url.match(/boards\/([^\/]+)/);
    if (match) return match[1].replace(/-/g, ' ');
  }
  
  if (url.includes('lever.co')) {
    const match = url.match(/lever\.co\/([^\/]+)/);
    if (match) return match[1].replace(/-/g, ' ');
  }
  
  // Try to extract from title
  const titleMatch = result.title?.match(/\bat\s+(.+?)(?:\s*[-–|]|$)/i);
  if (titleMatch) return titleMatch[1].trim();
  
  return 'Unknown Company';
}

// Extract location from content
function extractLocation(content: string, preferences: UserPreferences): string {
  const contentLower = content.toLowerCase();
  
  // Check for remote
  if (contentLower.includes('remote') || contentLower.includes('work from home')) {
    return 'Remote';
  }
  
  // Common location patterns
  const locationPatterns = [
    /location:\s*([^,\n]+)/i,
    /based in\s+([^,\n]+)/i,
    /office:\s*([^,\n]+)/i,
    /located in\s+([^,\n]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }
  
  return preferences.location || 'Unknown';
}

// Extract salary information
function extractSalary(content: string): string {
  const salaryPatterns = [
    /\$[\d,]+\s*(?:k|K)?(?:\s*[-–]\s*\$?[\d,]+\s*(?:k|K)?)?/,
    /USD\s*[\d,]+(?:\s*[-–]\s*[\d,]+)?/i,
    /salary:?\s*\$?[\d,]+(?:\s*[-–]\s*\$?[\d,]+)?/i
  ];
  
  for (const pattern of salaryPatterns) {
    const match = content.match(pattern);
    if (match) return match[0];
  }
  
  return 'Not specified';
}

// Extract skills from content
function extractSkills(content: string): string {
  const skillsSection = content.match(/(?:skills|requirements|qualifications)[\s\S]{0,500}/i);
  if (!skillsSection) return '';
  
  // Common tech skills to look for
  const techSkills = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'SQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile',
    'Machine Learning', 'AI', 'DevOps', 'CI/CD'
  ];
  
  const foundSkills = techSkills.filter(skill => 
    skillsSection[0].toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.slice(0, 6).join(', ');
}

// Extract remote policy
function extractRemotePolicy(content: string): string {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('fully remote') || contentLower.includes('100% remote')) {
    return 'Fully remote';
  }
  
  if (contentLower.includes('hybrid')) {
    return 'Hybrid';
  }
  
  if (contentLower.includes('on-site') || contentLower.includes('onsite')) {
    return 'On-site';
  }
  
  return 'Not specified';
}

// Simple scoring without AI
function calculateSimpleScore(
  result: any, 
  preferences: UserPreferences,
  content: string,
  query?: string
): number {
  let score = 5; // Base score
  
  const title = (result.title || '').toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Title match
  if (query && title.includes(query.toLowerCase())) score += 2;
  
  // Location match
  if (preferences.location) {
    if (preferences.location === 'Remote' && contentLower.includes('remote')) {
      score += 1.5;
    } else if (contentLower.includes(preferences.location.toLowerCase())) {
      score += 1.5;
    }
  }
  
  // Content quality
  if (content.length > 1000) score += 0.5;
  if (content.length > 2000) score += 0.5;
  
  // Job quality indicators
  if (contentLower.includes('benefits')) score += 0.5;
  if (contentLower.includes('competitive')) score += 0.5;
  
  // Recency
  if (result.publishedDate) {
    const daysOld = Math.floor(
      (Date.now() - new Date(result.publishedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOld <= 7) score += 1;
    else if (daysOld <= 14) score += 0.5;
  }
  
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

// Simplified similar jobs search
export async function findSimilarJobsEnhanced(
  jobUrl: string, 
  preferences: UserPreferences,
  numResults: number = 5
): Promise<EnhancedJobResult[]> {
  try {
    console.log(`🔗 Finding similar jobs to: ${jobUrl}`);
    
    const similarJobs = await getExaClient().findSimilarAndContents(jobUrl, {
      numResults: numResults,
      excludeSourceDomain: true,
      text: { 
        includeHtmlTags: false,
        maxCharacters: 4000
      },
      includeDomains: [
        'linkedin.com',
        'indeed.com',
        'glassdoor.com',
        'lever.co',
        'greenhouse.io'
      ]
    });

    const processedJobs: EnhancedJobResult[] = [];
    
    for (const result of similarJobs.results) {
      if (isBasicJobPosting(result)) {
        const job = await createJobResult(result, preferences);
        if (job) {
          processedJobs.push(job);
        }
      }
    }

    return processedJobs.sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.error('Error finding similar jobs:', error);
    return [];
  }
}