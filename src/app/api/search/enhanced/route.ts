import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobSearch, findSimilarJobsEnhanced } from '@/lib/enhanced-job-search-fixed';
import { prisma } from '@/lib/database';
import { SearchFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Enhanced search API called');
    
    // Validate environment variables
    const missingVars = [];
    if (!process.env.EXA_API_KEY) missingVars.push('EXA_API_KEY');
    if (!process.env.OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY');
    if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return NextResponse.json(
        { error: `Missing environment variables: ${missingVars.join(', ')}` },
        { status: 500 }
      );
    }
    
    const body: SearchFormData = await request.json();
    console.log('📝 Search request:', { query: body.query, location: body.location });
    
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
      numResults = 10, // Start smaller for testing
      findSimilar = false // Disable for initial testing
    } = body;

    // Build user preferences
    const preferences = {
      location,
      jobType,
      experienceLevel,
      salary,
      technologies,
      companySize
    };

    console.log('🔍 Starting enhanced job search...');

    // Execute enhanced search with detailed logging
    let enhancedJobs;
    try {
      enhancedJobs = await enhancedJobSearch(query, preferences, numResults);
      console.log(`✅ Enhanced search completed: ${enhancedJobs.length} jobs found`);
      
      if (enhancedJobs.length === 0) {
        console.log('❌ No jobs found in enhanced search');
      }
    } catch (searchError) {
      console.error('❌ Enhanced search failed:', searchError);
      return NextResponse.json(
        { 
          error: 'Enhanced search failed', 
          details: searchError instanceof Error ? searchError.message : 'Unknown error',
          tip: 'Check your EXA API key and try again with a simpler query'
        },
        { status: 500 }
      );
    }

    // Create search record
    let search;
    try {
      search = await prisma.search.create({
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
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Continue without saving to database for now
      search = { id: 'temp-id' };
    }

    // For now, skip similar jobs to simplify testing
    let allJobs = enhancedJobs;

    // Save jobs to database (with error handling)
    const savedJobs = [];
    for (const job of allJobs) {
      try {
        const savedJob = await prisma.job.create({
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
        });
        savedJobs.push(savedJob);
      } catch (saveError) {
        console.error('Error saving job:', saveError);
        // Add job without saving to database
        savedJobs.push({
          id: `temp-${Date.now()}-${Math.random()}`,
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
          searchId: search.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    console.log(`💾 Processed ${savedJobs.length} jobs`);

    // Generate simple insights
    const insights = generateSimpleInsights(savedJobs, preferences);

    return NextResponse.json({
      searchId: search.id,
      jobs: savedJobs,
      totalFound: savedJobs.length,
      insights,
      searchMetrics: {
        averageScore: savedJobs.length > 0 
          ? Number((savedJobs.reduce((acc, j) => acc + j.score, 0) / savedJobs.length).toFixed(1))
          : 0,
        perfectMatches: savedJobs.filter(j => j.score >= 9).length,
        greatMatches: savedJobs.filter(j => j.score >= 7 && j.score < 9).length,
        remoteJobs: savedJobs.filter(j => 
          j.location?.toLowerCase().includes('remote')
        ).length,
        companiesFound: new Set(savedJobs.map(j => j.company)).size
      }
    });

  } catch (error) {
    console.error('🔥 Unexpected error in enhanced search:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Search Failed',
        message: errorMessage,
        tip: 'Try using the standard search or check console logs for details'
      },
      { status: 500 }
    );
  }
}

// Simplified insights generation
function generateSimpleInsights(jobs: any[], preferences: any) {
  return {
    topCompanies: getTopCompanies(jobs),
    salaryRange: getSalaryInsights(jobs),
    locationDistribution: getLocationDistribution(jobs),
    skillsTrending: getTopSkills(jobs),
    experienceLevels: getExperienceLevelDistribution(jobs),
    remoteOpportunities: getRemoteInsights(jobs),
    recommendations: generateRecommendations(jobs, preferences)
  };
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
    job.location?.toLowerCase().includes('remote')
  );

  const hybridJobs = jobs.filter(job => 
    job.location?.toLowerCase().includes('hybrid')
  );

  return {
    fullyRemote: remoteJobs.length,
    hybrid: hybridJobs.length,
    onSite: jobs.length - remoteJobs.length - hybridJobs.length,
    remotePercentage: jobs.length > 0 
      ? Math.round((remoteJobs.length / jobs.length) * 100)
      : 0
  };
}

function generateRecommendations(jobs: any[], preferences: any) {
  const recommendations = [];

  // Score-based recommendations
  if (jobs.length > 0) {
    const avgScore = jobs.reduce((acc, j) => acc + j.score, 0) / jobs.length;
    if (avgScore < 6) {
      recommendations.push({
        type: 'query',
        message: 'Try broadening your search terms or removing some filters for more results'
      });
    }

    if (jobs.length < 5) {
      recommendations.push({
        type: 'results',
        message: 'Consider expanding your search criteria to find more opportunities'
      });
    }
  }

  // Location recommendations
  if (preferences.location && preferences.location !== 'Remote') {
    const remoteJobs = jobs.filter(j => j.location?.toLowerCase().includes('remote'));
    if (remoteJobs.length > jobs.length * 0.3) {
      recommendations.push({
        type: 'location',
        message: 'Many remote opportunities available - consider including remote positions'
      });
    }
  }

  return recommendations;
}