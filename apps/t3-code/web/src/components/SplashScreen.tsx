export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4" aria-label="Flowstarter loading">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{
              backgroundImage: "linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)",
            }}
          >
            F
          </div>
          <span className="text-lg font-semibold text-foreground">Flowstarter</span>
        </div>
        <div className="h-1 w-32 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full animate-pulse"
            style={{
              backgroundImage: "linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)",
              width: "60%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
