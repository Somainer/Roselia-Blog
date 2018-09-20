// import config from '../src/common/config'
// const axios = require('axios')
// const utils = require('../src/common/utils');
// const _ = require('lodash')

const fullPrerender = true
const renderPath = ['/', '/post?p=1']
/*(async fp => {
    if (!fp) return [];
    let data = await axios.get(utils.apiFor('posts'), {limit: 6}).then(x => x.data);
    return [...Array(data.pages).keys()].map(x => x + 1).map(
        p => _.concat([`/?p=${p}`], (await axios.get(utils.apiFor('post', p)).then(x => x.data.data)).map(x => x.id).map(x => `/post?p=${x}`)))
    
})(fullPrerender);*/


module.exports = {
    fullPrerender,
    renderPath
}