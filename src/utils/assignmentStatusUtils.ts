// Assignment-based status determination logic for Scout Management
// This shows one row per scout assignment instead of one row per player

export type AssignmentStatus = 'marked_for_scouting' | 'assigned' | 'in_progress' | 'completed' | 'reviewed';

export interface AssignmentStatusInfo {
  status: AssignmentStatus;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  scoutName?: string;
}

interface AssignmentStatusParams {
  assignment: any;
  reports: any[];
  playerId: string;
}

export const determineAssignmentStatus = ({
  assignment,
  reports,
  playerId
}: AssignmentStatusParams): AssignmentStatusInfo => {
  
  // Check if this specific scout has submitted a report for this player
  const scoutReport = reports.find(report => 
    report.playerId === playerId && report.scoutId === assignment.assigned_to_scout_id
  );
  
  const scoutName = assignment.assigned_to_scout ? 
    `${assignment.assigned_to_scout.first_name || ''} ${assignment.assigned_to_scout.last_name || ''}`.trim() || 
    assignment.assigned_to_scout.email : 
    'Unknown Scout';
  
  // If scout has submitted a report, assignment is completed
  if (scoutReport) {
    return {
      status: 'completed',
      label: 'Report Submitted',
      variant: 'outline',
      className: 'bg-green-100 text-green-800 border-0',
      scoutName
    };
  }
  
  // Otherwise, use the assignment's current status
  const statusLabels: { [key: string]: string } = {
    'assigned': 'Assigned',
    'in_progress': 'In Progress',
    'reviewed': 'Under Review'
  };
  
  const statusColors: { [key: string]: string } = {
    'assigned': 'bg-red-100 text-red-800',
    'in_progress': 'bg-orange-100 text-orange-800',
    'reviewed': 'bg-blue-100 text-blue-800'
  };
  
  return {
    status: assignment.status as AssignmentStatus,
    label: statusLabels[assignment.status] || 'Assigned',
    variant: 'outline',
    className: `${statusColors[assignment.status] || statusColors.assigned} border-0`,
    scoutName
  };
};

// Helper function to get kanban column for assignment
export const getAssignmentKanbanStatus = (statusInfo: AssignmentStatusInfo): 'shortlisted' | 'assigned' | 'completed' => {
  switch (statusInfo.status) {
    case 'marked_for_scouting':
      return 'shortlisted';
    case 'completed':
      return 'completed';
    case 'assigned':
    case 'in_progress':
    case 'reviewed':
    default:
      return 'assigned';
  }
};

// Create assignment-based kanban data structure
export const transformToAssignmentBased = (
  assignments: any[],
  allPlayers: any[],
  reports: any[],
  scoutingAssignmentList: any,
  selectedScout: string,
  searchTerm: string
) => {
  const kanbanData = {
    shortlisted: [] as any[],
    assigned: [] as any[],
    completed: [] as any[]
  };

  // Process each assignment as a separate row
  assignments.forEach(assignment => {
    // Apply scout filter
    if (selectedScout !== "all" && assignment.assigned_to_scout_id !== selectedScout) {
      return;
    }

    // Find player data
    const playerData = allPlayers.find(p => {
      const playerIdStr = p.isPrivatePlayer ? p.id : p.id.toString();
      return playerIdStr === assignment.player_id;
    });

    if (!playerData) return;

    const playerName = playerData.name || 'Unknown Player';
    const club = playerData.club || 'Unknown Club';

    // Apply search filter
    if (searchTerm && !playerName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !club.toLowerCase().includes(searchTerm.toLowerCase())) {
      return;
    }

    // Determine assignment status
    const statusInfo = determineAssignmentStatus({
      assignment,
      reports,
      playerId: assignment.player_id
    });

    const kanbanStatus = getAssignmentKanbanStatus(statusInfo);
    const scoutName = statusInfo.scoutName || 'Unknown Scout';

    // Find the report for this assignment if completed
    const scoutReport = reports.find(report => 
      report.playerId === assignment.player_id && report.scoutId === assignment.assigned_to_scout_id
    );

    const assignmentData = {
      id: assignment.id,
      playerName,
      club,
      position: playerData.positions?.[0] || 'Unknown',
      rating: playerData.transferroomRating?.toFixed(1) || 'N/A',
      assignedTo: scoutName,
      updatedAt: getUpdatedTime(statusInfo.status),
      lastStatusChange: getLastStatusChange(statusInfo.status, assignment.updated_at || new Date().toISOString()),
      avatar: playerData.image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format`,
      priority: assignment.priority || null,
      deadline: assignment.deadline || null,
      scoutId: assignment.assigned_to_scout_id,
      status: statusInfo.status,
      playerId: assignment.player_id,
      assignmentId: assignment.id,
      templateName: scoutReport?.templateName || null
    };

    kanbanData[kanbanStatus].push(assignmentData);
  });

  // Add players marked for scouting (but not assigned) to shortlisted column
  const scoutingAssignmentPlayerIds = new Set<string>(
    (scoutingAssignmentList?.playerIds || [])
      .filter((id): id is string => typeof id === 'string')
      .filter(id => !assignments.some(a => a.player_id === id))
  );

  scoutingAssignmentPlayerIds.forEach(playerId => {
    // Find player data
    const playerData = allPlayers.find(p => {
      const playerIdStr = p.isPrivatePlayer ? p.id : p.id.toString();
      return playerIdStr === playerId;
    });

    if (!playerData) return;

    const playerName = playerData.name || 'Unknown Player';
    const club = playerData.club || 'Unknown Club';

    // Apply search filter
    if (searchTerm && !playerName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !club.toLowerCase().includes(searchTerm.toLowerCase())) {
      return;
    }

    // Skip if scout filter is applied (unassigned players don't have scouts)
    if (selectedScout !== "all") {
      return;
    }

    const shortlistedData = {
      id: `scouting-assignment-${playerId}`,
      playerName,
      club,
      position: playerData.positions?.[0] || 'Unknown',
      rating: playerData.transferroomRating?.toFixed(1) || 'N/A',
      assignedTo: 'Unassigned',
      updatedAt: '1 day ago',
      lastStatusChange: 'Marked for scouting',
      avatar: playerData.image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format`,
      priority: null,
      deadline: null,
      scoutId: null,
      status: 'marked_for_scouting',
      playerId,
      assignmentId: null
    };

    kanbanData.shortlisted.push(shortlistedData);
  });

  return kanbanData;
};

const getUpdatedTime = (status: string) => {
  const times = {
    'assigned': '2 days ago',
    'in_progress': '5 hours ago', 
    'completed': '1 week ago',
    'reviewed': '3 days ago'
  };
  return times[status as keyof typeof times] || '1 day ago';
};

const getLastStatusChange = (status: string, updatedAt: string) => {
  const timeDiff = new Date().getTime() - new Date(updatedAt).getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
  
  let timeAgo = '';
  if (daysDiff > 0) {
    timeAgo = `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
  } else if (hoursDiff > 0) {
    timeAgo = `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} ago`;
  } else {
    timeAgo = 'Just now';
  }

  const statusLabels = {
    'assigned': 'Assigned',
    'in_progress': 'In Progress', 
    'completed': 'Completed',
    'reviewed': 'Under review'
  };
  
  return `${statusLabels[status as keyof typeof statusLabels] || 'Updated'} ${timeAgo}`;
};
