module RoseliaBlog.RoseliaCore.Managements.Query

open System
open System.Linq
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.Managements.Helpers
open RoseliaBlog.RoseliaCore.Util

type Linq.QueryBuilder with
    [<NoDynamicInvocation; CustomOperation("firstOption")>]
    member inline this.FirstOption(source : Linq.QuerySource<'a, 'b>) =
        this.Select(source, Option.ofObject)
    
    [<NoDynamicInvocation; CustomOperation("firstOptionAsync")>]
    member inline this.FirstOptionAsync (source : Linq.QuerySource<'a, 'b>) =
        (source.Source :?> IQueryable<'a>)
            .FirstOrDefaultAsync()
            |> Task.map Option.ofObject

    [<NoDynamicInvocation; CustomOperation("toListAsync")>]
    member inline this.ToListAsync (source : Linq.QuerySource<'a, _>) =
        (source.Source :?> IQueryable<'a>).ToListAsync()
        
    [<NoDynamicInvocation; CustomOperation("includes")>]
    member inline this.Includes (source : Linq.QuerySource<'a, 'b>, [<ProjectionParameter>] projection : 'a -> 'c) =
        Linq.QuerySource<'a, 'b>((source.Source :?> IQueryable<'a>).Include(projection))
    
    [<NoDynamicInvocation; CustomOperation("anyAsync")>]
    member inline this.AnyAsync (source : Linq.QuerySource<'a, 'b>, [<ProjectionParameter>] predicate : 'a -> bool) =
        (source.Source :?> IQueryable<'a>).AnyAsync(predicate)
    
    [<NoDynamicInvocation; CustomOperation("notEmptyAsync")>]
    member inline this.NotEmptyAsync (source : Linq.QuerySource<'a, 'b>) =
        (source.Source :?> IQueryable<'a>).AnyAsync()
