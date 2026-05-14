import { EditorBootstrapLoader } from "./auth/EditorBootstrapLoader";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <EditorBootstrapLoader statusLabel="Flowstarter loading" />
    </div>
  );
}
