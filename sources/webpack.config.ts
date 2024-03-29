import path from 'path'
import type { Configuration } from 'webpack'
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import md5 from 'md5'

const config: Configuration & { devServer: DevServerConfiguration } = {
  mode: "production",
  entry: [path.resolve(__dirname, '../scripts/src/index'), path.resolve(__dirname, "src/App")],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: require.resolve('react-component-injector-loader'),
          options: {
            encrypt: (p: string) => md5(p)
          }
        }, {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              "jsx": "react-jsx",
              "module": "ESNext",
              "sourceMap": true,
              "lib": ["esnext", "dom", "dom.iterable"],
              "target": "es5",
              "importHelpers": true,
              "moduleResolution": "node",
              "experimentalDecorators": true,
              "resolveJsonModule": true,
              "esModuleInterop": true,
              "allowSyntheticDefaultImports": true,
              "downlevelIteration": true,
            }
          }
        }],
        include: [
          path.resolve(__dirname, "src")
        ],
        exclude: /\/node_modules\//
      },
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, '../scripts/src'),
        loader: 'ts-loader',
      }
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  performance: {},
  devtool: false,
  devServer: {
    client: {
      overlay: false
    },
    port: 4000,
  },
  target: "web",
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  optimization: {
    minimize: false,
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
    splitChunks: {
      chunks: 'all',
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/index.html')
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: path.join(require.resolve('react'), '..', 'umd/react.development.js'),
        to: 'react.js',
      },
      {
        from: path.join(require.resolve('react-dom'), '..', 'umd/react-dom.development.js'),
        to: 'react-dom.js',
      }]
    })
  ],
}
export default config