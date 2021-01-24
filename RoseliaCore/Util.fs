﻿module RoseliaBlog.RoseliaCore.Util

open System
open System.Linq.Expressions
open System.Runtime.CompilerServices
open Microsoft.FSharp.Linq.RuntimeHelpers

let inline mapFromDict dict =
    dict |> Seq.map (|KeyValue|) |> Map.ofSeq

let inline tryGetFromDictWithType<'a, 'b when 'b :> System.Collections.Generic.IReadOnlyDictionary<string, obj>>
    key (dict: 'b) : 'a option =
    let (found, result) = dict.TryGetValue key

    match result with
    | _ when not found -> None
    | :? 'a as x -> Some x
    | _ -> None

[<Struct>]
type OptionalBuilder =
    member inline this.Bind(opt, binder) =
        opt
        |> Option.bind binder
    
    member inline this.Return(value) = Some value
    
let optional = OptionalBuilder()

/// Get the default value of type 'a.
/// This function is not a duplicate because the type annotation is not required.
let inline Default<'a> = Unchecked.defaultof<'a>

let inline ExprToLinq (expr: Quotations.Expr<'a -> 'b>) : Expression<System.Func<'a, 'b>> =
    let linq = LeafExpressionConverter.QuotationToExpression expr
    let call = linq :?> MethodCallExpression
    let lambda = call.Arguments.[0] :?> LambdaExpression
    Expression.Lambda<System.Func<'a, 'b>>(lambda.Body, lambda.Parameters)

[<Extension>]
type FSFuncUtil =
    [<Extension>]
    static member ToFSharpFunc (func : Func<'a, 'b>) = func.Invoke
    
    [<Extension>]
    static member ToFSharpFunc (func : Func<'a>) = func.Invoke
    
    [<Extension>]
    static member ToFSharpFunc (func : Action<'a>) = func.Invoke

module Option =
    let inline ofObject x =
        match box x with
        | null -> None
        | _ -> Some x
