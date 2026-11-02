import { expect as baseExpect, type Locator } from '@playwright/test';
import { highlightElements } from '../ui/helpers/highlight';

function isLocator(value: unknown): value is Locator {
    return typeof value === 'object'
        && value !== null
        && 'evaluateAll' in value
        && typeof value.evaluateAll === 'function'
        && 'getAttribute' in value
        && typeof value.getAttribute === 'function';
}

// Delegate assertions to Playwright so its retries, messages and timeouts stay intact.
export const expect: typeof baseExpect = new Proxy(baseExpect, {
    apply(target, thisArg, argumentsList) {
        const assertion = Reflect.apply(target, thisArg, argumentsList);
        const actual: unknown = argumentsList[0];
        if (!isLocator(actual)) {
            return assertion;
        }

        const wrap = (matchers: object): object => new Proxy(matchers, {
            get(matcherTarget, property, receiver) {
                const value = Reflect.get(matcherTarget, property, receiver);
                if (property === 'not') {
                    return wrap(value);
                }
                if (typeof value !== 'function') {
                    return value;
                }

                return async (...args: unknown[]) => {
                    const result = await Reflect.apply(value, matcherTarget, args);
                    await highlightElements(actual);
                    return result;
                };
            },
        });

        return wrap(assertion);
    },
});
