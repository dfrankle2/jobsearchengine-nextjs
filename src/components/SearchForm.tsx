'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchFormData } from '@/types';
import { Search, Loader2 } from 'lucide-react';

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

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [expandedFilters, setExpandedFilters] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      numResults: 20,
      findSimilar: true
    }
  });

  const onSubmit = async (data: SearchFormData) => {
    await onSearch(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="query">What job are you looking for?</Label>
        <div className="flex gap-2">
          <Input
            id="query"
            placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
            {...register('query')}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>
        {errors.query && (
          <p className="text-sm text-red-500">{errors.query.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpandedFilters(!expandedFilters)}
          className="w-full"
        >
          {expandedFilters ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {expandedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, Remote, New York"
                {...register('location')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select onValueChange={(value) => setValue('jobType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select onValueChange={(value) => setValue('experienceLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry-level">Entry-level</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Minimum Salary</Label>
              <Input
                id="salary"
                placeholder="e.g., $80,000 or 80k"
                {...register('salary')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technologies">Technologies/Skills</Label>
              <Input
                id="technologies"
                placeholder="e.g., React, Python, AWS"
                {...register('technologies')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select onValueChange={(value) => setValue('companySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Startup">Startup (1-50)</SelectItem>
                  <SelectItem value="Small">Small (51-200)</SelectItem>
                  <SelectItem value="Medium">Medium (201-1000)</SelectItem>
                  <SelectItem value="Large">Large (1000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="findSimilar"
                  checked={watch('findSimilar')}
                  onCheckedChange={(checked) => setValue('findSimilar', checked as boolean)}
                />
                <Label htmlFor="findSimilar" className="text-sm font-normal">
                  Find similar jobs to top matches
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}