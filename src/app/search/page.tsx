'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import { JobCard } from '@/components/JobCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Job, SearchFormData } from '@/types';
import { 
  Loader2, 
  Filter, 
  TrendingUp, 
  Clock,
  Target,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Search
} from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle URL search params
  useEffect(() => {
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    
    if (query || location) {
      const searchData: SearchFormData = {
        query: query || '',
        location: location || '',
      };
      handleSearch(searchData);
    }
  }, [searchParams]);

  const handleSearch = async (data: SearchFormData) => {
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      setJobs(result.jobs);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to search jobs');
      setJobs([]);
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

  const getJobStats = () => {
    if (jobs.length === 0) return null;
    
    const perfectMatches = jobs.filter(j => j.score >= 9).length;
    const goodMatches = jobs.filter(j => j.score >= 7 && j.score < 9).length;
    const avgScore = jobs.reduce((acc, j) => acc + j.score, 0) / jobs.length;
    
    return { perfectMatches, goodMatches, avgScore };
  };

  const stats = getJobStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              AI-Powered Job Search
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search millions of jobs across 50+ job boards. Our AI analyzes and scores 
              each opportunity based on your preferences.
            </p>
          </div>

          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-blue-200 rounded-full animate-ping" />
              </div>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
            </div>
            <p className="mt-6 text-lg text-gray-600 animate-pulse">
              Searching across job boards and analyzing matches...
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                This usually takes 10-15 seconds
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="p-8 text-center bg-red-50 border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Search Error</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">Please try again or adjust your search criteria.</p>
          </Card>
        )}

        {/* Results */}
        {!isLoading && hasSearched && !error && (
          <div>
            {/* Stats Bar */}
            {stats && jobs.length > 0 && (
              <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      {jobs.length} Jobs Found
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {stats.perfectMatches > 0 && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                        <Target className="w-3 h-3 mr-1" />
                        {stats.perfectMatches} Perfect Match{stats.perfectMatches > 1 ? 'es' : ''}
                      </Badge>
                    )}
                    {stats.goodMatches > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stats.goodMatches} Good Match{stats.goodMatches > 1 ? 'es' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="px-3 py-1">
                      Avg Score: {stats.avgScore.toFixed(1)}/10
                    </Badge>
                  </div>
                </div>
                
                {/* Sort/Filter Options */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter Results
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">
                    Sorted by: <span className="font-medium">Best Match</span>
                  </span>
                </div>
              </div>
            )}

            {/* No Results */}
            {jobs.length === 0 && (
              <Card className="p-12 text-center bg-gray-50 border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any jobs matching your criteria. Try:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 text-left max-w-xs mx-auto">
                    <li>• Using different keywords</li>
                    <li>• Expanding your location preferences</li>
                    <li>• Adjusting your filters</li>
                    <li>• Removing some requirements</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Job Grid */}
            {jobs.length > 0 && (
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
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SearchPageContent />
    </Suspense>
  );
}