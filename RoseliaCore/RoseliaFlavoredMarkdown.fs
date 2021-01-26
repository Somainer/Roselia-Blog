namespace RoseliaBlog.RoseliaCore.RoseliaFlavoredMarkdown

open System.Text.RegularExpressions

open Markdig
open Markdig.Parsers
open Markdig.Parsers.Inlines
open Markdig.Renderers
open Markdig.Renderers.Html
open Markdig.Renderers.Html.Inlines
open Markdig.Syntax.Inlines

type IRoseliaExtension =
    abstract Name : string

/// Spoiler is such thing as ~this~.
/// This extension will convert spoilers to <span class="heimu">this</span>
type SpoilerBlockingExtension() =
    member val HtmlClassName = "heimu"
    member val HtmlLabel = "span"
    
    interface IRoseliaExtension with
        member this.Name = "SpoilerBlocking"
    
    interface IMarkdownExtension with
        member this.Setup(pipeline) =
            match pipeline.InlineParsers.FindExact<EmphasisInlineParser>() with
            | null -> ()
            | emphasis ->
                emphasis.EmphasisDescriptors.Add(EmphasisDescriptor ('~', 1, 1, true));
        
        member this.Setup(_pipeline, renderer) =
            match renderer with
            | :? HtmlRenderer as hr ->
                match hr.ObjectRenderers.FindExact<EmphasisInlineRenderer>() with
                | null -> ()
                | emphasis ->
                    let prevDelegate = emphasis.GetTag
                    emphasis.GetTag <-
                        fun emph ->
                            if emph.DelimiterChar = '~' then
                                // If it is a spoiler, then add custom css class.
                                // Pretty dirty, but works.
                                let attributes = emph.GetAttributes()
                                attributes.AddClass this.HtmlClassName
                                this.HtmlLabel
                            else prevDelegate.Invoke emph
            | _ -> ()

/// Roselia Script pattern
/// (label){{(code)}}
type RoseliaScriptInline (label : string, code : string) =
    inherit ContainerInline()
    
    member val Label : string = label
    member val Code : string = code

type RoseliaScriptParser () =
    inherit InlineParser()
    let regex = Regex(@"(r|R|Roselia|roselia){{([\s\S]+)}}")
    override this.Match (processor, slice) =
        let matchResult = regex.Match(slice.Text, slice.Start)
        if matchResult.Success then
            slice.Start <- slice.Start + matchResult.Length
            let label = matchResult.Groups.[1].Value
            let code = matchResult.Groups.[2].Value
            processor.Inline <- RoseliaScriptInline(label, code)
            true
        else false
            

type RoseliaScriptRenderer () =
    inherit HtmlObjectRenderer<RoseliaScriptInline>()
    member val OverridenLabel = "Roselia"

    override this.Write(renderer: HtmlRenderer, obj: RoseliaScriptInline): unit =
        renderer.Write(sprintf "%s{{ %s }}" this.OverridenLabel obj.Code) |> ignore

type RoseliaScriptExtension () =
    interface IRoseliaExtension with
        member _.Name = "RoseliaScript"
    
    interface IMarkdownExtension with
        member this.Setup(pipeline) =
            pipeline.InlineParsers.AddIfNotAlready<RoseliaScriptParser>()
            
        member this.Setup(_pipeline, renderer) =
            RoseliaScriptRenderer()
            |> renderer.ObjectRenderers.Add
    
/// The RFM extension.
type RoseliaFlavoredMarkdown() =
    static member val Pipeline = RoseliaFlavoredMarkdown.MakePipeline
    
    static member private MakePipeline =
        let pipeline =
            MarkdownPipelineBuilder()
                .UseAdvancedExtensions()
                .Use<SpoilerBlockingExtension>()
                .Use<RoseliaScriptExtension>()
        pipeline.Extensions.TryRemove<Extensions.EmphasisExtras.EmphasisExtraExtension>() |> ignore
        
        pipeline.Build()
        
module RoseliaFlavoredMarkdown =
    let ConvertToHtml markdown =
        Markdown.ToHtml(markdown, RoseliaFlavoredMarkdown.Pipeline)
