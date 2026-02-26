export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative bg-[#FAFAFA] dark:bg-[#0a0a0c]">
      {/* Inline background to avoid client component */}
      <div className="fixed inset-0 -z-10 bg-[#FAFAFA] dark:bg-[#0a0a0c]" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 animate-spin text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-gray-900 dark:text-white font-medium">Loading...</p>
      </div>
    </div>
  );
}
