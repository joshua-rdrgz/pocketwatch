export function SidePanelHeader() {
  return (
    <header className="flex flex-col justify-center items-center gap-3">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        Pocketwatch
      </h1>
      <p className="text-muted-foreground text-center font-medium max-w-md">
        Track your productivity and earnings in real-time. Perfect for
        freelancers and remote workers who want to optimize their work patterns.
      </p>
    </header>
  );
}
