module RoseliaCore.Managements.RemoteLoginManagement

open System
open RoseliaBlog.RoseliaCore.Database.KVStorage
open RoseliaBlog.RoseliaCore.Token.TokenTypes

type ConnectionInfo = {
    Ip: string
    Browser: string
    Os: string
}

type RemoteLoginRecord = {
    mutable User: RoseliaUserBase option
    mutable IssueTime: DateTime
    mutable IsConfirmed: bool
    ConnectionInfo: ConnectionInfo
} with
    static member ExpiryTimeSecond = 100
    member this.IsExpired =
        this.IssueTime.AddSeconds (float RemoteLoginRecord.ExpiryTimeSecond)
            <= DateTime.UtcNow

let private Storage : RemoteLoginRecord RoseliaKVStorage =
    RoseliaKVStorage.GetDefault()

let private GenerateCode() =
    Random().Next(1000000).ToString "D6"

let rec private GenerateUniqueCode () =
    let code = GenerateCode()
    if Storage.ContainsKey code then
        GenerateUniqueCode()
    else code
    
let GetRandomCode connection =
    let record = {
        User = None
        IssueTime = DateTime.UtcNow
        IsConfirmed = false
        ConnectionInfo = connection
    }
    
    let code = GenerateUniqueCode()
    Storage.Add(code, record)
    code

let GetRecordOption code =
    let (exist, record) = Storage.TryGetValue code
    if exist then
        if record.IsExpired then
            Storage.Remove(code) |> ignore
            None
        else Some record
    else None

let ScanCode code user =
    match GetRecordOption code with
    | Some record ->
        record.IssueTime <- DateTime.UtcNow // Extend expiry time
        record.User <- Some user
        true
    | None -> false

let ConfirmLogin code (user : RoseliaUserBase) =
    match GetRecordOption code with
    | Some record
        when record.User.IsSome
             && record.User.Value.Id = user.Id ->
        record.IsConfirmed <- true
        record.IssueTime <- DateTime.UtcNow // Extend expiry time
        true
    | _ -> false
    
let RemoveCode (code : string) =
    Storage.Remove code
