import { NextRequest, NextResponse } from 'next/server';
import { searchJobsByQuery, enrichJobData, findSimilarJobs } from '@/lib/job-search';
import { prisma } from '@/lib/database';
import { SearchFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Check required environment variables
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
    
    // Validate input
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
      numResults = 20,
      findSimilar = true 
    } = body;

    // Build optimized search query
    let searchQuery = query;
    
    // Add location context if provided
    if (location) {
      searchQuery += ` in ${location}`;
    }
    
    // Add job type if specified
    if (jobType) {
      searchQuery += ` ${jobType}`;
    }
    
    // Add experience level if specified
    if (experienceLevel) {
      searchQuery += ` ${experienceLevel}`;
    }
    
    // Add technologies/skills if specified
    if (technologies) {
      searchQuery += ` ${technologies}`;
    }
    
    // Search for jobs with error handling
    console.log(`🔍 Searching for: ${searchQuery}`);
    let jobs;
    try {
      jobs = await searchJobsByQuery(searchQuery, numResults);
      console.log(`Found ${jobs.length} initial job postings`);
    } catch (searchError) {
      console.error('Job search failed:', searchError);
      return NextResponse.json(
        { 
          error: 'Failed to search jobs', 
          details: searchError instanceof Error ? searchError.message : 'Unknown error',
          tip: 'Try a more specific search query or check your API keys'
        },
        { status: 500 }
      );
    }

    // Create search record with error handling
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to save search', 
          details: 'Database connection error',
          tip: 'Please check your database connection'
        },
        { status: 500 }
      );
    }

    // Enrich job data with AI
    console.log('📊 Analyzing job postings...');
    const enrichedJobs = [];
    const userPreferences = { location, jobType, experienceLevel, salary, technologies, companySize };
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchPromises = batch.map(async (job) => {
        try {
          return await enrichJobData(job, userPreferences);
        } catch (error) {
          console.error('Error processing job:', error);
          // Return job with default score on error
          return { ...job, score: 5, company: 'Unknown', location: 'Unknown' };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          enrichedJobs.push(result.value);
        }
      }
    }

    // Find similar jobs to top matches if requested
    let allJobs = enrichedJobs;
    if (findSimilar && enrichedJobs.length > 0) {
      console.log('🔗 Finding similar jobs to top matches...');
      const topJobs = enrichedJobs.filter(job => job.score >= 8);
      
      if (topJobs.length > 0) {
        const similarJobsPromises = topJobs.slice(0, 3).map(job => 
          findSimilarJobs(job.url, 3)
        );
        
        const similarJobsResults = await Promise.all(similarJobsPromises);
        const similarJobs = similarJobsResults.flat();
        
        // Enrich similar jobs
        for (const job of similarJobs) {
          try {
            const enrichedJob = await enrichJobData(job, userPreferences);
            if (!allJobs.find(j => j.url === enrichedJob.url)) {
              allJobs.push(enrichedJob);
            }
          } catch (error) {
            console.error('Error processing similar job:', error);
          }
        }
      }
    }

    // Sort by score
    allJobs.sort((a, b) => b.score - a.score);

    // Save jobs to database
    const savedJobs = await Promise.all(
      allJobs.map(job => 
        prisma.job.create({
          data: {
            title: job.title,
            url: job.url,
            company: job.company,
            location: job.location,
            salary: job.salary,
            experienceLevel: job.experienceLevel,
            jobType: job.jobType,
            skills: job.skills,
            content: job.content,
            score: job.score,
            searchId: search.id
          }
        })
      )
    );

    return NextResponse.json({
      searchId: search.id,
      jobs: savedJobs,
      totalFound: savedJobs.length
    });

  } catch (error) {
    console.error('Search error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
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
        error: 'Search Failed',
        message: errorMessage,
        tip: 'Try a simpler search query or contact support if the issue persists'
      },
      { status: 500 }
    );
  }
}