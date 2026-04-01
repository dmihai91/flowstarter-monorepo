import AuthLayout from '@/components/auth/AuthLayout';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access the Flowstarter coding agent"
    >
      <AuthFormCard
        footer={
          <p className="text-xs text-white/30">
            Don&apos;t have an account?{' '}
            <span className="font-medium text-[var(--violet)] hover:text-[var(--accent)] cursor-pointer transition-colors">
              Contact your admin
            </span>
          </p>
        }
      >
        <LoginForm />
      </AuthFormCard>
    </AuthLayout>
  );
}
