#!/usr/bin/env node
const fs = require("fs");
const UglifyJS = require("uglify-es");
const path = require("path");
const argv = require("argv");
let args = argv.option([
    {
        name: "source",
        short: "s",
        type: "string",
        description: "Source js path"
    },
    {
        name: "destination",
        short: "d",
        type: "string",
        description: "Path of compressed js files."
    }
]).run().options;
let jsPath = args.source || path.join("..", "static_assets");
let digestPath = args.destination || jsPath.replace("static_assets", "static");
const options = undefined;
function crawlFile(dir, callback){
    return (new Promise(function(resolve, reject){
        fs.readdir(dir, (err, files) =>
            err ? reject(err) : resolve(files)
        )
    })).then(files => {
        files.forEach(f => {
            let absPath = path.join(dir, f);
            fs.stat(absPath, (err, stats) => {
                if(err) return console.error(err);
                stats.isFile() ? callback(absPath) : crawlFile(absPath, callback);
            })
        })
    }).catch(console.error);
}
console.log("Building assets...", jsPath, "=>", digestPath);
crawlFile(jsPath, f => {
    if(!f.toLowerCase().endsWith(".js") || f.toLowerCase().endsWith(".min.js")) return false;
    console.log("   Building:", f);
    return (new Promise(function(resolve, reject){
        fs.readFile(f, (err, data) => err?reject(err):resolve(data))
    })).then(data => {
        return '"use strict";' + UglifyJS.minify(data.toString(), options).code;
    }).then(buf => {
        //console.log(`${f}.replace("${jsPath}", "${digestPath}") =`, f.replace(jsPath, digestPath))
        console.log("   Writing to ", f.replace(jsPath, digestPath))
        fs.writeFile(f.replace(jsPath, digestPath), buf, e => e && console.error(e))
    }).catch(console.error);
});