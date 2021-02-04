module RoseliaCore.Managements.PluginStorageManagement

open System.Linq
open FSharp.Control.Tasks.V2
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.Managements
open RoseliaBlog.RoseliaCore.Util

let SearchRecords application key indexKey user (SameReturnTypeAs GetContext context) =
    let mutable query =
        context.PluginStorage.AsQueryable()
            .Where(fun p -> p.Application = application)
    
    match indexKey with
    | Some key ->
        query <- query.Where(fun p -> p.IndexKey = key)
    | None -> ()
    match key with
    | Some k ->
        query <- query.Where(fun p -> p.Key = k)
    | None -> ()
    
    match user with
    | Some u ->
        query.Where(fun p -> p.TargetUser = u)
    | None -> query

let NewRecord application key userName value indexKey =
    task {
        let! user =
            userName
            |> Task.bindOptionAsync UserManagement.FindUserByUsername
            
        use context = GetContext()
        
        let record = SearchRecords application (Some key) None user context
        let! r = record.FirstOrDefaultAsync()
        if not(isNull(box r)) then
            return Error "Such record exists."
        else
            let newRecord = {
                PluginStorage.Application = application
                Key = key
                IndexKey = indexKey
                Content = value
                User =
                    if user.IsNone then Default else user.Value.UserId
                TargetUser =
                    user
                    |> Option.defaultValue Default
                RecordId = Default
                CreatedTime = Default
                LastEditedTime = Default
            }
            context.PluginStorage.Add newRecord
            |> ignore
            
            let! _ = context.SaveChangesAsync()
            return Ok ()
    }

let EditRecord application key userName value indexKey =
    task {
        use context = GetContext()
        let! user =
            userName
            |> Task.bindOptionAsync UserManagement.FindUserByUsername
        
        let! record =
            SearchRecords application (Some key) None user context
            |> (fun q -> q.FirstOrDefaultAsync())
        
        match box record with
        | null ->
            return Error "Such record does not exist."
        | _ ->
            record.Content <- value
            record.IndexKey <- indexKey
            let! _ = context.SaveChangesAsync()
            return Ok()
    }
    
let UpsertRecord application key userName value indexKey =
    task {
        match! EditRecord application key userName value indexKey with
        | Ok _  as ok -> return ok
        | Error _ ->
            return!
                NewRecord application key userName value indexKey
    }