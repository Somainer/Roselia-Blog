namespace RoseliaBlog.RoseliaCore.StructuralCopy

open System
open System.Collections.Generic
open System.Linq
open System.Linq.Expressions
open System.Reflection
open Microsoft.FSharp.Quotations
open RoseliaBlog.RoseliaCore

type QuotedFunc<'In, 'Out> = Expression<Func<'In, 'Out>>

type CopierMissingPolicy =
    | Ignore = 0
    | Error = 1

type Copier<'TFrom, 'TTo>
    (mapper : Map<string, Expression>,
     missingPolicy : CopierMissingPolicy,
     assignNullValues: bool) as self =
    let GetAssignmentExpressions sourceVar targetVar isAssignment =
        let sourceDecls = typeof<'TFrom>.GetProperties()
        let decls = typeof<'TTo>.GetProperties()
        let assignments : Expression seq =
            seq {
                for field in decls do
                    let name = field.Name
                    match Map.tryFind name mapper with
                    | Some fn when assignNullValues ->
                        yield Expression.Assign(
                                Expression.Property(targetVar, field),
                                Expression.Convert(
                                    Expression.Invoke(fn, [sourceVar]),
                                    field.PropertyType
                                )
                            )
                    | Some fn ->
                        let lambda = fn :?> LambdaExpression
                        let tempVar = Expression.Variable(lambda.ReturnType)
                        yield Expression.Block(
                            [tempVar],
                            ([
                                Expression.Assign(tempVar, Expression.Invoke(lambda, [sourceVar]))
                                Expression.IfThen(
                                    Expression.NotEqual(tempVar, Expression.Default(lambda.ReturnType)),
                                    Expression.Assign(Expression.Property(targetVar, field), tempVar)
                                )
                            ] : Expression list)
                        )
                    | None ->
                        match
                            sourceDecls.FirstOrDefault
                                (fun f -> f.Name = name && f.PropertyType.IsAssignableTo field.PropertyType)
                            with
                            | null ->
                                match missingPolicy with
                                | CopierMissingPolicy.Error ->
                                    invalidOp $"No field names {name} in {typeof<'TFrom>.Name} with type {field.PropertyType.Name}"
                                | CopierMissingPolicy.Ignore | _ -> ()
                            | fromField ->
                                let getFromSource = Expression.Property(sourceVar, fromField)
                                let assignment =
                                    Expression.Assign(
                                        Expression.Property(targetVar, field),
                                        getFromSource
                                    )
                                
                                let expression : Expression =
                                   if isAssignment
                                       && not(assignNullValues) then
                                        upcast Expression.IfThen(
                                            Expression.NotEqual(getFromSource, Expression.Default(fromField.PropertyType)),
                                            assignment
                                        )
                                    else upcast assignment
                                
                                yield expression
            }
        assignments
    
    member this.MapperExpression () =
        let unitCtor = typeof<'TTo>.GetConstructor([||])
        let sourceVar = Expression.Parameter(typeof<'TFrom>, "source")
        let targetVar = Expression.Variable(typeof<'TTo>, "target")
        let assignments = GetAssignmentExpressions sourceVar targetVar false
        
        let returnLabel = Expression.Label(typeof<'TTo>)
        Expression.Lambda(
            body = Expression.Block(
                [ targetVar ],
                seq {
                    yield Expression.Assign(targetVar, Expression.New(unitCtor, [])) :> Expression
                    yield! assignments
                    yield upcast Expression.Return(returnLabel, targetVar, typeof<'TTo>)
                    yield upcast Expression.Label(returnLabel, targetVar)
                }
            ),
            parameters = [| sourceVar |]
        ) :?> Expression<Func<'TFrom, 'TTo>>
    
    member private this.MakeMapper () =
        this.MapperExpression()
            .Compile() .Invoke
            
    member this.GetAssignerExpression () =
        let sourceVar = Expression.Parameter(typeof<'TFrom>, "source")
        let targetVar = Expression.Parameter(typeof<'TTo>, "target")
        let assignments = GetAssignmentExpressions sourceVar targetVar true
        Expression.Lambda(
            Expression.Block(assignments),
            [sourceVar; targetVar]
        ).Reduce()
        :?> Expression<Action<'TFrom, 'TTo>>
        
    member private this.GetAssigner() =
        this.GetAssignerExpression()
            .Compile().Invoke
    
    member val private Converter =
        lazy self.MakeMapper()
        
    member val private Assigner =
        lazy self.GetAssigner()
    
    member this.ThrowIfFail () =
        this.Converter.Force() |> ignore
        this
    
    member this.Copy (from : 'TFrom) =
        this.Converter.Value from
    
    member this.Assign source target =
        this.Assigner.Value (source, target)
        
type CopierBuilder<'TFrom, 'TTo>() =
    let mutable missingPolicy = CopierMissingPolicy.Error
    let mutable assignNullValues = true
    member val private mappers =
        Dictionary<string, Expression>()
    
    member this.MapTo<'a> (fromNav : Expression<Func<'TFrom, 'a>>) (toNav : Expression<Func<'TTo, 'a>>) =
        let toProp =
            tryUnbox<MemberExpression> toNav.Body
            |> Option.filter (fun m -> m.Member :? PropertyInfo)
            
        if toProp.IsNone then
            invalidArg (nameof toNav) "must be property access"
        
        this.mappers.Add (toProp.Value.Member.Name, fromNav)
        this
    
    member this.MapToFn<'a> (fromNav : Expr<'TFrom -> 'a>, toNav : Expr<'TTo -> 'a>) =
        this.MapTo (Util.ExprToLinq fromNav) (Util.ExprToLinq toNav)
    
    member this.MapToValue toNav value =
        this.MapTo (Util.ExprToLinq <@ fun _ -> value @>) toNav
        
    member this.MapToDefault navigator =
        this.MapToValue navigator Util.Default
    
    member this.WhenFieldMissing policy =
        missingPolicy <- policy
        this
        
    member this.SkipNullValues shouldSkip =
        assignNullValues <- (not shouldSkip)
        this
        
    member this.Build () =
        Copier<'TFrom, 'TTo>(Util.mapFromDict this.mappers, missingPolicy, assignNullValues)
        
module StructuralCopy =
    let NewBuilder<'TFrom, 'TTo> =
        CopierBuilder<'TFrom, 'TTo>()
        
    let Of<'TFrom, 'TTo> =
        NewBuilder<'TFrom, 'TTo>
            .Build().Copy
    
    let inline mapTo fromNav toNav (builder : CopierBuilder<_, _>) =
        builder.MapToFn (fromNav, toNav)
        
    let inline build (builder : CopierBuilder<_, _>) =
        builder.Build()
        
    let inline whenFieldMissing policy (builder : CopierBuilder<_, _>) =
        builder.WhenFieldMissing policy
    
    let inline skipNullValue skip (builder : CopierBuilder<_, _>) =
        builder.SkipNullValues skip
    
    let inline mapToDefault navigator (builder : CopierBuilder<_, _>) =
        builder.MapToDefault (Util.ExprToLinq navigator)
