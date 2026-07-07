import React, { useState, useEffect, useCallback } from 'react';
import './game.css';
import { playerLabel, GEM_COLORS, GEM_ORDER } from './constants';
import PlayerPanel from './PlayerPanel';
import BoardCards  from './BoardCards';
import NoblesCol   from './NoblesCol';
import GemsCol     from './GemsCol';
import BottomBar   from './BottomBar';

const DISCARD_COLORS = [...GEM_ORDER, 'gold'];

export default function GameBoard({ gameState, myPlayerId, send }) {
  const [pendingGems,   setPendingGems]   = useState([]); // gems picked this turn (not yet sent)
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [discardSelections, setDiscardSelections] = useState({}); // color -> count

  // Derived values
  const currentPlayer   = gameState.players[gameState.currentPlayerIndex];
  const currentPlayerId = currentPlayer?.id;
  const isMyTurn        = currentPlayerId === myPlayerId;
  const myPlayer        = gameState.players.find(p => p.id === myPlayerId);

  // Clear local turn state whenever the turn changes
  useEffect(() => {
    setPendingGems([]);
    setSelectedCardId(null);
  }, [gameState.currentPlayerIndex]);

  // Tick every 250ms so the turn countdown stays smooth
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = gameState.turnDeadline
    ? Math.max(0, Math.ceil((gameState.turnDeadline - now) / 1000))
    : null;

  // ── Gem discard-down (triggered when a reserve pushes you over 10 gems) ──
  const myPendingDiscard = gameState.pendingDiscard?.playerId === myPlayerId
    ? gameState.pendingDiscard
    : null;

  useEffect(() => {
    setDiscardSelections({});
  }, [gameState.pendingDiscard]);

  const discardPicked = Object.values(discardSelections).reduce((a, b) => a + b, 0);

  const handleDiscardPick = useCallback((color) => {
    if (!myPendingDiscard) return;
    setDiscardSelections(prev => {
      const have   = myPlayer.gems[color] || 0;
      const picked = prev[color] || 0;
      const total  = Object.values(prev).reduce((a, b) => a + b, 0);
      if (picked >= have || total >= myPendingDiscard.count) return prev;
      return { ...prev, [color]: picked + 1 };
    });
  }, [myPendingDiscard, myPlayer]);

  const handleDiscardUndo = useCallback((color) => {
    setDiscardSelections(prev => {
      const picked = prev[color] || 0;
      if (picked <= 0) return prev;
      return { ...prev, [color]: picked - 1 };
    });
  }, []);

  const handleDiscardConfirm = useCallback(() => {
    if (!myPendingDiscard || discardPicked !== myPendingDiscard.count) return;
    send('game_action', { type: 'discard_gems', gems: discardSelections });
    setDiscardSelections({});
  }, [myPendingDiscard, discardPicked, discardSelections, send]);

  // ── Gem picking ────────────────────────────────────────────
  const handleGemClick = useCallback((color) => {
    if (!isMyTurn || color === 'gold') return;

    setPendingGems(prev => {
      const pool       = gameState.gems;
      const hasDupe    = new Set(prev).size < prev.length; // already have 2-same
      if (prev.length >= 3 || hasDupe) return prev;         // maxed out
      if ((pool[color] || 0) <= 0) return prev;             // pool empty

      if (prev.includes(color)) {
        // Trying to pick 2 of the same color — only valid when:
        //   • this is the only pending gem
        //   • bank originally had ≥4 of this color
        if (prev.length === 1 && (pool[color] || 0) >= 4) {
          return [color, color];
        }
        return prev; // invalid
      }

      return [...prev, color]; // pick a different color
    });
  }, [isMyTurn, gameState.gems]);

  const handleGemReturn = useCallback((index) => {
    setPendingGems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── End turn — send gem picks to server ───────────────────
  const canEndTurn = isMyTurn && pendingGems.length >= 1;

  const handleEndTurn = useCallback(() => {
    if (!canEndTurn) return;
    send('game_action', { type: 'take_gems', gems: pendingGems });
    setPendingGems([]);
  }, [canEndTurn, pendingGems, send]);

  // ── Card selection ─────────────────────────────────────────
  const handleCardSelect = useCallback((card) => {
    if (!card) return;
    setSelectedCardId(prev => (prev === card.id ? null : card.id));
  }, []);

  // ── Card actions ───────────────────────────────────────────
  const handleBuyCard = useCallback((card) => {
    send('game_action', { type: 'buy_card', cardId: card.id });
    setSelectedCardId(null);
    setPendingGems([]);
  }, [send]);

  const handleReserveCard = useCallback((card) => {
    send('game_action', { type: 'reserve_card', cardId: card.id });
    setSelectedCardId(null);
    setPendingGems([]);
  }, [send]);

  if (!myPlayer) return null;

  const winner = gameState.winner
    ? gameState.players.find(p => p.id === gameState.winner)
    : null;

  return (
    // Clicking the board background deselects any selected card
    <div className="game-board" onClick={() => setSelectedCardId(null)}>

      {/* ── Column 1: Player panels ── */}
      <div className="players-col">
        {gameState.players.map((player, idx) => (
          <PlayerPanel
            key={player.id}
            player={player}
            playerIndex={idx}
            isActive={player.id === currentPlayerId}
            myPlayerId={myPlayerId}
            secondsLeft={player.id === currentPlayerId ? secondsLeft : null}
          />
        ))}
      </div>

      {/* ── Column 2: Development cards (tier 3 → tier 1) ── */}
      <BoardCards
        tiers={gameState.tiers}
        isMyTurn={isMyTurn}
        myPlayer={myPlayer}
        selectedCardId={selectedCardId}
        onCardSelect={handleCardSelect}
        onBuy={handleBuyCard}
        onReserve={handleReserveCard}
      />

      {/* ── Column 3: Noble tiles ── */}
      <NoblesCol nobles={gameState.nobles} />

      {/* ── Column 4: Gem tokens ── */}
      <GemsCol
        gems={gameState.gems}
        isMyTurn={isMyTurn}
        pendingGems={pendingGems}
        onGemClick={handleGemClick}
      />

      {/* ── Bottom bar (spans all 4 columns) ── */}
      <BottomBar
        myPlayer={myPlayer}
        pendingGems={pendingGems}
        isMyTurn={isMyTurn}
        canEndTurn={canEndTurn}
        onGemReturn={handleGemReturn}
        onEndTurn={handleEndTurn}
        selectedCardId={selectedCardId}
        onSelectCard={handleCardSelect}
        onBuy={handleBuyCard}
      />

      {/* ── Discard-down overlay (reserve pushed you over 10 gems) ── */}
      {myPendingDiscard && (
        <div className="discard-overlay" onClick={e => e.stopPropagation()}>
          <div className="discard-card">
            <div className="discard-title">Discard {myPendingDiscard.count} gem(s)</div>
            <p className="discard-sub">You're over the 10-gem limit — choose what to return to the bank.</p>
            <div className="discard-gems-row">
              {DISCARD_COLORS.map(color => {
                const have   = myPlayer.gems[color] || 0;
                const picked = discardSelections[color] || 0;
                if (have === 0) return null;
                return (
                  <div key={color} className="discard-gem-col">
                    <div
                      className="discard-gem-circle"
                      style={{ background: GEM_COLORS[color].bg, borderColor: GEM_COLORS[color].border }}
                      onClick={() => handleDiscardPick(color)}
                    >
                      {have - picked}
                    </div>
                    {picked > 0 && (
                      <div className="discard-gem-undo" onClick={() => handleDiscardUndo(color)}>
                        return {picked}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="discard-progress">{discardPicked} / {myPendingDiscard.count} selected</div>
            <button
              className="discard-confirm-btn"
              disabled={discardPicked !== myPendingDiscard.count}
              onClick={handleDiscardConfirm}
            >
              Confirm Discard
            </button>
          </div>
        </div>
      )}

      {/* ── Game-over overlay ── */}
      {gameState.phase === 'ended' && winner && (
        <div className="game-over-overlay">
          <div className="game-over-card" onClick={e => e.stopPropagation()}>
            <div className="game-over-title">Game Over</div>
            <div className="game-over-winner">
              {winner.id === myPlayerId
                ? '🏆 You win!'
                : `${playerLabel(winner.id, myPlayerId)} wins!`}
            </div>
            <ul className="scores-list">
              {gameState.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map(p => (
                  <li key={p.id} className="score-item">
                    <span>{playerLabel(p.id, myPlayerId)}</span>
                    <span style={{ color: '#f0d080', fontWeight: 700 }}>
                      {p.score} pts
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
