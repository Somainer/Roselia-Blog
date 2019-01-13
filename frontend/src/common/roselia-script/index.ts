import * as _ from 'lodash'
import config from '../config'
import utils from '../utils'
import axios from '../ajax-bar-axios'
import {
  PreviewObject, 
  RenderResult, 
  MusicMetaObject,
  RSElementSelector
} from './script-types'
import {summonDialog} from './summonDialog'
import Vue from 'vue';
declare global {
  interface Window {
    APlayer: any
  }
}
function ensureAPlayer(onload) {
  if (!window.APlayer) {
    let playerNode = document.createElement('script')
    let playerStyle = document.createElement('link')
    playerStyle.rel = 'stylesheet'
    playerStyle.href = 'https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.css'
    playerNode.async = true
    playerNode.onload = onload || null

    playerNode.src = 'https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.js'
    document.head.appendChild(playerStyle)
    document.body.appendChild(playerNode)
  }
}
function unescapeToHTML (str) {
  const d = document.createElement('div')
  d.innerHTML = str.replace(/<em>(.*?)<\/em>/, (_, expr) => `*${expr}*`)
  return d.innerText || d.textContent
}

function handleRenderResult(res: RSElementSelector | RSElementSelector[]) {
  if (res instanceof Array) {
    return res.map(handleRenderResult).join('')
  }
  if (res instanceof RenderResult) {
    res = res.template
  }
  if (res instanceof HTMLElement) {
    return res.outerHTML
  }
  if (_.isNumber(res) || _.isString(res)) return res
  return ''
}

function render (template, context, delim) { // A not so naive template engine.
  const funcTemplate = expr => `with(data || {}) { with(data.functions) {return (${expr});}}`
  return template.replace(new RegExp((delim || ['{{', '}}']).join('\\s*?(([\\s\\S]+?))\\s*?'), 'gm'), (_total, expr) => {
    if (!config.enableRoseliaScript) {
      return `<pre><code>${expr}</code></pre>`
    }
    try {
      const bigC = /([a-zA-Z_$]+[a-zA-Z_0-9]*){([\s\S]+)}/.exec(expr)
      let res
      let isSingleCall = false
      if (bigC) {
        let [_inp, fn, ctx] = bigC
        const func = (context[fn] || context.functions[fn])
        if (_.isFunction(func)) {
          res = func(unescapeToHTML(ctx))
          isSingleCall = true
        }
      }
      if (!isSingleCall) {
        expr = unescapeToHTML(expr)
        res = (new Function('data', funcTemplate(expr)))(context)
      }
      return handleRenderResult(res)
    } catch (e) {
      console.log('On rendering:', expr)
      console.error(e)
      return expr
    }
  })
}

function selfish (target, forbid?: string[]) {
  const cache = new WeakMap()
  if (forbid) {
    const err = key => new Proxy({}, {
      get () {
        // console.error(`You are not allowed to access ${key} in this context`)
        return null
      }
    })
    forbid.forEach(k => target[k] = err(k))
  }

  const handler = {
    get (target, key) {
      const value = Reflect.get(target, key)
      if (!_.isFunction(value)) return value
      if (!cache.has(value)) {
        cache.set(value, value.bind(target))
      }
      return cache.get(value)
    }
  }
  return new Proxy(target, handler)
}
class RoseliaRenderer {
  app: any
  context: RoseliaScript
  scriptEvaluator: RoseliaScript
  toInject: any
  constructor (app) {
    this.app = app
    this.scriptEvaluator = new RoseliaScript(app)
    this.context = selfish(this.scriptEvaluator, [
      'window', 'document', 'fetch', 'localStorage', 'seesionStorage', 'XMLHttpRequest'
    ])
  }
  render (template) {
    // if (!config.enableRoseliaScript) return template
    this.scriptEvaluator.pendingFunctions = []
    try {
      this.toInject = this.app
      const result = render(template, this.context, ['(?:Roselia|roselia|r|R){{', '}}'])
      return result
    } catch (e) {
      console.error(e)
      // this.scriptEvaluator.injectEventsOn(this.app)
      return template
    }
    // return render(template, this.context, ['(?:Roselia|roselia|r|R){{', '}}'])
  }

  async renderAsync (template) {
    return new Promise(resolve => resolve(this.render(template))).then(t => {
      // this.scriptEvaluator.injectEventsOn(this.app)
      return t
    })
  }

  renderVue (template) {
    const v = new Vue({
      template: '<div id="rhodonite">' + this.render(template) + '</div>',
      data: this.scriptEvaluator.functions,
      delimiters: ['v{{', '}}']
    })
    this.toInject = v
    // this.injectEvents()
    return v
  }

  async renderVueAsync(template) {
    return new Promise(resolve => resolve(this.renderVue(template)))
  }

