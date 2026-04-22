'use client';

import { useState } from 'react';
import TabNav from '@/components/TabNav';
import type { Tab } from '@/components/TabNav';
import SportFilter from '@/components/SportFilter';
import type { Sport } from '@/components/SportFilter';
import Feed from '@/components/Feed';

export default function Page() {
  const [tab, setTab] = useState<Tab>('following');
  const [sport, setSport] = useState<Sport>('nba');

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">X Feed</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Sports &amp; competitor posts</p>
        </header>

        <TabNav activeTab={tab} onTabChange={setTab} />

        {tab === 'sports' && (
          <SportFilter activeSport={sport} onSportChange={setSport} />
        )}

        <Feed tab={tab} sport={sport} />
      </div>
    </main>
  );
}
