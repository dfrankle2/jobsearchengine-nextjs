'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobCard } from '@/components/JobCard';
import { 
  BarChart3, 
  MapPin, 
  Building2, 
  DollarSign, 
  TrendingUp,
  Filter,
  SortDesc,
  Eye,
  Lightbulb,
  Target,
  Home,
  Users
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

interface EnhancedSearchResultsProps {
  jobs: Job[];
  metrics: SearchMetrics;
  insights: SearchInsights;
  onSaveJob?: (jobId: string) => void;
  query: string;
}

export function EnhancedSearchResults({ 
  jobs, 
  metrics, 
  insights, 
  onSaveJob,
  query 
}: EnhancedSearchResultsProps) {
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'salary'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'perfect' | 'great' | 'remote'>('all');

  useEffect(() => {
    let filtered = [...jobs];

    // Apply filters
    switch (filterBy) {
      case 'perfect':
        filtered = filtered.filter(job => job.score >= 9);
        break;
      case 'great':
        filtered = filtered.filter(job => job.score >= 7);
        break;
      case 'remote':
        filtered = filtered.filter(job => 
          job.location?.toLowerCase().includes('remote')
        );
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'score':
        filtered.sort((a, b) => b.score - a.score);
        break;
      case 'date':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'salary':
        filtered.sort((a, b) => {
          const aSalary = extractSalaryNumber(a.salary);
          const bSalary = extractSalaryNumber(b.salary);
          return bSalary - aSalary;
        });
        break;
    }

    setFilteredJobs(filtered);
  }, [jobs, sortBy, filterBy]);

  const extractSalaryNumber = (salary?: string | null): number => {
    if (!salary || salary === 'Not specified') return 0;
    const numbers = salary.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Search Results for "{query}"
          </CardTitle>
          <CardDescription>
            Found {jobs.length} relevant positions with an average match score of {metrics.averageScore}/10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.perfectMatches}</div>
              <div className="text-sm text-muted-foreground">Perfect Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.greatMatches}</div>
              <div className="text-sm text-muted-foreground">Great Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.remoteJobs}</div>
              <div className="text-sm text-muted-foreground">Remote Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.companiesFound}</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{jobs.length}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Job Listings ({filteredJobs.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Market Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {/* Filters and Sorting */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filterBy === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('all')}
              >
                All Jobs
              </Button>
              <Button
                variant={filterBy === 'perfect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('perfect')}
              >
                <Filter className="h-3 w-3 mr-1" />
                Perfect Matches
              </Button>
              <Button
                variant={filterBy === 'great' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('great')}
              >
                Great Matches
              </Button>
              <Button
                variant={filterBy === 'remote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('remote')}
              >
                <Home className="h-3 w-3 mr-1" />
                Remote Only
              </Button>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === 'score' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('score')}
              >
                <SortDesc className="h-3 w-3 mr-1" />
                Match Score
              </Button>
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
              >
                Recent
              </Button>
              <Button
                variant={sortBy === 'salary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('salary')}
              >
                Salary
              </Button>
            </div>
          </div>

          {/* Job Cards */}
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No jobs match your current filters. Try adjusting your filter criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilterBy('all')}
                  className="mt-2"
                >
                  Show All Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  savedJob={job.savedJob}
                  onSave={onSaveJob}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Companies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Top Hiring Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topCompanies.map((company, index) => (
                    <div key={company.company} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{company.company}</span>
                      </div>
                      <Badge>{company.jobCount} jobs</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Insights */}
            {insights.salaryRange && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Salary Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Salary:</span>
                      <span className="font-medium">${insights.salaryRange.average.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Range:</span>
                      <span className="font-medium">
                        ${insights.salaryRange.min.toLocaleString()} - ${insights.salaryRange.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jobs with Salary:</span>
                      <span className="font-medium">
                        {Math.round((insights.salaryRange.jobsWithSalary / insights.salaryRange.totalJobs) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.locationDistribution.map((loc) => (
                    <div key={loc.location} className="flex items-center justify-between">
                      <span className="text-sm">{loc.location}</span>
                      <Badge variant="secondary">{loc.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most In-Demand Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.skillsTrending.slice(0, 15).map((skill) => (
                    <Badge key={skill.skill} variant="outline" className="text-xs">
                      {skill.skill} ({skill.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Remote Work Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Remote Work Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {insights.remoteOpportunities.fullyRemote}
                    </div>
                    <div className="text-sm text-muted-foreground">Fully Remote</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {insights.remoteOpportunities.hybrid}
                    </div>
                    <div className="text-sm text-muted-foreground">Hybrid</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {insights.remoteOpportunities.onSite}
                    </div>
                    <div className="text-sm text-muted-foreground">On-site</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {insights.remoteOpportunities.remotePercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Remote-Friendly</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Tips to improve your job search based on current results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium capitalize">{rec.type} Recommendation</p>
                        <p className="text-sm text-muted-foreground mt-1">{rec.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {insights.recommendations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Great job! Your search results look excellent. Keep applying to your top matches!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Tips */}
          <Card>
            <CardHeader>
              <CardTitle>General Job Search Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Application Strategy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Focus on jobs with 8+ match scores first</li>
                    <li>• Tailor your resume to include relevant skills</li>
                    <li>• Apply within 24-48 hours of posting</li>
                    <li>• Follow up after 1-2 weeks</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Research Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check company reviews on Glassdoor</li>
                    <li>• Research company culture and values</li>
                    <li>• Connect with employees on LinkedIn</li>
                    <li>• Prepare company-specific questions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}