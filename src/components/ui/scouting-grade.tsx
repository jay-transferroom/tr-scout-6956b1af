import * as React from "react"
import { cn } from "@/lib/utils"
import { convertNumericToDisplay } from "@/utils/ratingConversion"

interface ScoutingGradeProps {
  grade: string | number | null;
  className?: string;
  displayFormat?: string; // 'numeric' | 'letter' | 'percentage'
}

const ScoutingGrade = ({ grade, className, displayFormat }: ScoutingGradeProps) => {
  if (grade === null || grade === undefined) return <span className="text-grey-400 text-sm">-</span>;

  // If displayFormat is provided and grade is numeric, convert for display
  let displayValue: string;
  if (displayFormat && typeof grade === 'number') {
    const converted = convertNumericToDisplay(grade, displayFormat);
    displayValue = converted.toString();
  } else {
    displayValue = grade.toString().toUpperCase();
  }
  
  // Determine dot color based on the underlying numeric value
  const getDotColor = (gradeValue: string, rawGrade: string | number) => {
    // Try numeric evaluation first (works for both numeric grades and converted averages)
    const numericGrade = typeof rawGrade === 'number' ? rawGrade : parseFloat(rawGrade.toString());
    
    if (!isNaN(numericGrade)) {
      if (numericGrade >= 8) return 'bg-success-500';
      if (numericGrade >= 6) return 'bg-warning-500';
      return 'bg-error-500';
    }

    // Fall back to letter grade detection
    if (gradeValue.startsWith('A')) return 'bg-success-500';
    if (gradeValue.startsWith('B')) return 'bg-warning-500';
    if (gradeValue.startsWith('C')) return 'bg-error-500';
    
    return 'bg-grey-400';
  };

  const dotColor = getDotColor(displayValue, grade);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", dotColor)} />
      <span className="text-sm font-medium text-grey-900">{displayValue}</span>
    </div>
  );
};

export { ScoutingGrade }
