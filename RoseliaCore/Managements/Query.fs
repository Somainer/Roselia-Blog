module RoseliaBlog.RoseliaCore.Managements.Query

open System
open System.Linq
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.Managements.Helpers
open RoseliaBlog.RoseliaCore.Util

type IQueryable<'a> with
    [<NoDynamicInvocation>]
    member inline this.FirstOption() =
        this.FirstOrDefault()
        |> Option.ofObject
    
    [<NoDynamicInvocation>]
    member inline this.FirstOptionAsync () =
        this
            .FirstOrDefaultAsync()
            |> Task.map Option.ofObject
