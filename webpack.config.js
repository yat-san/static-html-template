const path = require("path");
const fs = require("fs");

const webpack = require("webpack");
const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const Imagemin = require("imagemin-webpack");
const pagesPath = path.resolve(__dirname, "src/pages");

function getPages() {
  return fs.readdirSync(pagesPath);
}

module.exports = function (env) {
  return {
    mode: env.production ? "production" : "development",
    entry: {
      main: [
        path.resolve(__dirname, "src/js/main.js"),
        path.resolve(__dirname, "src/styles/main.scss")
      ],
      libs: [
        /* Add here IDs of needed modules and they will concatenate into files libs.js and libs.css */
        require.resolve("jquery")
      ]
    },
    output: {
      path: path.resolve(__dirname, "dist/"),
      publicPath: env.production ? "./" : "/",
      filename: "js/[name].js"
    },
    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.njk$/,
              use: [
                "html-loader",
                {
                  loader: "shiny-nunjucks-loader",
                  options: {
                    filters: path.resolve(
                      __dirname,
                      "nunjucks-helpers/filters.js"
                    ),
                    extensions: path.resolve(
                      __dirname,
                      "nunjucks-helpers/extentions.js"
                    ),
                    globals: path.resolve(
                      __dirname,
                      "nunjucks-helpers/globals.js"
                    )
                  }
                }
              ]
            },
            {
              test: /\.js$/,
              use: [
                {
                  loader: "babel-loader",
                  options: {
                    exclude: [/node_modules/],
                    presets: [
                      [
                        "@babel/preset-env",
                        {modules: false, useBuiltIns: "usage", corejs: 3}
                      ]
                    ]
                  }
                }
              ]
            },
            {
              test: /\.s?css$/,
              sideEffects: true,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    publicPath: '../',
                    hmr: !env.production
                  }
                },
                {
                  loader: require.resolve("css-loader"),
                  options: {importLoaders: 2}
                },
                {
                  loader: require.resolve("postcss-loader"),
                  options: {
                    ident: "postcss",
                    sourceMap: true
                  }
                },
                {
                  loader: require.resolve("resolve-url-loader"),
                  options: {
                    sourceMap: true
                  }
                },
                {
                  loader: require.resolve("sass-loader"),
                  options: {
                    implementation: require("sass"),
                    sourceMap: true
                  }
                }
              ]
            },
            {
              loader: "file-loader",
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                outputPath: "images",
                name: "[path][name].[ext]",
                context: "images"
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new Imagemin({
        bail: false, // Ignore errors on corrupted images
        cache: false,
        imageminOptions: {
          // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them

          // Lossless optimization with custom option
          // Feel free to experiment with options for better result for you
          plugins: [
            ["gifsicle", {interlaced: true}],
            ["jpegtran", {progressive: true}],
            ["optipng", {optimizationLevel: 5}],
            [
              "svgo",
              {
                options: require("./svgo.config"),
                plugins: [
                  {
                    removeViewBox: false
                  }
                ]
              }
            ]
          ]
        }
      })]
      .concat(
        getPages()
          .map(page => {
            return new HtmlPlugin({
              inject: true,
              template: path.join(pagesPath, page),
              filename: page.replace("njk", "html")
            });
          })
          .concat([
            new MiniCssExtractPlugin({
              filename: "styles/styles.css"
            })
            // env.development && new webpack.HotModuleReplacementPlugin()
          ])
          .filter(Boolean),
      ),
    node: {
      module: "empty",
      dgram: "empty",
      dns: "mock",
      fs: "empty",
      http2: "empty",
      net: "empty",
      tls: "empty",
      child_process: "empty"
    },
    devServer: {
      compress: true,
      contentBase: path.resolve(__dirname, "./dist"),
      watchContentBase: true
    },
    target: "web"
  };
};
