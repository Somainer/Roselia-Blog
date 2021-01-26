[<AutoOpen>]
module RoseliaBlog.RoseliaCore.Managements.Helpers

open System.Threading.Tasks
open FSharp.Control.Tasks.V2
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.Database

let inline GetContext () = RoseliaBlogDbContext.OpenSqlConnection

let inline GetContextWithoutTracking() =
    let context = GetContext()
    context.ChangeTracker.QueryTrackingBehavior <- QueryTrackingBehavior.NoTracking
    context

let inline MutateEntity entityName finder fn findArg =
    task {
        use context = GetContext()
        let! entity = finder findArg context
        match box entity with
        | null -> return Error $"{entityName} not found"
        | _ ->
            match fn entity with
            | Ok _ as ok ->
                let! _ = context.SaveChangesAsync()
                return ok
            | err -> return err
    }

let inline MutateEntityWithException entityName finder findArg (fn : System.Action<_>) =
    let mutate entity =
        try
            fn.Invoke entity
            Ok ()
        with
        | ex -> Error (ex.ToString())
        
    MutateEntity entityName finder mutate findArg


module Task =
    let inline flatMap mapper cont =
        task {
            let! r = cont
            return! mapper r
        }
        
    let inline unit result = Task.FromResult result
    
    let inline map mapper cont =
        flatMap (mapper >> unit) cont
    
    /// flatten an option of task to a task of option.
    let inline flattenOption contOption =
        // Avoid thunk creation using explicit match.
        match contOption with
        | Some cont -> cont
        | None -> unit None
    
    let inline all (xs : Task<'a> seq) = Task.WhenAll xs
