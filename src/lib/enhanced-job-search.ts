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

// Enhanced search with multiple strategies
export async function enhancedJobSearch(
  query: string, 
  preferences: UserPreferences,
  numResults: number = 25
): Promise<EnhancedJobResult[]> {
  console.log(`🚀 Starting enhanced job search for: ${query}`);
  
  const searchStrategies = [
    // Strategy 1: Direct job board search with autoprompt
    {
      name: 'job_boards_autoprompt',
      query: buildJobBoardQuery(query, preferences),
      type: 'neural' as const,
      useAutoprompt: true,
      includeDomains: getJobBoardDomains(),
      weight: 0.4
    },
    
    // Strategy 2: Company career pages search
    {
      name: 'company_careers',
      query: buildCompanyCareerQuery(query, preferences),
      type: 'neural' as const,
      useAutoprompt: false,
      includeDomains: getCompanyCareerDomains(),
      weight: 0.3
    },
    
    // Strategy 3: Keyword-based search for exact matches
    {
      name: 'keyword_exact',
      query: buildKeywordQuery(query, preferences),
      type: 'keyword' as const,
      useAutoprompt: false,
      includeDomains: [...getJobBoardDomains(), ...getCompanyCareerDomains()],
      weight: 0.3
    }
  ];

  let allResults: EnhancedJobResult[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 45); // Extend to 45 days for more results

  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 Executing ${strategy.name} strategy`);
      
      const searchResults = await getExaClient().searchAndContents(strategy.query, {
        type: strategy.type,
        numResults: Math.ceil(numResults * strategy.weight),
        text: { 
          includeHtmlTags: false,
          maxCharacters: 8000 // More content for better analysis
        },
        highlights: {
          query: buildHighlightQuery(preferences),
          numSentences: 5,
          highlightsPerUrl: 4
        },
        includeDomains: strategy.includeDomains,
        includeText: getIncludeTextFilters(preferences),
        excludeText: getExcludeTextFilters(),
        startPublishedDate: startDate.toISOString(),
        endPublishedDate: endDate.toISOString(),
        useAutoprompt: strategy.useAutoprompt
      });

      console.log(`✅ ${strategy.name} found ${searchResults.results.length} results`);
      
      // Process results with enhanced validation
      const processedResults = await Promise.all(
        searchResults.results
          .filter(result => enhancedJobValidation(result, query, preferences))
          .map(result => enrichJobResult(result, preferences, strategy.weight))
      );

      allResults = allResults.concat(processedResults.filter(r => r !== null) as EnhancedJobResult[]);
      
    } catch (error) {
      console.error(`❌ ${strategy.name} strategy failed:`, error);
    }
  }

  // Remove duplicates and sort by enhanced score
  const uniqueResults = deduplicateJobs(allResults);
  const scoredResults = await batchEnhanceScores(uniqueResults, preferences);
  
  console.log(`📊 Final results: ${scoredResults.length} unique jobs`);
  
  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, numResults);
}

// Build optimized search queries based on preferences
function buildJobBoardQuery(query: string, preferences: UserPreferences): string {
  let searchQuery = `${query} job opening position hiring now`;
  
  if (preferences.location && preferences.location !== 'Remote') {
    searchQuery += ` in ${preferences.location}`;
  }
  
  if (preferences.location === 'Remote' || preferences.jobType?.includes('Remote')) {
    searchQuery += ` remote work from home`;
  }
  
  if (preferences.experienceLevel) {
    searchQuery += ` ${preferences.experienceLevel}`;
  }
  
  if (preferences.technologies) {
    const techs = preferences.technologies.split(',').slice(0, 3);
    searchQuery += ` ${techs.join(' ')}`;
  }
  
  return searchQuery;
}

function buildCompanyCareerQuery(query: string, preferences: UserPreferences): string {
  const baseQuery = `${query} careers jobs opportunities team join`;
  
  if (preferences.companySize) {
    const sizeTerms = {
      'Startup': 'startup early stage',
      'Small': 'growing company',
      'Medium': 'established company',
      'Large': 'enterprise corporation'
    };
    return `${baseQuery} ${sizeTerms[preferences.companySize as keyof typeof sizeTerms] || ''}`;
  }
  
  return baseQuery;
}

function buildKeywordQuery(query: string, preferences: UserPreferences): string {
  let keywordQuery = `"${query}" AND (job OR position OR hiring OR career)`;
  
  if (preferences.location && preferences.location !== 'Remote') {
    keywordQuery += ` AND "${preferences.location}"`;
  }
  
  if (preferences.location === 'Remote') {
    keywordQuery += ` AND (remote OR "work from home")`;
  }
  
  return keywordQuery;
}

function buildHighlightQuery(preferences: UserPreferences): string {
  const highlights = [
    'requirements', 'qualifications', 'responsibilities', 
    'salary', 'benefits', 'experience', 'skills'
  ];
  
  if (preferences.technologies) {
    highlights.push(...preferences.technologies.split(',').map(t => t.trim()));
  }
  
  return highlights.join(' ');
}

// Enhanced domain lists
function getJobBoardDomains(): string[] {
  return [
    // Tier 1 - Major job boards
    'linkedin.com', 'indeed.com', 'glassdoor.com',
    
    // Tier 2 - Specialized job boards
    'monster.com', 'dice.com', 'ziprecruiter.com', 'careerbuilder.com',
    'simplyhired.com', 'craigslist.org',
    
    // Tech-focused boards
    'stackoverflow.com', 'angel.co', 'wellfound.com', 'hired.com',
    'otta.com', 'builtin.com', 'techjobs.com', 'cyberjobs.com',
    
    // Remote job boards
    'remote.co', 'flexjobs.com', 'weworkremotely.com', 'remoteok.io',
    'remotejobs.com', 'justremote.co', 'nomadlist.com',
    
    // Industry-specific
    'biospace.com', 'healthcareers.com', 'idealist.org', 'usajobs.gov',
    
    // ATS platforms
    'lever.co', 'greenhouse.io', 'workable.com', 'ashbyhq.com',
    'smartrecruiters.com', 'myworkdayjobs.com', 'icims.com',
    'taleo.net', 'jobvite.com', 'breezy.hr'
  ];
}

function getCompanyCareerDomains(): string[] {
  return [
    // Major tech companies
    'careers.google.com', 'amazon.jobs', 'careers.microsoft.com',
    'jobs.apple.com', 'metacareers.com', 'careers.salesforce.com',
    'netflix.jobs', 'uber.com', 'airbnb.com', 'spotify.com',
    
    // Consulting & Finance
    'mckinsey.com', 'bain.com', 'bcg.com', 'goldmansachs.com',
    'jpmorgan.com', 'blackrock.com',
    
    // Other major companies
    'jobs.boeing.com', 'ge.com', 'ibm.com', 'oracle.com',
    'cisco.com', 'intel.com', 'nvidia.com', 'amd.com'
  ];
}

function getIncludeTextFilters(preferences: UserPreferences): string[] {
  const filters = ['apply now hiring join'];
  
  if (preferences.location === 'Remote') {
    filters.push('remote work home');
  }
  
  if (preferences.salary) {
    filters.push('salary compensation pay');
  }
  
  // Only one string allowed, up to 5 words
  return [filters.join(' ').split(' ').slice(0, 5).join(' ')];
}

function getExcludeTextFilters(): string[] {
  // Only one string allowed, up to 5 words
  return ['expired filled closed unavailable'];
}

// Enhanced job validation with AI assistance
function enhancedJobValidation(result: any, query: string, preferences: UserPreferences): boolean {
  const title = (result.title || '').toLowerCase();
  const content = (result.text || '').toLowerCase();
  const url = (result.url || '').toLowerCase();

  // Basic validation
  if (!title || !content || content.length < 300) return false;
  
  // URL validation
  const jobUrlPatterns = [
    '/jobs/', '/careers/', '/job/', '/career/', '/position/', 
    '/opening/', '/vacancy/', 'job-', 'career-', '-job',
    'jobid=', 'job_id=', 'requisition', 'posting', '/apply'
  ];
  
  const hasJobUrl = jobUrlPatterns.some(pattern => url.includes(pattern));
  
  // Content structure validation
  const requiredSections = [
    ['responsibilit', 'duties', 'what you', 'you will'],
    ['requirement', 'qualification', 'skill', 'experience'],
    ['apply', 'application', 'submit', 'send resume']
  ];
  
  const sectionsFound = requiredSections.filter(sectionGroup => 
    sectionGroup.some(term => content.includes(term))
  ).length;

  // Query relevance
  const queryWords = query.toLowerCase().split(' ');
  const titleRelevance = queryWords.filter(word => 
    word.length > 2 && title.includes(word)
  ).length;
  
  const contentRelevance = queryWords.filter(word => 
    word.length > 2 && content.includes(word)
  ).length;

  // Exclusion patterns
  const excludePatterns = [
    'company overview', 'about us', 'privacy policy',
    'terms of service', 'news article', 'press release'
  ];
  
  const isExcluded = excludePatterns.some(pattern => 
    title.includes(pattern) || content.substring(0, 1000).includes(pattern)
  );

  // Scoring criteria
  const validationScore = [
    hasJobUrl ? 2 : 0,
    sectionsFound * 1,
    titleRelevance > 0 ? 2 : 0,
    contentRelevance > 1 ? 1 : 0,
    !isExcluded ? 1 : -5,
    content.length > 1000 ? 1 : 0
  ].reduce((sum, score) => sum + score, 0);

  return validationScore >= 4;
}

// Enhanced job result enrichment
async function enrichJobResult(
  result: any, 
  preferences: UserPreferences, 
  strategyWeight: number
): Promise<EnhancedJobResult | null> {
  try {
    const content = result.text || '';
    
    // Extract all information in parallel
    const [
      company, location, salary, experienceLevel, 
      jobType, skills, applyMethod, benefits, remotePolicy
    ] = await Promise.all([
      extractWithAI(content, 'company'),
      extractWithAI(content, 'location'),
      extractWithAI(content, 'salary'),
      extractWithAI(content, 'experience'),
      extractWithAI(content, 'jobType'),
      extractWithAI(content, 'skills'),
      extractWithAI(content, 'applyMethod'),
      extractWithAI(content, 'benefits'),
      extractWithAI(content, 'remotePolicy')
    ]);

    const baseScore = calculateEnhancedScore(result, preferences, strategyWeight);
    
    return {
      url: result.url,
      title: result.title || 'Untitled Position',
      content,
      company: company || 'Unknown Company',
      location: location || 'Unknown',
      salary,
      experienceLevel,
      jobType,
      skills,
      score: baseScore,
      publishedDate: result.publishedDate,
      applyMethod,
      companySize: inferCompanySize(company, content),
      benefits: benefits ? benefits.split(',').map(b => b.trim()) : [],
      remotePolicy
    };
  } catch (error) {
    console.error('Error enriching job result:', error);
    return null;
  }
}

// AI-powered information extraction with optimized prompts
async function extractWithAI(content: string, field: string): Promise<string> {
  const prompts: Record<string, string> = {
    company: 'Extract the hiring company name. Return only the company name.',
    location: 'Extract the job location. Return only: city, state/country OR "Remote" OR "Hybrid".',
    salary: 'Extract salary/compensation info. Return range or amount, or "Not specified".',
    experience: 'Extract experience level. Return: "Entry-level", "Mid-level", "Senior", "Lead", or "Not specified".',
    jobType: 'Extract employment type. Return: "Full-time", "Part-time", "Contract", "Freelance", or "Not specified".',
    skills: 'Extract top 6 required skills/technologies. Return as comma-separated list.',
    applyMethod: 'How to apply? Return: "Online application", "Email", "Company website", or "Not specified".',
    benefits: 'Extract key benefits offered. Return top 5 as comma-separated list, or "None mentioned".',
    remotePolicy: 'What is the remote work policy? Return: "Fully remote", "Hybrid", "On-site", or "Not specified".'
  };

  const prompt = prompts[field];
  if (!prompt) return '';

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: [
        { 
          role: 'system', 
          content: 'Extract specific information from job postings. Be concise and accurate. Follow the exact format requested.' 
        },
        { 
          role: 'user', 
          content: `${prompt}\n\nJob posting excerpt:\n${content.substring(0, 4000)}` 
        }
      ],
      temperature: 0,
      max_tokens: 150
    });
    
    return completion.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error(`Error extracting ${field}:`, error);
    return '';
  }
}

// Enhanced scoring algorithm
function calculateEnhancedScore(
  result: any, 
  preferences: UserPreferences, 
  strategyWeight: number
): number {
  const title = (result.title || '').toLowerCase();
  const content = (result.text || '').toLowerCase();
  
  let score = 5; // Base score
  
  // Content quality indicators
  if (content.length > 2000) score += 1;
  if (content.length > 4000) score += 1;
  
  // Job quality signals
  const qualitySignals = [
    'competitive salary', 'benefits', 'equity', 'bonus',
    'health insurance', 'retirement', '401k', 'pto',
    'flexible', 'growth opportunity', 'training'
  ];
  
  const qualityCount = qualitySignals.filter(signal => 
    content.includes(signal)
  ).length;
  
  score += Math.min(2, qualityCount * 0.5);
  
  // Strategy weight adjustment
  score += strategyWeight * 2;
  
  // Recency bonus (if published date available)
  if (result.publishedDate) {
    const daysOld = Math.floor(
      (Date.now() - new Date(result.publishedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOld <= 7) score += 1;
    else if (daysOld <= 14) score += 0.5;
  }
  
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

// Advanced deduplication
function deduplicateJobs(jobs: EnhancedJobResult[]): EnhancedJobResult[] {
  const seen = new Set<string>();
  const unique: EnhancedJobResult[] = [];
  
  for (const job of jobs) {
    // Create multiple keys for deduplication
    const urlKey = job.url.toLowerCase();
    const titleCompanyKey = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    
    if (!seen.has(urlKey) && !seen.has(titleCompanyKey)) {
      seen.add(urlKey);
      seen.add(titleCompanyKey);
      unique.push(job);
    }
  }
  
  return unique;
}

// Batch score enhancement with AI
async function batchEnhanceScores(
  jobs: EnhancedJobResult[], 
  preferences: UserPreferences
): Promise<EnhancedJobResult[]> {
  console.log('🧠 Enhancing scores with AI analysis...');
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  const enhancedJobs: EnhancedJobResult[] = [];
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (job) => {
      try {
        const enhancedScore = await calculateAIScore(job, preferences);
        return { ...job, score: enhancedScore };
      } catch (error) {
        console.error('Error enhancing score:', error);
        return job;
      }
    });
    
    const enhancedBatch = await Promise.allSettled(batchPromises);
    
    enhancedBatch.forEach(result => {
      if (result.status === 'fulfilled') {
        enhancedJobs.push(result.value);
      }
    });
    
    // Small delay to respect rate limits
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return enhancedJobs;
}

// AI-powered score calculation
async function calculateAIScore(
  job: EnhancedJobResult, 
  preferences: UserPreferences
): Promise<number> {
  const prompt = `Rate this job match from 1-10 based on user preferences.

Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Salary: ${job.salary || 'Not specified'}
- Experience: ${job.experienceLevel || 'Not specified'}
- Type: ${job.jobType || 'Not specified'}
- Skills: ${job.skills || 'Not specified'}
- Remote Policy: ${job.remotePolicy || 'Not specified'}

User Preferences:
- Location: ${preferences.location || 'Any'}
- Job Type: ${preferences.jobType || 'Any'}
- Experience: ${preferences.experienceLevel || 'Any'}
- Salary: ${preferences.salary || 'Any'}
- Technologies: ${preferences.technologies || 'Any'}
- Company Size: ${preferences.companySize || 'Any'}

Scoring criteria:
- 9-10: Perfect match (exact title, location, salary, skills)
- 7-8: Great match (most preferences met)
- 5-6: Good match (some preferences met)
- 3-4: Fair match (basic requirements met)
- 1-2: Poor match (few or no preferences met)

Consider remote work as location-flexible. Return only a number 1-10.`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: [
        { role: 'system', content: 'You are an expert job matching algorithm. Provide precise numerical scores.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 10
    });
    
    const score = parseFloat(completion.choices[0].message.content || '5');
    return isNaN(score) ? job.score : Math.min(10, Math.max(1, score));
  } catch (error) {
    console.error('Error calculating AI score:', error);
    return job.score;
  }
}

// Utility function to infer company size
function inferCompanySize(company: string, content: string): string {
  const companyLower = company.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Large companies
  const largeCompanies = [
    'google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix',
    'tesla', 'uber', 'airbnb', 'spotify', 'salesforce'
  ];
  
  if (largeCompanies.some(large => companyLower.includes(large))) {
    return 'Large';
  }
  
  // Size indicators in content
  if (contentLower.includes('startup') || contentLower.includes('early stage')) {
    return 'Startup';
  }
  
  if (contentLower.includes('fortune 500') || contentLower.includes('enterprise')) {
    return 'Large';
  }
  
  return 'Unknown';
}

// Find similar jobs using Exa's similarity search
export async function findSimilarJobsEnhanced(
  jobUrl: string, 
  preferences: UserPreferences,
  numResults: number = 10
): Promise<EnhancedJobResult[]> {
  try {
    console.log(`🔗 Finding similar jobs to: ${jobUrl}`);
    
    const similarJobs = await getExaClient().findSimilarAndContents(jobUrl, {
      numResults: numResults * 2, // Get more to filter down
      excludeSourceDomain: true,
      text: { 
        includeHtmlTags: false,
        maxCharacters: 6000
      },
      highlights: {
        query: buildHighlightQuery(preferences),
        numSentences: 4
      },
      includeDomains: [...getJobBoardDomains(), ...getCompanyCareerDomains()],
      excludeText: getExcludeTextFilters()
    });

    const enrichedSimilar = await Promise.all(
      similarJobs.results
        .filter(result => enhancedJobValidation(result, '', preferences))
        .slice(0, numResults)
        .map(result => enrichJobResult(result, preferences, 0.8))
    );

    return enrichedSimilar
      .filter(job => job !== null)
      .sort((a, b) => b!.score - a!.score) as EnhancedJobResult[];
      
  } catch (error) {
    console.error('Error finding similar jobs:', error);
    return [];
  }
}