'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleTheme } from '@/lib/theme';

/** Light / soft dark switch. The icon follows the `.dark` class, so no state is needed. */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label="Cambiar tema claro / oscuro"
      title="Tema claro / oscuro"
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}
