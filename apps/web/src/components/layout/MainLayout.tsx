import {
  CSSProperties,
  ReactNode,
  SVGProps,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/common/PageTransition';
import { MainRoutes } from '@/router/MainRoutes';
import { Button } from '@/components/coss-ui/button';
import { Separator } from '@/components/coss-ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/coss-ui/sidebar';
import {
  IconSidebarAuthFiles,
  IconSidebarConfig,
  IconSidebarDashboard,
  IconSidebarInspection,
  IconSidebarLogs,
  IconSidebarMonitor,
  IconSidebarOauth,
  IconSidebarProviders,
  IconSidebarQuota,
  IconSidebarSystem,
} from '@/components/ui/icons';
import { INLINE_LOGO_JPEG } from '@/assets/logoInline';
import {
  useAuthStore,
  useConfigStore,
  useLanguageStore,
  useNotificationStore,
  useThemeStore,
} from '@/stores';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { usePanelFeatureAvailability } from '@/hooks/usePanelFeatureAvailability';
import { isFileLogsAvailable } from '@/features/logs/logFeatureAvailability';
import { LANGUAGE_LABEL_KEYS, LANGUAGE_ORDER } from '@/utils/constants';
import { isSupportedLanguage } from '@/utils/language';
import type { Theme } from '@/types';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { NavMain } from '@/components/layout/nav-main';
import { NavDocuments } from '@/components/layout/nav-documents';
import { NavSecondary } from '@/components/layout/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import { SiteHeader } from '@/components/layout/site-header';

const SIDEBAR_ICON_SIZE = 20;

const sidebarIcons: Record<string, ReactNode> = {
  dashboard: <IconSidebarDashboard size={SIDEBAR_ICON_SIZE} />,
  aiProviders: <IconSidebarProviders size={SIDEBAR_ICON_SIZE} />,
  authFiles: <IconSidebarAuthFiles size={SIDEBAR_ICON_SIZE} />,
  oauth: <IconSidebarOauth size={SIDEBAR_ICON_SIZE} />,
  quota: <IconSidebarQuota size={SIDEBAR_ICON_SIZE} />,
  codexInspection: <IconSidebarInspection size={SIDEBAR_ICON_SIZE} />,
  monitoring: <IconSidebarMonitor size={SIDEBAR_ICON_SIZE} />,
  config: <IconSidebarConfig size={SIDEBAR_ICON_SIZE} />,
  logs: <IconSidebarLogs size={SIDEBAR_ICON_SIZE} />,
  system: <IconSidebarSystem size={SIDEBAR_ICON_SIZE} />,
};

const headerIconProps: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

const headerIcons = {
  refresh: (
    <svg {...headerIconProps}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  language: (
    <svg {...headerIconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  sun: (
    <svg {...headerIconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  moon: (
    <svg {...headerIconProps}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  ),
  autoTheme: (
    <svg {...headerIconProps}>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 16v5" />
      <path d="M9 11a3 3 0 0 1 5.2-2" />
      <path d="M14.5 7v2h-2" />
      <path d="M15 11a3 3 0 0 1-5.2 2" />
      <path d="M9.5 15v-2h2" />
    </svg>
  ),
  logout: (
    <svg {...headerIconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

const THEME_OPTIONS: Array<{ key: Theme; labelKey: string; icon: ReactNode }> = [
  { key: 'auto', labelKey: 'theme.auto', icon: headerIcons.autoTheme },
  { key: 'white', labelKey: 'theme.white', icon: headerIcons.sun },
  { key: 'dark', labelKey: 'theme.dark', icon: headerIcons.moon },
];

type NavItem = {
  path: string;
  label: string;
  shortLabel?: string;
  icon: ReactNode;
  exact?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export function MainLayout() {
  const { t } = useTranslation();
  const { showNotification } = useNotificationStore();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const config = useConfigStore((state) => state.config);
  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const clearCache = useConfigStore((state) => state.clearCache);
  const featureAvailability = usePanelFeatureAvailability();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const fullBrandName = 'CPA Manager Plus';
  const abbrBrandName = t('title.abbr');
  const isLogsPage = location.pathname.startsWith('/logs');

  useLayoutEffect(() => {
    const updateContentCenter = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      document.documentElement.style.setProperty(
        '--content-center-x',
        `${rect.left + rect.width / 2}px`
      );
    };

    updateContentCenter();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && contentRef.current
        ? new ResizeObserver(updateContentCenter)
        : null;

    if (resizeObserver && contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', updateContentCenter);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateContentCenter);
      document.documentElement.style.removeProperty('--content-center-x');
    };
  }, []);

  useEffect(() => {
    fetchConfig().catch(() => {
      // Initial failures are surfaced by the login/config flows.
    });
  }, [fetchConfig]);

  const fileLogsAvailable = isFileLogsAvailable(config);
  const navShortLabel = (key: string, fallback: string) => {
    const shortKey = `${key}_short`;
    const label = t(shortKey, { defaultValue: fallback });
    return label === shortKey ? fallback : label;
  };

  const operationNavItems: NavItem[] = [
    ...(featureAvailability.requestMonitoringAvailable
      ? [
        {
          path: '/monitoring',
          label: t('nav.monitoring_center'),
          shortLabel: navShortLabel('nav.monitoring_center', t('nav.monitoring_center')),
          icon: sidebarIcons.monitoring,
        },
      ]
      : []),
    ...(fileLogsAvailable
      ? [
        {
          path: '/logs',
          label: t('nav.logs'),
          shortLabel: navShortLabel('nav.logs', t('nav.logs')),
          icon: sidebarIcons.logs,
        },
      ]
      : []),
  ];

  const navSections: NavSection[] = [
    {
      label: t('nav.dashboard'),
      items: [
        {
          path: '/',
          label: t('nav.dashboard'),
          shortLabel: navShortLabel('nav.dashboard', t('nav.dashboard')),
          icon: sidebarIcons.dashboard,
          exact: true,
        },
      ],
    },
    {
      label: t('nav.config_management'),
      items: [
        {
          path: '/config',
          label: t('nav.config_management'),
          shortLabel: navShortLabel('nav.config_management', t('nav.config_management')),
          icon: sidebarIcons.config,
        },
        {
          path: '/ai-providers',
          label: t('nav.ai_providers'),
          shortLabel: navShortLabel('nav.ai_providers', t('nav.ai_providers')),
          icon: sidebarIcons.aiProviders,
        },
      ],
    },
    {
      label: t('nav.auth_files'),
      items: [
        {
          path: '/auth-files',
          label: t('nav.auth_files'),
          shortLabel: navShortLabel('nav.auth_files', t('nav.auth_files')),
          icon: sidebarIcons.authFiles,
        },
        {
          path: '/oauth',
          label: t('nav.oauth', { defaultValue: 'OAuth' }),
          shortLabel: navShortLabel('nav.oauth', t('nav.oauth', { defaultValue: 'OAuth' })),
          icon: sidebarIcons.oauth,
        },
        {
          path: '/quota',
          label: t('nav.quota_management'),
          shortLabel: navShortLabel('nav.quota_management', t('nav.quota_management')),
          icon: sidebarIcons.quota,
        },
        {
          path: '/codex-inspection',
          label: t('nav.codex_inspection'),
          shortLabel: navShortLabel('nav.codex_inspection', t('nav.codex_inspection')),
          icon: sidebarIcons.codexInspection,
        },
      ],
    },
    {
      label: t('nav.monitoring_center', { defaultValue: 'Operations' }),
      items: operationNavItems,
    },
    {
      label: t('nav.system_info'),
      items: [
        {
          path: '/system',
          label: t('nav.system_info'),
          shortLabel: navShortLabel('nav.system_info', t('nav.system_info')),
          icon: sidebarIcons.system,
        },
      ],
    },
  ].filter((section) => section.items.length > 0);

  const navItems = navSections.flatMap((section) => section.items);
  const navOrder = navItems.map((item) => item.path);
  const getRouteOrder = (pathname: string) => {
    const trimmedPath =
      pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const normalizedPath = trimmedPath === '/dashboard' ? '/' : trimmedPath;

    const aiProvidersIndex = navOrder.indexOf('/ai-providers');
    if (aiProvidersIndex !== -1) {
      if (normalizedPath === '/ai-providers') return aiProvidersIndex;
      if (normalizedPath.startsWith('/ai-providers/')) {
        if (normalizedPath.startsWith('/ai-providers/gemini')) return aiProvidersIndex + 0.1;
        if (normalizedPath.startsWith('/ai-providers/codex')) return aiProvidersIndex + 0.2;
        if (normalizedPath.startsWith('/ai-providers/claude')) return aiProvidersIndex + 0.3;
        if (normalizedPath.startsWith('/ai-providers/vertex')) return aiProvidersIndex + 0.4;
        if (normalizedPath.startsWith('/ai-providers/ampcode')) return aiProvidersIndex + 0.5;
        if (normalizedPath.startsWith('/ai-providers/openai')) return aiProvidersIndex + 0.6;
        return aiProvidersIndex + 0.05;
      }
    }

    const authFilesIndex = navOrder.indexOf('/auth-files');
    if (authFilesIndex !== -1) {
      if (normalizedPath === '/auth-files') return authFilesIndex;
      if (normalizedPath.startsWith('/auth-files/')) {
        if (normalizedPath.startsWith('/auth-files/oauth-excluded')) return authFilesIndex + 0.1;
        if (normalizedPath.startsWith('/auth-files/oauth-model-alias')) return authFilesIndex + 0.2;
        return authFilesIndex + 0.05;
      }
    }

    const exactIndex = navOrder.indexOf(normalizedPath);
    if (exactIndex !== -1) return exactIndex;
    const nestedIndex = navOrder.findIndex(
      (path) => path !== '/' && normalizedPath.startsWith(`${path}/`)
    );
    return nestedIndex === -1 ? null : nestedIndex;
  };

  const getTransitionVariant = useCallback((fromPathname: string, toPathname: string) => {
    const normalize = (pathname: string) => {
      const trimmed =
        pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
      return trimmed === '/dashboard' ? '/' : trimmed;
    };

    const from = normalize(fromPathname);
    const to = normalize(toPathname);
    const isAuthFiles = (pathname: string) =>
      pathname === '/auth-files' || pathname.startsWith('/auth-files/');
    const isAiProviders = (pathname: string) =>
      pathname === '/ai-providers' || pathname.startsWith('/ai-providers/');
    if (isAuthFiles(from) && isAuthFiles(to)) return 'ios';
    if (isAiProviders(from) && isAiProviders(to)) return 'ios';
    return 'none';
  }, []);

  const handleRefreshAll = async () => {
    clearCache();
    const results = await Promise.allSettled([
      fetchConfig(undefined, true),
      triggerHeaderRefresh(),
    ]);
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected && rejected.status === 'rejected') {
      const reason = rejected.reason;
      const message =
        typeof reason === 'string' ? reason : reason instanceof Error ? reason.message : '';
      showNotification(
        `${t('notification.refresh_failed')}${message ? `: ${message}` : ''}`,
        'error'
      );
      return;
    }
    showNotification(t('notification.data_refreshed'), 'success');
  };

  const normalizedLocationPath =
    location.pathname.length > 1 && location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname;
  const currentPath = normalizedLocationPath === '/dashboard' ? '/' : normalizedLocationPath;
  const matchesNavPath = (item: NavItem, pathname: string) =>
    item.path === '/' || item.exact
      ? pathname === item.path
      : pathname === item.path || pathname.startsWith(`${item.path}/`);
  const activeNavItem =
    [...navItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => matchesNavPath(item, currentPath)) ?? navItems[0];
  const currentRouteLabel = activeNavItem?.label ?? fullBrandName;

  return (
    // <SidebarProvider
    //   className="h-svh min-h-0 overflow-hidden bg-sidebar text-sidebar-foreground [&_[data-slot=sidebar-container]]:transition-none [&_[data-slot=sidebar-gap]]:transition-none"
    //   style={
    //     {
    //       '--sidebar-width': 'calc(var(--spacing) * 72)',
    //       '--header-height': 'calc(var(--spacing) * 11)',
    //     } as CSSProperties
    //   }
    // >
    //   <AppSidebar
    //     abbrBrandName={abbrBrandName}
    //     currentPath={currentPath}
    //     fullBrandName={fullBrandName}
    //     matchesNavPath={matchesNavPath}
    //     navSections={navSections}
    //     variant="inset"
    //   />
    // <SidebarInset className="min-h-0 overflow-hidden bg-white">
    // <SidebarProvider
    //   style={
    //     {
    //       "--sidebar-width": "calc(var(--spacing) * 72)",
    //       "--header-height": "calc(var(--spacing) * 12)",
    //     } as React.CSSProperties
    //   }
    // >
    //   <AppSidebar variant="inset" />
    //   <SidebarInset>
    //     <SiteHeader
    //       currentRouteLabel={currentRouteLabel}
    //       language={language}
    //       logout={logout}
    //       onLanguageSelect={setLanguage}
    //       onRefreshAll={handleRefreshAll}
    //       onThemeSelect={setTheme}
    //       theme={theme}
    //     />
    //     <div
    //       className={cn(
    //         'cpa-shell-content h-[calc(100svh-var(--header-height))] min-h-0 overflow-y-auto bg-white',
    //         isLogsPage && 'overflow-hidden'
    //       )}
    //       ref={contentRef}
    //     >
    //       <div className="@container/main flex min-h-full flex-col">
    //         <main
    //           className={cn(
    //             'cpa-shell-main flex min-h-full min-w-0 flex-col gap-(--app-gap) overflow-x-hidden bg-transparent p-(--app-gap)',
    //             isLogsPage && 'h-full min-h-0 overflow-hidden'
    //           )}
    //         >
    //           <PageTransition
    //             render={(location) => <MainRoutes location={location} />}
    //             getRouteOrder={getRouteOrder}
    //             getTransitionVariant={getTransitionVariant}
    //             scrollContainerRef={contentRef}
    //           />
    //         </main>
    //       </div>
    //     </div>
    //   </SidebarInset>
    // </SidebarProvider>
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
