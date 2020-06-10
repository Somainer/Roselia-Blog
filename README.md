# Roselia-Blog

Roselia-Blog is a blog engine. Its front-end is mostly written in TypeScript and Vue, while its back-end is written in Python.

English | [简体中文](./README-CN.md)

## Usage
These are steps you should take after cloning this repo.

### Prerequisite
* `Python 3.6+` (because of string interpolations).
* `NodeJS`  (to compile the front-end).
* `Yarn pkg` The package manager for NodeJS.

Then install the dependencies via `pip install -r requirements.txt`.
Then change current work dir to `./frontend` and execute `yarn`.

### Configuration
There are three configs you need to change based on your conditions.
In general, you do not need to change configs with a default value except blog title, motto and link.

In `api_server/config.py` you could change:
* `BLOG_LINK`: The link to your blog webpage.
* `BLOG_INFO`: Change title, motto as you like. (For server-side static page rendering.)
* `DEBUG`: Make sure it is `False` if you want to run it in production.
* `ANTI_SEO`: Disable SEO optimization if this is `True`. If so, contents won’t be rendered per user request. Note that spiders which might execute user JavaScript like Google may also get the content.
* `HOST`: The listening host, default `0.0.0.0`.
* `PORT`: The listening port, default 5000.
* `DB_PATH`: The database address,can be SQL addresses.
* `UPLOAD_DIR`: The image upload directory. Make it empty to disable directly upload images to this server.

In `api_server/secret.py` you could change:
* `APP_KEY` & `APP_SALT`: The application key and salt for token generation. Change it to `gen_key()` to generate a random key every launch, or change it to a custom `str` value.
* `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: the id and secret for GitHub OAuth, keep it empty to disable it.
* `MICROSOFT_CLIENT_ID` & `MICROSOFT_CLIENT_SECRET`: the id and secret for MSA OAuth, keep it empty to disable it.
* `CHEVERETO_API_KEY` & `CHEVERETO_API_ENDPOINT`: the api enpoint and key for uploading images to the chevereto service. Keep them empty to disable this upload channel.
* `SM_MS_API_TOKEN`: The api token to upload images to `sm.ms` image hosting server. Keep it empty to disable this channel.

In `frontend/src/common/config.js`, you could change (in bottom `export default` clause):
* `title`: The title of blog.
* `motto`: The motto of blog.
* `apiBase`: The api base URL of the site, default `/api`.
* `theme`: The theme of the blog.
* `enableRoseliaScript`: Control whether enable the in post rendering JavaScript.
* `enableAskYukina`: Control whether enable the assistant. Please make it false because this function is still under development.
* `footName`: The string display in the footer.
* `urlPrefix`: Change the prefixing URL of the blog, default is an empty string.
* `images.indexBannerImage`: The banner image of index page.
* `images.lazyloadImage`: The placeholder image of images in the post.
* `images.timelineBannerImage`: The banner image of timeline page.

Basically, you only need to change title and motto and footName.

### Build
After installing all dependencies, you just execute `api_server/roselia.py build` to build the front-end.

### Start
Just execute `api_server/roselia.py serve` to start the server.
Then, configure the nginx or apache.
After that, access the blog index, follow the instructions, you are all done.

### About `api_server/roselia.py`
`roselia.py` provided some commands to start or build the blog. Usage: `roselia.py [command]`
command could be:
> * serve: Start the service regarding `DEBUG` setting.
> * run-dev: Force start the development environment.
> * run-prod: Force start the production environment.
> * run-gunicorn: Start the server using `gunicorn`.
> * compress-assets: **Remove previous static folder**,.copy static_assets` to `static`, and compress images.
> * copy-assets Copy **built** front-end assets to static, then replace CSS and JS in templates.
> * build-frontend Build the front end.
> * build = compress-assets + build-front-end + copy-assets
> * assets = compress-assets + copy-assets

## Features
If you are writing codes or formulas in articles, this blog is suitable for you because this blog has native, out-of-the-box support of following functions:
* Code highlighting.
* Formula
* Side-bar navigation.
* Preview of links to articles.
* References skip and preview.
* In-article JavaScript and string interpolation, for additional functions or provide support for comments.
* Block text template syntax for to humorously blocking out “inappropriate” or “secret” text. They are texts surrounded by `~`.
* Paste or drop to upload images.
* Paste code snippets directly from `Visual Studio Code`.
* Hidden Posts: posts which could only be accessed via permanent link.
* Secret Posts: posts which users with a certain role level only could access.
* Social login: user could login via GitHub or Microsoft accounts.
* Two factor authentication.

## Roselia Script
Roselia-Blog does not open for registration, hence, we fully trust every user in this site. So, we open the in-post or comment script to all users. This script could interpolate strings, open/close some switches, or programmatically change the metadata of post or comment. It is still dangerous because `while (true) {}` will still crash the browser. So, you could disable it in the config.

Syntax: `<prefix>{{<expression>}}`

The `<prefix>` is anything matches `Roselia|roselia|r|R`.  The `<expression>` is a valid `JavaScript` expression.
If this expression ends with comma(`;`), this expression is treated as a clause and the execution result will be dropped.

Example: `r{{ 1 + 1 }}` renderes to `2`.

