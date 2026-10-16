'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToday } from '@/lib/hooks/useToday';
import { cn } from '@/lib/utils/cn';
import { formatInitials } from '@/lib/utils/formatters';
import { useAuth, useCurrentUser } from '@/modules/auth/hooks/useAuth';
import { usePendingTests } from '@/modules/specimen-tests/hooks/useSpecimenTests';
import { useUiStore } from '@/store/uiStore';
import { ROLE_LABELS } from '@/types';
import { BrandMark } from './BrandMark';
import { NavIcon, type NavIconName } from './NavIcons';

interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
  /** Other paths that light up this item. */
  also?: string[];
}

// Sections whose phase is still blocked (Bitácora, Informes) show an "upcoming" page.
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/clients', label: 'Clientes', icon: 'clients' },
  { href: '/projects', label: 'Proyectos', icon: 'projects', also: ['/field-records'] },
  { href: '/bitacora', label: 'Bitácora', icon: 'bitacora' },
  { href: '/tests/pending', label: 'Ensayos pendientes', icon: 'tests' },
  { href: '/reports', label: 'Informes', icon: 'reports' },
];

function NavLink({ item, count }: { item: NavItem; count?: number }) {
  const pathname = usePathname();
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const active = [item.href, ...(item.also ?? [])].some((p) => pathname.startsWith(p));

  return (
    <Link
      href={item.href}
      onClick={() => setDrawerOpen(false)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'font-medium text-sidebar-foreground hover:bg-muted'
      )}
    >
      <NavIcon name={item.icon} />
      <span className="flex-1">{item.label}</span>
      {!!count && (
        <span
          className="rounded-full border border-st-late-bd bg-st-late px-[7px] py-px font-mono text-[11px] font-medium text-st-late-fg"
          aria-label={`${count} requieren atención`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/** Tests overdue or due today: the badge on "Ensayos pendientes". */
function useAttentionCount(): number {
  const today = useToday();
  const { data } = usePendingTests({ until: today });
  return data?.length ?? 0;
}

function UserMenu() {
  const { logout } = useAuth();
  const me = useCurrentUser();
  const user = me.data?.user;
  if (!user) return <div className="h-8" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-md text-left outline-none focus-visible:outline-2 focus-visible:outline-ring">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {formatInitials(user.fullName)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium">{user.fullName}</span>
            <span className="block truncate text-xs text-subtle">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-subtle" strokeWidth={1.6} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" side="top">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const attention = useAttentionCount();
  const me = useCurrentUser();

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-[rgba(20,22,25,0.42)] md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'z-40 flex h-full w-[244px] shrink-0 flex-col border-r bg-sidebar print:hidden',
          'fixed inset-y-0 left-0 md:static',
          drawerOpen ? 'flex' : 'hidden md:flex'
        )}
      >
        <div className="flex h-[60px] shrink-0 items-center border-b px-[18px]">
          <BrandMark />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-auto px-2.5 py-3">
          <div className="px-2.5 py-1.5 text-[11px] uppercase tracking-[0.07em] text-subtle">
            Operación
          </div>
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              count={item.href === '/tests/pending' ? attention : undefined}
            />
          ))}
          <div className="mx-2.5 my-3 h-px bg-border" />
          <NavLink item={{ href: '/settings', label: 'Configuración', icon: 'settings' }} />
        </nav>

        <div className="flex shrink-0 flex-col gap-3 border-t px-4 py-3.5">
          <div className="text-xs leading-snug text-muted-foreground">
            <div className="mb-0.5 text-[11px] uppercase tracking-[0.07em] text-subtle">
              Laboratorio
            </div>
            {me.data?.tenant.name ?? '—'}
          </div>
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
