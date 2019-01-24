const path = require('path');
const webpack = require('webpack');

module.exports = {
	mode: 'production',
	entry: {
		index: path.resolve(__dirname, 'src', 'app.js'),
		polyfills: path.resolve(__dirname, 'src', 'polyfills.js'),
	},

	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'js/bundle.js',
		filename: 'js/[name].bundle.js',
	},

	resolve: {
		alias: {
			vue: 'vue/dist/vue.js'
		}
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},

	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				// This has effect on the react lib size
				'NODE_ENV': JSON.stringify('production'),
			}
		}),
		new webpack.ProvidePlugin({
			Vue: 'vue'
		}),
	]
};