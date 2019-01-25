const path = require('path');
const webpack = require('webpack');

module.exports = env => {
	const isProduction = env === 'production';

	console.log('is production', isProduction);

	return {
		mode: isProduction ? 'production' : 'development',
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
			rules: isProduction ? [
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
			] : []
		},

		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production'),
				}
			}),
			new webpack.ProvidePlugin({
				Vue: 'vue'
			}),
		],

		devtool: isProduction ? 'source-map' : 'inline-source-map',

		devServer: {
			contentBase: path.join(__dirname, 'public'),
			historyApiFallback: true,
		}
	};
};