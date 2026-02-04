import LoginButton from '../components/LoginButton';

export default function LoginPage() {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass-card w-full max-w-md text-center">
        <h2 className="text-xl sm:text-2xl font-heading font-bold mb-4 text-primary">Login</h2>
        <p className="text-sm sm:text-base text-foreground/70 mb-6">Please log in to continue.</p>
        <LoginButton />
      </div>
    </div>
  );
}
