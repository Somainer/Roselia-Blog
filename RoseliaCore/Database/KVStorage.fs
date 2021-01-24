namespace RoseliaBlog.RoseliaCore.Database.KVStorage

open System
open System.Collections.Generic
open System.Runtime.CompilerServices

type RoseliaKVStorage<'TValue> = IDictionary<string, 'TValue>

type DictStorage<'TValue> = Dictionary<string, 'TValue>

module RoseliaKVStorageHelpers =
    let GenRandomUUID () =
        Guid.NewGuid().ToString("N")
        
    type IDictionary<'TKey, 'TValue> with
        member this.GetValueOption key =
            let (hasValue, value) = this.TryGetValue key
            if hasValue then Some value
            else None

[<Extension>]
type RoseliaKVStorageExtension =
    [<Extension>]
    static member PutRandom (this: RoseliaKVStorage<'TValue>) value =
        let key = RoseliaKVStorageHelpers.GenRandomUUID ()
        this.Add(key, value)
        key
