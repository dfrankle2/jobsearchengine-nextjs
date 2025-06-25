import Exa from 'exa-js';
import OpenAI from 'openai';
import { UserPreferences } from '@/types';

// Lazy load API clients to avoid initialization during build
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

interface JobSearchResult {
  url: string;
  title: string;
  content: string;
  score?: number;
}

export async function searchJobsByQuery(query: string, numResults: number = 25): Promise<JobSearchResult[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    // Dual search strategy for better coverage
    const searches = [
      // Neural search for semantic understanding
      {
        query: `${query} job opening hiring now apply position career opportunity`,
        type: 'neural' as const,
        useAutoprompt: true
      },
      // Keyword search for exact matches
      {
        query: `"${query}" AND (job OR position OR hiring OR career)`,
        type: 'keyword' as const,
        useAutoprompt: false
      }
    ];

    let allResults: JobSearchResult[] = [];

    for (const searchConfig of searches) {
      try {
        console.log(`🔍 Searching with ${searchConfig.type}: ${searchConfig.query}`);
        
        const jobSearch = await getExaClient().searchAndContents(searchConfig.query, {
          type: searchConfig.type,
          numResults: Math.ceil(numResults / 2),
          text: { 
            includeHtmlTags: false,
            maxCharacters: 5000 // More content for better analysis
          },
          highlights: {
            query: 'requirements qualifications responsibilities salary benefits experience skills',
            numSentences: 4,
            highlightsPerUrl: 3
          },
          // Job-focused domains only
          includeDomains: [
            // Tier 1 - Major job boards
            'linkedin.com', 
            'indeed.com',
            'glassdoor.com',
            
            // Tier 2 - Established job sites
            'monster.com',
            'dice.com',
            'ziprecruiter.com',
            'careerbuilder.com',
            'simplyhired.com',
            
            // Tech & startup focused
            'stackoverflow.com',
            'angel.co',
            'wellfound.com',
            'hired.com',
            'otta.com',
            'builtin.com',
            
            // Remote job boards
            'remote.co',
            'flexjobs.com',
            'weworkremotely.com',
            'remoteok.io',
            'remotejobs.com',
            
            // ATS & recruiting platforms
            'lever.co',
            'greenhouse.io',
            'workable.com',
            'ashbyhq.com',
            'smartrecruiters.com',
            'myworkdayjobs.com',
            'icims.com',
            'taleo.net',
            'jobvite.com',
            'breezy.hr',
            
            // Direct company career pages
            'careers.google.com',
            'amazon.jobs',
            'careers.microsoft.com',
            'jobs.apple.com',
            'metacareers.com',
            'careers.salesforce.com'
          ],
          // Note: Cannot use excludeDomains when getting content
          // Focus on job-related content
          includeText: ["apply now hiring"],
          
          // Exclude filled positions
          excludeText: ["no longer available"],
          
          startPublishedDate: startDate.toISOString(),
          endPublishedDate: endDate.toISOString(),
          useAutoprompt: searchConfig.useAutoprompt
        });

        console.log(`✅ Found ${jobSearch.results.length} results`);

        // Enhanced validation and scoring
        const validResults = jobSearch.results
          .filter(result => isValidJobPosting(result))
          .map(result => ({
            url: result.url,
            title: result.title || 'Untitled Job',
            content: result.text || '',
            score: calculateInitialScore(result, query)
          }));

        allResults = allResults.concat(validResults);
      } catch (error) {
        console.error(`Search failed for ${searchConfig.type}:`, error);
      }
    }

    // Remove duplicates and sort by initial score
    const uniqueResults = allResults
      .filter((job, index, self) => 
        index === self.findIndex(j => j.url === job.url)
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    console.log(`📊 Total unique valid results: ${uniqueResults.length}`);
    return uniqueResults.slice(0, numResults);

  } catch (error) {
    console.error('Exa search error:', error);
    return [];
  }
}

