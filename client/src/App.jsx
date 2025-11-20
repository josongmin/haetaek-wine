import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { TabNavigation, UserBadge } from './shared/components/Layout';
import ReviewPricePage from './pages/ReviewPricePage';
import ReviewShopPage from './pages/ReviewShopPage';
import ReviewWinePage from './pages/ReviewWinePage';

export default function App() {
  const [activeTab, setActiveTab] = useState('price');

  return (
    <div>
      <Toaster position="bottom-right" />
      <UserBadge /> {/* ⬅️ 추가 */}

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'price' && <ReviewPricePage />}
      {activeTab === 'shop' && <ReviewShopPage />}
      {activeTab === 'wine' && <ReviewWinePage />}
    </div>
  );
}
