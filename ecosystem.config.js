module.exports = {
	apps: [
		{
			name: 'meew-bot',
			script: 'src/index.js',
			env: {
				NODE_ENV: 'production'
			},
			restart_delay: 2000,
			autorestart: true,
			watch: false
		}
	]
};