// Enhanced validation with multiple criteria
function isValidJobPosting(result: any): boolean {
  const title = (result.title || '').toLowerCase();
  const content = (result.text || '').toLowerCase();
  const url = (result.url || '').toLowerCase();

  // URL patterns that indicate job postings
  const jobUrlPatterns = [
    '/jobs/', '/careers/', '/job/', '/career/', '/position/', 
    '/opening/', '/vacancy/', 'job-', 'career-', '-job', '-career',
    'jobid=', 'job_id=', 'requisition', 'posting'
  ];
  
  const hasJobUrl = jobUrlPatterns.some(pattern => url.includes(pattern));

  // Strong job indicators in title
  const titleJobIndicators = [
    'hiring', 'job', 'position', 'role', 'opening', 
    'opportunity', 'career', 'vacancy', 'wanted', 'seeking'
  ];
  
  const hasTitleIndicator = titleJobIndicators.some(indicator => 
    title.includes(indicator)
  );

  // Content must have job-specific sections
  const requiredSections = [
    ['responsibilit', 'duties', 'role', 'what you', 'you will'],
    ['requirement', 'qualification', 'skill', 'experience', 'must have'],
    ['benefit', 'offer', 'perks', 'salary', 'compensation']
  ];
  
  const sectionsFound = requiredSections.filter(sectionGroup => 
    sectionGroup.some(term => content.includes(term))
  ).length;

  // Exclude non-job pages
  const excludePatterns = [
    'company overview', 'about us page', 'store location', 
    'press release', 'news article', 'blog post', 'case study',
    'product page', 'service page', 'contact us', 'privacy policy',
    'terms of service', 'cookie policy'
  ];

  const isExcluded = excludePatterns.some(pattern => 
    title.includes(pattern) || content.substring(0, 500).includes(pattern)
  );

  // Content quality checks
  const hasSubstantialContent = content.length > 500;
  const hasApplyInstructions = content.includes('apply') || content.includes('application');
  
  // Multiple validation criteria (need at least 3)
  const criteria = [
    hasJobUrl,
    hasTitleIndicator,
    sectionsFound >= 2,
    !isExcluded,
    hasSubstantialContent,
    hasApplyInstructions
  ];
  
  const criteriaMetCount = criteria.filter(c => c).length;
  
  return criteriaMetCount >= 3;
}

// Calculate initial relevance score based on content quality
function calculateInitialScore(result: any, query: string): number {
  const title = (result.title || '').toLowerCase();
  const content = (result.text || '').toLowerCase();
  const queryLower = query.toLowerCase();
  
  let score = 5; // Base score
  
  // Title relevance
  if (title.includes(queryLower)) score += 2;
  
  // Content depth
  if (content.length > 2000) score += 1;
  if (content.length > 4000) score += 1;
  
  // Job quality indicators
  const qualityIndicators = [
    'salary', 'benefits', 'remote', 'hybrid', 
    'equity', 'bonus', 'pto', 'vacation'
  ];
  
  const qualityCount = qualityIndicators.filter(ind => 
    content.includes(ind)
  ).length;
  
  if (qualityCount >= 3) score += 1;
  
  return Math.min(10, score);
}

export async function findSimilarJobs(jobUrl: string, numResults: number = 10): Promise<JobSearchResult[]> {
  try {
    const similarJobs = await getExaClient().findSimilarAndContents(jobUrl, {
      numResults,
      excludeSourceDomain: true,
      text: { 
        includeHtmlTags: false,
        maxCharacters: 4000
      },
      highlights: {
        query: 'requirements qualifications responsibilities salary',
        numSentences: 3
      },
      // Focused domain list for quality
      includeDomains: [
        'linkedin.com', 
        'indeed.com',
        'glassdoor.com',
        'monster.com',
        'dice.com',
        'ziprecruiter.com',
        'angel.co',
        'wellfound.com',
        'lever.co',
        'greenhouse.io',
        'workable.com',
        'builtin.com'
      ],
      excludeText: ["no longer available"]
    });

    return similarJobs.results
      .filter(result => isValidJobPosting(result))
      .map(result => ({
        url: result.url,
        title: result.title || 'Untitled Job',
        content: result.text || '',
        score: calculateInitialScore(result, '')
      }));
  } catch (error) {
    console.error('Error finding similar jobs:', error);
    return [];
  }
}

