/**
 * ProjectNotFoundRedirect — Redirects to home page when a project is not found.
 * Handles deleted projects and invalid IDs gracefully without showing an error.
 */

import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { LoadingScreen } from '@flowstarter/flow-design-system';

export function ProjectNotFoundRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return <LoadingScreen message="Loading project..." />;
}
