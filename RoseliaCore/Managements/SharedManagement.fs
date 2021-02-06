module RoseliaCore.Managements.SharedManagement

open System
open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore.Database.KVStorage
open RoseliaBlog.RoseliaCore.Managements

type ShareRecord = {
    Id: int
    mutable Activated: bool
    mutable ActivationTime: DateTime
} with
    static member ExpiryTimeSeconds = 600
    
    member this.IsExpired =
        this.Activated &&
            this.ActivationTime.AddSeconds (float ShareRecord.ExpiryTimeSeconds)
                < DateTime.UtcNow
    
    member this.Activate () =
        if not this.Activated then
            this.Activated <- true
            this.ActivationTime <- DateTime.UtcNow
          
let private Storage : ShareRecord RoseliaKVStorage =
    RoseliaKVStorage.GetDefault()
    
let private NewShared postId =
    Storage.PutRandom {
        Id = postId
        Activated = false
        ActivationTime = DateTime.MinValue
    }

let SharePost postId role =
    task {
        match! PostManagement.GetPost postId with
        | Some post when post.Secret <= role + 1 ->
            return Some (NewShared post.PostId)
        | _ -> return None
    }

let private GetSharedInternal shareId =
    let (exist, record) = Storage.TryGetValue shareId
    if exist then
        if record.IsExpired then
            Storage.Remove shareId |> ignore
            None
        else
            record.Activate()
            Some record
    else None

let GetSharedPostId shareId =
    GetSharedInternal shareId
    |> Option.map (fun r -> r.Id)
