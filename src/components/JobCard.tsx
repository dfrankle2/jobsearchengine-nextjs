'use client';

import { Job, SavedJob } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatSalary, getScoreColor, truncateText } from '@/lib/utils';
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Briefcase, DollarSign, GraduationCap } from 'lucide-react';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  savedJob?: SavedJob | null;
  onSave?: (jobId: string) => void;
  onRemove?: (savedJobId: string) => void;
}

export function JobCard({ job, savedJob, onSave, onRemove }: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl line-clamp-2">{job.title}</CardTitle>
            <CardDescription className="text-base mt-1">{job.company}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(job.score)}`}>
              {job.score}/10
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveToggle}
              disabled={isSaving}
            >
              {savedJob ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          )}
          {job.jobType && (
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>{job.jobType}</span>
            </div>
          )}
          {job.salary && job.salary !== 'Not specified' && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatSalary(job.salary)}</span>
            </div>
          )}
          {job.experienceLevel && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>{job.experienceLevel}</span>
            </div>
          )}
        </div>

        {job.skills && (
          <div className="flex flex-wrap gap-2">
            {job.skills.split(',').slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-3">
          {truncateText(job.content, 200)}
        </p>
      </CardContent>

      <CardFooter>
        <Button variant="outline" asChild className="w-full">
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            View Job <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}