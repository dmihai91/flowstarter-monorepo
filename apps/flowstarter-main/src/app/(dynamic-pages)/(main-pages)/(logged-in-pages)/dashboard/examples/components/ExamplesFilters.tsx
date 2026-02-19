'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/lib/i18n';
import { Search, Star } from 'lucide-react';

interface ExamplesFiltersProps {
  categories: { value: string; label: string }[];
  industries: string[];
  searchQuery: string;
  selectedCategory: string;
  selectedIndustry: string;
  showFeatured: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onFeaturedToggle: () => void;
}

export function ExamplesFilters({
  categories,
  industries,
  searchQuery,
  selectedCategory,
  selectedIndustry,
  showFeatured,
  onSearchChange,
  onCategoryChange,
  onIndustryChange,
  onFeaturedToggle,
}: ExamplesFiltersProps) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Featured Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('examples.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Featured Toggle */}
        <Button
          variant={showFeatured ? 'default' : 'outline'}
          onClick={onFeaturedToggle}
          className="flex items-center gap-2 sm:w-auto"
        >
          <Star className={`h-4 w-4 ${showFeatured ? 'fill-current' : ''}`} />
          {t('examples.featured')}
        </Button>
      </div>

      {/* Category and Industry Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue
                placeholder={t('examples.categoryLabel') as string}
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industry Filter */}
        <div className="flex-1">
          <Select value={selectedIndustry} onValueChange={onIndustryChange}>
            <SelectTrigger>
              <SelectValue
                placeholder={t('examples.industryLabel') as string}
              />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
