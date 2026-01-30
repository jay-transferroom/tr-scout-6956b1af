import { useState, useCallback, useMemo } from "react";
import { Player } from "@/types/player";

export interface PositionPlayerSlot {
  position: string;
  activePlayerId: string;
  alternatePlayerIds: string[];
}

interface UseMultiPlayerPositionsResult {
  positionSlots: PositionPlayerSlot[];
  getPositionData: (position: string) => PositionPlayerSlot | undefined;
  getActivePlayer: (position: string, players: Player[]) => Player | undefined;
  getAllPlayersForPosition: (position: string, players: Player[]) => Player[];
  getPlayerCount: (position: string) => number;
  setActivePlayer: (position: string, playerId: string) => void;
  addPlayerToPosition: (position: string, playerId: string) => void;
  removePlayerFromPosition: (position: string, playerId: string) => void;
  loadFromAssignments: (assignments: Array<{ position: string; player_id: string }>) => void;
  getActiveAssignments: () => Array<{ position: string; player_id: string }>;
  clearAll: () => void;
}

export const useMultiPlayerPositions = (): UseMultiPlayerPositionsResult => {
  const [positionSlots, setPositionSlots] = useState<PositionPlayerSlot[]>([]);

  const getPositionData = useCallback((position: string): PositionPlayerSlot | undefined => {
    return positionSlots.find(slot => slot.position === position);
  }, [positionSlots]);

  const getActivePlayer = useCallback((position: string, players: Player[]): Player | undefined => {
    const slot = positionSlots.find(s => s.position === position);
    if (!slot) return undefined;
    return players.find(p => p.id === slot.activePlayerId);
  }, [positionSlots]);

  const getAllPlayersForPosition = useCallback((position: string, players: Player[]): Player[] => {
    const slot = positionSlots.find(s => s.position === position);
    if (!slot) return [];
    
    const allIds = [slot.activePlayerId, ...slot.alternatePlayerIds];
    return allIds
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [positionSlots]);

  const getPlayerCount = useCallback((position: string): number => {
    const slot = positionSlots.find(s => s.position === position);
    if (!slot) return 0;
    return 1 + slot.alternatePlayerIds.length;
  }, [positionSlots]);

  const setActivePlayer = useCallback((position: string, playerId: string) => {
    setPositionSlots(prev => {
      const existingIndex = prev.findIndex(s => s.position === position);
      
      if (existingIndex === -1) {
        // No existing slot for this position
        return [...prev, { 
          position, 
          activePlayerId: playerId, 
          alternatePlayerIds: [] 
        }];
      }

      const existing = prev[existingIndex];
      
      // If the new active player is already active, no change
      if (existing.activePlayerId === playerId) return prev;
      
      // Swap the active player with the selected one
      const newAlternates = existing.alternatePlayerIds.filter(id => id !== playerId);
      if (existing.activePlayerId) {
        newAlternates.unshift(existing.activePlayerId);
      }

      const updated = [...prev];
      updated[existingIndex] = {
        position,
        activePlayerId: playerId,
        alternatePlayerIds: newAlternates
      };
      return updated;
    });
  }, []);

  const addPlayerToPosition = useCallback((position: string, playerId: string) => {
    setPositionSlots(prev => {
      const existingIndex = prev.findIndex(s => s.position === position);
      
      if (existingIndex === -1) {
        // No existing slot, create new with this player as active
        return [...prev, { 
          position, 
          activePlayerId: playerId, 
          alternatePlayerIds: [] 
        }];
      }

      const existing = prev[existingIndex];
      
      // Check if player is already in this position
      if (existing.activePlayerId === playerId || 
          existing.alternatePlayerIds.includes(playerId)) {
        return prev;
      }

      const updated = [...prev];
      updated[existingIndex] = {
        ...existing,
        alternatePlayerIds: [...existing.alternatePlayerIds, playerId]
      };
      return updated;
    });
  }, []);

  const removePlayerFromPosition = useCallback((position: string, playerId: string) => {
    setPositionSlots(prev => {
      const existingIndex = prev.findIndex(s => s.position === position);
      if (existingIndex === -1) return prev;

      const existing = prev[existingIndex];
      
      if (existing.activePlayerId === playerId) {
        // Removing the active player
        if (existing.alternatePlayerIds.length === 0) {
          // No alternates, remove the slot entirely
          return prev.filter((_, i) => i !== existingIndex);
        }
        
        // Promote the first alternate to active
        const [newActive, ...restAlternates] = existing.alternatePlayerIds;
        const updated = [...prev];
        updated[existingIndex] = {
          position,
          activePlayerId: newActive,
          alternatePlayerIds: restAlternates
        };
        return updated;
      }

      // Removing an alternate
      const updated = [...prev];
      updated[existingIndex] = {
        ...existing,
        alternatePlayerIds: existing.alternatePlayerIds.filter(id => id !== playerId)
      };
      return updated;
    });
  }, []);

  const loadFromAssignments = useCallback((assignments: Array<{ position: string; player_id: string }>) => {
    // Convert simple assignments to position slots (each position gets one active player)
    const slots: PositionPlayerSlot[] = assignments.map(a => ({
      position: a.position,
      activePlayerId: a.player_id,
      alternatePlayerIds: []
    }));
    setPositionSlots(slots);
  }, []);

  const getActiveAssignments = useCallback((): Array<{ position: string; player_id: string }> => {
    return positionSlots.map(slot => ({
      position: slot.position,
      player_id: slot.activePlayerId
    }));
  }, [positionSlots]);

  const clearAll = useCallback(() => {
    setPositionSlots([]);
  }, []);

  return {
    positionSlots,
    getPositionData,
    getActivePlayer,
    getAllPlayersForPosition,
    getPlayerCount,
    setActivePlayer,
    addPlayerToPosition,
    removePlayerFromPosition,
    loadFromAssignments,
    getActiveAssignments,
    clearAll
  };
};
