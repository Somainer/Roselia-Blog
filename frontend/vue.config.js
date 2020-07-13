const MonacoEditorWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    assetsDir: 'blog/static',
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
