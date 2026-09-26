import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  History,
  Settings,
  Sparkles
} from 'lucide-react';

export type SidebarTab = 'overview' | 'incidents' | 'streams' | 'history' | 'settings';

interface LeftSidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  incidentCount?: number;
  onOpenGemini?: () => void;
  aiAvailable?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  incidentCount = 1,
  onOpenGemini,
  aiAvailable = false,
}) => {
  const navItems = [
    {
      id: 'overview' as SidebarTab,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'incidents' as SidebarTab,
      label: 'Incidents',
      icon: AlertTriangle,
      badge: incidentCount > 0 ? `${incidentCount}` : undefined,
    },
    {
      id: 'streams' as SidebarTab,
      label: 'Event Streams',
      icon: Activity,
    },
    {
      id: 'history' as SidebarTab,
      label: 'History',
      icon: History,
    },
    {
      id: 'settings' as SidebarTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-[#08080a] border-r border-[#1c1c20] p-3 flex flex-col justify-between select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Platform
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#15151a] text-white border border-[#26262e] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#101014]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-400' : 'text-zinc-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subtle Gemini SRE Co-Pilot Card in Sidebar Footer */}
      {onOpenGemini && (
        <div className="pt-3 border-t border-[#1c1c20] space-y-2">
          <button
            onClick={onOpenGemini}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0e0e12] hover:bg-[#14141a] border border-[#222228] text-xs text-zinc-300 transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-white truncate text-[11px]">AI Copilot</div>
              <div className="text-[10px] text-zinc-400 truncate">
                {aiAvailable ? 'Gemini 3.8 Flash' : 'Rule-Based Mode'}
              </div>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};
