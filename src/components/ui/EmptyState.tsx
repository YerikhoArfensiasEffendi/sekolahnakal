interface EmptyStateProps {
  message: string;
  icon?: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, icon = '🎬', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <p className="text-text-secondary">{message}</p>
      {action}
    </div>
  );
}
