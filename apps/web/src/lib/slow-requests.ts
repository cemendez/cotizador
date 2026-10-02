const SLOW_AFTER_MS = 3000;

let slowCount = 0;
const listeners = new Set<() => void>;

function notify() {
    for (const listener of listeners) listener();
}

export function trackRequest(): () => void {
    let isSlow = false;
    const timer = window.setTimeout(() => {
        isSlow = true;
        slowCount += 1;
        notify();
    }, SLOW_AFTER_MS);

    return () => {
        window.clearTimeout(timer);
        if (isSlow) {
            isSlow = false;
            slowCount -= 1;
            notify();
        }
    };
}

export const slowRequests = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot: () => slowCount > 0,
};