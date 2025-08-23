import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Player, ScoringSystem } from '../../types/PlayerTypes';

// Import comparison view components (these would be imported from extracted components)
// import { StatsComparisonView } from './comparison/StatsComparisonView';
// import { TierAnalysisView } from './comparison/TierAnalysisView';
// import { ValueADPView } from './comparison/ValueADPView';
// import { RecommendationView } from './comparison/RecommendationView';

export type ComparisonViewType = 'stats' | 'tiers' | 'value' | 'recommendations';

export interface PlayerComparisonModalProps {
  isOpen: boolean;
  players: Player[];
  scoringSystem: ScoringSystem;
  comparisonView: ComparisonViewType;
  onClose: () => void;
  onViewChange: (view: ComparisonViewType) => void;
  onExport: () => void;
}

const COMPARISON_TABS = [
  { id: 'stats' as const, label: 'Stats Comparison', icon: '📊' },
  { id: 'tiers' as const, label: 'Tier Analysis', icon: '🏆' },
  { id: 'value' as const, label: 'Value & ADP', icon: '💰' },
  { id: 'recommendations' as const, label: 'Recommendations', icon: '💡' },
];

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({
  isOpen,
  players,
  scoringSystem,
  comparisonView,
  onClose,
  onViewChange,
  onExport,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      // Focus the first focusable element after animation
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 150);
    } else {
      document.body.style.overflow = 'auto';
      setIsAnimating(false);
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'Tab':
        // Trap focus within modal
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
        break;
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle overlay click to close
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle tab change with keyboard support
  const handleTabKeyDown = (event: React.KeyboardEvent, tabId: ComparisonViewType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onViewChange(tabId);
    }
  };

  // Export functionality with accessibility feedback
  const handleExport = useCallback(() => {
    onExport();
    // Could add toast notification here for export confirmation
  }, [onExport]);

  // Render comparison content based on selected view
  const renderComparisonContent = () => {
    switch (comparisonView) {
      case 'stats':
        return (
          <div role="tabpanel" aria-labelledby="tab-stats" className="comparison-content">
            {/* <StatsComparisonView {...contentProps} /> */}
            <div className="placeholder-content">
              <h3>Stats Comparison View</h3>
              <p>Statistical comparison of selected players will be displayed here.</p>
              <p>Players selected: {players.length}</p>
              <p>Scoring system: {scoringSystem}</p>
            </div>
          </div>
        );
      case 'tiers':
        return (
          <div role="tabpanel" aria-labelledby="tab-tiers" className="comparison-content">
            {/* <TierAnalysisView {...contentProps} /> */}
            <div className="placeholder-content">
              <h3>Tier Analysis View</h3>
              <p>Player tier analysis will be displayed here.</p>
            </div>
          </div>
        );
      case 'value':
        return (
          <div role="tabpanel" aria-labelledby="tab-value" className="comparison-content">
            {/* <ValueADPView {...contentProps} /> */}
            <div className="placeholder-content">
              <h3>Value & ADP View</h3>
              <p>Player value and ADP analysis will be displayed here.</p>
            </div>
          </div>
        );
      case 'recommendations':
        return (
          <div role="tabpanel" aria-labelledby="tab-recommendations" className="comparison-content">
            {/* <RecommendationView {...contentProps} /> */}
            <div className="placeholder-content">
              <h3>Recommendations View</h3>
              <p>Player recommendations based on analysis will be displayed here.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isAnimating ? 'modal-overlay--open' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className={`modal-container ${isAnimating ? 'modal-container--open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 id="modal-title" className="modal-title">
              Player Comparison
            </h2>
            <p id="modal-description" className="modal-description">
              Compare {players.length} selected players across different metrics
            </p>
          </div>
          
          <div className="modal-controls">
            <button
              type="button"
              onClick={handleExport}
              className="export-button"
              aria-label="Export comparison data to CSV"
              title="Export to CSV"
            >
              Export CSV
            </button>
            
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={onClose}
              className="close-button"
              aria-label="Close player comparison modal"
              title="Close modal"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation" role="tablist" aria-label="Comparison views">
          {COMPARISON_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              type="button"
              className={`tab-button ${comparisonView === tab.id ? 'tab-button--active' : ''}`}
              aria-selected={comparisonView === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onViewChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              tabIndex={comparisonView === tab.id ? 0 : -1}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="modal-content" id={`tabpanel-${comparisonView}`}>
          {renderComparisonContent()}
        </div>

        {/* Hidden element for focus management */}
        <button
          ref={lastFocusableRef}
          type="button"
          className="sr-only"
          onFocus={() => firstFocusableRef.current?.focus()}
          tabIndex={0}
          aria-hidden="true"
        >
          Focus trap
        </button>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.15s ease-out;
          padding: 1rem;
        }

        .modal-overlay--open {
          opacity: 1;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          transform: scale(0.95) translateY(20px);
          transition: transform 0.15s ease-out;
          overflow: hidden;
        }

        .modal-container--open {
          transform: scale(1) translateY(0);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e5e5;
          background: #f8f9fa;
        }

        .modal-title-section {
          flex: 1;
        }

        .modal-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-description {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .modal-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .export-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease;
          min-height: 44px;
        }

        .export-button:hover {
          background: #2563eb;
        }

        .export-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.5rem;
          border-radius: 4px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .close-button:hover {
          color: #374151;
        }

        .close-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e5e5e5;
          background: #f8f9fa;
          overflow-x: auto;
        }

        .tab-button {
          background: none;
          border: none;
          padding: 1rem 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          min-height: 44px;
          white-space: nowrap;
        }

        .tab-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .tab-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }

        .tab-button--active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: white;
        }

        .tab-icon {
          font-size: 1rem;
        }

        .tab-label {
          flex: 1;
        }

        .modal-content {
          flex: 1;
          overflow: auto;
          padding: 1.5rem;
        }

        .comparison-content {
          min-height: 400px;
        }

        .placeholder-content {
          text-align: center;
          color: #6b7280;
        }

        .placeholder-content h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .placeholder-content p {
          margin: 0.5rem 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0.5rem;
          }

          .modal-header {
            padding: 1rem;
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .modal-controls {
            justify-content: space-between;
          }

          .tab-navigation {
            flex-wrap: wrap;
          }

          .tab-button {
            flex: 1;
            min-width: 0;
            padding: 0.75rem 1rem;
          }

          .modal-content {
            padding: 1rem;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .modal-container {
            border: 2px solid;
          }

          .tab-button--active {
            border-bottom-width: 4px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .modal-overlay,
          .modal-container,
          .export-button,
          .close-button,
          .tab-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PlayerComparisonModal;