import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import './NpcDialogue.css';

const BARBARIAN_AUTO_DISMISS_MS = 6500;

/* ===== SARAH — SVG Animated Character ===== */

function SarahAvatar({ mood }) {
  // Skin and feature colors
  const skinColor = '#fdbcb4';
  const hairColor = '#8B4513';
  const eyeColor = '#2d5a27';
  const mouthHappy = 'M 35,52 Q 40,58 45,52';
  const mouthWorried = 'M 35,55 Q 40,50 45,55';
  const mouthCelebrating = 'M 33,52 Q 40,60 47,52';
  const mouthNeutral = 'M 36,53 L 44,53';

  const getMouth = () => {
    switch (mood) {
      case 'celebrating': return mouthCelebrating;
      case 'worried': return mouthWorried;
      case 'happy': return mouthHappy;
      default: return mouthNeutral;
    }
  };

  // Eye variation based on mood
  const eyeHeight = mood === 'worried' ? 3 : 3.5;
  const eyeBrowOffset = mood === 'worried' ? -1 : 0;

  return (
    <svg
      className={`cc-sarah__avatar cc-sarah__avatar--${mood}`}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hair (back layer) */}
      <ellipse cx="40" cy="32" rx="22" ry="24" fill={hairColor} />
      {/* Hair sides flowing down */}
      <path d="M 18,32 Q 14,55 20,70 L 24,68 Q 22,52 22,36 Z" fill={hairColor} />
      <path d="M 62,32 Q 66,55 60,70 L 56,68 Q 58,52 58,36 Z" fill={hairColor} />

      {/* Face */}
      <ellipse cx="40" cy="38" rx="17" ry="19" fill={skinColor} />

      {/* Hair (front bangs) */}
      <path
        d="M 23,28 Q 28,15 40,14 Q 52,15 57,28 Q 52,22 40,21 Q 28,22 23,28 Z"
        fill={hairColor}
      />

      {/* Eyes */}
      <ellipse cx="33" cy="36" rx="2.5" ry={eyeHeight} fill="white" />
      <ellipse cx="47" cy="36" rx="2.5" ry={eyeHeight} fill="white" />
      <ellipse cx="33.5" cy="36.5" rx="1.5" ry="1.8" fill={eyeColor} />
      <ellipse cx="47.5" cy="36.5" rx="1.5" ry="1.8" fill={eyeColor} />
      {/* Pupils */}
      <circle cx="34" cy="36.5" r="0.8" fill="#1a1a1a" />
      <circle cx="48" cy="36.5" r="0.8" fill="#1a1a1a" />
      {/* Eye shine */}
      <circle cx="34.5" cy="35.5" r="0.5" fill="white" opacity="0.8" />
      <circle cx="48.5" cy="35.5" r="0.5" fill="white" opacity="0.8" />

      {/* Eyebrows */}
      <path
        d={`M 29,${32 + eyeBrowOffset} Q 33,${29 + eyeBrowOffset} 37,${31 + eyeBrowOffset}`}
        stroke="#5a3a1a"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M 43,${31 + eyeBrowOffset} Q 47,${29 + eyeBrowOffset} 51,${32 + eyeBrowOffset}`}
        stroke="#5a3a1a"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Nose */}
      <path d="M 39,40 Q 40,43 41,40" stroke="#e8a090" strokeWidth="0.8" fill="none" />

      {/* Mouth */}
      <path d={getMouth()} stroke="#d4736a" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="28" cy="44" rx="3.5" ry="2" fill="#ffb4a2" opacity="0.4" />
      <ellipse cx="52" cy="44" rx="3.5" ry="2" fill="#ffb4a2" opacity="0.4" />

      {/* Neck */}
      <rect x="36" y="56" width="8" height="6" rx="2" fill={skinColor} />

      {/* Body/shirt */}
      <path
        d="M 25,62 Q 25,58 36,58 L 44,58 Q 55,58 55,62 L 58,85 Q 55,90 40,90 Q 25,90 22,85 Z"
        fill="#22c55e"
      />
      {/* Shirt collar */}
      <path
        d="M 36,58 Q 40,64 44,58"
        stroke="#16a34a"
        strokeWidth="1"
        fill="none"
      />
      {/* Leaf emblem on shirt */}
      <path
        d="M 37,72 Q 40,66 43,72 Q 40,74 37,72 Z"
        fill="#16a34a"
        opacity="0.7"
      />

      {/* Arms */}
      <path d="M 25,63 Q 18,70 20,80" stroke={skinColor} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 55,63 Q 62,70 60,80" stroke={skinColor} strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Celebration sparkles (only when celebrating) */}
      {mood === 'celebrating' && (
        <>
          <circle cx="12" cy="20" r="2" fill="#fbbf24" className="cc-sarah__sparkle" />
          <circle cx="68" cy="15" r="1.5" fill="#fbbf24" className="cc-sarah__sparkle cc-sarah__sparkle--delay" />
          <circle cx="8" cy="45" r="1.5" fill="#fbbf24" className="cc-sarah__sparkle cc-sarah__sparkle--delay2" />
          <circle cx="72" cy="40" r="2" fill="#fbbf24" className="cc-sarah__sparkle" />
          <path d="M 14,12 L 16,8 L 18,12 L 14,12 Z" fill="#22c55e" className="cc-sarah__sparkle cc-sarah__sparkle--delay" />
          <path d="M 64,8 L 66,4 L 68,8 L 64,8 Z" fill="#22c55e" className="cc-sarah__sparkle cc-sarah__sparkle--delay2" />
        </>
      )}
    </svg>
  );
}

/* ===== Sarah Guide (replaces VillagerGuide) ===== */

function SarahGuide() {
  const hasOnboarded = useGameStore((state) => state.hasOnboarded);
  const completeOnboarding = useGameStore((state) => state.completeOnboarding);
  const sarahMood = useGameStore((state) => state.sarahMood);
  const lastImpact = useGameStore((state) => state.lastImpact);
  const townHallHealth = useGameStore((state) => state.townHallHealth);
  const [showText, setShowText] = useState(false);

  // Typing reveal effect
  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Dynamic message based on mood/state
  const getMessage = () => {
    if (!hasOnboarded) {
      return "Hi! I'm Sarah 🌱 Welcome to our village! Tell me what you did today — biked to work, composted your scraps — and watch our Town Hall respond!";
    }
    switch (sarahMood) {
      case 'celebrating':
        return `Amazing! +${lastImpact?.impactScore ?? 0} for the village! 🎉 The Town Hall is glowing!`;
      case 'worried':
        return `Oh no... the village felt that. ${lastImpact?.remedy ?? 'We need to do better!'} 😟`;
      case 'happy':
        return `Great job! Every green choice makes our village stronger! 💚`;
      default:
        return `The Town Hall stands at ${Math.round(townHallHealth)}%. What will you do today?`;
    }
  };

  const displayMood = hasOnboarded ? sarahMood : 'happy';

  return (
    <div className={`cc-overlay cc-sarah cc-sarah--${displayMood}`}>
      <div className="cc-sarah__container">
        {/* Sarah's avatar */}
        <div className="cc-sarah__avatar-wrap">
          <SarahAvatar mood={displayMood} />
          <div className="cc-sarah__name-tag">Sarah</div>
        </div>

        {/* Speech bubble */}
        <div className="cc-sarah__bubble">
          <div className="cc-sarah__bubble-arrow" />
          <p className={`cc-sarah__text ${showText ? 'cc-sarah__text--visible' : ''}`}>
            {getMessage()}
          </p>
          {!hasOnboarded && (
            <button
              className="cc-sarah__action-btn"
              onClick={completeOnboarding}
              type="button"
            >
              Let's go! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Barbarian Alert (redesigned) ===== */

function BarbarianAlert({ alert, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(alert.id), BARBARIAN_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  return (
    <div className="cc-overlay cc-barbarian">
      <div className="cc-barbarian__panel">
        <div className="cc-barbarian__header">
          <span className="cc-barbarian__icon">⚔️</span>
          <span className="cc-barbarian__name">Barbarian Guard</span>
        </div>
        <p className="cc-barbarian__headline">{alert.headline}</p>
        <p className="cc-barbarian__text">{alert.remedy}</p>
        <div className="cc-barbarian__timer" />
        <button
          className="cc-barbarian__dismiss"
          onClick={() => onDismiss(alert.id)}
          type="button"
        >
          ⚡ Acknowledged
        </button>
      </div>
    </div>
  );
}

/* ===== Main NPC Dialogue Controller ===== */

export default function NpcDialogue() {
  const npcAlertQueue = useGameStore((state) => state.npcAlertQueue);
  const dismissAlert = useGameStore((state) => state.dismissAlert);

  // Surface one Barbarian alert at a time so warnings don't stack.
  const activeAlert = npcAlertQueue[0] ?? null;

  return (
    <>
      <SarahGuide />
      {activeAlert && <BarbarianAlert alert={activeAlert} onDismiss={dismissAlert} />}
    </>
  );
}
