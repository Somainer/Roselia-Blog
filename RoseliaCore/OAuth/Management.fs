module RoseliaCore.OAuth.OAuthManagement

open FSharp.Control.Tasks.V2
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
        let! record = query {
            for record in context.OAuth do
            where (record.UnderlyingUser = underlyingUser
                   && record.OAuthAdapter = adapter.Name)
            includes record.User
            firstOptionAsync
        }
        
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
            match!
                query { for record in context.OAuth do
                        where (record.UnderlyingUser = oauthUser
                               && record.OAuthAdapter = adapter.Name)
                        firstOptionAsync
                } with
            | None -> ()
            | Some record ->
                context.OAuth.Remove record |> ignore
                let! _ = context.SaveChangesAsync()
                ()
            
            do! AddRecordUnchecked user adapter.Name oauthUser
            return Ok ()
        | None -> return Error "Such user does not exist."
    }
