import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Editor | Build & edit your website - Flowstarter',
  description: 'Build, customize, and publish your website with AI-powered editing. No coding required.',
};

/**
 * Editor Layout
 * 
 * Full-screen, immersive dark environment.
 * No chrome from the main platform - this is a focused workspace.
 */
export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/editor');
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#08080a] text-white antialiased">
      {/* Subtle ambient atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top-left violet glow */}
        <div 
          className="absolute -top-[300px] -left-[200px] w-[800px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.8) 0%, transparent 70%)' }}
        />
        {/* Bottom-right cyan glow */}
        <div 
          className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[500px] rounded-full opacity-[0.025]"
          style={{ background: 'radial-gradient(ellipse, rgba(6, 182, 212, 0.8) 0%, transparent 70%)' }}
        />
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}
