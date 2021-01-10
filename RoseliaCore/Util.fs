module RoseliaCore.Util

let inline mapFromDict dict =
    dict |> Seq.map (|KeyValue|) |> Map.ofSeq

let inline tryGetFromDictWithType<'a, 'b when 'b :> System.Collections.Generic.IReadOnlyDictionary<string, obj>>
    key (dict: 'b) : 'a option =
    let (found, result) = dict.TryGetValue key

    match result with
    | _ when not found -> None
    | :? 'a as x -> Some x
    | _ -> None
