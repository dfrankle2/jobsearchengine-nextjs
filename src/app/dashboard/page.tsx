'use client';

import { useEffect, useState } from 'react';
import { SavedJob, Search } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobCard } from '@/components/JobCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Briefcase, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [recentSearches, setRecentSearches] = useState<Search[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch saved jobs
      const savedJobsResponse = await fetch('/api/saved-jobs');
      if (savedJobsResponse.ok) {
        const savedJobsData = await savedJobsResponse.json();
        setSavedJobs(savedJobsData);
      }

      // Fetch recent searches
      const searchesResponse = await fetch('/api/jobs?limit=5');
      if (searchesResponse.ok) {
        const searchesData = await searchesResponse.json();
        // Group by search ID to get unique searches
        const uniqueSearches = searchesData.reduce((acc: any[], job: any) => {
          if (!acc.find(s => s.id === job.searchId)) {
            acc.push({
              id: job.searchId,
              query: job.search?.query || 'Unknown search',
              createdAt: job.createdAt,
              jobCount: 1
            });
          } else {
            const search = acc.find(s => s.id === job.searchId);
            search.jobCount++;
          }
          return acc;
        }, []);
        setRecentSearches(uniqueSearches.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (savedJobId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: savedJobId, status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setSavedJobs(savedJobs.map(sj => 
          sj.id === savedJobId ? { ...sj, status: newStatus as any } : sj
        ));
      }
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleRemoveSavedJob = async (savedJobId: string) => {
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: savedJobId }),
      });

      if (response.ok) {
        setSavedJobs(savedJobs.filter(sj => sj.id !== savedJobId));
      }
    } catch (error) {
      console.error('Failed to remove saved job:', error);
    }
  };

  const filteredJobs = statusFilter === 'all' 
    ? savedJobs 
    : savedJobs.filter(sj => sj.status === statusFilter);

  const stats = {
    total: savedJobs.length,
    interested: savedJobs.filter(j => j.status === 'interested').length,
    applied: savedJobs.filter(j => j.status === 'applied').length,
    interviewing: savedJobs.filter(j => j.status === 'interviewing').length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Job Search Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interested</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interested}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewing}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="saved" className="space-y-4">
        <TabsList>
          <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
          <TabsTrigger value="recent">Recent Searches</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Jobs</h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No saved jobs yet. Start searching to save jobs!</p>
                <Button asChild className="mt-4">
                  <a href="/search">Start Searching</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((savedJob) => (
                <div key={savedJob.id} className="relative">
                  <JobCard
                    job={savedJob.job}
                    savedJob={savedJob}
                    onRemove={handleRemoveSavedJob}
                  />
                  <div className="mt-2">
                    <Select
                      value={savedJob.status}
                      onValueChange={(value) => handleUpdateStatus(savedJob.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interviewing">Interviewing</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
          {recentSearches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No recent searches. Start searching for jobs!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentSearches.map((search) => (
                <Card key={search.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{search.query}</CardTitle>
                    <CardDescription>
                      {new Date(search.createdAt).toLocaleDateString()} • {search.jobCount} jobs found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/search?query=${encodeURIComponent(search.query)}`}>
                        Search Again
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}