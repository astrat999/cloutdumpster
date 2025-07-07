import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				display: ['Inter', 'sans-serif'],
				body: ['Inter', 'sans-serif'],
				mono: ['JetBrains Mono', 'Consolas', 'monospace']
			},
			colors: {
				// Minimal aggressive palette
				accent: '#FF2F6E', // Hot pink primary
				text: '#EEEEEE', // Light text
				card: '#111111', // Dark cards

				// Legacy colors for compatibility
				royal: '#8B5CF6', // Deep purple primary
				electric: '#22D3EE', // Cyan electric blue
				gold: '#FBBF24', // Rich gold accent
				velvet: '#1a1625', // Dark purple base
				silk: '#2d2438', // Medium purple
				'neon-pink': '#FF6B9D', // Hot pink accent
				'cyber-green': '#00FF94', // Matrix green
				void: '#0B0A0F', // Deepest black
				plasma: '#B794F6', // Light purple
				chrome: '#E5E7EB' // Light gray chrome
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				float: 'float 6s ease-in-out infinite',
				glow: 'glow 2s ease-in-out infinite alternate',
				drift: 'drift 8s ease-in-out infinite'
			},
			keyframes: {
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				glow: {
					from: { textShadow: '0 0 5px #FF2F6E, 0 0 10px #FF2F6E, 0 0 15px #FF2F6E' },
					to: { textShadow: '0 0 10px #8B5CF6, 0 0 20px #8B5CF6, 0 0 30px #8B5CF6' }
				},
				drift: {
					'0%, 100%': { transform: 'translateX(0px) translateY(0px)' },
					'25%': { transform: 'translateX(5px) translateY(-5px)' },
					'50%': { transform: 'translateX(-3px) translateY(5px)' },
					'75%': { transform: 'translateX(-5px) translateY(-3px)' }
				}
			},
			backdropBlur: {
				xs: '2px'
			},
			boxShadow: {
				neon: '0 0 5px theme(colors.accent), 0 0 20px theme(colors.accent), 0 0 35px theme(colors.accent)'
			}
		}
	},

	plugins: [require('daisyui')],

	daisyui: {
		themes: [
			{
				minimal: {
					primary: '#FF2F6E',
					secondary: '#111111',
					accent: '#EEEEEE',
					neutral: '#000000',
					'base-100': '#000000',
					'base-200': '#111111',
					'base-300': '#222222',
					info: '#22D3EE',
					success: '#00FF94',
					warning: '#FBBF24',
					error: '#FF2F6E'
				}
			}
		]
	}
} as Config;
