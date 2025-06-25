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
    // Build multiple targeted search queries
    const searchQueries = [
      `"${query}" job opening apply now hiring`,
      `"${query}" position career opportunity`,
      `${query} jobs available hiring immediately`
    ];

    let allResults: JobSearchResult[] = [];

    // Try multiple search strategies
    for (const searchQuery of searchQueries.slice(0, 2)) {
      try {
        console.log(`Searching with query: ${searchQuery}`);
        
        const jobSearch = await getExaClient().searchAndContents(searchQuery, {
          type: 'neural',
          numResults: Math.ceil(numResults / 2),
          text: { 
            includeHtmlTags: false,
            maxCharacters: 4000
          },
          highlights: {
            query: 'job requirements qualifications responsibilities experience salary',
            numSentences: 3,
            highlightsPerUrl: 2
          },
          // CORRECTED: Use only base domains (no paths)
          includeDomains: [
            // Major job boards
            'linkedin.com', 
            'indeed.com',
            'glassdoor.com',
            'monster.com',
            'dice.com',
            'ziprecruiter.com',
            'careerbuilder.com',
            'simplyhired.com',
            
            // Tech-focused job boards
            'stackoverflow.com',
            'angel.co',
            'wellfound.com',
            'hired.com',
            'otta.com',
            
            // Remote-specific
            'remote.co',
            'flexjobs.com',
            'weworkremotely.com',
            'remoteok.io',
            
            // ATS platforms
            'lever.co',
            'greenhouse.io',
            'workable.com',
            'ashbyhq.com',
            'smartrecruiters.com',
            'myworkdayjobs.com',
            'icims.com',
            'taleo.net',
            
            // Company career sites (base domains only)
            'google.com',
            'amazon.com',
            'microsoft.com',
            'apple.com',
            'meta.com',
            'netflix.com',
            'salesforce.com',
            'adobe.com',
            'airbnb.com',
            'uber.com',
            'stripe.com',
            'shopify.com'
          ],
          // Exclude non-job content domains
          excludeDomains: [
            'medium.com',
            'wordpress.com', 
            'blogger.com',
            'reddit.com',
            'quora.com',
            'facebook.com',
            'twitter.com',
            'instagram.com',
            'youtube.com',
            'news.ycombinator.com',
            'techcrunch.com',
            'forbes.com',
            'wikipedia.org'
          ],
          // CORRECTED: Only 1 string, up to 5 words for includeText
          includeText: ["job apply position"],
          
          // CORRECTED: Only 1 string, up to 5 words for excludeText  
          excludeText: ["expired filled closed"],
          
          startPublishedDate: startDate.toISOString(),
          endPublishedDate: endDate.toISOString(),
          useAutoprompt: true
        });

        console.log(`Found ${jobSearch.results.length} results for query: ${searchQuery}`);

        const results = jobSearch.results
          .filter(result => isValidJobPosting(result))
          .map(result => ({
            url: result.url,
            title: result.title || 'Untitled Job',
            content: result.text || '',
            score: undefined
          }));

        allResults = allResults.concat(results);
      } catch (error) {
        console.error(`Search failed for query: ${searchQuery}`, error);
      }
    }

    // Remove duplicates by URL
    const uniqueResults = allResults.filter((job, index, self) => 
      index === self.findIndex(j => j.url === job.url)
    );

    console.log(`Total unique results: ${uniqueResults.length}`);
    return uniqueResults.slice(0, numResults);

  } catch (error) {
    console.error('Exa search error:', error);
    return [];
  }
}

// Helper function to validate if a result is actually a job posting
function isValidJobPosting(result: any): boolean {
  const title = (result.title || '').toLowerCase();
  const content = (result.text || '').toLowerCase();
  const url = (result.url || '').toLowerCase();

  // Must contain job-related indicators
  const jobIndicators = [
    'job', 'position', 'role', 'career', 'hiring', 'employment', 
    'opportunity', 'opening', 'vacancy', 'apply', 'candidate'
  ];
  
  const hasJobIndicator = jobIndicators.some(indicator => 
    title.includes(indicator) || content.includes(indicator) || url.includes(indicator)
  );

  // Must NOT be these types of pages
  const excludePatterns = [
    'company profile', 'about us', 'store location', 'contact',
    'press', 'news', 'blog', 'article', 'podcast', 'watch',
    'stream', 'netflix', 'apple store', 'store hours'
  ];

  const isExcluded = excludePatterns.some(pattern => 
    title.includes(pattern) || content.includes(pattern)
  );

  // Must have substantial content (real job descriptions are detailed)
  const hasSubstantialContent = content.length > 200;

  // Check for job-specific content patterns
  const jobContentPatterns = [
    'responsibilities', 'requirements', 'qualifications', 'experience',
    'skills', 'salary', 'benefits', 'full-time', 'part-time', 'remote'
  ];

  const hasJobContent = jobContentPatterns.some(pattern => 
    content.includes(pattern)
  );

  return hasJobIndicator && !isExcluded && hasSubstantialContent && hasJobContent;
}

export async function findSimilarJobs(jobUrl: string, numResults: number = 10): Promise<JobSearchResult[]> {
  try {
    const similarJobs = await getExaClient().findSimilarAndContents(jobUrl, {
      numResults,
      excludeSourceDomain: true,
      text: { 
        includeHtmlTags: false,
        maxCharacters: 3000
      },
      highlights: {
        query: 'job requirements qualifications experience',
        numSentences: 2
      },
      // Same focused domain list as search
      includeDomains: [
        'linkedin.com', 
        'indeed.com',
        'glassdoor.com',
        'monster.com',
        'dice.com',
        'ziprecruiter.com',
        'careerbuilder.com',
        'stackoverflow.com',
        'angel.co',
        'wellfound.com',
        'lever.co',
        'greenhouse.io',
        'workable.com',
        'icims.com'
      ],
      // CORRECTED: Only 1 string, up to 5 words
      excludeText: ["expired filled"]
    });

    return similarJobs.results
      .filter(result => isValidJobPosting(result))
      .map(result => ({
        url: result.url,
        title: result.title || 'Untitled Job',
        content: result.text || '',
        score: undefined
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
        { role: 'system', content: 'You are a helpful assistant.' },
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
  const prompt = `Rate how well this job matches the user's preferences on a scale of 1-10.

Job Details:
- Company: ${job.company}
- Location: ${job.location}
- Salary: ${job.salary || 'Not specified'}
- Experience Level: ${job.experienceLevel || 'Not specified'}
- Job Type: ${job.jobType || 'Not specified'}
- Skills: ${job.skills || 'Not specified'}

User Preferences:
- Preferred Location: ${preferences.location || 'Any'}
- Preferred Job Type: ${preferences.jobType || 'Any'}
- Experience Level: ${preferences.experienceLevel || 'Any'}
- Desired Salary: ${preferences.salary || 'Any'}
- Technologies: ${preferences.technologies || 'Any'}
- Company Size: ${preferences.companySize || 'Any'}

Job Description:
${job.content.substring(0, 2000)}

Rate this match from 1-10 where:
- 10 = Perfect match
- 7-9 = Strong match
- 4-6 = Moderate match
- 1-3 = Poor match

Return ONLY a number from 1 to 10.`;

  try {
    const response = await getOpenAIResponse(prompt);
    const score = parseInt(response.trim());
    return isNaN(score) ? 5 : Math.min(10, Math.max(1, score));
  } catch (error) {
    console.error('Error calculating score:', error);
    return 5;
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