import * as _ from '../fake-lodash'
import config from '../config'
import utils from '../utils'
import axios from '../ajax-bar-axios'
import {
  PreviewObject, 
  RenderResult, 
  MusicMetaObject,
  RSElementSelector,
  RecursivePartial,
  RecursiveReadOnly,
  Optional,
  UnitFunction
} from './script-types'
import { RoseliaScriptState, RoseliaScriptEffect } from './states'
import { INotification } from '@/common/api/notifications'
import {summonDialog} from './summonDialog'
import Vue from 'vue';
import { mapEntries } from '../helpers';
declare global {
  interface Window {
    APlayer: any
  }
}
function ensureAPlayer(onload: () => void) {
  if (!window.APlayer) {
    let playerNode = document.createElement('script')
    let playerStyle = document.createElement('link')
    playerStyle.rel = 'stylesheet'
    playerStyle.href = 'https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.css'
    playerNode.async = true
    playerNode.onload = onload || null

    playerNode.src = 'https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.js'
    document.head!.appendChild(playerStyle)
    document.body!.appendChild(playerNode)
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

function replaceTemplate(template: string, delim: string[], replace: (s: string, ...args: any[]) => string) {
  return template.replace(new RegExp((delim || ['{{', '}}']).join('\\s*?(([\\s\\S]+?))\\s*?'), 'gm'), replace)
}

function render (template: string, context: any, delim: string[]) { // A not so naive template engine.
  const funcTemplate = expr => `with(data) { with (states) { with(functions) {return (${expr});}}}`
  const innerRenderer = expr => {
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
        res = (new Function('data', funcTemplate(expr))).call(context, context)
      }
      return handleRenderResult(res)
    } catch (e) {
      console.log('On rendering:', expr)
      console.error(e)
      return expr
    }
  }
  return replaceTemplate(template, delim, (_total, expr: string) => {
    const exprTrim = expr.trim()
    if (exprTrim.startsWith('//')) return ''; // Ignore comments.
    const needReturnValue = !exprTrim.endsWith(';')
    const expression = needReturnValue ? exprTrim : exprTrim.substring(0, exprTrim.length - 1)
    const renderResult = innerRenderer(expression)
    return needReturnValue ? renderResult : ''
  })
}

function selfish<T extends object, K extends keyof T> (target: T, forbid?: K[]): T {
  const cache = new WeakMap()
  const forbidden = new Set(forbid)

  return new Proxy(target, {
    get (target, key: K) {
      if (forbidden.has(key)) return null;
      const value = Reflect.get(target, key)
      if (!_.isFunction(value)) return value
      if (!cache.has(value)) {
        cache.set(value, value.bind(target))
      }
      return cache.get(value)
    }
  })
}

function sandbox<T extends object>(target: T): T {
  return new Proxy(target, {
    has(target, key) {
      return true
    },
    get(target, key) {
      if(key === Symbol.unscopables) {
        return undefined
      }
      return Reflect.get(target, key)
    }
  })
}

function hiddenProxy<T extends object, K extends keyof T>(obj: T, hide: K[]): [Set<K>, Omit<T, K>] {
  const hidden = new Set(hide);

  return [hidden, new Proxy(obj, {
    get(target, key: K) {
      if (hidden.has(key)) return null;
      return Reflect.get(target, key);
    }
  })]
}

function readOnlyProxy<T extends object>(target: T, deep: boolean = false): T {
  return new Proxy(target, {
    get(target, key) {
      const result = Reflect.get(target, key);
      if (deep && typeof result === "object") {
        return readOnlyProxy(result);
      }
      return result;
    },
    set(target, key) {
      return false;
    },
    deleteProperty() {
      return false;
    }
  })
}

export function deepFrozen<T extends object>(obj: T): RecursiveReadOnly<T> {
  const copied = {...obj}
  Object.keys(copied).forEach(key => {
    if (copied.hasOwnProperty(key) && (typeof copied[key] === 'object') && !Object.isFrozen(copied[key])) {
        copied[key] = deepFrozen(copied[key])
    }
  });
  return Object.freeze(copied) as RecursiveReadOnly<T>
}

