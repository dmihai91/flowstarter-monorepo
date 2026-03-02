'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { Pencil, Check, X, Mail, User, Calendar, Shield, Camera } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef } from 'react';

export function ProfileContent() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslations();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">{t('profile.userNotFound')}</h1>
        <p className="text-gray-500 dark:text-white/50 mt-2">{t('profile.userNotFound.description')}</p>
      </div>
    );
  }

  const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    || user.emailAddresses[0]?.emailAddress || '';

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: currentValue });
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setMessage(null);
  };

  const saveField = async (field: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const value = editValues[field]?.trim();
      if (!value) throw new Error('Value cannot be empty');

      if (field === 'firstName' || field === 'lastName') {
        await user.update({ [field]: value });
        setMessage({ type: 'success', text: 'Name updated successfully.' });
      } else if (field === 'email') {
        const emailObj = user.emailAddresses.find(e => e.emailAddress === primaryEmail);
        if (emailObj && value !== primaryEmail) {
          const newEmail = await user.createEmailAddress({ email: value });
          await newEmail.prepareVerification({ strategy: 'email_code' });
          setMessage({ type: 'success', text: 'Verification email sent to ' + value + '. Please check your inbox.' });
        }
      }
      setEditingField(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.errors?.[0]?.longMessage || err?.message || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      await user.setProfileImage({ file });
      setMessage({ type: 'success', text: 'Profile photo updated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update photo.' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const f = user.firstName?.[0] || '';
    const l = user.lastName?.[0] || '';
    return (f + l).toUpperCase() || 'U';
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const InfoRow = ({ 
    icon: Icon, 
    label, 
    value, 
    field, 
    editable = false 
  }: { 
    icon: any; 
    label: string; 
    value: string; 
    field?: string; 
    editable?: boolean;
  }) => {
    const isEditing = editingField === field;

    return (
      <div className="flex items-start gap-3 py-2">
        <div className="mt-0.5 p-2 rounded-lg bg-[var(--purple)]/10">
          <Icon className="w-4 h-4 text-[var(--purple)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider mb-0.5">
            {label}
          </p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValues[field!] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field!]: e.target.value })}
                className="h-8 text-sm bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField(field!);
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={() => saveField(field!)}
                disabled={saving}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={cancelEdit}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {value}
              </p>
              {editable && (
                <button
                  onClick={() => startEdit(field!, value)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-all"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-4 h-[calc(100vh-4rem)] overflow-hidden">
      {/* Page title */}
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {t('profile.personalInformation.title')}
      </h1>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* Status message */}
      {message && (
        <div className={`mb-3 px-3 py-2 rounded-xl text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Personal Info Card */}
      <div className="rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm p-3 sm:p-4 mb-3">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-1">
          {t('profile.personalInformation.title')}
        </h2>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <InfoRow icon={User} label="First Name" value={user.firstName || '—'} field="firstName" editable />
          <InfoRow icon={User} label="Last Name" value={user.lastName || '—'} field="lastName" editable />
          <InfoRow icon={Mail} label={t('profile.personalInformation.primaryEmail')} value={primaryEmail || '—'} field="email" editable />
          <InfoRow icon={Shield} label={t('profile.personalInformation.userId')} value={user.id} />
        </div>
      </div>

      {/* Account Details Card */}
      <div className="rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-sm p-3 sm:p-4">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-1">
          {t('profile.accountDetails.title')}
        </h2>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          <InfoRow icon={Calendar} label={t('profile.accountDetails.created')} value={formatDate(user.createdAt)} />
          <InfoRow icon={Calendar} label={t('profile.accountDetails.lastUpdated')} value={formatDate(user.updatedAt)} />
        </div>
      </div>
    </div>
  );
}
