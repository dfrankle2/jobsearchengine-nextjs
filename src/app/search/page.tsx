'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import { EnhancedSearchResults } from '@/components/EnhancedSearchResults';
import { JobCard } from '@/components/JobCard';
import { Job, SearchFormData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  AlertCircle,
  Search,
  Clock,
  RefreshCw
} from 'lucide-react';

interface SearchMetrics {
  averageScore: number;
  perfectMatches: number;
  greatMatches: number;
  remoteJobs: number;
  companiesFound: number;
}

interface SearchInsights {
  topCompanies: Array<{ company: string; jobCount: number }>;
  salaryRange: {
    average: number;
    min: number;
    max: number;
    jobsWithSalary: number;
    totalJobs: number;
  } | null;
  locationDistribution: Array<{ location: string; count: number }>;
  skillsTrending: Array<{ skill: string; count: number }>;
  experienceLevels: Array<{ level: string; count: number }>;
  remoteOpportunities: {
    fullyRemote: number;
    hybrid: number;
    onSite: number;
    remotePercentage: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
  }>;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [insights, setInsights] = useState<SearchInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'standard' | 'enhanced'>('enhanced');

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
    setCurrentQuery(data.query);
    setError(null);
    
    try {
      // Use enhanced search by default, fallback to standard if needed
      const endpoint = searchMode === 'enhanced' ? '/api/search/enhanced' : '/api/search';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Search failed');
      }
      
      setJobs(result.jobs);
      
      // Enhanced search returns additional data
      if (result.insights && result.searchMetrics) {
        setMetrics(result.searchMetrics);
        setInsights(result.insights);
      } else {
        // Fallback for standard search
        setMetrics({
          averageScore: Number((result.jobs.reduce((acc: number, j: Job) => acc + j.score, 0) / result.jobs.length).toFixed(1)) || 0,
          perfectMatches: result.jobs.filter((j: Job) => j.score >= 9).length,
          greatMatches: result.jobs.filter((j: Job) => j.score >= 7 && j.score < 9).length,
          remoteJobs: result.jobs.filter((j: Job) => 
            j.location?.toLowerCase().includes('remote')
          ).length,
          companiesFound: new Set(result.jobs.map((j: Job) => j.company)).size
        });
        setInsights(null);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setJobs([]);
      setMetrics(null);
      setInsights(null);
      
      // If enhanced search fails, try standard search as fallback
      if (searchMode === 'enhanced' && !(error instanceof Error && error.message?.includes('rate limit'))) {
        console.log('Enhanced search failed, falling back to standard search...');
        setSearchMode('standard');
        setTimeout(() => handleSearch(data), 100);
        return;
      }
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

  const retryWithStandardSearch = () => {
    setSearchMode('standard');
    setError(null);
    if (currentQuery) {
      handleSearch({ query: currentQuery });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              {searchMode === 'enhanced' ? (
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Enhanced AI Search
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  Standard Search
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {searchMode === 'enhanced' ? 'AI-Powered Job Intelligence' : 'Job Search'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {searchMode === 'enhanced' 
                ? 'Multi-strategy search across 50+ job boards with AI analysis and market insights'
                : 'Search millions of jobs with AI-powered matching and scoring'
              }
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
              {searchMode === 'enhanced' 
                ? 'Executing multi-strategy search and analyzing job market...'
                : 'Searching across job boards and analyzing matches...'
              }
            </p>
            <div className="mt-4 space-y-2 text-center">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {searchMode === 'enhanced' ? '15-20 seconds' : '10-15 seconds'}
                </span>
              </div>
              {searchMode === 'enhanced' && (
                <div className="text-xs text-gray-500 max-w-md">
                  Searching job boards, company career pages, and using AI to extract detailed insights...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="p-8 text-center bg-red-50 border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Search Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            {searchMode === 'enhanced' && (
              <div className="space-y-2">
                <p className="text-sm text-red-600">
                  The enhanced search encountered an issue. You can try the standard search instead.
                </p>
                <Button 
                  onClick={retryWithStandardSearch}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Standard Search
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Results */}
        {!isLoading && hasSearched && !error && metrics && (
          searchMode === 'enhanced' && insights ? (
            <EnhancedSearchResults
              jobs={jobs}
              metrics={metrics}
              insights={insights}
              onSaveJob={handleSaveJob}
              query={currentQuery}
            />
          ) : (
            // Fallback to standard results display
            <div className="space-y-6">
              {/* Stats Bar */}
              {jobs.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        {jobs.length} Jobs Found
                      </h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {metrics.perfectMatches > 0 && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                          <Target className="w-3 h-3 mr-1" />
                          {metrics.perfectMatches} Perfect Match{metrics.perfectMatches > 1 ? 'es' : ''}
                        </Badge>
                      )}
                      {metrics.greatMatches > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {metrics.greatMatches} Good Match{metrics.greatMatches > 1 ? 'es' : ''}
                        </Badge>
                      )}
                      <Badge variant="outline" className="px-3 py-1">
                        Avg Score: {metrics.averageScore}/10
                      </Badge>
                    </div>
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
          )
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