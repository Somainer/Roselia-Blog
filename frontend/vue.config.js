const MonacoEditorWebpackPlugin = require('monaco-editor-webpack-plugin')
const config = require('./src/common/config.js')
process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
    // assetsDir: 'static',
    // assetsDir: 'blog/static',
    assetsDir: `${config.urlPrefix}/static`.replace(/^\/*/g, ''),
    pwa: {
        "name": 'Roselia Blog',
        "themeColor": '#6670ed',
        "msTileColor": '#890f87',
        // "name": 'Mohuety',
        // "themeColor": '#0288d1',
        // "msTileColor": '#6292E9',
        "appleMobileWebAppCapable": "yes",
        "appleMobileWebAppStatusBarStyle": "black"
    },
    productionSourceMap: false,
    configureWebpack: {
        plugins: [
            new MonacoEditorWebpackPlugin({
                languages: [
                    'html', 'javascript', 'typescript', 'markdown'
                ],
                filename: 'unions-road.[name].[contenthash].js'
            })
        ]
    }
}
