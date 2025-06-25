import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobSearch, findSimilarJobsEnhanced } from '@/lib/enhanced-job-search-fixed';
import { prisma } from '@/lib/database';
import { SearchFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const missingVars = [];
    if (!process.env.EXA_API_KEY) missingVars.push('EXA_API_KEY');
    if (!process.env.OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY');
    if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
    
    if (missingVars.length > 0) {
      return NextResponse.json(
        { error: `Missing environment variables: ${missingVars.join(', ')}` },
        { status: 500 }
      );
    }
    
    const body: SearchFormData = await request.json();
    
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { 
      query, 
      location, 
      jobType, 
      experienceLevel, 
      salary, 
      technologies, 
      companySize,
      numResults = 25,
      findSimilar = true 
    } = body;

    console.log(`🚀 Enhanced search initiated for: "${query}"`);
    
    // Build user preferences
    const preferences = {
      location,
      jobType,
      experienceLevel,
      salary,
      technologies,
      companySize
    };

    // Create search record
    const search = await prisma.search.create({
      data: {
        query,
        location,
        jobType,
        experienceLevel,
        salary,
        technologies,
        companySize
      }
    });

    console.log(`📝 Search record created: ${search.id}`);

    // Execute enhanced search
    let enhancedJobs;
    try {
      enhancedJobs = await enhancedJobSearch(query, preferences, numResults);
      console.log(`✅ Enhanced search completed: ${enhancedJobs.length} jobs found`);
    } catch (searchError) {
      console.error('Enhanced search failed:', searchError);
      return NextResponse.json(
        { 
          error: 'Enhanced search failed', 
          details: searchError instanceof Error ? searchError.message : 'Unknown error',
          tip: 'Try a more specific search query or check your API keys'
        },
        { status: 500 }
      );
    }

    // Find similar jobs for top matches if requested
    let allJobs = enhancedJobs;
    if (findSimilar && enhancedJobs.length > 0) {
      console.log('🔗 Finding similar jobs to top matches...');
      
      const topJobs = enhancedJobs.filter(job => job.score >= 8);
      
      if (topJobs.length > 0) {
        try {
          const similarJobsPromises = topJobs.slice(0, 3).map(job => 
            findSimilarJobsEnhanced(job.url, preferences, 5)
          );
          
          const similarJobsResults = await Promise.allSettled(similarJobsPromises);
          const similarJobs = similarJobsResults
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);
          
          // Add similar jobs that aren't already in results
          for (const similarJob of similarJobs) {
            if (!allJobs.find(j => j.url === similarJob.url)) {
              allJobs.push(similarJob);
            }
          }
          
          console.log(`🔗 Added ${similarJobs.length} similar jobs`);
        } catch (similarError) {
          console.error('Similar jobs search failed:', similarError);
          // Continue without similar jobs
        }
      }
    }

    // Sort by score and limit results
    allJobs.sort((a, b) => b.score - a.score);
    const finalJobs = allJobs.slice(0, numResults);

    // Save jobs to database with enhanced fields
    const savedJobs = await Promise.all(
      finalJobs.map(job => 
        prisma.job.create({
          data: {
            title: job.title,
            url: job.url,
            company: job.company,
            location: job.location,
            salary: job.salary || 'Not specified',
            experienceLevel: job.experienceLevel || 'Not specified',
            jobType: job.jobType || 'Not specified',
            skills: job.skills || '',
            content: job.content,
            score: Math.round(job.score),
            searchId: search.id
          }
        })
      )
    );

    // Generate search insights
    const insights = generateSearchInsights(finalJobs, preferences);

    console.log(`💾 Saved ${savedJobs.length} jobs to database`);

    return NextResponse.json({
      searchId: search.id,
      jobs: savedJobs,
      totalFound: savedJobs.length,
      insights,
      searchMetrics: {
        averageScore: Number((finalJobs.reduce((acc, j) => acc + j.score, 0) / finalJobs.length).toFixed(1)),
        perfectMatches: finalJobs.filter(j => j.score >= 9).length,
        greatMatches: finalJobs.filter(j => j.score >= 7 && j.score < 9).length,
        remoteJobs: finalJobs.filter(j => 
          j.location?.toLowerCase().includes('remote') || 
          j.remotePolicy?.toLowerCase().includes('remote')
        ).length,
        companiesFound: new Set(finalJobs.map(j => j.company)).size
      }
    });

  } catch (error) {
    console.error('Enhanced search error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'API Configuration Error',
          message: 'Please check your API keys in environment variables',
          tip: 'Ensure EXA_API_KEY and OPENAI_API_KEY are properly set'
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please wait a moment and try again.',
          tip: 'Try searching with fewer results or wait 60 seconds'
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Enhanced Search Failed',
        message: errorMessage,
        tip: 'Try a simpler search query or contact support if the issue persists'
      },
      { status: 500 }
    );
  }
}

