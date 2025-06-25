'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import { EnhancedSearchResults } from '@/components/EnhancedSearchResults';
import { JobCard } from '@/components/JobCard';
import { Job, SearchFormData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  RefreshCw,
  FileText,
  MapPin,
  Building2
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
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              {searchMode === 'enhanced' ? (
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhanced AI Search
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Standard Search
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {searchMode === 'enhanced' ? 'AI-Powered Job Intelligence' : 'Smart Job Search'}
            </h1>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {searchMode === 'enhanced' 
                ? 'Multi-strategy search across 50+ job boards with AI analysis and market insights'
                : 'Search millions of jobs with AI-powered matching and scoring'
              }
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-blue-200 rounded-full animate-ping" />
              </div>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
            </div>
            
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchMode === 'enhanced' 
                  ? 'Executing multi-strategy search...'
                  : 'Searching job databases...'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchMode === 'enhanced' 
                  ? 'Analyzing job boards, company sites, and generating AI insights. This may take 30-60 seconds.'
                  : 'Finding and analyzing job matches. This usually takes 10-20 seconds.'
                }
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500 justify-center">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {searchMode === 'enhanced' ? '30-60 sec' : '10-20 sec'}
                </span>
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  AI Analysis
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <CardTitle className="text-lg text-red-900">Search Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-700">{error}</p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => handleSearch({ query: currentQuery })}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                {searchMode === 'enhanced' && (
                  <Button 
                    onClick={retryWithStandardSearch}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Use Standard Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {!isLoading && hasSearched && !error && metrics && (
          <div className="space-y-8">
            {searchMode === 'enhanced' && insights ? (
              <EnhancedSearchResults
                jobs={jobs}
                metrics={metrics}
                insights={insights}
                onSaveJob={handleSaveJob}
                query={currentQuery}
              />
            ) : (
              /* Standard Results Layout */
              <div className="space-y-8">
                {/* Results Header */}
                {jobs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-2xl">
                              {jobs.length} Job{jobs.length !== 1 ? 's' : ''} Found
                            </CardTitle>
                            <p className="text-gray-600 mt-1">
                              Average match score: {metrics.averageScore}/10
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
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
                          {metrics.remoteJobs > 0 && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {metrics.remoteJobs} Remote
                            </Badge>
                          )}
                          {metrics.companiesFound > 0 && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                              <Building2 className="w-3 h-3 mr-1" />
                              {metrics.companiesFound} Companies
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )}

                {/* No Results */}
                {jobs.length === 0 && (
                  <Card className="p-16 text-center bg-gray-50 border-gray-200">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No jobs found
                      </h3>
                      <p className="text-gray-600 mb-6">
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
        )}

        {/* Welcome State - When no search has been performed */}
        {!isLoading && !hasSearched && !error && (
          <div className="text-center py-24">
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Search className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your Job Search
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Enter a job title, keywords, or company name above to begin your search. 
                Our AI will analyze thousands of opportunities to find your perfect match.
              </p>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <Card className="p-6">
                  <FileText className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-2">Smart Matching</h3>
                  <p className="text-sm text-gray-600">Get personalized job matches scored 1-10 based on your skills</p>
                </Card>
                <Card className="p-6">
                  <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-semibold mb-2">Market Insights</h3>
                  <p className="text-sm text-gray-600">See salary ranges, top companies, and trending skills</p>
                </Card>
                <Card className="p-6">
                  <Target className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold mb-2">Real-time Search</h3>
                  <p className="text-sm text-gray-600">Search across 50+ job boards for the latest opportunities</p>
                </Card>
              </div>
            </div>
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