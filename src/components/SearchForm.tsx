'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SearchFormData } from '@/types';
import { 
  Search, 
  Loader2, 
  SlidersHorizontal, 
  TrendingUp,
  Sparkles,
  MapPin,
  Briefcase,
  Code2,
  DollarSign
} from 'lucide-react';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  location: z.string().optional(),
  jobType: z.string().optional(),
  experienceLevel: z.string().optional(),
  salary: z.string().optional(),
  technologies: z.string().optional(),
  companySize: z.string().optional(),
  numResults: z.number().min(1).max(50).optional(),
  findSimilar: z.boolean().optional()
});

interface SearchFormProps {
  onSearch: (data: SearchFormData) => Promise<void>;
  isLoading?: boolean;
}

const popularSearches = [
  { icon: Code2, text: 'Software Engineer', query: 'Software Engineer' },
  { icon: TrendingUp, text: 'Product Manager', query: 'Product Manager' },
  { icon: Sparkles, text: 'Data Scientist', query: 'Data Scientist Machine Learning' },
  { icon: DollarSign, text: 'Finance Remote', query: 'Finance Analyst remote' },
];

const popularLocations = ['Remote', 'San Francisco', 'New York', 'Austin', 'Seattle', 'London'];

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      numResults: 25,
      findSimilar: true
    }
  });

  // Watch for filter changes to update active count
  const watchedFields = watch(['location', 'jobType', 'experienceLevel', 'salary', 'technologies', 'companySize']);
  
  useEffect(() => {
    const count = watchedFields.filter(field => field && field !== '').length;
    setActiveFilters(count);
  }, [watchedFields]);

  const onSubmit = async (data: SearchFormData) => {
    await onSearch(data);
  };

  const handlePopularSearch = (query: string) => {
    setValue('query', query);
    handleSubmit(onSubmit)();
  };

  const handleLocationClick = (location: string) => {
    setValue('location', location);
    if (!expandedFilters) setExpandedFilters(true);
  };

  const clearFilters = () => {
    setValue('location', '');
    setValue('jobType', '');
    setValue('experienceLevel', '');
    setValue('salary', '');
    setValue('technologies', '');
    setValue('companySize', '');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="query" className="text-lg font-semibold">
          What's your dream job?
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="query"
              placeholder="Job title, skills, or company"
              {...register('query')}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button type="submit" disabled={isLoading} size="lg" className="px-8">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2">Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span className="ml-2">Search Jobs</span>
              </>
            )}
          </Button>
        </div>
        {errors.query && (
          <p className="text-sm text-destructive">{errors.query.message}</p>
        )}
      </div>

      {/* Popular Searches */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground font-medium">Popular searches</p>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((search, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePopularSearch(search.query)}
              className="gap-2"
            >
              <search.icon className="h-3 w-3" />
              {search.text}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Location Filters */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground font-medium">Popular locations</p>
        <div className="flex flex-wrap gap-2">
          {popularLocations.map((location) => (
            <Badge
              key={location}
              variant={watch('location') === location ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => handleLocationClick(location)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {location}
            </Badge>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpandedFilters(!expandedFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {expandedFilters ? 'Hide' : 'Show'} Filters
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters}
              </Badge>
            )}
          </Button>
          {activeFilters > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}
        </div>

        {expandedFilters && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="City, state, or 'Remote'"
                  {...register('location')}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType" className="text-sm font-medium">
                  Job Type
                </Label>
                <Select 
                  value={watch('jobType') || ''} 
                  onValueChange={(value) => setValue('jobType', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel" className="text-sm font-medium">
                  Experience Level
                </Label>
                <Select 
                  value={watch('experienceLevel') || ''} 
                  onValueChange={(value) => setValue('experienceLevel', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any level</SelectItem>
                    <SelectItem value="Entry-level">Entry-level (0-2 years)</SelectItem>
                    <SelectItem value="Mid-level">Mid-level (3-5 years)</SelectItem>
                    <SelectItem value="Senior">Senior (6-10 years)</SelectItem>
                    <SelectItem value="Lead">Lead (10+ years)</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary" className="text-sm font-medium">
                  Minimum Salary
                </Label>
                <Input
                  id="salary"
                  placeholder="e.g., $80,000 or 80k"
                  {...register('salary')}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technologies" className="text-sm font-medium">
                  Technologies/Skills
                </Label>
                <Input
                  id="technologies"
                  placeholder="e.g., React, Python, AWS"
                  {...register('technologies')}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-sm font-medium">
                  Company Size
                </Label>
                <Select 
                  value={watch('companySize') || ''} 
                  onValueChange={(value) => setValue('companySize', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Any size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any size</SelectItem>
                    <SelectItem value="Startup">Startup (1-50)</SelectItem>
                    <SelectItem value="Small">Small (51-200)</SelectItem>
                    <SelectItem value="Medium">Medium (201-1000)</SelectItem>
                    <SelectItem value="Large">Large (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="findSimilar"
                  checked={watch('findSimilar')}
                  onCheckedChange={(checked) => setValue('findSimilar', checked as boolean)}
                />
                <Label htmlFor="findSimilar" className="text-sm font-normal cursor-pointer">
                  Find similar jobs to top matches
                </Label>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing up to {watch('numResults') || 25} results
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}