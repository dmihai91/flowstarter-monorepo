'use client';

import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Globe, 
  Mail, 
  BarChart3, 
  Settings, 
  LogOut,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Mock data for now - will be replaced with real data
const mockProjects = [
  {
    id: '1',
    name: 'Coffee Shop Berlin',
    domain: 'coffeeshop.berlin',
    status: 'live',
    createdAt: '2024-02-20',
    client: 'Marcus Weber',
  },
  {
    id: '2',
    name: 'Yoga Studio München',
    domain: 'yogastudio-muenchen.de',
    status: 'building',
    createdAt: '2024-02-22',
    client: 'Anna Schmidt',
  },
  {
    id: '3',
    name: 'Tech Consulting',
    domain: 'pending',
    status: 'pending',
    createdAt: '2024-02-24',
    client: 'Thomas Müller',
  },
];

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is team member
  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isTeam = role === 'team' || role === 'admin';
      
      if (!user) {
        router.push('/team/login');
      } else if (!isTeam) {
        // Not a team member, redirect to client dashboard
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/team/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Live
          </span>
        );
      case 'building':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            <Clock className="w-3 h-3" />
            Building
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const filteredProjects = mockProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>
      
      <div className="min-h-screen font-display relative">
        {/* Gradient background with flow lines */}
        <GradientBackground variant="dashboard" className="fixed" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/team/dashboard" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                  Team
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-white/50">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Client Projects
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                Manage client websites and configure services
              </p>
            </div>
            
            <Link href="/team/dashboard/new">
              <Button className="bg-gradient-to-r from-[var(--purple)] to-blue-500 hover:from-[var(--purple)]/90 hover:to-blue-500/90 text-white font-semibold rounded-xl shadow-lg shadow-[var(--purple)]/20 h-11 px-5">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Globe, label: 'Configure Domain', desc: 'DNS & SSL setup', color: 'text-blue-500' },
              { icon: Mail, label: 'Setup Email', desc: 'Zoho Mail config', color: 'text-emerald-500' },
              { icon: BarChart3, label: 'Analytics', desc: 'Google Analytics', color: 'text-amber-500' },
              { icon: Settings, label: 'Services', desc: 'Integrations', color: 'text-purple-500' },
            ].map((action, i) => (
              <button
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/10 hover:border-[var(--purple)]/30 dark:hover:border-[var(--purple)]/30 transition-all group"
              >
                <div className={`p-2.5 rounded-lg bg-gray-100 dark:bg-white/5 ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Projects section */}
          <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200/50 dark:border-white/10">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-white/5 border-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:ring-2 focus:ring-[var(--purple)]/20"
                />
              </div>
              
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-white/5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
                >
                  <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-white/60" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
                >
                  <List className="w-4 h-4 text-gray-600 dark:text-white/60" />
                </button>
              </div>
            </div>

            {/* Projects grid/list */}
            <div className={`p-4 ${viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`group p-4 rounded-xl border border-gray-200/50 dark:border-white/5 hover:border-[var(--purple)]/30 dark:hover:border-[var(--purple)]/30 bg-gray-50/50 dark:bg-white/[0.01] hover:bg-white dark:hover:bg-white/[0.03] transition-all cursor-pointer ${
                    viewMode === 'list' ? 'flex items-center justify-between' : ''
                  }`}
                >
                  <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                      {viewMode === 'grid' && getStatusBadge(project.status)}
                    </div>
                    
                    <div className={`space-y-2 ${viewMode === 'list' ? 'flex items-center gap-6' : ''}`}>
                      <p className="text-sm text-gray-500 dark:text-white/50 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        {project.domain}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        Client: {project.client}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-4 pt-4 border-t border-gray-200/50 dark:border-white/5' : ''}`}>
                    {viewMode === 'list' && getStatusBadge(project.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-[var(--purple)] dark:text-white/50 dark:hover:text-[var(--purple)]"
                    >
                      <Settings className="w-4 h-4 mr-1.5" />
                      Configure
                    </Button>
                    {project.status === 'live' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-[var(--purple)] dark:text-white/50 dark:hover:text-[var(--purple)]"
                      >
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-white/50">No projects found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
