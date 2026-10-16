import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandMark } from '@/components/layout/BrandMark';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <BrandMark className="justify-center" />
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-lg font-semibold">Iniciar sesión</h1>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            Entra con tu correo del laboratorio.
          </p>
          {/* useSearchParams (callbackUrl) requires a Suspense boundary. */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
