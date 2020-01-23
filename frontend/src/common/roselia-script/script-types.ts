interface PreviewObject {
  title: string,
  subtitle?: string
  img?: string,
  color?: string,
  goTo: number | string | RSElementSelector
}

interface MusicMetaObject {
  name: string,
  artist: string,
  url: string
  cover?: string,
  lrc?: string,
  theme?: string,
  type?: 'auto'|'hls'|'normal'
}


class RenderResult {
  template: string
  returnValue: HTMLElement
  constructor (template, ret) {
    this.template = template
    this.returnValue = ret
  }
}

type RSElementSelector = string | RenderResult | HTMLElement

type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export {
  PreviewObject,
  MusicMetaObject,
  RenderResult,
  RSElementSelector,
  RecursivePartial
}