'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';

export function ProfileContent() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslations();

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">{t('profile.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loading skeletons */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.personalInformation.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.accountDetails.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            {t('profile.userNotFound')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('profile.userNotFound.description')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">{t('profile.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personalInformation.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('profile.personalInformation.fullName')}
              </p>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('profile.personalInformation.primaryEmail')}
              </p>
              <p className="font-medium">
                {user.emailAddresses.find(
                  (email) => email.id === user.primaryEmailAddressId
                )?.emailAddress ||
                  user.emailAddresses[0]?.emailAddress ||
                  t('profile.personalInformation.noEmail')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('profile.personalInformation.userId')}
              </p>
              <p className="font-medium text-xs font-mono bg-(--surface-1) px-2 py-1 rounded">
                {user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.accountDetails.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('profile.accountDetails.created')}
              </p>
              <p className="font-medium">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : t('profile.accountDetails.unknown')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('profile.accountDetails.lastUpdated')}
              </p>
              <p className="font-medium">
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : t('profile.accountDetails.unknown')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
