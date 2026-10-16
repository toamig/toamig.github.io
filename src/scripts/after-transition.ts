// Resolves once an incoming page transition has finished, so startup work the
// first frame doesn't need (WebGL, network fetches, cycling images, scroll
// timelines) waits instead of stalling the animation. The homepage's head
// script creates the promise; on other pages, or in browsers without view
// transitions, it resolves straight away.
export const afterTransition = (): Promise<void> =>
  (window as { __afterTransition?: Promise<void> }).__afterTransition ?? Promise.resolve();
