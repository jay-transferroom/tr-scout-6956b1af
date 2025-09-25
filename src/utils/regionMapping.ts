// Mapping of regions to their constituent nationalities
export const REGION_TO_NATIONALITIES: Record<string, string[]> = {
  'Europe': [
    'England', 'France', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Portugal', 'Belgium',
    'Croatia', 'Poland', 'Ukraine', 'Czech Republic', 'Austria', 'Switzerland', 'Denmark',
    'Sweden', 'Norway', 'Finland', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland',
    'Russia', 'Turkey', 'Greece', 'Serbia', 'Slovenia', 'Slovakia', 'Hungary', 'Romania',
    'Bulgaria', 'Lithuania', 'Latvia', 'Estonia', 'Belarus', 'Bosnia and Herzegovina',
    'North Macedonia', 'Montenegro', 'Albania', 'Moldova', 'Malta', 'Cyprus', 'Luxembourg',
    'Iceland', 'Faroe Islands', 'Andorra', 'Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'
  ],
  'South America': [
    'Brazil', 'Argentina', 'Colombia', 'Peru', 'Venezuela', 'Chile', 'Ecuador', 'Bolivia',
    'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'French Guiana'
  ],
  'North America': [
    'United States', 'Canada', 'Mexico', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua',
    'Costa Rica', 'Panama', 'Belize', 'Jamaica', 'Haiti', 'Dominican Republic', 'Cuba',
    'Trinidad and Tobago', 'Barbados', 'Bahamas', 'Antigua and Barbuda', 'Saint Lucia',
    'Grenada', 'Saint Vincent and the Grenadines', 'Dominica', 'Saint Kitts and Nevis'
  ],
  'Africa': [
    'Nigeria', 'Egypt', 'South Africa', 'Kenya', 'Uganda', 'Tanzania', 'Ghana', 'Morocco',
    'Algeria', 'Tunisia', 'Libya', 'Sudan', 'Ethiopia', 'Somalia', 'Senegal', 'Mali',
    'Burkina Faso', 'Niger', 'Chad', 'Central African Republic', 'Cameroon', 'Equatorial Guinea',
    'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Angola', 'Zambia',
    'Zimbabwe', 'Botswana', 'Namibia', 'Lesotho', 'Swaziland', 'Madagascar', 'Mauritius',
    'Seychelles', 'Comoros', 'Cape Verde', 'São Tomé and Príncipe', 'Guinea', 'Guinea-Bissau',
    'Sierra Leone', 'Liberia', 'Ivory Coast', 'Togo', 'Benin', 'Rwanda', 'Burundi', 'Djibouti',
    'Eritrea', 'Gambia', 'Mauritania', 'Western Sahara', 'Malawi', 'Mozambique'
  ],
  'Asia': [
    'Japan', 'South Korea', 'China', 'India', 'Thailand', 'Vietnam', 'Malaysia', 'Singapore',
    'Indonesia', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Bangladesh', 'Pakistan',
    'Afghanistan', 'Iran', 'Iraq', 'Syria', 'Lebanon', 'Jordan', 'Israel', 'Palestine',
    'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Kuwait',
    'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Mongolia',
    'North Korea', 'Taiwan', 'Hong Kong', 'Macau', 'Brunei', 'East Timor', 'Maldives',
    'Sri Lanka', 'Nepal', 'Bhutan', 'Armenia', 'Azerbaijan', 'Georgia'
  ],
  'Oceania': [
    'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu',
    'Samoa', 'Tonga', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau', 'Marshall Islands',
    'Federated States of Micronesia', 'Cook Islands', 'Niue', 'American Samoa', 'Guam',
    'Northern Mariana Islands', 'French Polynesia', 'New Caledonia', 'Wallis and Futuna'
  ]
};

// Helper function to check if a nationality belongs to a specific region
export const isNationalityInRegion = (nationality: string | undefined, region: string): boolean => {
  if (!nationality || region === 'all') return true;
  
  const regionNationalities = REGION_TO_NATIONALITIES[region];
  if (!regionNationalities) return false;
  
  return regionNationalities.some(nat => 
    nat.toLowerCase() === nationality.toLowerCase() ||
    nationality.toLowerCase().includes(nat.toLowerCase()) ||
    nat.toLowerCase().includes(nationality.toLowerCase())
  );
};