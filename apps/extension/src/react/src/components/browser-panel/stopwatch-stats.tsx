export function StopwatchStats() {
  return (
    <div className="flex-1 p-2 flex flex-col gap-1">
      <div className="font-mono text-2xl">00:00:00</div>
      <div className="text-xs text-muted-foreground">$0.00 earned</div>
      <div className="text-sm text-muted-foreground">Project Name</div>
    </div>
  );
}