const innerCallToken = Symbol("yukina") // Verify inner token.
let savedTheme = { ...config.theme }

type RoseliaScriptContext = Partial<RoseliaScript>

class RoseliaRenderer {
  app: Vue
  context: RoseliaScriptContext
  scriptEvaluator: RoseliaScript
  toInject: any
  static roseliaScriptDelim = ['(?:Roselia|roselia|r|R){{', '}}']
  private hiddenFields: Set<keyof RoseliaScript>
  constructor (app) {
    this.app = app
    this.scriptEvaluator = new RoseliaScript(app)
    const [hiddenFields, context] =
        hiddenProxy(readOnlyProxy(sandbox(selfish(this.scriptEvaluator, ['app']))), [])
    this.context = context
    this.hiddenFields = hiddenFields
  }

  render (template: string) {
    // if (!config.enableRoseliaScript) return template
    this.scriptEvaluator.pendingFunctions = []
    try {
      this.toInject = this.app
      const result = render(template, this.context, RoseliaRenderer.roseliaScriptDelim)
      this.resetHookCounts()
      return result
    } catch (e) {
      console.error(e)
      // this.scriptEvaluator.injectEventsOn(this.app)
      return template
    }
    // return render(template, this.context, ['(?:Roselia|roselia|r|R){{', '}}'])
  }

  cleanScript(template: string) {
    return replaceTemplate(template, RoseliaRenderer.roseliaScriptDelim, _ => '')
  }

  async renderAsync (template: string) {
    return Promise.resolve(this.render(template)).then(t => {
      // this.scriptEvaluator.injectEventsOn(this.app)
      return t
    })
  }

  renderVue (template: string) {
    const rid = this.scriptEvaluator.randomID()
    const v = new Vue({
      template: `<div id="${rid}">` + this.render(template) + '</div>',
      data: this.scriptEvaluator.functions,
      delimiters: ['v{{', '}}']
    })
    this.toInject = v
    // this.injectEvents()
    Object.defineProperty(v, 'autoInject', {
      value: () => {
        v.$mount(document.getElementById(rid)!)
        v.$nextTick(() => this.injectEvents())
      }
    })
    return v
  }

  async renderVueAsync(template: string) {
    return new Promise(resolve => resolve(this.renderVue(template)))
  }

  injectEvents () {
    this.scriptEvaluator.injectEventsOn(this.toInject)
  }

  pushContext(context: object, name: string = 'context') {
    this.scriptEvaluator.def(name, context)
    return () => {
      this.scriptEvaluator.undef(name)
    }
  }

  pushMethod(method: (rs: RoseliaScriptContext) => (...args: any[]) => any, name: string) {
    return this.pushContext((...args: any[]) => method(this.context)(...args), name)
  }

  hideAttributes<T extends keyof RoseliaScript>(attrs: T[]) {
    const toHide = attrs.filter(k => !this.hiddenFields.has(k));
    toHide.forEach(k => this.hiddenFields.add(k));
    return () => toHide.forEach(k => this.hiddenFields.delete(k))
  }
  clearHiddenAttributes() {
    this.hiddenFields.clear();
  }

  enterCommentMode() {
    return this.hideAttributes([
        "changeExtraDisplaySettings",
        'importJS',
        'request',
        'roseliaApi',
        'changeTheme',
        'changeThemeOnce',
        'resetTheme',
        'saveCurrentTheme',
        'switchToColorMode',
        "forceSwitchToColorMode",
        "resetColorMode",
        "previewColor",
        "undef",
        "def",
        "defState",
        "useState",
        "useInterval",
        "useTimeout",
        'sendNotification'
    ])
  }

  setUpdateCallback(callback: () => void) {
    this.scriptEvaluator.stateManager.setCallback(callback)
  }

  resetMounted() {
    this.scriptEvaluator.mounted = false
  }

