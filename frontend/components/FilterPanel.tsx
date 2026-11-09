'use client';

import { useState, type ReactNode } from 'react';
import { JobType } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Briefcase,
  Search,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  jobTypes: JobType[];
  search: string;
  location: string;
}

interface FilterPanelProps {
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const EMPTY_FILTERS: FilterOptions = {
  jobTypes: [],
  search: '',
  location: '',
};

type SectionKey = 'jobType' | 'search' | 'location';

interface AccordionSectionProps {
  id: SectionKey;
  label: string;
  icon: ReactNode;
  count?: number;
  isOpen: boolean;
  onToggle: (id: SectionKey) => void;
  children: ReactNode;
}

function AccordionSection({
  id,
  label,
  icon,
  count,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-3 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </span>
        <span className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0 rounded-full"
            >
              {count}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </span>
      </button>
      <div
        className={cn(
          'grid transition-all duration-200',
          isOpen
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 bg-muted/10 space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FilterPanel({
  onClose,
  onApplyFilters,
  initialFilters = EMPTY_FILTERS,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>(() => ({
    ...initialFilters,
    jobTypes: [...initialFilters.jobTypes],
  }));

  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(['jobType', 'search', 'location'])
  );

  const toggleSection = (id: SectionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleJobType = (type: JobType) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type],
    }));
  };

  const activeFilterCount =
    filters.jobTypes.length +
    (filters.search.trim() ? 1 : 0) +
    (filters.location.trim() ? 1 : 0);

  const handleApply = () => {
    onApplyFilters({
      ...filters,
      jobTypes: [...filters.jobTypes],
      search: filters.search.trim(),
      location: filters.location.trim(),
    });

    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      ...EMPTY_FILTERS,
      jobTypes: [],
    };

    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <Sheet
      open={true}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="
          z-[70]
          w-full
          sm:max-w-xs
          flex
          flex-col
          p-0
          overflow-hidden
          bg-background
          border-border
          text-foreground

          max-sm:!fixed
          max-sm:!inset-x-0
          max-sm:!inset-y-auto
          max-sm:!bottom-0
          max-sm:!right-auto
          max-sm:!w-full
          max-sm:!max-w-none
          max-sm:!h-[88dvh]
          max-sm:!max-h-[88dvh]
          max-sm:!translate-x-0
          max-sm:!translate-y-0
          max-sm:!rounded-t-2xl
          max-sm:!rounded-b-none
          max-sm:border-l-0
          max-sm:border-t
          max-sm:pb-[env(safe-area-inset-bottom)]
        "
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 pt-4 pb-4 border-b border-border/40 shrink-0 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="h-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0 rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </SheetTitle>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset all
              </button>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            Refine your job search with these filters.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <AccordionSection
            id="jobType"
            label="Job type"
            icon={<Briefcase className="h-4 w-4" />}
            count={filters.jobTypes.length}
            isOpen={openSections.has('jobType')}
            onToggle={toggleSection}
          >
            {JOB_TYPES.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-3 min-h-8">
                <Checkbox
                  id={`jt-${value}`}
                  checked={filters.jobTypes.includes(value)}
                  onCheckedChange={() => toggleJobType(value)}
                  className="h-4 w-4 rounded border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`jt-${value}`}
                  className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  {label}
                </Label>
              </div>
            ))}
          </AccordionSection>
          <AccordionSection
            id="search"
            label="Search"
            icon={<Search className="h-4 w-4" />}
            count={filters.search.trim() ? 1 : 0}
            isOpen={openSections.has('search')}
            onToggle={toggleSection}
          >
            <Input
              value={filters.search}
              onChange={event =>
                setFilters(prev => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
              placeholder="Job title, company, or keyword"
              aria-label="Search jobs"
              className="h-10 text-sm bg-background"
            />
          </AccordionSection>
          <AccordionSection
            id="location"
            label="Location"
            icon={<MapPin className="h-4 w-4" />}
            count={filters.location.trim() ? 1 : 0}
            isOpen={openSections.has('location')}
            onToggle={toggleSection}
          >
            <Input
              value={filters.location}
              onChange={event =>
                setFilters(prev => ({
                  ...prev,
                  location: event.target.value,
                }))
              }
              placeholder="Country, city, or region"
              aria-label="Filter by location"
              className="h-10 text-sm bg-background"
            />
          </AccordionSection>
        </div>

        {activeFilterCount > 0 && (
          <div className="px-5 py-3 border-t border-border/40 shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Active filters
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {filters.jobTypes.map(type => (
                <Badge
                  key={type}
                  variant="secondary"
                  onClick={() => toggleJobType(type)}
                  className="text-[11px] px-2 py-1 bg-muted/60 text-foreground border-0 cursor-pointer hover:bg-muted"
                >
                  {JOB_TYPES.find(item => item.value === type)?.label} ×
                </Badge>
              ))}
              {filters.search.trim() && (
                <Badge
                  variant="secondary"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, search: '' }))
                  }
                  className="text-[11px] px-2 py-1 bg-muted/60 text-foreground border-0 cursor-pointer hover:bg-muted"
                >
                  Search: {filters.search.trim()} ×
                </Badge>
              )}
              {filters.location.trim() && (
                <Badge
                  variant="secondary"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, location: '' }))
                  }
                  className="text-[11px] px-2 py-1 bg-muted/60 text-foreground border-0 cursor-pointer hover:bg-muted"
                >
                  Location: {filters.location.trim()} ×
                </Badge>
              )}
            </div>
          </div>
        )}

        <SheetFooter
          className="
            px-5
            py-4
            border-t
            border-border/40
            shrink-0
            flex-row
            gap-3
            bg-background
          "
        >
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 h-11 text-sm bg-transparent border-border/60 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 opacity-75">
                ({activeFilterCount})
              </span>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}