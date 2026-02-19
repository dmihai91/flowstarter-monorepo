'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    message: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.message.trim()) {
      toast.error(t('feedback.error.required'));
      return;
    }

    if (formData.message.trim().length < 10) {
      toast.error(t('feedback.error.tooShort'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      toast.success(t('feedback.success'));
      setFormData({ category: '', message: '', email: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error(t('feedback.error.submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">{t('feedback.title')}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t('feedback.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2.5">
            <Label htmlFor="category" className="text-sm font-medium">
              {t('feedback.category.label')}
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder={t('feedback.category.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  {t('feedback.category.bug')}
                </SelectItem>
                <SelectItem value="feature">
                  {t('feedback.category.feature')}
                </SelectItem>
                <SelectItem value="improvement">
                  {t('feedback.category.improvement')}
                </SelectItem>
                <SelectItem value="other">
                  {t('feedback.category.other')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="message" className="text-sm font-medium">
              {t('feedback.message.label')}
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder={t('feedback.message.placeholder')}
              className="min-h-[140px] resize-none"
              disabled={isSubmitting}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground pt-1">
              {formData.message.length}/5000 {t('feedback.message.characters')}
            </p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-medium">
              {t('feedback.email.label')}{' '}
              <span className="text-muted-foreground font-normal text-xs">
                ({t('feedback.email.optional')})
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder={t('feedback.email.placeholder')}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('feedback.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.category || !formData.message.trim()
              }
              className="flex-1"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('feedback.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
