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
  startDate.setDate(startDate.getDate() - 7); // Focus on very recent jobs

  try {
    // Use auto type for intelligent routing between neural and keyword search
    const jobSearch = await getExaClient().searchAndContents(query, {
      type: 'auto', // Let Exa decide between neural and keyword
      numResults: Math.min(numResults, 100), // Exa limit
      text: { 
        includeHtmlTags: false,
        maxCharacters: 5000 // Increased for better content
      },
      highlights: {
        query: 'requirements qualifications experience skills salary remote hybrid benefits',
        numSentences: 5 // More context
      },
      includeDomains: [
        // Direct company career pages
        'careers.google.com', 'amazon.jobs', 'careers.microsoft.com',
        'jobs.apple.com', 'careers.meta.com', 'careers.netflix.com',
        
        // Major job boards
        'linkedin.com/jobs', 'indeed.com', 'glassdoor.com',
        'dice.com', 'ziprecruiter.com', 'monster.com',
        
        // Tech-focused
        'jobs.stackoverflow.com', 'angel.co', 'wellfound.com',
        'hired.com', 'triplebyte.com', 'otta.com',
        
        // Remote-specific
        'remote.co', 'remoteok.io', 'weworkremotely.com',
        'flexjobs.com', 'remotejobs.com',
        
        // ATS platforms
        'lever.co', 'greenhouse.io', 'workable.com',
        'ashbyhq.com', 'jobs.smartrecruiters.com',
        'myworkdayjobs.com', 'icims.com', 'taleo.net'
      ],
      startPublishedDate: startDate.toISOString(),
      endPublishedDate: endDate.toISOString(),
      excludeText: 'This position has been filled', // More specific
      useAutoprompt: true, // Optimize query automatically
      category: 'job listing' // Help Exa understand context
    });

    // Filter out likely filled positions
    const activeJobs = jobSearch.results.filter(result => {
      const text = (result.text || '').toLowerCase();
      return !text.includes('position has been filled') &&
             !text.includes('no longer accepting') &&
             !text.includes('applications closed');
    });

    return activeJobs.map(result => ({
      url: result.url,
      title: result.title || 'Untitled Job',
      content: result.text || '',
      score: undefined
    }));
  } catch (error) {
    console.error('Exa search error:', error);
    throw new Error(`Failed to search jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function findSimilarJobs(jobUrl: string, numResults: number = 10): Promise<JobSearchResult[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    const similarJobs = await getExaClient().findSimilarAndContents(jobUrl, {
      numResults,
      excludeSourceDomain: true, // Avoid duplicate listings
      text: { 
        includeHtmlTags: false,
        maxCharacters: 3000
      },
      highlights: {
        query: 'job requirements qualifications',
        numSentences: 3
      },
      includeDomains: [
        // Same comprehensive list as search
        'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
        'dice.com', 'ziprecruiter.com', 'careerbuilder.com',
        'stackoverflow.com', 'angel.co', 'wellfound.com',
        'remote.co', 'flexjobs.com',
        'lever.co', 'greenhouse.io', 'workable.com',
        'icims.com', 'myworkdayjobs.com'
      ],
      // Note: Cannot use excludeDomains when getting content
      startPublishedDate: startDate.toISOString(),
      endPublishedDate: endDate.toISOString(),
      excludeText: ['position has been filled'] // Only 1 phrase allowed
    });

    return similarJobs.results.map(result => ({
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