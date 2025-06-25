'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { JobCard } from '@/components/JobCard';
import { Job, SearchFormData } from '@/types';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (data: SearchFormData) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      setJobs(result.jobs);
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      // Update the local state to reflect the saved status
      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, savedJob: { id: 'temp', status: 'interested' } as any }
          : job
      ));
    } catch (error) {
      console.error('Save job error:', error);
      alert('Failed to save job. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search for Jobs</h1>
        <p className="text-gray-600">
          Use our AI-powered search to find the perfect job matches
        </p>
      </div>

      <div className="mb-8">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Searching and analyzing jobs...</span>
        </div>
      )}

      {!isLoading && hasSearched && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {jobs.length} Jobs Found
            </h2>
            {jobs.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-green-600">
                  {jobs.filter(j => j.score >= 9).length} Perfect Matches
                </span>
                {' • '}
                <span className="font-medium text-blue-600">
                  {jobs.filter(j => j.score >= 7 && j.score < 9).length} Good Matches
                </span>
                {' • '}
                Average Score: {(jobs.reduce((acc, j) => acc + j.score, 0) / jobs.length).toFixed(1)}/10
              </div>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No jobs found matching your criteria. Try adjusting your search filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  savedJob={job.savedJob}
                  onSave={handleSaveJob}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}