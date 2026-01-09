function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton animate-pulse rounded-md bg-secondary ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
