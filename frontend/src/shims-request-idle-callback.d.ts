/** requestIdleCallback is not defined in ts library now, manually writting a workaround.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
 */

export type RequestIdleCallbackHandle = number;
export type RequestIdleCallbackOptions = {
  timeout: number;
};
export type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: (() => number);
};

declare global {
  interface Window {
    requestIdleCallback?: ((
      callback: ((deadline: RequestIdleCallbackDeadline) => void),
      opts?: RequestIdleCallbackOptions,
    ) => RequestIdleCallbackHandle);
    cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
  }
}