There are such built-in apis:
* `def (name: string, func: any)` naming a result. This result is possible to be used in following scripts or comments.
* `onceLoad (fn: () => void)` Add a callabck when post is loaded.
* `onceUnload(fn: () => void)` Add a callback when post is destroyed.
* `getElement (name: RSElementSelector): HTMLElement | null`: Get the HTML element by id or other api rendering result. 
* `element (name: RSElementSelector): Promise<HTMLElement>`: Promise version of `getElement`.
* `then (f: () => void)`: Add a callback when the DOM is loaded.
* `music (meta: MusicMetaObject | MusicMetaObject[], autoplay = false, onPlayerReady?: (ob?: object) => void)`: Insert a music or musics (based on APlayer).
* `btn (text: string, onClick?: () => void, externalClasses: Array<String>|String = ‘’, externalAttributes?: object)`: Insert a button.
* `toast(text: string, color: string)` Display a notification.
* `importJS (url: string, onComplete?: any)`: Insert a JavaScript from other source. (May affect articles afterwards)
* `
createElement<K extends keyof HTMLElementTagNameMap>(
    type: K,
    extend?: RecursivePartial<HTMLElementTagNameMap[K]>,
    children?: (Node | string)[]
): HTMLElementTagNameMap[K]
`: Create the element with type `type`, extend the attributed in `extent`, finally, fill the children.
* `createTextNode(text: string): Text`: Create a text node.
* `currentTheme()`: Get current theme palette.
* `changeThemeOnce(theme: Partial<typeof config.theme>): void`: Change the theme when viewing this post, reset theme when switching posts.
* `changeTheme(theme: Partial<typeof config.theme>): void`: Change the theme until refresh. (Asks for `theme` priviledge).
* `resetTheme()`: Reset the theme to default.
* `saveCurrentTheme()`: Save current theme.
* `switchToColorMode(isLight: boolean)`: Change the color mode. To light mode if isLight is true, otherwise dark mode. Reset after post is destroyed.
* `async forceSwitchToColorMode(light: boolean)`: Change the color mode. Won’t change until refresh.
* `changeExtraDisplaySettings(settings: Partial<{
    metaBelowImage: boolean,
    blurMainImage: boolean,
    disableSideNavigation: boolean
  }>)`: Change the extra display settings. `metaBelowImage` controls whether the metadata of post is below the image.
`blurMainImage` controls if blur the dominant image. `disableSideNavigation` controls whether disable the side navigation.
* `sendNotification(notification: INotification)`: Send a notification to user (via the global notification bus).
* `withEventListener<K extends keyof HTMLElementEventMap>(element: RSElementSelector, event: K, listener: (event: HTMLElementEventMap[K]) => void): RSElementSelector` Add an event listener to an element, then return the element.

### Hooks
Roselia-Script supports react-like hooks, which is inspired both by Vue and React.
There are several APIs help building reactive posts.
APIs introducing new variables are prefixed with `def`. Hook APIs are prefixed with `use`. So, we have following APIs:

#### defState
```typescript
declare function defState<S>(name: string, state: S | (() => S)): void
```
`defState` accepts a name and a state, introducing that variable to current article. 
Basically, you could write a simplest counter in this way:
```
r{{
    defState('count', 0), btn(count, () => ++count)
}}
```
This would introduce a button, displaying current count, increasing count every click.

#### useState
Somebody would miss the legacy `useState` hook in React. Here is `useState`.
This hook is expected to hehave the same as [React State Hook](https://reactjs.org/docs/hooks-state.html).

```typescript
declare function useState<S>(state: S | (() => S)): [S, (value: (S | ((oldValue: S) => S))) => void]
```

A counter could be written as:
```javascript
(() => {
    const [count, setCount] = useState(0)
    return btn(count, () => setCount(c => c + 1))
})()
```
Or:
```javascript
    def(['count', 'setCount'], useState(0)), btn(count, () => setCount(c => c + 1))
```

`defState` is more reactive and short while `useState` is more functional. If you loved Vue, you might be happy with `defState`, otherwise use `useState`.

#### useEffect
This hook is expected to behave the same as [React Effect Hook](https://reactjs.org/docs/hooks-effect.html).
```typescript
declare function useEffect(effect: () => void, deps: any[]): void
```

#### useInterval / useTimeout
```typescript
declare function useInterval(callback: () => void, interval: number | null): void
```
Both hook have the same signature. Interval could be changed when `interval` changed. 
If `interval` is `null`, the interval stopped.
Here is an implementation to demonstrate how it works:
```typescript
function useInterval(callback: () => void, interval: number | null): void {
    useEffect(() => {
        if (typeof interval === 'number') {
            const timer = setInterval(() => fn(), interval)
            return () => clearInterval(timer)
        }
    }, [interval])
}
```

### Examples:

Inserting a song:

```
r{{
    music({
       title: ‘陽だまりロードナイト’,
        author: ‘Roselia’,
        url: ‘https://cdn.roselia.moe/static/img/roselia/hidamari.mp3’,
        pic: ‘https://p4.music.126.net/gT4F8nlV2Io58GTVAEWyLw==/18636722092789001.jpg’
    })
}}
```

When the script is executed in posts, a special variable `post` will be available in the context.
Properties of this object can be modified to change the metadata during runtime. Also, a `comment` variable will be available when rendering comments.
