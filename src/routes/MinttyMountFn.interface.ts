/** IDEA: It would be cool to have some kind of Promise loading state for while the editor loads... */
export interface MinttyMountFn {
  (mountTo: { container: HTMLElement }): {
    destroy(): void;
  };
}
