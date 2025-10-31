import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Shortlist {
  id: string;
  name: string;
  description: string;
  color: string;
  playerIds: string[]; // For compatibility with existing code
  created_at?: string;
  updated_at?: string;
  requirement_id?: string; // For director users
  is_scouting_assignment_list?: boolean; // For the dedicated scouting assignment list
  club_id?: string; // Club association for data isolation
  user_id?: string; // User who created the shortlist
}

export const useShortlists = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load shortlists from database
  const loadShortlists = useCallback(async () => {
    if (!user) {
      setShortlists([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch shortlists filtered by club_id or user_id
      // Users see: their own shortlists + club shortlists + scouting assignment list
      const { data: shortlistsData, error: shortlistsError } = await supabase
        .from('shortlists')
        .select('*')
        .or(`user_id.eq.${user.id},club_id.eq.${profile?.club_id || 'null'},is_scouting_assignment_list.eq.true`)
        .order('created_at', { ascending: true });

      if (shortlistsError) throw shortlistsError;

      console.log('=== LOADING SHORTLISTS ===');
      console.log('Loaded shortlists from DB:', shortlistsData?.length || 0);

      if (!shortlistsData || shortlistsData.length === 0) {
        setShortlists([]);
        setLoading(false);
        return;
      }

      // Fetch player IDs for each shortlist
      const shortlistsWithPlayers = await Promise.all(
        shortlistsData.map(async (shortlist) => {
          const { data: playersData, error: playersError } = await supabase
            .from('shortlist_players')
            .select('player_id')
            .eq('shortlist_id', shortlist.id);

          if (playersError) {
            console.error('Error fetching players for shortlist:', playersError);
            return {
              ...shortlist,
              playerIds: []
            };
          }

          return {
            ...shortlist,
            playerIds: playersData?.map(p => p.player_id) || []
          };
        })
      );

      console.log('Shortlists with players loaded:', shortlistsWithPlayers.map(s => ({ 
        name: s.name, 
        id: s.id, 
        playerCount: s.playerIds?.length || 0 
      })));

      setShortlists(shortlistsWithPlayers);
    } catch (error) {
      console.error('Error loading shortlists:', error);
      toast({
        title: "Error",
        description: "Failed to load shortlists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  // Load shortlists when user changes
  useEffect(() => {
    loadShortlists();
  }, [loadShortlists]);

  const createShortlist = useCallback(async (name: string, description: string = "", playerIds: string[] = [], requirementId?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create shortlists",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Create the shortlist with club_id from user's profile
      const { data: shortlistData, error: shortlistError } = await supabase
        .from('shortlists')
        .insert({
          user_id: user.id,
          club_id: profile?.club_id || null,
          name,
          description: description || `Custom shortlist: ${name}`,
          color: "bg-gray-500",
          requirement_id: requirementId
        })
        .select()
        .single();

      if (shortlistError) throw shortlistError;

      // Add players to the shortlist if provided
      if (playerIds.length > 0) {
        const playerInserts = playerIds.map(playerId => ({
          shortlist_id: shortlistData.id,
          player_id: playerId
        }));

        const { error: playersError } = await supabase
          .from('shortlist_players')
          .insert(playerInserts);

        if (playersError) throw playersError;
      }

      const newShortlist: Shortlist = {
        ...shortlistData,
        playerIds
      };

      setShortlists(prev => [...prev, newShortlist]);
      
      toast({
        title: "Shortlist Created",
        description: `"${name}" has been created successfully`,
      });

      return newShortlist;
    } catch (error) {
      console.error('Error creating shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to create shortlist",
        variant: "destructive"
      });
      return null;
    }
  }, [user, profile, toast]);

  const addPlayerToShortlist = useCallback(async (shortlistId: string, playerId: string) => {
    try {
      const { error } = await supabase
        .from('shortlist_players')
        .insert({
          shortlist_id: shortlistId,
          player_id: playerId
        });

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          toast({
            title: "Player Already Added",
            description: "This player is already in the shortlist",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Update local state
      setShortlists(prev => prev.map(shortlist => {
        if (shortlist.id === shortlistId) {
          const playerIds = shortlist.playerIds || [];
          if (!playerIds.includes(playerId)) {
            return {
              ...shortlist,
              playerIds: [...playerIds, playerId]
            };
          }
        }
        return shortlist;
      }));

      toast({
        title: "Player Added",
        description: "Player has been added to the shortlist",
      });
    } catch (error) {
      console.error('Error adding player to shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to add player to shortlist",
        variant: "destructive"
      });
    }
  }, [toast]);

  const removePlayerFromShortlist = useCallback(async (shortlistId: string, playerId: string) => {
    try {
      console.log('=== REMOVING PLAYER FROM SHORTLIST ===');
      console.log('Shortlist ID:', shortlistId);
      console.log('Player ID:', playerId);
      console.log('Before removal - shortlists state:', shortlists.map(s => ({ id: s.id, name: s.name, playerCount: s.playerIds?.length || 0 })));
      
      const { error } = await supabase
        .from('shortlist_players')
        .delete()
        .eq('shortlist_id', shortlistId)
        .eq('player_id', playerId);

      if (error) throw error;

      console.log('Database deletion successful, refreshing shortlists...');
      
      // Refresh shortlists from database to ensure UI updates
      await loadShortlists();
      
      console.log('After refresh - shortlists reloaded');

      toast({
        title: "Player Removed",
        description: "Player has been removed from the shortlist",
      });
    } catch (error) {
      console.error('Error removing player from shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove player from shortlist",
        variant: "destructive"
      });
    }
  }, [toast, loadShortlists]);

  const getPlayerShortlists = useCallback((playerId: string) => {
    return shortlists.filter(shortlist => {
      const playerIds = shortlist.playerIds || [];
      return playerIds.includes(playerId);
    });
  }, [shortlists]);

  const updateShortlist = useCallback(async (id: string, updates: Partial<Shortlist>) => {
    try {
      const { error } = await supabase
        .from('shortlists')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          requirement_id: updates.requirement_id
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setShortlists(prev => prev.map(shortlist => 
        shortlist.id === id ? { ...shortlist, ...updates } : shortlist
      ));

      toast({
        title: "Shortlist Updated",
        description: "Shortlist has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteShortlist = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setShortlists(prev => prev.filter(shortlist => shortlist.id !== id));

      toast({
        title: "Shortlist Deleted",
        description: "Shortlist has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete shortlist",
        variant: "destructive"
      });
    }
  }, [toast]);

  const getScoutingAssignmentList = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('shortlists')
        .select(`
          *,
          shortlist_players(player_id)
        `)
        .eq('is_scouting_assignment_list', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No scouting assignment list found, create it
          const { data: newList, error: createError } = await supabase
            .from('shortlists')
            .insert({
              user_id: user.id,
              club_id: profile?.club_id || null,
              name: 'Marked for Scouting',
              description: 'Players assigned by scout managers for scouting assessment',
              color: 'bg-orange-500',
              is_scouting_assignment_list: true
            })
            .select()
            .single();

          if (createError) throw createError;
          
          return {
            ...newList,
            playerIds: []
          };
        }
        throw error;
      }

      return {
        ...data,
        playerIds: data.shortlist_players?.map(sp => sp.player_id) || []
      };
    } catch (error) {
      console.error('Error getting scouting assignment list:', error);
      return null;
    }
  }, [user, profile]);

  const addPlayerToScoutingAssignment = useCallback(async (playerId: string) => {
    const scoutingList = await getScoutingAssignmentList();
    if (!scoutingList) {
      toast({
        title: "Error",
        description: "Could not find scouting assignment list",
        variant: "destructive"
      });
      return;
    }

    // When adding to scouting assignment, remove any existing assignments for this player
    try {
      await supabase
        .from('scouting_assignments')
        .delete()
        .eq('player_id', playerId);
      
      console.log(`Removed existing assignments for player ${playerId} when marking for scouting`);
    } catch (error) {
      console.error('Error removing existing assignments:', error);
      // Continue anyway, this is not critical
    }

    await addPlayerToShortlist(scoutingList.id, playerId);
    await loadShortlists(); // Refresh to update UI
  }, [getScoutingAssignmentList, addPlayerToShortlist, loadShortlists, toast]);

  const removePlayerFromScoutingAssignment = useCallback(async (playerId: string) => {
    try {
      const scoutingList = await getScoutingAssignmentList();
      if (!scoutingList) {
        toast({
          title: "Error", 
          description: "Could not find scouting assignment list",
          variant: "destructive"
        });
        return;
      }

      await removePlayerFromShortlist(scoutingList.id, playerId);
      await loadShortlists(); // Refresh to update UI
    } catch (error) {
      console.error('Error removing player from scouting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove player from scouting assignment",
        variant: "destructive"
      });
    }
  }, [getScoutingAssignmentList, removePlayerFromShortlist, loadShortlists, toast]);

  return {
    shortlists,
    loading,
    createShortlist,
    updateShortlist,
    deleteShortlist,
    addPlayerToShortlist,
    removePlayerFromShortlist,
    getPlayerShortlists,
    refreshShortlists: loadShortlists,
    getScoutingAssignmentList,
    addPlayerToScoutingAssignment,
    removePlayerFromScoutingAssignment,
  };
};