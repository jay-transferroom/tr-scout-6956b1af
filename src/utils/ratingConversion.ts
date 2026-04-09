
// Helper function to convert various rating types to numeric for recommendation logic
export const convertRatingToNumeric = (value: any): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Handle letter grades
    const letterGrade = value.trim().toUpperCase();
    switch (letterGrade) {
      case 'A': return 9;
      case 'B': return 7.5;
      case 'C': return 6;
      case 'D': return 4;
      case 'E': return 2;
      default:
        // Try to parse as number
        const numericValue = parseFloat(value);
        return !isNaN(numericValue) ? numericValue : null;
    }
  }
  
  return null;
};

// Reverse mapping: convert a numeric average back to a display value based on the rating system type
export const convertNumericToDisplay = (value: number, displayFormat?: string): string | number => {
  if (!displayFormat || displayFormat === 'numeric') {
    return Math.round(value * 10) / 10;
  }

  if (displayFormat === 'letter') {
    if (value >= 8.5) return 'A';
    if (value >= 7) return 'B';
    if (value >= 5) return 'C';
    if (value >= 3) return 'D';
    return 'E';
  }

  if (displayFormat === 'percentage') {
    return `${Math.round(value)}%`;
  }

  // For custom/unknown formats, return numeric
  return Math.round(value * 10) / 10;
};

// Detect the rating system type from a report's sections
export const detectRatingSystemType = (sections: any): string => {
  if (!sections) return 'numeric';
  
  const parsed = typeof sections === 'string' ? (() => { try { return JSON.parse(sections); } catch { return []; } })() : sections;
  if (!Array.isArray(parsed)) return 'numeric';

  for (const section of parsed) {
    // Check section-level rating system
    if (section.ratingSystem) {
      const rs = section.ratingSystem;
      if (rs.type === 'letter' || rs.name?.toLowerCase().includes('letter')) return 'letter';
      if (rs.type === 'percentage' || rs.name?.toLowerCase().includes('percentage')) return 'percentage';
    }
    
    // Check field values for letter grades
    if (section.fields && Array.isArray(section.fields)) {
      for (const field of section.fields) {
        if (field.value && typeof field.value === 'string') {
          const upper = field.value.trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
            return 'letter';
          }
        }
      }
    }
  }

  return 'numeric';
};
