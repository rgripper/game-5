export function isDefined<T>(value: T): value is Exclude<T, undefined> {
    return value !== undefined;
}
