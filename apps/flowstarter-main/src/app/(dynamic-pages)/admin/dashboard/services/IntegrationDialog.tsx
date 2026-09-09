'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import type { Integration, IntegrationType, Project } from './services.types';
import { INTEGRATION_META } from './services.types';

interface IntegrationDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingIntegration: Integration | null;
  dialogType: IntegrationType;
  dialogProject: string;
  setDialogProject: (project: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  integrationName: string;
  setIntegrationName: (name: string) => void;
  showApiKey: boolean;
  setShowApiKey: Dispatch<SetStateAction<boolean>>;
  saving: boolean;
  handleSave: () => void;
  projects: Project[] | undefined;
  t: (key: string) => string;
}

export function IntegrationDialog({
  dialogOpen,
  setDialogOpen,
  editingIntegration,
  dialogType,
  dialogProject,
  setDialogProject,
  apiKey,
  setApiKey,
  integrationName,
  setIntegrationName,
  showApiKey,
  setShowApiKey,
  saving,
  handleSave,
  projects,
  t,
}: IntegrationDialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(() => {
              const meta = INTEGRATION_META[dialogType];
              const Icon = meta.icon;
              return (
                <>
                  <span
                    className={`inline-flex w-7 h-7 rounded-lg ${meta.bgColor} items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </span>
                  {editingIntegration ? 'Update' : 'Add'}{' '}
                  {INTEGRATION_META[dialogType].name}
                </>
              );
            })()}
          </DialogTitle>
          <DialogDescription>
            {INTEGRATION_META[dialogType].keyHelp}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Project selector */}
          <div className="space-y-2">
            <Label htmlFor="dialog-project">
              {t('app.projectLabel')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={dialogProject}
              onValueChange={setDialogProject}
              disabled={!!editingIntegration}
            >
              <SelectTrigger id="dialog-project">
                <SelectValue placeholder={t('team.services.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || t('app.untitledProject')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Integration name */}
          <div className="space-y-2">
            <Label htmlFor="dialog-name">Label (optional)</Label>
            <Input
              id="dialog-name"
              placeholder={`${INTEGRATION_META[dialogType].name}: Client Name`}
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
            />
          </div>

          {/* API key */}
          <div className="space-y-2">
            <Label htmlFor="dialog-key">
              {INTEGRATION_META[dialogType].keyLabel}{' '}
              {!editingIntegration && <span className="text-red-500">*</span>}
            </Label>
            {editingIntegration && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Leave blank to keep the existing key.
              </p>
            )}
            <div className="relative">
              <Input
                id="dialog-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder={
                  editingIntegration
                    ? '••••••••••••••••'
                    : INTEGRATION_META[dialogType].keyPlaceholder
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/40 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-500" />
              Encrypted with Supabase Vault, never stored in plaintext
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving || !dialogProject || (!editingIntegration && !apiKey)
            }
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {editingIntegration ? 'Update' : 'Save'} Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
