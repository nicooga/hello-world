type Maybe<T, E> =
    | { ok: true, result: T }
    | { ok: false, error: E };

export default Maybe;