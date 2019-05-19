pub enum Diff<T> {
    Delete(ID),
    Upsert(T)
}