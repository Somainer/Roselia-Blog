﻿module RoseliaBlog.RoseliaCore.Util

open System
open System.Linq.Expressions
open System.Net.Http
open System.Runtime.CompilerServices
open System.Text.Json
open FSharp.Control.Tasks.V2
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

let inline implicitly (x : ^a) : ^b = ((^a or ^b) : (static member op_Implicit : ^a -> ^b) x) 

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

let inline StringIsNotNullOrEmpty s =
    s
    |> String.IsNullOrEmpty
    |> not

let inline ExprToLinqCovariant (expr: Quotations.Expr<'a -> 'b>) : Expression<System.Func<'a, 'c>> =
    let linq = LeafExpressionConverter.QuotationToExpression expr
    let call = linq :?> MethodCallExpression
    let lambda = call.Arguments.[0] :?> LambdaExpression
    Expression.Lambda<System.Func<'a, 'c>>(lambda.Body, lambda.Parameters)

let inline ExprToLinq (expr: Quotations.Expr<'a -> 'b>) : Expression<System.Func<'a, 'b>> =
    ExprToLinqCovariant expr

let inline (|SameReturnTypeAs|) (_ : _ -> 'a) (x : 'a) = x

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

[<Extension>]
type HttpUtil () =
    [<Extension>]
    static member GetJsonAsync<'a> (response : HttpResponseMessage) =
        task {
            let! content = response.Content.ReadAsStringAsync()
            return JsonSerializer.Deserialize<'a> content
        }
        
let DiscoverImplementations<'a> () =
    seq {
        for t in typeof<'a>.Assembly.GetTypes() do
            if t.IsClass
               && not t.IsAbstract
               && t.IsAssignableTo(typeof<'a>) then
                let ctor = t.GetConstructor([||])
                if not (isNull ctor) then
                    yield ctor.Invoke([||]) :?> 'a
    }

module String =
    let removeSuffix (suffix : string) (str : string) =
        if str.EndsWith suffix then
            str.Remove(str.Length - suffix.Length)
        else str
