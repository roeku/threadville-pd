/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            fontFamily: {
                'typewriter': ['"Courier Prime"', '"Courier New"', 'monospace'],
                'stamp': ['"Special Elite"', 'cursive'],
                'handwriting': ['"Caveat"', 'cursive'],
                'digital': ['"Roboto"', 'sans-serif'],
                'mono-tech': ['"Share Tech Mono"', 'monospace'],
            },
            backgroundImage: {
                'paper-texture': "url('/textures/documents/paper_plain_2.png')",
            }
        },
    },
    plugins: [],
}