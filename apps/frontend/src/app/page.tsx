import { redirect } from 'next/navigation';

/** Unauthenticated users are sent to /login by proxy.ts before reaching this. */
export default function RootPage() {
  redirect('/dashboard');
}
