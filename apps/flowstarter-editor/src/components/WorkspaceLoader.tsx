'use client';

interface WorkspaceLoaderProps {
  projectId: string;
}

const STEPS = [
  'Setting up your workspace...',
  'Installing tools...',
  'Loading project files...',
  'Starting the editor...',
];

export function WorkspaceLoader({ projectId }: WorkspaceLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101014]">
      <div className="text-center space-y-6 max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{
              backgroundImage: 'linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)',
            }}
          >
            F
          </div>
          <span className="text-xl font-semibold text-white/90">Flowstarter</span>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="h-1.5 w-48 mx-auto rounded-full overflow-hidden bg-white/5">
            <div
              className="h-full rounded-full animate-[loading_2s_ease-in-out_infinite]"
              style={{
                backgroundImage: 'linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)',
                width: '60%',
              }}
            />
          </div>
          <p className="text-sm text-white/40 animate-pulse">
            Preparing your editor...
          </p>
        </div>

        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(80%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
}
