import React, { useState } from 'react';
import NavigationTabs, { 
  TabConfig, 
  createTabConfig, 
  DRAFT_TAB_CONFIG 
} from './NavigationTabs';
import { 
  Users, 
  GitCompare, 
  BarChart3, 
  Play, 
  Globe, 
  Eye, 
  Brain,
  Settings,
  MessageCircle 
} from 'lucide-react';

// Example 1: Basic Usage
const BasicNavigationExample: React.FC = () => {
  const [currentView, setCurrentView] = useState('draft');

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        tabConfig={DRAFT_TAB_CONFIG}
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">
          Current View: {currentView}
        </h2>
        <div className="bg-white rounded-lg p-6 shadow">
          Content for {currentView} view goes here...
        </div>
      </div>
    </div>
  );
};

// Example 2: Custom Tab Configuration with Badges
const CustomNavigationExample: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  const customTabs: TabConfig[] = [
    createTabConfig('dashboard', 'Dashboard', Users),
    createTabConfig('analysis', 'Analysis', BarChart3, { badge: 3 }),
    createTabConfig('messages', 'Messages', MessageCircle, { badge: 'NEW' }),
    createTabConfig('settings', 'Settings', Settings, { disabled: true })
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        tabConfig={customTabs}
        variant="pills"
        className="bg-gray-100 p-4"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">
          Current View: {currentView}
        </h2>
        <div className="bg-white rounded-lg p-6 shadow">
          Content for {currentView} view goes here...
        </div>
      </div>
    </div>
  );
};

// Example 3: All Variants Showcase
const VariantsShowcaseExample: React.FC = () => {
  const [defaultView, setDefaultView] = useState('draft');
  const [pillsView, setPillsView] = useState('compare');
  const [underlineView, setUnderlineView] = useState('rankings');

  const exampleTabs = DRAFT_TAB_CONFIG.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 space-y-8">
      <div className="bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
        <NavigationTabs
          currentView={defaultView}
          onViewChange={setDefaultView}
          tabConfig={exampleTabs}
          variant="default"
        />
      </div>

      <div className="bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Pills Variant</h3>
        <NavigationTabs
          currentView={pillsView}
          onViewChange={setPillsView}
          tabConfig={exampleTabs}
          variant="pills"
        />
      </div>

      <div className="bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Underline Variant</h3>
        <NavigationTabs
          currentView={underlineView}
          onViewChange={setUnderlineView}
          tabConfig={exampleTabs}
          variant="underline"
        />
      </div>
    </div>
  );
};

// Example 4: Integration with Legacy Component Pattern
const LegacyIntegrationExample: React.FC = () => {
  const [currentView, setCurrentView] = useState('draft');

  // Recreate the exact tabs from the legacy component
  const legacyTabs: TabConfig[] = [
    { id: 'draft', name: 'Draft Board', icon: Users },
    { id: 'compare', name: 'Player Compare', icon: GitCompare },
    { id: 'rankings', name: 'Custom Rankings', icon: BarChart3 },
    { id: 'simulation', name: 'Draft Simulation', icon: Play },
    { id: 'live-data', name: 'Live Data', icon: Globe },
    { id: 'draft-tracker', name: 'Draft Tracker', icon: Eye },
    { id: 'enhanced-ai', name: 'Enhanced AI', icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              🏈 INJUSTICE LEAGUE - Draft Analyzer
            </h1>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <NavigationTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        tabConfig={legacyTabs}
        variant="underline"
        responsive={true}
      />

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'draft' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Draft Board View</h2>
            <p className="text-gray-600">
              This is where the main draft board component would be rendered.
            </p>
          </div>
        )}
        
        {currentView === 'compare' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Player Comparison View</h2>
            <p className="text-gray-600">
              This is where the player comparison tool would be rendered.
            </p>
          </div>
        )}
        
        {currentView === 'rankings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Custom Rankings View</h2>
            <p className="text-gray-600">
              This is where the drag-and-drop rankings would be rendered.
            </p>
          </div>
        )}

        {/* Add other view conditions as needed */}
      </div>
    </div>
  );
};

export {
  BasicNavigationExample,
  CustomNavigationExample,
  VariantsShowcaseExample,
  LegacyIntegrationExample
};