// Generate insights about the search results
function generateSearchInsights(jobs: any[], preferences: any) {
  const insights = {
    topCompanies: getTopCompanies(jobs),
    salaryRange: getSalaryInsights(jobs),
    locationDistribution: getLocationDistribution(jobs),
    skillsTrending: getTopSkills(jobs),
    experienceLevels: getExperienceLevelDistribution(jobs),
    remoteOpportunities: getRemoteInsights(jobs),
    recommendations: generateRecommendations(jobs, preferences)
  };

  return insights;
}

function getTopCompanies(jobs: any[]) {
  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(companyCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([company, count]) => ({ company, jobCount: count }));
}

function getSalaryInsights(jobs: any[]) {
  const salaries = jobs
    .map(job => job.salary)
    .filter(salary => salary && salary !== 'Not specified')
    .map(salary => {
      const numbers = salary.match(/\d+/g);
      return numbers ? parseInt(numbers[0]) : null;
    })
    .filter((num): num is number => num !== null && num > 1000);

  if (salaries.length === 0) return null;

  return {
    average: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
    min: Math.min(...salaries),
    max: Math.max(...salaries),
    jobsWithSalary: salaries.length,
    totalJobs: jobs.length
  };
}

function getLocationDistribution(jobs: any[]) {
  const locationCounts = jobs.reduce((acc, job) => {
    const location = job.location || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(locationCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 8)
    .map(([location, count]) => ({ location, count }));
}

function getTopSkills(jobs: any[]) {
  const allSkills = jobs
    .map(job => job.skills)
    .filter(skills => skills)
    .flatMap(skills => skills.split(',').map((s: string) => s.trim().toLowerCase()))
    .filter(skill => skill.length > 1);

  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(skillCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));
}

function getExperienceLevelDistribution(jobs: any[]) {
  const experienceCounts = jobs.reduce((acc, job) => {
    const level = job.experienceLevel || 'Not specified';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(experienceCounts)
    .map(([level, count]) => ({ level, count }));
}

function getRemoteInsights(jobs: any[]) {
  const remoteJobs = jobs.filter(job => 
    job.location?.toLowerCase().includes('remote') ||
    job.remotePolicy?.toLowerCase().includes('remote') ||
    job.content?.toLowerCase().includes('remote work')
  );

  const hybridJobs = jobs.filter(job => 
    job.location?.toLowerCase().includes('hybrid') ||
    job.remotePolicy?.toLowerCase().includes('hybrid')
  );

  return {
    fullyRemote: remoteJobs.length,
    hybrid: hybridJobs.length,
    onSite: jobs.length - remoteJobs.length - hybridJobs.length,
    remotePercentage: Math.round((remoteJobs.length / jobs.length) * 100)
  };
}

function generateRecommendations(jobs: any[], preferences: any) {
  const recommendations = [];

  // Score-based recommendations
  const avgScore = jobs.reduce((acc, j) => acc + j.score, 0) / jobs.length;
  if (avgScore < 6) {
    recommendations.push({
      type: 'query',
      message: 'Consider broadening your search terms for more relevant results'
    });
  }

  // Location recommendations
  if (preferences.location && preferences.location !== 'Remote') {
    const remoteJobs = jobs.filter(j => j.location?.toLowerCase().includes('remote'));
    if (remoteJobs.length > jobs.length * 0.3) {
      recommendations.push({
        type: 'location',
        message: 'Many remote opportunities available - consider adding "Remote" to your location preferences'
      });
    }
  }

  // Salary recommendations
  const jobsWithSalary = jobs.filter(j => j.salary && j.salary !== 'Not specified');
  if (jobsWithSalary.length < jobs.length * 0.5) {
    recommendations.push({
      type: 'salary',
      message: 'Many jobs don\'t list salary - consider reaching out directly or checking company websites'
    });
  }

  return recommendations;
}