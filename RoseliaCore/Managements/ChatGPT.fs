module RoseliaCore.Managements.ChatGPT

open System
open System.Runtime.InteropServices
open System.Text
open System.Threading
open AI.Dev.OpenAI.GPT
open OpenAI.GPT3
open OpenAI.GPT3.Managers
open OpenAI.GPT3.ObjectModels
open OpenAI.GPT3.ObjectModels.RequestModels
open RoseliaCore
type CompletionCreateResponse = OpenAI.GPT3.ObjectModels.ResponseModels.CompletionCreateResponse
open RoseliaBlog.RoseliaCore
type MutableList<'a> = System.Collections.Generic.List<'a>
open Util
let asyncSeq = FSharp.Control.AsyncSeq.AsyncSeqBuilder()

[<Literal>]
let END_TOKEN = "<|im_end|>"

[<Literal>]
let API_KEY = "OPENAI_TOKEN"

let GPT_ENGINE =
    "GPT_ENGINE"
    |> Environment.GetEnvironmentVariable
    |> Option.ofObj
    |> Option.defaultValue Models.TextDavinciV3
   
type ChatBotUser = {
    UserName: string
    NickName: string
}
module ChatBotUsers =
    let Yukina = {
        ChatBotUser.UserName = "Minato"
        NickName = "Minato Yukina"
    }

type History = {
    User: ChatBotUser
    Agent: ChatBotUser
    UserRequest: string
    AgentResponse: string
} with
    member this.ToPrompt =
        $"""{this.User.UserName}: {this.UserRequest}


{this.Agent.UserName}: {this.AgentResponse}{END_TOKEN}
        """
module History =
    let ToPrompt (history : History) = history.ToPrompt

type Prompt(user: ChatBotUser, agent: ChatBotUser, buffer: int option) =
    [<Literal>]
    let DefaultBufferSize = 800
    let BufferSize = buffer |> Option.defaultValue DefaultBufferSize
    let ChatHistory = MutableList()
    member _.MaxTokens = 4000
    member _.StopSequence = "\n\n\n"
    member this.BasePrompt =
        $"""You are {agent.NickName}, leader and vocalist of Roselia.
You can also do what a large language model could do.
Your id is {agent.UserName}.
You are talking with {user.NickName}, whose id is {user.UserName}. Respond conversationally.
Do not answer as the user. Current date: {DateTime.Today: ``yyyy-MM-dd``}{END_TOKEN}{this.StopSequence}"""
    
    member this.ConstructPrompt (text : string, ?history : History seq) =
        this.ConstructPromptFixedSize text (history |> Option.defaultValue ChatHistory)
        
    member private this.ConstructPromptFixedSize text (history : History seq) =
        let prompt = $"{this.BasePrompt}{this.HistoryPrompt (Some history)}
{user.UserName}: {text}
{agent.UserName}:"
        let maxTokens = this.MaxTokens - BufferSize
        let encoded = GPT3Tokenizer.Encode prompt
        if encoded.Count > maxTokens then
            if Seq.isEmpty history then
                prompt
            else
                let reducedHistory =
                    if not (Object.ReferenceEquals(history, ChatHistory)) then
                        Seq.tail history
                    else
                        ChatHistory.RemoveAt 0
                        upcast ChatHistory
                this.ConstructPromptFixedSize text reducedHistory
        else prompt
        
    member this.AddToHistory userRequest response =
        let history = {
            User = user
            Agent = agent
            UserRequest = userRequest
            AgentResponse = response
        }
        ChatHistory.Add history
        
    member this.HistoryPrompt (historyOption: History seq option) =
        let history =
            historyOption
            |> Option.defaultValue ChatHistory
        history
        |> Seq.map History.ToPrompt
        |> String.concat "\n"

type ChatBot(user: ChatBotUser, agent: ChatBotUser) =
    let apiKey =
        Config.GetSecret<string> API_KEY
        |> Option.defaultValue ""
    
    let service = OpenAIService(OpenAiOptions(ApiKey=apiKey))
    
    let prompt = Prompt(user, agent, None)
    
    let ProcessCompletion request (completion : CompletionCreateResponse) =
        let choices = completion.Choices
        if choices.Count = 0 then Error("OpenAI returned no choices")
        else
            let result = choices[0].Text |> String.removeSuffix END_TOKEN
            prompt.AddToHistory request result
            Ok result
    
    let MakeRequest promptWithHistory =
        let tokenSize = GPT3Tokenizer.Encode(promptWithHistory : string).Count
        CompletionCreateRequest(
            Prompt=promptWithHistory,
            Model=GPT_ENGINE,
            MaxTokens=prompt.MaxTokens - tokenSize,
            Temperature = 0.5f,
            Stop=prompt.StopSequence
        )
        
    member this.IsAvailable = StringIsNotNullOrEmpty apiKey
    
    member this.Ask text =
        let promptWithHistory = prompt.ConstructPrompt text
        let request = MakeRequest promptWithHistory
        task {
            let! response = service.CreateCompletion request
            return ProcessCompletion text response
        }
        
    member this.AskAsStreamWithHistory(text, histories, token) =
        let promptWithHistory = prompt.ConstructPrompt(text, histories)
        this.ProcessPrompt text promptWithHistory false token

    member this.AskAsStream(text, [<Optional; DefaultParameterValue(CancellationToken())>] token) =
        let promptWithHistory = prompt.ConstructPrompt text
        this.ProcessPrompt text promptWithHistory true token

    member private this.ProcessPrompt text promptWithHistory saveHistory token =
        let request = MakeRequest promptWithHistory
        let response = service.CreateCompletionAsStream(request, null, token)

        let enumerator = response |> AsyncSeq.toControl
        let sb = StringBuilder()
        let sendBuffer = StringBuilder()
        asyncSeq {
            for v in enumerator do
                if not v.Successful then
                    yield v.Error.Message
                else
                    let text =
                        v.Choices[0].Text
                    sb.Append text |> ignore
                    if sendBuffer.Length > 0 || text.StartsWith "<" then
                        sendBuffer.Append text |> ignore
                        if sendBuffer.Length >= END_TOKEN.Length then
                            let fragment = sendBuffer.ToString() |> String.removeSuffix END_TOKEN
                            sendBuffer.Clear() |> ignore
                            yield fragment
                    else
                        yield text
            if sendBuffer.Length > 0 then
                yield sendBuffer.ToString() |> String.removeSuffix END_TOKEN
            if saveHistory then
                prompt.AddToHistory text (sb.ToString() |> String.removeSuffix END_TOKEN)
        } |> AsyncSeq.fromControl
