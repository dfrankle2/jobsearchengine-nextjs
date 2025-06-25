import Exa from 'exa-js';
import OpenAI from 'openai';
import { UserPreferences } from '@/types';

const exa = new Exa(process.env.EXA_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface JobSearchResult {
  url: string;
  title: string;
  content: string;
  score?: number;
}

export async function searchJobsByQuery(query: string, numResults: number = 10): Promise<JobSearchResult[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const searchQuery = `"${query}" "apply now" OR "apply today" job opening position`;
  
  const jobSearch = await exa.searchAndContents(searchQuery, {
    type: 'neural',
    numResults,
    text: { includeHtmlTags: false },
    includeDomains: [
      'linkedin.com', 'indeed.com', 'glassdoor.com',
      'angel.co', 'wellfound.com', 'lever.co',
      'greenhouse.io', 'workday.com', 'google.com',
      'apple.com', 'microsoft.com'
    ],
    startPublishedDate: startDate.toISOString(),
    endPublishedDate: endDate.toISOString(),
    excludeText: ['position has been filled']
  });

  return jobSearch.results.map(result => ({
    url: result.url,
    title: result.title || 'Untitled Job',
    content: result.text || '',
    score: undefined
  }));
}

export async function findSimilarJobs(jobUrl: string, numResults: number = 5): Promise<JobSearchResult[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    const similarJobs = await exa.findSimilarAndContents(jobUrl, {
      numResults,
      text: { includeHtmlTags: false },
      includeDomains: [
        'linkedin.com', 'indeed.com', 'glassdoor.com',
        'angel.co', 'wellfound.com', 'lever.co',
        'greenhouse.io', 'workday.com'
      ],
      startPublishedDate: startDate.toISOString(),
      endPublishedDate: endDate.toISOString(),
      excludeText: ['position has been filled']
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
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