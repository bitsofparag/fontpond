/** Represents either a successful value or a handled error. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