  injectEvents () {
    this.scriptEvaluator.injectEventsOn(this.toInject)
  }
}


class RoseliaScript {
  app: any
  customFunctions: object
  functions: object
  askAccess: Map<String, boolean>
  pendingFunctions: (() => void)[]
  mounted: boolean

  constructor (app) {
    this.app = app
    this.customFunctions = {app: null}
    this.functions = selfish(this.customFunctions)
    this.app.$on('postUnload', () => {
      this.customFunctions = {app: null}
      this.functions = selfish(this.customFunctions)
      this.mounted = false
    })
    this.askAccess = new Map
    this.pendingFunctions = []
    this.mounted = false
  }

  then (f) {
    if (this.mounted) this.app.$nextTick(f)
    else this.pendingFunctions.push(f)
  }

  injectEventsOn (app: Vue) {
    // console.log("PF", this.pendingFunctions, this.pendingFunctions.forEach, this.pendingFunctions.map)
    this.pendingFunctions.forEach(async f => app.$nextTick(f))
    this.pendingFunctions = []
    this.mounted = true
  }

  music (meta: MusicMetaObject | Array<MusicMetaObject>, autoplay = false, onPlayerReady = null) {
    ensureAPlayer(() => this.app.$emit('aPlayerLoaded'))
    let id = this.randomID()
    let player
    this.then(_ => {
      const addPlayer = () => {
        const element = document.getElementById(id)
        player = new window.APlayer({
          container: element,
          narrow: false,
          autoplay,
          mutex: true,
          theme: config.theme.accent,
          mode: 'circulation',
          showlrc: 1,
          preload: 'metadata',
          audio: meta
        })
        player.on('loadstart', () => {
          Array.from(element.getElementsByClassName('aplayer-title')).forEach((ev: HTMLElement) => {
            ev.style.color = config.theme.secondary
          })
          onPlayerReady && onPlayerReady(player)
        })
      }
      if (!window.APlayer) {
        this.app.$once('aPlayerLoaded', () => {
          this.then(addPlayer)
        })
      } else {
        this.then(addPlayer)
      }

      this.app.$once('postUnload', () => {
        player.destroy()
      })
    })
    return new RenderResult(`<div id="${id}"></div>`, player)
  }
  heimu (text) {
    const id = this.randomID()
    return new RenderResult(`<span class="heimu" id="${id}">${text}</span>`, id)
  }
  cite (text, pid) {
    return `<a href="post?p=${pid}">${text}</a>`
  }

  randomID (length?) {
    return Number(Math.random().toString().substring(3, length) + Date.now()).toString(36)
  }

  onceLoad (fn) {
    this.app.$once('postLoaded', fn)
  }

  onceUnload (fn) {
    this.app.$once('postUnload', fn)
  }

  btn (text, onClick, externalClasses: Array<String>|String = '') {
    const id = this.randomID()
    if (externalClasses instanceof Array) externalClasses = externalClasses.join(' ')
    onClick && this.then(() => {
      document.getElementById(id).addEventListener('click', onClick)
    })
    return new RenderResult(`<button id="${id}" class="v-btn ${externalClasses}">${text}</button>`, id)
  }

  toast (text, color) {
    this.app.showToast(text, color || 'info')
  }

  formula (expr) {
    return `$ ${expr} $`
  }

  formulation (expr) {
    return `$$ ${expr} $$`
  }

  formulationEscape () {
    const delims = [['$$', '$$'], ['$', '$'], ['\\(', '\\)']]
    delims.map(pat => pat.map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('\\s*(.*?)\\s*')).map(p => new RegExp(p, 'gms')).forEach(pattern => {
      this.app.postData.content = this.app.postData.content.replace(pattern, (_sup, form) => {
        // console.log(form, '=>', unescapeToHTML(form))
        return unescapeToHTML(form)
      })
    })
  }

  importJS (url, onComplete?) {
    const jsNode = document.createElement('script')
    jsNode.onload = onComplete
    jsNode.async = true
    jsNode.src = url
    document.body.appendChild(jsNode)
  }

  def (name, func) {
    if (func instanceof RenderResult) {
      this.customFunctions[name] = func.returnValue
      return func.template
    }
    this.customFunctions[name] = func
    if (_.isString(func) || func instanceof HTMLElement) {
      return func
    }
  }

  audio (src: string) {
    const id = this.randomID()
    return new RenderResult(`<audio id='${id}' src='${src}' hidden='true'/>`, id)
  }

