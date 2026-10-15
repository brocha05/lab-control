import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FlaskConical } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Lab Control'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Inicia sesión para continuar</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {/* useSearchParams (callbackUrl) requires a Suspense boundary. */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
