module RoseliaCore.AsyncSeq

open System.Collections.Generic
open System.Threading.Tasks
type 'a FCAsyncEnumerator = 'a FSharp.Control.IAsyncEnumerator
type 'a FCAsyncEnumerable = 'a FSharp.Control.IAsyncEnumerable
open RoseliaBlog.RoseliaCore

type 'a IAsyncSeq = 'a IAsyncEnumerable

let fromControl (c : 'a FCAsyncEnumerable) =
    { new IAsyncSeq<'a> with
        member _.GetAsyncEnumerator _ =
            let enumerator = c.GetEnumerator()
            let mutable value : 'a = Util.Default
            {
                new IAsyncEnumerator<'a> with
                    member _.MoveNextAsync () =
                        task {
                            match! enumerator.MoveNext() |> Async.StartAsTask with
                            | Some x ->
                                value <- x
                                return true
                            | None -> return false
                        }
                        |> ValueTask<bool>
                    member _.Current = value
                    member _.DisposeAsync () = task { enumerator.Dispose() } |> ValueTask
            }
    }
    
let toControl (c : 'a IAsyncSeq) =
    { new FCAsyncEnumerable<'a> with
        member _.GetEnumerator() =
            let enumerator = c.GetAsyncEnumerator()
            {
                new FCAsyncEnumerator<'a> with
                    member _.MoveNext () =
                        task {
                            match! enumerator.MoveNextAsync() with
                            | true ->
                                return Some enumerator.Current
                            | false -> return None
                        } |> Async.AwaitTask
                    
                    member _.Dispose() = enumerator.DisposeAsync().GetAwaiter().GetResult()
            }
    }
