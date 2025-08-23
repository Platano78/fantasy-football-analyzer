/**
 * NavigationTabs Component
 * 
 * A flexible, responsive navigation solution with multiple styling variants
 * and accessibility features.
 * 
 * Features:
 * - Multiple variants (default, pills, underline)
 * - Responsive design with mobile optimization
 * - Badge support for notifications
 * - Full keyboard navigation and screen reader support
 * - Smooth animations and transitions
 * 
 * @author Team Delta - Component Extraction
 */

import React, { memo, useMemo } from 'react';
import { LucideIcon, Users, GitCompare, BarChart3, Play, Globe, Eye, Brain } from 'lucide-react';
import './NavigationTabs.css';

// Type definitions
export interface TabConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  badge?: number | string;
  disabled?: boolean;
}

export interface NavigationTabsProps {
  currentView: string;
  onViewChange: (view: string) => void;
  tabConfig: TabConfig[];
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  responsive?: boolean;
}

// Pre-configured tab sets
export const DRAFT_TAB_CONFIG: TabConfig[] = [
  { id: 'draft', name: 'Draft Board', icon: Users },
  { id: 'compare', name: 'Player Compare', icon: GitCompare },
  { id: 'rankings', name: 'Custom Rankings', icon: BarChart3 },
  { id: 'simulation', name: 'Draft Simulation', icon: Play },
  { id: 'live-data', name: 'Live Data', icon: Globe },
  { id: 'draft-tracker', name: 'Draft Tracker', icon: Eye },
  { id: 'enhanced-ai', name: 'Enhanced AI', icon: Brain }
];

export const ANALYSIS_TAB_CONFIG: TabConfig[] = [
  { id: 'compare', name: 'Player Compare', icon: GitCompare },
  { id: 'rankings', name: 'Custom Rankings', icon: BarChart3 },
  { id: 'simulation', name: 'Draft Simulation', icon: Play },
  { id: 'enhanced-ai', name: 'Enhanced AI', icon: Brain }
];

export const DEFAULT_TAB_CONFIG: TabConfig[] = DRAFT_TAB_CONFIG;

// Utility function for type-safe tab creation
export const createTabConfig = (
  id: string,
  name: string,
  icon: LucideIcon,
  options: Partial<Pick<TabConfig, 'badge' | 'disabled'>> = {}
): TabConfig => ({
  id,
  name,
  icon,
  ...options
});

/**
 * NavigationTabs Component
 * 
 * Provides a flexible navigation interface with multiple styling variants
 * and full responsive support.
 */
const NavigationTabs: React.FC<NavigationTabsProps> = memo(({
  currentView,
  onViewChange,
  tabConfig = DEFAULT_TAB_CONFIG,
  variant = 'default',
  className = '',
  responsive = true
}) => {
  // Get variant-specific styling classes
  const getVariantClasses = useMemo(() => {
    const baseClasses = {
      container: 'flex items-center',
      tab: 'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 navigation-tab',
      activeTab: '',
      inactiveTab: ''
    };

    switch (variant) {
      case 'pills':
        return {
          ...baseClasses,
          container: `${baseClasses.container} gap-2 p-2`,
          tab: `${baseClasses.tab} rounded-full`,
          activeTab: 'bg-blue-600 text-white shadow-lg',
          inactiveTab: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        };
      
      case 'underline':
        return {
          ...baseClasses,
          container: `${baseClasses.container} border-b border-gray-200`,
          tab: `${baseClasses.tab} border-b-2 border-transparent`,
          activeTab: 'border-blue-600 text-blue-600',
          inactiveTab: 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
        };
      
      default: // 'default'
        return {
          ...baseClasses,
          container: `${baseClasses.container} gap-1 bg-gray-100 rounded-lg p-1`,
          tab: `${baseClasses.tab} rounded-md`,
          activeTab: 'bg-white text-gray-900 shadow-sm',
          inactiveTab: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        };
    }
  }, [variant]);

  const containerClasses = `navigation-tabs-container ${getVariantClasses.container} ${className} ${
    responsive ? 'overflow-x-auto sm:overflow-x-visible' : ''
  }`;

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (!disabled) {
      onViewChange(tabId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, tabId: string, disabled?: boolean) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      onViewChange(tabId);
    }
  };

  return (
    <nav className={containerClasses} role="tablist" aria-label="Main navigation">
      {tabConfig.map((tab) => {
        const isActive = currentView === tab.id;
        const isDisabled = tab.disabled;
        
        const tabClasses = `
          ${getVariantClasses.tab}
          ${isActive ? getVariantClasses.activeTab : getVariantClasses.inactiveTab}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${responsive ? 'min-w-max sm:min-w-0' : ''}
        `.trim();

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={tabClasses}
            onClick={() => handleTabClick(tab.id, isDisabled)}
            onKeyDown={(e) => handleKeyDown(e, tab.id, isDisabled)}
            disabled={isDisabled}
            title={tab.name}
          >
            <tab.icon 
              className={`w-5 h-5 ${responsive ? 'sm:w-4 sm:h-4' : 'w-4 h-4'}`}
              aria-hidden="true"
            />
            
            <span className={responsive ? 'hidden sm:inline' : ''}>
              {tab.name}
            </span>
            
            {tab.badge && (
              <span 
                className="navigation-badge inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5"
                aria-label={`${typeof tab.badge === 'number' ? tab.badge : ''} notifications`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
});

NavigationTabs.displayName = 'NavigationTabs';

export default NavigationTabs;