import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Lato', 'sans-serif'],
				'lato': ['Lato', 'sans-serif'],
			},
			// Custom spacing scale based on your design tokens
			spacing: {
				'0': '0px',
				'25': '1px',
				'50': '2px',
				'75': '3px',
				'100': '4px',
				'125': '5px',
				'150': '6px',
				'200': '8px',
				'250': '10px',
				'300': '12px',
				'350': '14px',
				'400': '16px',
				'450': '18px',
				'500': '20px',
				'600': '24px',
				'700': '28px',
				'800': '32px',
				'900': '36px',
				'1000': '40px',
				'1200': '48px',
				'1400': '56px',
				'1600': '64px',
				'1800': '72px',
				'2000': '80px',
				'3000': '120px',
				'4000': '160px',
				'5000': '200px',
			},
			colors: {
				// Brand colors
				brand: {
					25: '#f0fdf9',
					50: '#ecfdf5', 
					100: '#d1fae5',
					200: '#a7f3d0',
					300: '#6ee7b7',
					400: '#34d399',
					500: '#10b981',
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
					950: '#022c22'
				},
				
				// Neutral colors
				neutral: {
					25: '#fcfcfd',
					50: '#f9fafb',
					100: '#f2f4f7',
					200: '#eaecf0',
					300: '#d0d5dd',
					400: '#98a2b3',
					500: '#667085',
					600: '#475467',
					700: '#344054',
					800: '#1d2939',
					900: '#101828',
					950: '#0c111d'
				},
				
				// Error colors
				error: {
					25: '#fffbfa',
					50: '#fef3f2',
					100: '#fee4e2',
					200: '#fecdca',
					300: '#fda29b',
					400: '#f97066',
					500: '#f04438',
					600: '#d92d20',
					700: '#b42318',
					800: '#912018',
					900: '#7a271a',
					950: '#55160c'
				},
				
				// Warning colors
				warning: {
					25: '#fffcf5',
					50: '#fffaeb',
					100: '#fef0c7',
					200: '#fedf89',
					300: '#fec84b',
					400: '#fdb022',
					500: '#f79009',
					600: '#dc6803',
					700: '#b54708',
					800: '#93370d',
					900: '#7a2e0e',
					950: '#4e1d09'
				},
				
				// Information colors
				information: {
					25: '#f5faff',
					50: '#eff8ff',
					100: '#d1e9ff',
					200: '#b2ddff',
					300: '#84caff',
					400: '#53b1fd',
					500: '#2970ff',
					600: '#155eef',
					700: '#004eeb',
					800: '#0040c1',
					900: '#00359e',
					950: '#002266'
				},
				
				// Success colors
				success: {
					25: '#f6fef9',
					50: '#ecfdf3',
					100: '#d1fadf',
					200: '#a6f4c5',
					300: '#6ce9a6',
					400: '#32d583',
					500: '#12b76a',
					600: '#039855',
					700: '#027a48',
					800: '#05603a',
					900: '#054f31',
					950: '#022c22'
				},
				
				// Secondary colors
				secondary: {
					25: '#fafaff',
					50: '#f4f3ff',
					100: '#ebe9fe',
					200: '#d9d6fe',
					300: '#bdb4fe',
					400: '#9b8afb',
					500: '#7a5af8',
					600: '#6938ef',
					700: '#5925dc',
					800: '#4a1fb8',
					900: '#3e1c96',
					950: '#27115f'
				},
				
				// Grey colors
				grey: {
					25: '#fcfcfd',
					50: '#f9fafb',
					100: '#f2f4f7',
					200: '#eaecf0',
					300: '#d0d5dd',
					400: '#98a2b3',
					500: '#667085',
					600: '#475467',
					700: '#344054',
					800: '#1d2939',
					900: '#101828',
					950: '#0c111d'
				},
				
				// Focus color
				focus: {
					100: '#f4f3ff'
				},
				
				// Keep existing shadcn colors for backward compatibility
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				'none': '0px',
				'50': '2px',
				'100': '4px',
				'150': '6px',
				'200': '8px',
				'300': '12px',
				'400': '16px',
				'500': '20px',
				'600': '24px',
				'full': '9999px',
				// Keep existing shadcn radius values
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'sm': '0 1px 2px 0 rgba(152, 162, 179, 0.4), 0 5px 10px 0 rgba(152, 162, 179, 0.2)',
				'md': '0 8px 12px 0 rgba(152, 162, 179, 0.4), 0 2px 4px 0 rgba(152, 162, 179, 0.2)',
				'lg': '0 12px 16px 0 rgba(152, 162, 179, 0.4), 0 4px 6px 0 rgba(152, 162, 179, 0.2)',
				'left': '-12px 0 12px 0 rgba(152, 162, 179, 0.4), -8px 0 6px 0 rgba(152, 162, 179, 0.2)',
				'right': '12px 0 12px 0 rgba(152, 162, 179, 0.4), 4px 0 6px 0 rgba(152, 162, 179, 0.2)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
