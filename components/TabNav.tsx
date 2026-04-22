'use client';

type Tab = 'trending' | 'sports' | 'competition' | 'following';

const TABS: { id: Tab; label: string }[] = [
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
  { id: 'sports', label: 'Sports' },
  { id: 'competition', label: 'Competition' },
];

export type { Tab };

interface TabNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex border-b border-zinc-800">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
