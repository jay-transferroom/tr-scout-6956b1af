import { Report, ReportSectionData } from "@/types/report";

type ReportQuality = 'good' | 'average' | 'poor';

// Sample text responses for different quality levels
const sampleTexts = {
  good: {
    short: "Excellent performance with consistent quality",
    medium: "Demonstrates exceptional ability in this area with strong technical execution and excellent decision-making. Shows maturity beyond his years and consistent performance levels.",
    long: "Outstanding display of technical proficiency and tactical awareness. Consistently makes the right decisions under pressure and demonstrates excellent composure. His physical attributes complement his technical skills perfectly, allowing him to dominate in key moments. Shows great potential for development at the highest level and would be an excellent addition to any squad."
  },
  average: {
    short: "Solid performance with room for growth",
    medium: "Shows decent ability in this area but with noticeable inconsistencies. Has the foundation to improve with proper coaching and more experience at competitive levels.",
    long: "Demonstrates adequate technical skills and tactical understanding for his age and experience level. While there are areas that need refinement, the core fundamentals are present. Can be inconsistent in high-pressure situations but shows flashes of quality. With dedicated development work, could become a reliable player at this level."
  },
  poor: {
    short: "Needs significant improvement",
    medium: "Struggles in this area with frequent mistakes and poor decision-making. Requires substantial development work and may not be suited for the required level of competition.",
    long: "Shows considerable weaknesses in both technical execution and tactical awareness. Decision-making is often poor, particularly under pressure. Physical limitations also impact overall performance. Would require extensive development work with no guarantee of reaching the required standard. Not recommended for recruitment at this time given the investment required versus potential return."
  }
};

// Generate rating value based on quality and rating system
const getRatingValue = (quality: ReportQuality, ratingSystem: any) => {
  if (!ratingSystem) return null;
  
  const options = ratingSystem.options || [];
  if (options.length === 0) return null;
  
  // Find appropriate rating based on quality
  if (quality === 'good') {
    // Return top rating
    return options[options.length - 1].value;
  } else if (quality === 'average') {
    // Return middle rating
    const midIndex = Math.floor(options.length / 2);
    return options[midIndex].value;
  } else {
    // Return low rating (but not the absolute lowest)
    const lowIndex = Math.min(1, options.length - 1);
    return options[lowIndex].value;
  }
};

// Generate numeric value based on quality
const getNumericValue = (quality: ReportQuality) => {
  if (quality === 'good') {
    return Math.floor(Math.random() * 15) + 85; // 85-100
  } else if (quality === 'average') {
    return Math.floor(Math.random() * 20) + 60; // 60-80
  } else {
    return Math.floor(Math.random() * 20) + 40; // 40-60
  }
};

// Generate dropdown value
const getDropdownValue = (quality: ReportQuality, options: string[]) => {
  if (!options || options.length === 0) return null;
  
  if (quality === 'good') {
    return options[options.length - 1];
  } else if (quality === 'average') {
    const midIndex = Math.floor(options.length / 2);
    return options[midIndex];
  } else {
    return options[0];
  }
};

// Get text based on field name and quality
const getTextForField = (fieldName: string, quality: ReportQuality) => {
  const name = fieldName.toLowerCase();
  
  // For summary/verdict/recommendation fields, use long text
  if (name.includes('summary') || name.includes('verdict') || name.includes('recommendation') || name.includes('overall')) {
    return sampleTexts[quality].long;
  }
  
  // For shorter description fields, use medium text
  if (name.includes('description') || name.includes('analysis') || name.includes('assessment')) {
    return sampleTexts[quality].medium;
  }
  
  // For short fields, use short text
  return sampleTexts[quality].short;
};

export const fillReportWithTestData = (
  report: Report,
  template: any,
  quality: ReportQuality
): Report => {
  const updatedSections: ReportSectionData[] = report.sections.map((section) => {
    const templateSection = template.sections.find((ts: any) => ts.id === section.sectionId);
    
    if (!templateSection) return section;
    
    const updatedFields = section.fields.map((field) => {
      const templateField = templateSection.fields.find((tf: any) => tf.id === field.fieldId);
      
      if (!templateField) return field;
      
      let value = null;
      
      switch (templateField.type) {
        case 'text':
        case 'textarea':
          value = getTextForField(templateField.label, quality);
          break;
          
        case 'rating':
          value = getRatingValue(quality, templateField.ratingSystem);
          break;
          
        case 'number':
          value = getNumericValue(quality);
          break;
          
        case 'dropdown':
          value = getDropdownValue(quality, templateField.options || []);
          break;
          
        case 'checkbox':
          value = quality === 'good' ? true : (quality === 'average' ? Math.random() > 0.5 : false);
          break;
          
        default:
          value = null;
      }
      
      return {
        ...field,
        value,
        notes: quality === 'good' ? 'Impressive display' : (quality === 'average' ? 'Needs monitoring' : 'Concerns noted')
      };
    });
    
    return {
      ...section,
      fields: updatedFields
    };
  });
  
  return {
    ...report,
    sections: updatedSections,
    updatedAt: new Date()
  };
};