  resetHookCounts() {
    this.scriptEvaluator._effectManager.reset()
    this.scriptEvaluator.stateManager.reset()
  }
}


class RoseliaScript {
  app: any
  customFunctions: object
  functions: object
  stateManager: RoseliaScriptState
  states: any
  _effectManager: RoseliaScriptEffect
  askAccess: Map<String, boolean>
  pendingFunctions: (() => void)[]
  mounted: boolean

  constructor (app: Vue) {
    this.app = app
    const initialize = () => {
      this.customFunctions = { app: null }
      this.functions = selfish(this.customFunctions)
      this.stateManager = new RoseliaScriptState()
      this._effectManager.clear()
      this._effectManager = new RoseliaScriptEffect()
      this.states = this.stateManager.state
      this.mounted = false
    };

    // Just copy them to make the ts compiler knows that these fields are definitely assigned in the constructor.
    this.customFunctions = { app: null }
    this.functions = selfish(this.customFunctions)
    this.stateManager = new RoseliaScriptState()
    this._effectManager = new RoseliaScriptEffect()
    this.mounted = false

    initialize()
    this.app.$on('postUnload', () => {
      initialize()
    })
    this.askAccess = new Map
    this.pendingFunctions = []
    // this.mounted = false
  }

  then (f: () => void) {
    if (this.mounted) this.app.$nextTick(f)
    else this.pendingFunctions.push(f)
  }

  injectEventsOn (app: Vue) {
    // console.log("PF", this.pendingFunctions, this.pendingFunctions.forEach, this.pendingFunctions.map)
    this.pendingFunctions.forEach(async f => app.$nextTick(f))
    this.pendingFunctions = []
    this.mounted = true
  }

