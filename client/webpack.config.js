const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkerPlugin = require('worker-plugin');

const appConfig = {
  mode: 'development',
  entry: {
    app: './src/index.tsx'
  },
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        use: 'worker-loader'
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: 'file-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.wasm']
  },
  devtool: 'inline-source-map',
  devServer: {
    open: true,
    contentBase: './build'
  },
  plugins: [
    new CleanWebpackPlugin(),
    //new WorkerPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'Development'
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build')
  }
};

const workerConfig = {
  entry: "./src/server/pipeline.worker.ts",
  target: "webworker",
  mode: 'development',
  // plugins: [
  //   new WasmPackPlugin({
  //     crateDirectory: path.resolve(__dirname, "../crate-wasm")
  //   })
  // ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".wasm"]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: "worker.js"
  }
};

module.exports = [appConfig, workerConfig];