async function getOpenAIResponse(prompt: string): Promise<string> {
  if (!prompt) return '';
  
  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts information from job postings. Be concise and accurate.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 100
    });
    
    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return '';
  }
}

export async function extractJobInfo(content: string, field: string): Promise<string> {
  const prompts: Record<string, string> = {
    company: 'Extract the company name from this job posting. Return ONLY the company name, nothing else.',
    location: 'Extract the job location from this job posting. Return ONLY the location (city, state/country or "Remote"), nothing else.',
    salary: 'Extract the salary information from this job posting. Return ONLY the salary range or amount, or "Not specified" if not mentioned.',
    experience: 'Extract the required experience level from this job posting. Return ONLY one of: Entry-level, Mid-level, Senior, Lead, or Not specified.',
    jobType: 'Extract the job type from this job posting. Return ONLY one of: Full-time, Part-time, Contract, Freelance, Internship, or Not specified.',
    skills: 'Extract the top 5 key skills or technologies from this job posting. Return them as a comma-separated list, nothing else.'
  };

  const prompt = prompts[field];
  if (!prompt) return '';

  const fullPrompt = `${prompt}\n\nJob posting:\n${content.substring(0, 3000)}`;
  return getOpenAIResponse(fullPrompt);
}

export async function calculateJobScore(
  job: JobSearchResult & {
    company: string;
    location: string;
    salary?: string;
    experienceLevel?: string;
    jobType?: string;
    skills?: string;
  },
  preferences: UserPreferences
): Promise<number> {
  // Start with initial content-based score
  let baseScore = job.score || 5;
  
  // Preference matching
  const prompt = `Based on the following job and user preferences, adjust the score.
Current base score: ${baseScore}/10

Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Salary: ${job.salary || 'Not specified'}
- Experience: ${job.experienceLevel || 'Not specified'}
- Type: ${job.jobType || 'Not specified'}
- Skills: ${job.skills || 'Not specified'}

User Preferences:
- Location: ${preferences.location || 'Any'}
- Job Type: ${preferences.jobType || 'Any'}
- Experience: ${preferences.experienceLevel || 'Any'}
- Salary: ${preferences.salary || 'Any'}
- Technologies: ${preferences.technologies || 'Any'}
- Company Size: ${preferences.companySize || 'Any'}

Adjust the score based on how well the job matches preferences:
- Add points for exact matches
- Subtract points for mismatches
- Consider "Remote" as matching any location preference

Return ONLY a number from 1 to 10.`;

  try {
    const response = await getOpenAIResponse(prompt);
    const score = parseInt(response.trim());
    return isNaN(score) ? baseScore : Math.min(10, Math.max(1, score));
  } catch (error) {
    console.error('Error calculating score:', error);
    return baseScore;
  }
}

export async function enrichJobData(job: JobSearchResult, preferences: UserPreferences) {
  const [company, location, salary, experienceLevel, jobType, skills] = await Promise.all([
    extractJobInfo(job.content, 'company'),
    extractJobInfo(job.content, 'location'),
    extractJobInfo(job.content, 'salary'),
    extractJobInfo(job.content, 'experience'),
    extractJobInfo(job.content, 'jobType'),
    extractJobInfo(job.content, 'skills')
  ]);

  const enrichedJob = {
    ...job,
    company,
    location,
    salary,
    experienceLevel,
    jobType,
    skills
  };

  const score = await calculateJobScore(enrichedJob, preferences);

  return {
    ...enrichedJob,
    score
  };
}