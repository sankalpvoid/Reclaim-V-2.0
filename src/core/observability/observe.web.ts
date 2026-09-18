import type { ComponentType } from 'react';

export const Observe = {
  clientId: null as string | null,
  configure: (_config?: unknown) => undefined,
  reportError: (_error: unknown) => undefined,
};

export const ObserveRoot = {
  wrap<P extends object>(Component: ComponentType<P>): ComponentType<P> {
    return Component;
  },
};

export function useObserve() {
  return {
    markInteractive: (_attributes?: unknown) => undefined,
  };
}
