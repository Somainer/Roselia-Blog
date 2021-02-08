// const webpack = require('webpack')
const path = require('path')

/** @extends {webpack.Plugin} */
class ManifestPlugin {
    /**
     * @param {webpack.Compiler} compiler
     * */
    apply(compiler) {
        compiler.hooks.emit.tapAsync('ManifestPlugin', (compilation, callback) => {
            const fileNames = {
                javaScripts: [],
                styleSheets: []
            }
            
            for (const name in compilation.assets) {
                const file = path.parse(name)
                if (file.name.startsWith("chunk-vendors.") || file.name.startsWith("app.")) {
                    if (file.ext === ".css") {
                        fileNames.styleSheets.push(name)
                    } else if (file.ext === ".js") {
                        fileNames.javaScripts.push(name)
                    }
                }
                
            }
            
            compilation.assets['required-static-assets.json'] = 
                this.generateFile(JSON.stringify(fileNames), null, 2)
            callback();
        })
    }
    
    generateFile(content) {
        return {
            source: () => content,
            size: () => content.length
        }
    }
}

module.exports = ManifestPlugin
