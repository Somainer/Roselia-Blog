const MonacoEditorWebpackPlugin = require('monaco-editor-webpack-plugin')
const webpack = require('webpack')
process.env.VUE_APP_VERSION = require('./package.json').version
const fs = require('fs')
const path = require('path')
const ManifestPlugin = require('./src/manifest.js')
const TOML = require('@iarna/toml')
const config = require('./src/common/config.js')
const configPath = path.resolve(__dirname, '..', '..', 'config.toml')
if (fs.existsSync(configPath)) {
    const configFile =
        TOML.parse(fs.readFileSync(configPath))
    config.title = configFile.title
    config.motto = configFile.motto
} else {
    console.warn(`Config file in ${configPath} not found, using default config.`)
}
console.log(`${config.title} - ${config.motto}`)

module.exports = {
    // assetsDir: 'static',
    // assetsDir: 'blog/static',
    assetsDir: `${config.urlPrefix}/static`.replace(/^\/*/g, ''),
    pwa: {
        "name": config.title,
        "themeColor": config.theme.primary,
        "msTileColor": config.theme.secondary,
        // "name": 'Mohuety',
        // "themeColor": '#0288d1',
        // "msTileColor": '#6292E9',
        "appleMobileWebAppCapable": "yes",
        "appleMobileWebAppStatusBarStyle": "black"
    },
    productionSourceMap: false,
    configureWebpack: {
        plugins: [
            new webpack.DefinePlugin({
                'process.env.BLOG_TITLE': `"${config.title}"`,
                'process.env.BLOG_MOTTO': `"${config.motto}"`,
                'process.env.BLOG_LINK': `"${config.link}"`,
                "process.env.BLOG_THEME": JSON.stringify(config.theme)
            }),
            new MonacoEditorWebpackPlugin({
                languages: [
                    'html', 'javascript', 'typescript', 'markdown'
                ],
                filename: 'unions-road.[name].[contenthash].js'
            }),
            new ManifestPlugin()
        ]
    }
}
