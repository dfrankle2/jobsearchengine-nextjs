'use client';

import { Job, SavedJob } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatSalary, getScoreColor, truncateText } from '@/lib/utils';
import { 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  GraduationCap, 
  Calendar,
  Building2,
  Users,
  Clock
} from 'lucide-react';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  savedJob?: SavedJob | null;
  onSave?: (jobId: string) => void;
  onRemove?: (savedJobId: string) => void;
}

export function JobCard({ job, savedJob, onSave, onRemove }: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSaveToggle = async () => {
    setIsSaving(true);
    try {
      if (savedJob && onRemove) {
        await onRemove(savedJob.id);
      } else if (onSave) {
        await onSave(job.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Determine badge variant based on score
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'outline';
  };

  // Parse posting date from content if available
  const getPostingDate = () => {
    const dateMatch = job.content.match(/posted\s+(\d+)\s+(day|week|month|hour)/i);
    if (dateMatch) {
      return `Posted ${dateMatch[1]} ${dateMatch[2]}${parseInt(dateMatch[1]) > 1 ? 's' : ''} ago`;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-xl font-semibold line-clamp-2 text-foreground">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <CardDescription className="text-base font-medium">
                {job.company}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getScoreBadgeVariant(job.score)} className="font-bold">
              {job.score}/10 Match
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveToggle}
              disabled={isSaving}
              className={savedJob ? 'text-primary' : 'text-muted-foreground'}
            >
              {savedJob ? (
                <BookmarkCheck className="h-5 w-5 fill-current" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          {job.location && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </Badge>
          )}
          {job.jobType && (
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="h-3 w-3" />
              {job.jobType}
            </Badge>
          )}
          {job.experienceLevel && (
            <Badge variant="secondary" className="gap-1">
              <GraduationCap className="h-3 w-3" />
              {job.experienceLevel}
            </Badge>
          )}
          {job.salary && job.salary !== 'Not specified' && (
            <Badge variant="secondary" className="gap-1 text-green-700 dark:text-green-400">
              <DollarSign className="h-3 w-3" />
              {formatSalary(job.salary)}
            </Badge>
          )}
        </div>

        {job.skills && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Key Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {job.skills.split(',').slice(0, 6).map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-3'}`}>
            {truncateText(job.content, isExpanded ? 1000 : 200)}
          </p>
          {job.content.length > 200 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-0 h-auto mt-1 text-xs"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>

        {getPostingDate() && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getPostingDate()}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button variant="default" asChild className="flex-1">
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            View Full Job <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        {job.url.includes('linkedin.com') && (
          <Button variant="outline" size="sm" asChild>
            <a 
              href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(job.company)}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Users className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}