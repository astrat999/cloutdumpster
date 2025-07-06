import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				'display': ['Playfair Display', 'serif'],
				'body': ['Inter', 'sans-serif']
			},
			colors: {
				'royal': '#8B5CF6',
				'electric': '#22D3EE', 
				'gold': '#FBBF24',
				'velvet': '#1a1625',
				'silk': '#2d2438'
			}
		}
	},

	plugins: [require('daisyui')],
	
	daisyui: {
		themes: [
			{
				luxury: {
					"primary": "#8B5CF6",
					"secondary": "#22D3EE", 
					"accent": "#FBBF24",
					"neutral": "#1a1625",
					"base-100": "#2d2438",
					"base-200": "#1a1625",
					"base-300": "#0f0d14",
					"info": "#22D3EE",
					"success": "#10B981",
					"warning": "#FBBF24",
					"error": "#EF4444",
				}
			}
		]
	}
} as Config;
