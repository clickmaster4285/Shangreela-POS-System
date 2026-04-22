import { LucideIcon } from 'lucide-react';

interface Tab {
   key: string;
   label: string;
   icon: LucideIcon;
   count?: number;
}

interface TabsNavigationProps {
   tabs: Tab[];
   activeTab: string;
   onTabChange: (tab: string) => void;
}

export function TabsNavigation({ tabs, activeTab, onTabChange }: TabsNavigationProps) {
   return (
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto no-scrollbar">
         {tabs.map(tab => (
            <button
               key={tab.key}
               onClick={() => onTabChange(tab.key)}
               className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
                     ? 'bg-background text-foreground shadow-sm'
                     : 'text-muted-foreground hover:text-foreground'
                  }`}
            >
               <tab.icon className="w-3.5 h-3.5" />
               {tab.label}
               {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                     {tab.count}
                  </span>
               )}
            </button>
         ))}
      </div>
   );
}