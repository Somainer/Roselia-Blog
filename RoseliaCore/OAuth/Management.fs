module RoseliaCore.OAuth.OAuthManagement

open FSharp.Control.Tasks.V2
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.OAuth
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.Managements
open RoseliaBlog.RoseliaCore.Managements.Query
open RoseliaBlog.RoseliaCore.Util

let LoginWithCode (adapter : IOauthAdapter) code request =
    task {
        let! token = adapter.GetAccessToken code request
        let! underlyingUser = adapter.GetUserInformation token
        use context = GetContextWithoutTracking()
        let recordQuery =
            query {
                for record in context.OAuth do
                where (record.UnderlyingUser = underlyingUser
                       && record.OAuthAdapter = adapter.Name)
                select record
            }
        
        let! record =
            recordQuery
                .Include(fun r -> r.UserId)
                .FirstOptionAsync()
        
        return record
        |> Option.map (fun r -> r.User)
    }
    
let private AddRecordUnchecked user adapter oauthUser =
    task {
        let oauth = {
            OAuth.User = user
            UserId = user.UserId
            UnderlyingUser = oauthUser
            OAuthAdapter = adapter
        }

        use context = GetContext()
        context.OAuth.Add oauth |> ignore
        let! _ = context.SaveChangesAsync()
        return ()
    }

let AddAdapter userName (adapter : IOauthAdapter) oauthUser =
    task {
        use context = GetContext()
        match! UserManagement.FindUserByUsername userName with
        | Some user ->
            let recordsQuery =
                query {
                    for record in context.OAuth do
                    where (record.UnderlyingUser = oauthUser
                           && record.OAuthAdapter = adapter.Name)
                }
            match! recordsQuery.FirstOptionAsync() with
            | None -> ()
            | Some record ->
                context.OAuth.Remove record |> ignore
                let! _ = context.SaveChangesAsync()
                ()
            
            do! AddRecordUnchecked user adapter.Name oauthUser
            return Ok ()
        | None -> return Error "Such user does not exist."
    }

let GetAdapters userName =
    task {
        match! UserManagement.FindUserByUsername userName with
        | None -> return Error "User not found,"
        | Some user ->
            use context = GetContextWithoutTracking()
            let! adapters =
                query {
                    for record in context.OAuth.AsQueryable() do
                    where (record.UserId = user.UserId)
                }
                |> EntityFrameworkQueryableExtensions.ToListAsync
            
            return Ok (seq {
                for adapter in adapters do
                    yield
                        {|
                            Adapter = adapter.OAuthAdapter
                            User = adapter.UnderlyingUser
                        |}
            })
    }

let RemoveAdapter userName adapter =
    task {
        match! UserManagement.FindUserByUsername userName with
        | None -> return Error "User not found."
        | Some user ->
            use context = GetContext()
            let! record =
                query {
                    for r in context.OAuth.AsQueryable() do
                    where (r.UserId = user.UserId && r.OAuthAdapter = adapter)
                }
                |> EntityFrameworkQueryableExtensions.ToListAsync
            
            context.RemoveRange record
            let! _ = context.SaveChangesAsync()
            return Ok ()
    }
