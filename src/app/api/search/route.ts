import { NextRequest, NextResponse } from 'next/server';
import { searchJobsByQuery, enrichJobData, findSimilarJobs } from '@/lib/job-search';
import { prisma } from '@/lib/database';
import { SearchFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SearchFormData = await request.json();
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

    // Search for jobs
    console.log(`🔍 Searching for: ${query}`);
    const jobs = await searchJobsByQuery(query, numResults);
    console.log(`Found ${jobs.length} initial job postings`);

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

    // Enrich job data with AI
    console.log('📊 Analyzing job postings...');
    const enrichedJobs = [];
    const userPreferences = { location, jobType, experienceLevel, salary, technologies, companySize };
    
    for (const job of jobs) {
      try {
        const enrichedJob = await enrichJobData(job, userPreferences);
        enrichedJobs.push(enrichedJob);
      } catch (error) {
        console.error('Error processing job:', error);
        continue;
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
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}