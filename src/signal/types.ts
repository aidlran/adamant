export type Effect = () => void;
export type Signal<T> = [SignalGetter<T>, SignalSetter<T>];
export type SignalGetter<T> = () => T;
export type SignalSetter<T> = (newValue: T) => void;
export type Unsubscribable = () => void;
