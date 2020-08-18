interface IDisposable {
    dispose(): void
}

type Dispatch<T> = (arg: T) => void;
