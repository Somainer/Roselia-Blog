export interface PreviewObject {
  title: string,
  subtitle?: string
  img?: string,
  color?: string,
  goTo: number | string | RSElementSelector
}

export interface MusicMetaObject {
  name: string,
  artist: string,
  url: string
  cover?: string,
  lrc?: string,
  theme?: string,
  type?: 'auto'|'hls'|'normal'
}


export class RenderResult {
  template: string
  returnValue: HTMLElement | string
  constructor (template: string, ret: HTMLElement | string) {
    this.template = template
    this.returnValue = ret
  }
}

export type RSElementSelector = string | RenderResult | HTMLElement

export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export type RecursiveReadOnly<T> = {
  readonly [K in keyof T]:
    T[K] extends (infer U)[] ? readonly U[] :
    T[K] extends object ? RecursiveReadOnly<T[K]> :
    T[K];
}
