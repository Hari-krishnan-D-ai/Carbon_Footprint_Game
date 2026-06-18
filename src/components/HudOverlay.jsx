import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { classifyHealth } from '../utils/gameLogic.js';
import './HudOverlay.css';

const HEALTH_LABEL = {
  thriving: 'Thriving',
  strained: 'Strained',
  critical: 'Critical',
};

function AnimatedNumber({ value, className }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const from = prevValueRef.current;
    const to = Math.round(value);
    prevValueRef.current = to;
    if (from === to) return;

    const duration = 400;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

export default function HudOverlay() {
  const townHallHealth = useGameStore((state) => state.townHallHealth);
  const pollutionFactor = useGameStore((state) => state.pollutionFactor);
  const lastImpact = useGameStore((state) => state.lastImpact);
  const turnHistory = useGameStore((state) => state.turnHistory);
  const plantedTreesCount = useGameStore((state) => state.plantedTreesCount);

  const status = classifyHealth(townHallHealth);

  return (
    <div className="cc-hud-coc" data-status={status}>
      {/* ===== CLASH WIDGETS ROW ===== */}
      <div className="cc-widgets-row">
        {/* Widget 1: Town Hall Health */}
        <div className="cc-widget cc-widget--health">
          <div className="cc-widget__icon-frame">
            <span className="cc-widget__icon">🛡️</span>
          </div>
          <div className="cc-widget__content">
            <div className="cc-widget__info-row">
              <span className="cc-widget__label">TOWN HALL</span>
              <span className="cc-widget__value">
                <AnimatedNumber value={townHallHealth} />/100
              </span>
            </div>
            <div className="cc-widget__bar-track">
              <div
                className="cc-widget__bar-fill cc-widget__bar-fill--health"
                style={{ width: `${townHallHealth}%` }}
              />
              <div className="cc-widget__bar-gloss" />
            </div>
          </div>
        </div>

        {/* Widget 2: Atmosphere Smog */}
        <div className="cc-widget cc-widget--smog">
          <div className="cc-widget__icon-frame">
            <span className="cc-widget__icon">💨</span>
          </div>
          <div className="cc-widget__content">
            <div className="cc-widget__info-row">
              <span className="cc-widget__label">ATMOSPHERE</span>
              <span className="cc-widget__value">
                <AnimatedNumber value={pollutionFactor} />% SMOG
              </span>
            </div>
            <div className="cc-widget__bar-track">
              <div
                className="cc-widget__bar-fill cc-widget__bar-fill--smog"
                style={{ width: `${pollutionFactor}%` }}
              />
              <div className="cc-widget__bar-gloss" />
            </div>
          </div>
        </div>

        {/* Widget 3: Trees Planted */}
        <div className="cc-widget cc-widget--trees">
          <div className="cc-widget__icon-frame">
            <span className="cc-widget__icon">🌳</span>
          </div>
          <div className="cc-widget__content">
            <div className="cc-widget__info-row">
              <span className="cc-widget__label">TREES PLANTED</span>
              <span className="cc-widget__value font-large">
                x{plantedTreesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Widget 4: Village Status */}
        <div className="cc-widget cc-widget--status">
          <div className="cc-widget__icon-frame">
            <span className="cc-widget__icon">👑</span>
          </div>
          <div className="cc-widget__content">
            <div className="cc-widget__info-row">
              <span className="cc-widget__label">VILLAGE STATUS</span>
              <span className={`cc-widget__status-text cc-widget__status-text--${status}`}>
                {HEALTH_LABEL[status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LAST IMPACT FLOATER ===== */}
      {lastImpact && (
        <div className="cc-coc-impact" data-positive={lastImpact.impactScore >= 0}>
          <div className="cc-coc-impact__inner">
            <span className="cc-coc-impact__score">
              {lastImpact.impactScore > 0 ? '+' : ''}
              {lastImpact.impactScore}
            </span>
            <span className="cc-coc-impact__category">{lastImpact.category}</span>
          </div>
        </div>
      )}

      {/* ===== RECENT DEEDS SCROLL ===== */}
      {turnHistory.length > 0 && (
        <div className="cc-coc-deeds">
          <div className="cc-coc-deeds__header">
            <h3>LOG OF DEEDS</h3>
          </div>
          <div className="cc-coc-deeds__list">
            {turnHistory.slice(0, 3).map((turn) => (
              <div
                key={turn.id}
                className="cc-coc-deeds__item"
                data-positive={turn.impactScore >= 0}
              >
                <div className="cc-coc-deeds__score-badge">
                  {turn.impactScore > 0 ? '+' : ''}{turn.impactScore}
                </div>
                <div className="cc-coc-deeds__text">{turn.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
