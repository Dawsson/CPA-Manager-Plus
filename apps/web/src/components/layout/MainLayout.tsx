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
  SidebarGroup,
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

// Header action icons - smaller size for header buttons
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
  menu: (
    <svg {...headerIconProps}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  ),
  close: (
    <svg {...headerIconProps}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  sidebarCollapse: (
    <svg {...headerIconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="m16 9-3 3 3 3" />
    </svg>
  ),
  sidebarExpand: (
    <svg {...headerIconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="m13 9 3 3-3 3" />
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

const THEME_OPTIONS: Array<{
  key: Theme;
  labelKey: string;
  icon: ReactNode;
}> = [
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

  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const fullBrandName = 'CPA Manager Plus';
  const abbrBrandName = t('title.abbr');
  const isLogsPage = location.pathname.startsWith('/logs');

  // 将顶部悬浮控制区高度写入 CSS 变量，供移动端粘性元素和浮层避让。
  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight;
      if (height) {
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    updateHeaderHeight();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && headerRef.current
        ? new ResizeObserver(updateHeaderHeight)
        : null;
    if (resizeObserver && headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // 将主内容区的中心点写入 CSS 变量，供底部浮层（配置面板操作栏、提供商导航）对齐到内容区
  useLayoutEffect(() => {
    const updateContentCenter = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      document.documentElement.style.setProperty('--content-center-x', `${centerX}px`);
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
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateContentCenter);
      document.documentElement.style.removeProperty('--content-center-x');
    };
  }, []);

  useEffect(() => {
    if (!languageMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [languageMenuOpen]);

  useEffect(() => {
    if (!themeMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [themeMenuOpen]);

  const toggleLanguageMenu = useCallback(() => {
    setLanguageMenuOpen((prev) => !prev);
    setThemeMenuOpen(false);
  }, []);

  const toggleThemeMenu = useCallback(() => {
    setThemeMenuOpen((prev) => !prev);
    setLanguageMenuOpen(false);
  }, []);

  const handleThemeSelect = useCallback(
    (nextTheme: Theme) => {
      setTheme(nextTheme);
      setThemeMenuOpen(false);
    },
    [setTheme]
  );

  const handleLanguageSelect = useCallback(
    (nextLanguage: string) => {
      if (!isSupportedLanguage(nextLanguage)) {
        return;
      }
      setLanguage(nextLanguage);
      setLanguageMenuOpen(false);
    },
    [setLanguage]
  );

  useEffect(() => {
    fetchConfig().catch(() => {
      // ignore initial failure; login flow会提示
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
    <SidebarProvider
      className="cpa-shell h-svh min-h-0 overflow-hidden bg-sidebar text-sidebar-foreground [&_[data-slot=sidebar-container]]:transition-none [&_[data-slot=sidebar-gap]]:transition-none"
      style={
        {
          '--header-height': '50px',
          '--sidebar-width': 'calc(var(--spacing) * 64)',
        } as CSSProperties
      }
    >
      <CpaSidebar
        abbrBrandName={abbrBrandName}
        currentPath={currentPath}
        fullBrandName={fullBrandName}
        matchesNavPath={matchesNavPath}
        navSections={navSections}
      />

      <SidebarInset className="min-h-0 overflow-hidden bg-background">
        <header
          className="cpa-shell-header flex h-(--header-height) min-h-(--header-height) shrink-0 items-center justify-between gap-2 border-border/70 border-b bg-background"
          ref={headerRef}
        >
          <div className="flex min-w-0 items-center gap-2 px-3 lg:px-4">
            <SidebarTrigger className="-ml-1 size-8 shrink-0" />
            <Separator className="mr-1.5 h-4 bg-border/70" orientation="vertical" />
            <nav
              className="flex min-w-0 items-center text-muted-foreground text-sm"
              aria-label={t('common.navigation', { defaultValue: 'Navigation' })}
            >
              <span className="min-w-0 truncate font-medium text-foreground">
                {currentRouteLabel}
              </span>
            </nav>
          </div>

          <div className="navbar-right h-full px-3 lg:px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshAll}
              title={t('header.refresh_all')}
              aria-label={t('header.refresh_all')}
            >
              {headerIcons.refresh}
            </Button>

            <div
              className={`language-menu ${languageMenuOpen ? 'open' : ''}`}
              ref={languageMenuRef}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguageMenu}
                title={t('language.switch')}
                aria-label={t('language.switch')}
                aria-haspopup="menu"
                aria-expanded={languageMenuOpen}
              >
                {headerIcons.language}
              </Button>
              {languageMenuOpen && (
                <div
                  className="notification entering language-menu-popover"
                  role="menu"
                  aria-label={t('language.switch')}
                >
                  {LANGUAGE_ORDER.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className={`language-menu-option ${language === lang ? 'active' : ''}`}
                      onClick={() => handleLanguageSelect(lang)}
                      role="menuitemradio"
                      aria-checked={language === lang}
                    >
                      <span>{t(LANGUAGE_LABEL_KEYS[lang])}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`theme-menu ${themeMenuOpen ? 'open' : ''}`} ref={themeMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleThemeMenu}
                title={t('theme.switch')}
                aria-label={t('theme.switch')}
                aria-haspopup="menu"
                aria-expanded={themeMenuOpen}
              >
                {theme === 'auto'
                  ? headerIcons.autoTheme
                  : theme === 'dark'
                    ? headerIcons.moon
                    : headerIcons.sun}
              </Button>
              {themeMenuOpen && (
                <div
                  className="notification entering theme-menu-popover"
                  role="menu"
                  aria-label={t('theme.switch')}
                >
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`theme-option ${theme === option.key ? 'active' : ''}`}
                      onClick={() => handleThemeSelect(option.key)}
                      role="menuitemradio"
                      aria-checked={theme === option.key}
                      title={t(option.labelKey)}
                      aria-label={t(option.labelKey)}
                    >
                      <span className="theme-option-icon">{option.icon}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title={t('header.logout')}
              aria-label={t('header.logout')}
            >
              {headerIcons.logout}
            </Button>
          </div>
        </header>

        <div
          className={cn(
            'cpa-shell-content',
            'h-[calc(100svh-var(--header-height))] min-h-0 overflow-y-auto bg-background',
            isLogsPage && 'overflow-hidden'
          )}
          ref={contentRef}
        >
          <main
            className={cn(
              'cpa-shell-main',
              'flex min-h-full min-w-0 flex-col gap-(--app-gap) overflow-x-hidden bg-transparent p-(--app-gap)',
              isLogsPage && 'h-full min-h-0 overflow-hidden'
            )}
          >
            <PageTransition
              render={(location) => <MainRoutes location={location} />}
              getRouteOrder={getRouteOrder}
              getTransitionVariant={getTransitionVariant}
              scrollContainerRef={contentRef}
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function CpaSidebar({
  abbrBrandName,
  currentPath,
  fullBrandName,
  matchesNavPath,
  navSections,
}: {
  abbrBrandName: string;
  currentPath: string;
  fullBrandName: string;
  matchesNavPath: (item: NavItem, pathname: string) => boolean;
  navSections: NavSection[];
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="cpa-coss-sidebar" collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="relative h-12 rounded-lg border border-transparent px-2 data-[active=true]:bg-sidebar-accent group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:hover:bg-transparent"
              size="lg"
              tooltip={fullBrandName}
            >
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground/55">
                <img alt="" className="size-full object-cover" src={INLINE_LOGO_JPEG} />
              </span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{abbrBrandName}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{fullBrandName}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = matchesNavPath(item, currentPath);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <NavLink
                          end={item.path === '/' || item.exact}
                          onClick={handleNavigate}
                          to={item.path}
                        />
                      }
                      tooltip={item.label}
                    >
                      {item.icon}
                      <span>{item.shortLabel ?? item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
