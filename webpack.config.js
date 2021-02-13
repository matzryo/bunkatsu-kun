const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// productionかdevelopmentを指定する
// npm scriptでの指定が優先される。
const MODE = "development";

// productionのときはソースマップを利用しない
const enabledSourceMap = MODE === "development";

// pages以下のファイルをバンドル対象とする。
const bundlePagePath = './src/js/pages';

// 以下のような形式のオブジェクトを作成する。
// { app: './src/js/pages/app.js', ...}
const entries = glob
        .sync(`${bundlePagePath}/*`)
        .reduce((entries, filepath) => {
          entries[path.parse(filepath).name] = filepath; return entries
        }, {});

module.exports = {
  // 基本的にapp.js, app_admin.jsとapp.cssを使う。
  // ページごとに違いが出てしまった場合、バンドルしたJSを作成する。
  entry: { ...entries },
  output: {
      // dist/bundle.jsに出力
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
  },
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: MODE,
  module: {
    rules: [
      // Sassファイルの読み込みとコンパイル
      {
        // 対象となるファイル
        test: /\.s?css$/i,
        use: [
          // CSSはJSとは別途出力する
          MiniCssExtractPlugin.loader,
          // CSSもWebpackでバンドルする
          {
            loader: "css-loader",
            options: {
              // CSS内のurl()メソッドの取り込みを禁止する
              url: false,
              sourceMap: enabledSourceMap,
              // 0 => no loaders (default);
              // 1 => postcss-loader;
              // 2 => postcss-loader, sass-loader
              importLoaders: 2
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: enabledSourceMap
            }
          }
        ]
      },
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        }
      },
    ]
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    extensions: [
      '.ts', '.js',
    ]
  },
  plugins: [
    // ビルド前にdistの既存ファイルを掃除する
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "app.css",
    }),
  ],
  devtool: "source-map",
};