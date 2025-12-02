import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { key: 'price', label: '가격 검토' },
    { key: 'shop', label: '샵 검토' },
    { key: 'wine', label: '와인 검토' }
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', padding: '10px' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            padding: '10px 20px',
            borderRadius: '20px',
            backgroundColor: activeTab === tab.key ? '#333' : '#eee',
            color: activeTab === tab.key ? 'white' : 'black',
            border: 'none'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

