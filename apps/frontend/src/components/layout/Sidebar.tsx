'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { formatInitials } from '@/lib/utils/formatters';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// App shell (development-plan 3.5). Sections whose phase is blocked show an
// "upcoming" page until they are built.
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [{ href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Laboratorio',
    items: [
      { href: '/field-records', label: 'Registros de campo', icon: ClipboardList },
      { href: '/tests/pending', label: 'Pruebas pendientes', icon: CalendarClock },
      { href: '/bitacora', label: 'Bitácora', icon: BookOpen },
      { href: '/reports', label: 'Informes', icon: FileText },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      { href: '/clients', label: 'Clientes', icon: Building2 },
      { href: '/projects', label: 'Proyectos', icon: FolderKanban },
    ],
  },
];

function NavLink({ href, label, icon: Icon, exact, collapsed }: NavItem & { collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive
            ? 'text-primary'
            : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-60'
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b px-3">
        <div
          className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center')}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
            <FlaskConical className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <p className="truncate text-sm font-semibold tracking-tight">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Lab Control'}
            </p>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 pt-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                {group.label}
              </p>
            )}
            {collapsed && <div className="my-1 h-px bg-border/50" />}
            {group.items.map((item) => (
              <NavLink key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {!collapsed && user && (
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {formatInitials(user.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{user.fullName}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[72px] z-10 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent"
        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
