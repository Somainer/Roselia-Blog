[<AutoOpen>]
module RoseliaBlog.RoseliaCore.Managements.Helpers

open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore.Database

let inline GetContext () = RoseliaBlogDbContext.OpenSqlConnection

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
