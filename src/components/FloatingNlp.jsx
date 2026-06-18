import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import './FloatingNlp.css';

const ROTATING_HINTS = [
  'I biked to work instead of driving',
  'I left every light on overnight',
  'I composted my food scraps today',
  'I ordered fast fashion shipped overnight',
  'I switched to a reusable water bottle',
  'I ran the AC all day with the windows open',
  'I planted a tree in the backyard',
  'I took a 30-minute shower',
];

const HINT_ROTATE_MS = 3500;

export default function FloatingNlp() {
  const [inputValue, setInputValue] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [hintFade, setHintFade] = useState(true);
  const [flashType, setFlashType] = useState(null); // 'positive' | 'negative' | null
  const isProcessing = useGameStore((state) => state.isProcessing);
  const lastImpact = useGameStore((state) => state.lastImpact);
  const submitUserAction = useGameStore((state) => state.submitUserAction);
  const inputRef = useRef(null);
  const prevImpactRef = useRef(null);

  // Smooth placeholder rotation with fade.
  useEffect(() => {
    if (inputValue) return;
    const interval = setInterval(() => {
      setHintFade(false);
      setTimeout(() => {
        setHintIndex((i) => (i + 1) % ROTATING_HINTS.length);
        setHintFade(true);
      }, 300);
    }, HINT_ROTATE_MS);
    return () => clearInterval(interval);
  }, [inputValue]);

  // Flash feedback on new impact.
  useEffect(() => {
    if (!lastImpact || lastImpact === prevImpactRef.current) return;
    prevImpactRef.current = lastImpact;
    setFlashType(lastImpact.impactScore >= 0 ? 'positive' : 'negative');
    const timer = setTimeout(() => setFlashType(null), 600);
    return () => clearTimeout(timer);
  }, [lastImpact]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    submitUserAction(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <div className={`cc-overlay cc-nlp ${flashType ? `cc-nlp--flash-${flashType}` : ''}`}>
      <form className="cc-nlp__panel" onSubmit={handleSubmit}>
        <div className="cc-nlp__header">
          <span className="cc-nlp__icon">🌍</span>
          <span className="cc-nlp__eyebrow">What did you do today?</span>
        </div>
        <div className="cc-nlp__input-row">
          <div className="cc-nlp__input-wrap">
            <input
              ref={inputRef}
              id="action-input"
              className={`cc-nlp__input ${hintFade ? '' : 'cc-nlp__input--hint-fading'}`}
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={ROTATING_HINTS[hintIndex]}
              maxLength={200}
              disabled={isProcessing}
              aria-label="Describe a real-world action"
              autoComplete="off"
            />
            {isProcessing && <div className="cc-nlp__spinner" />}
          </div>
          <button
            id="submit-action"
            className="cc-nlp__submit"
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
          >
            {isProcessing ? (
              <span className="cc-nlp__submit-processing">
                <span className="cc-nlp__pulse-dot" />
                Reading…
              </span>
            ) : (
              '⚡ Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