  getElement (name: RSElementSelector) {
    if (name instanceof HTMLElement) {
      name = name.id
    }
    if (name instanceof RenderResult) {
      if (_.isString(name.returnValue)) name = name.returnValue
      else {
        name = name.template
      }
    }
    if (_.isString(name)) {
      const matchId = /id=['"]([a-zA-Z0-9-]+)['"]/.exec(name)
      if (matchId) {
        name = matchId[1]
      }
    }
    if (name instanceof HTMLElement) {
      name = name.id
    }
    const res = (name in this.functions) ? this.functions[name] : name
    return document.getElementById(res instanceof Element ? res.id : res)
  }

  raw (s) {
    // s = s.split('\n').map(x => `<p>${x}</p>`).join('\n')
    return `<pre>Roselia{{${s}}}</pre>`
  }

  previewColor (color) {
    const prevColor = this.app.preview.color
    this.app.preview.color = color
    this.onceUnload(() => {
      this.app.preview.color = prevColor
    })
  }

  element (name) {
    return new Promise(resolve => {
      this.then(_ => {
        resolve(this.getElement(name))
      })
    })
  }

  createElement (type, extend?): HTMLElement {
    const el = document.createElement(type)
    el.id = this.randomID()
    extend && this.element(el).then(e => {
      _.assignIn(e, extend)
    })
    return el
  }
  setPreview (el, preview: PreviewObject /* :{title, subtitle, img, color} */) {
    this.element(el).then((e: HTMLElement) => {
      e.addEventListener('mouseover', ev => {
        ev.preventDefault()
        this.app.preview.show = true
        this.app.preview.attach = e
        this.app.preview.cacheData = null
        this.app.preview.current = this.app.postData.id;
        ['title', 'subtitle', 'img', 'color'].forEach(attr => {
          const value = preview[attr]
          if (!_.isNil(value)) this.app.preview[attr] = value
        })
      })
      e.addEventListener('mouseout', ev => {
        ev.preventDefault()
        this.app.preview.show = false
      })
      if (!_.isNil(preview.goTo)) {
        e.addEventListener('click', ev => {
          ev.preventDefault()
          this.app.$vuetify.goTo(_.isNumber(preview.goTo) ? preview.goTo : this.getElement(<any>preview.goTo), {offset: -200}).catch(reason => {
            if(_.isString(preview.goTo)) location.href = preview.goTo
            else this.app.$router.push(preview.goTo)
            console.error(reason)
          })
        })
      }
    })
  }

  previewed (el, preview) {
    this.setPreview(el, preview)
    return el
  }

  doTo (el, fn) {
    this.element(el).then(fn)
    return el
  }

  icon (icn, externalClasses: Array<String>|String = '') {
    // if (_.isArray(externalClasses)) externalClasses = externalClasses.join(' ')
    if (externalClasses instanceof Array) externalClasses = externalClasses.join(' ')
    if (icn.startsWith('fa')) {
      const [fa, txt] = icn.split('-')
      return `<i aria-hidden="true" class="v-icon ${fa} fa-${txt} ${externalClasses}"></i>`
    }
    return `<i aria-hidden="true" class="v-icon material-icons ${externalClasses}">${icn}</i>`
  }

  Y = fn => (u => u(u))(x => fn(s => x(x)(s)))

  askForAccess (type: string, title: string, message: string) {
    return new Promise((resolve, reject) => {
      this.onceUnload(() => this.askAccess.clear())
      if (this.askAccess.has(type)) {
        if (this.askAccess.get(type)) resolve()
        else reject()
      } else {
        const ch = this.createElement('div')
        document.getElementById('content').appendChild(ch)
        summonDialog({
          onConfirm: () => {
            resolve()
            this.askAccess.set(type, true)
          },
          onReject: () => {
            reject()
            this.askAccess.set(type, false)
          },
          cleanUp: () => {
            document.getElementById('content').removeChild(ch)
          },
          title,
          message
        }, ch)
      }
    }).then(() => {
      this.toast(`Operation ${type} granted`, 'success')
    }).catch(() => {
      this.toast(`Operation ${type} rejected`, 'error')
      return Promise.reject(new Error("User rejected"))
    })
  }

  askForToken () {
    return this.askForAccess('token', 'This post wish to access your personal info', 'This post needs to access your token to make requests.')
  }

  roseliaApi (...args) {
    return async data => {
      await this.askForToken()
      return utils.fetchJSON(utils.apiFor(...args), 'GET', data)
    }
  }

  // async fetchJSON (...args) { 
  //   await this.askForToken();
  //   return utils.fetchJSON(...args);
  // }
  // async fetchJSONWithSuccess (...args) { 
  //   await this.askForToken();
  //   return utils.fetchJSONWithSuccess(...args);
  // }
  request = {
    get: (url, data) => {
      return this.askForAccess('fetch', 'This post would like to fetch data', `It wants to access ${url}.`).then(() => {
        return axios.get(url, data).then(x => x.data)
      })
    }
  }
}

export default {
  RoseliaRenderer,
  createRenderer (app) {
    return new RoseliaRenderer(app)
  }
}