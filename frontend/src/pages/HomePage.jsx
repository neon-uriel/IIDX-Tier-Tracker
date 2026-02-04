import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl sm:text-5xl font-heading font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
        IIDX Tier Tracker
      </h1>
      <p className="text-sm sm:text-lg text-foreground/70 mb-8 max-w-md">
        Track your IIDX progress and lamp status across all difficulties.
      </p>
      <Link
        to="/dashboard"
        className="glass-card !py-4 !px-8 font-heading font-bold text-primary hover:text-white hover:bg-primary/80 transition-all"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
