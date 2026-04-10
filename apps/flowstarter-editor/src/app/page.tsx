import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function EditorHome() {
  const session = await auth();

  if (!session?.userId) {
    redirect('/');
  }

  // Editor root — no project selected. Show a landing or redirect.
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-white/90">Flowstarter Editor</h1>
        <p className="text-white/50 text-sm">
          Open a project from the dashboard to start editing.
        </p>
      </div>
    </div>
  );
}