  music (meta: MusicMetaObject | MusicMetaObject[], autoplay = false, onPlayerReady?: (ob?: object) => void) {
    ensureAPlayer(() => this.app.$emit('aPlayerLoaded'))
    let id = this.randomID()
    let player: any
    this.then(() => {
      const addPlayer = () => {
        const element = document.getElementById(id)!
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
          Array.from(element.getElementsByClassName('aplayer-title')).forEach((ev: Element) => {
            if(ev) (ev as HTMLElement).style.color = config.theme.secondary
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
  heimu (text: string) {
    const id = this.randomID()
    return new RenderResult(`<span class="heimu" id="${id}">${text}</span>`, id)
  }
  cite (text: string, pid: number) {
    return `<a href="post?p=${pid}">${text}</a>`
  }

  randomID (length?: number) {
    return Number(Math.random().toString().substring(3, length) + Date.now()).toString(36)
  }

  onceLoad (fn: () => void) {
    this.app.$once('postLoaded', fn)
  }

  onceUnload (fn: () => void) {
    this.app.$once('postUnload', fn)
  }

  extendAttributes(element: RSElementSelector, attributes: object) {
    this.element(element).then(el => {
      _.merge(el, attributes)
    })
  }

  btn (text: string, onClick?: () => void, externalClasses: Array<String>|String = '', externalAttributes?: object) {
    const id = this.randomID()
    if (externalClasses instanceof Array) externalClasses = externalClasses.join(' ')
    onClick && this.then(() => {
      this.getElement(id)!.addEventListener('click', onClick)
    })
    if (externalAttributes) {
      this.extendAttributes(id, externalAttributes)
    }
    return new RenderResult(
        `<button id="${id}" class="v-btn v-btn--contained v-size--default ${externalClasses}">${text}</button>`,
        id)
  }

  toast (text: string, color: string) {
    this.app.showToast(text, color || 'info')
  }

  formula (expr: string) {
    return `$ ${expr} $`
  }

  formulation (expr: string) {
    return `$$ ${expr} $$`
  }

  formulationEscape () {
    const delims = [['$$', '$$'], ['$', '$'], ['\\(', '\\)']]
    delims.map(pat => pat.map(s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('\\s*(.*?)\\s*')).map(p => new RegExp(p, 'gms')).forEach(pattern => {
      this.app.postData.content = this.app.postData.content.replace(pattern, (_sup, form) => {
        // console.log(form, '=>', unescapeToHTML(form))
        return unescapeToHTML(form)
      })
    })
  }

  importJS (url: string, onComplete?: any) {
    const jsNode = document.createElement('script')
    jsNode.onload = onComplete
    jsNode.async = true
    jsNode.src = url
    document.body.appendChild(jsNode)
  }

  def(name: string | string[], func: any) {
    if (_.isArray(name)) {
      if (_.isArray(func)) {
        name.forEach((key, idx) => this.def(key, func[idx]))
      } else {
        throw new Error('When name is an array, result should also be an array.')
      }
      return;
    }
    if (func instanceof RenderResult) {
      this.customFunctions[name] = func.returnValue
      return func.template
    }
    this.customFunctions[name] = func
    if (_.isString(func) || func instanceof HTMLElement) {
      return func
    }
  }

  undef (name: string) {
    this.customFunctions[name] = undefined
  }

  defState<S>(name: string, value: S | (() => S)) {
    this.stateManager.defineState(name, value)
  }

  audio (src: string) {
    const id = this.randomID()
    return new RenderResult(`<audio id='${id}' src='${src}' hidden='true'/>`, id)
  }

  getElement (name: RSElementSelector) {
    if (name instanceof RenderResult) {
      if (_.isString(name.returnValue)) name = name.returnValue
      else {
        name = name.template
      }
    }
    if (name instanceof HTMLElement) {
      name = name.id
    }
    if (_.isString(name)) {
      const matchId = /id=['"]([a-zA-Z0-9-]+)['"]/.exec(name)
      if (matchId) {
        name = matchId[1]
      }
    }
    const res = (name in this.functions) ? this.functions[name] : name
    return document.getElementById(res instanceof Element ? res.id : res)
  }

  raw (s: string) {
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

  element (name: RSElementSelector): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const element = this.getElement(name)
      if (element) {
        return resolve(element)
      }
      this.then(() => {
        const elem = this.getElement(name)
        if(elem) {
          resolve(elem)
        } else {
          reject()
        }
      })
    })
  }

  createElement<K extends keyof HTMLElementTagNameMap>(
    type: K,
    extend?: RecursivePartial<HTMLElementTagNameMap[K]>,
    children?: (Node | string)[]
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(type)
    el.id = this.randomID()
    extend && this.extendAttributes(el, extend)
    if (children) {
      children.forEach(c => {
        el.appendChild(_.isString(c) ? this.createTextNode(c) : c)
      })
    }
    return el
  }

  createTextNode(text: string) {
    return document.createTextNode(text)
  }

  setPreview (el: HTMLElement, preview: PreviewObject /* :{title, subtitle, img, color} */) {
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
          try {
            this.app.$vuetify.goTo(_.isNumber(preview.goTo) ? preview.goTo : this.getElement(<RSElementSelector>preview.goTo), {offset: -200})
          } catch (reason) {
            if(_.isString(preview.goTo)) location.href = preview.goTo
            else this.app.$router.push(preview.goTo)
            console.error(reason)
          }
        })
      }
    })
  }

  previewed (el: HTMLElement, preview: PreviewObject) {
    this.setPreview(el, preview)
    return el
  }

  doTo (el: RSElementSelector, fn: (elem: Element) => void) {
    this.element(el).then(fn)
    return el
  }

  icon (icn: string, externalClasses: Array<String>|String = '') {
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
        document.getElementById('content')!.appendChild(ch)
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
            document.getElementById('content')!.removeChild(ch)
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

  roseliaApi (...args: any[]) {
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
    get: (url: string, data?: object) => {
      return this.askForAccess('fetch', 'This post would like to fetch data', `It wants to access ${url}.`).then(() => {
        return axios.get(url, {
          params: data
        }).then(x => x.data)
      })
    }
  }

  nil () {
    return null
  }

  private forceChangeTheme(theme: Partial<typeof config.theme>, token: Symbol) {
    if (token === innerCallToken) {
      this.app.$vuetify.theme.setTheme(this.app.$vuetify.theme.dark ? 'dark' : 'light', theme)
      Object.assign(this.app.$vuetify.theme.currentTheme, theme)
    }
  }

  currentTheme () {
    return {
      ...this.app.$vuetify.theme.currentTheme
    }
  }

  currentThemePalette () {
    const theme = this.app.$vuetify.theme.parsedTheme;
    return deepFrozen(theme);
  }

  changeTheme(theme: Partial<typeof config.theme>) {
    this.askForAccess('theme', 'This post would like to change your theme', 'Changes will discard after refresh').then(() => {
      this.forceChangeTheme(theme, innerCallToken)
      savedTheme = {
        ...savedTheme,
        ...theme
      }
    })
  }

  changeThemeOnce(theme: Partial<typeof config.theme>) {
    this.forceChangeTheme(theme, innerCallToken)
    this.onceUnload(() => {
      this.forceChangeTheme(savedTheme, innerCallToken)
    })
  }

  resetTheme() {
    this.changeThemeOnce(config.theme)
  }

  saveCurrentTheme() {
    const currentTheme = this.currentTheme()
    this.askForAccess('theme', 'This post would like to save your current theme.', 'Changes will discard after refresh').then(() => {
      savedTheme = {
        ...savedTheme,
        ...currentTheme,
      }
      this.onceUnload(() => {
        this.forceChangeTheme(currentTheme, innerCallToken)
      })
    })
  }

  async forceSwitchToColorMode(light: boolean, token?: symbol) {
    if (token !== innerCallToken) {
      await this.askForAccess('colorMode', 'This post would like to change your color scheme.', 'Changes will discard after refresh,')
    }

    this.app.$emit('forceSwitchToLight', !!light)
    this.app.$emit('forceSwitchToDark', !light)
  }

  switchToColorMode(light: boolean) {
    this.forceSwitchToColorMode(light, innerCallToken)
    this.onceUnload(() => this.resetColorMode())
  }

  resetColorMode () {
    this.app.$emit('forceSwitchToLight', false)
    this.app.$emit('forceSwitchToDark', false)
  }

  changeExtraDisplaySettings(settings: Partial<{
    metaBelowImage: boolean,
    blurMainImage: boolean,
    disableSideNavigation: boolean
  }>) {
    this.app.extraDisplaySettings = {
      ...this.app.extraDisplaySettings,
      ...settings
    }
  }

  sendNotification(notification: INotification) {
    this.app.$store.commit('addNotification', notification)
  }

  Math = Math
  Object = Object
  log(...args: any[]) {
    return console.log(...args)
  }

  useTimeout(fn: () => void, timeout: number | null) {
    this.useEffect(() => {
      if (typeof timeout === 'number') {
        const timer = setTimeout(() => fn(), timeout)
        return () => clearTimeout(timer)
      }
    }, [timeout])
    
  }

  useInterval(fn: () => void, threshold: number | null) {
    this.useEffect(() => {
      if (typeof threshold === 'number') {
        const timer = setInterval(() => fn(), threshold)
        return () => clearInterval(timer)
      }
    }, [threshold])
  }

  useEffect(fn: () => Optional<UnitFunction>, deps: any[] = []) {
    this._effectManager.useEffect(fn, deps)
  }

  useState<S>(state: S | (() => S)) {
    return this.stateManager.useState(state)
  }

  withEventListener<K extends keyof HTMLElementEventMap>(element: RSElementSelector, event: K, listener: (event: HTMLElementEventMap[K]) => void) {
    this.element(element).then(el => {
      el.addEventListener(event, listener)
    })

    return element;
  }
}

export default {
  RoseliaRenderer,
  createRenderer (app: Vue) {
    return new RoseliaRenderer(app)
  }
}
