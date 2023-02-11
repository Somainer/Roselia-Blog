using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.Token;
using RoseliaCore.Managements;

namespace RoseliaBlog.Controllers;

[Route("/api/chat")]
public class ChatController : Controller
{
    [Route("ask-stream")]
    [HttpPost]
    [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
    public async Task<IActionResult> AskStream([FromBody] ChatGptRequestForm form)
    {
        var question = form.Text;
        if (string.IsNullOrEmpty(question))
        {
            return BadRequest("No input question.");
        }

        var user = await this.GetUser().GetUnderlyingUser();
        var chatUser = new ChatGPT.ChatBotUser(user?.Value?.UserName ?? "User", user?.Value?.Nickname ?? "User");
        var agent = ChatGPT.ChatBotUsers.Yukina;
        var bot = new ChatGPT.ChatBot(chatUser, agent);
        if (!bot.IsAvailable)
        {
            return Unauthorized("Chat is not available.");
        }
        var histories = MakeHistory(chatUser, agent, form.History);
        var result = bot.AskAsStreamWithHistory(question, histories, HttpContext.RequestAborted);
        return new AsyncStreamResult()
        {
            ContentType = "text/plain",
            Enumerable = result
        };
    }

    private static IEnumerable<ChatGPT.History> MakeHistory(ChatGPT.ChatBotUser user, ChatGPT.ChatBotUser agent,
        IEnumerable<ChatHistory> histories)
    {
        string lastContent = null;
        foreach (var history in histories)
        {
            if (lastContent is null) lastContent = history.Content;
            else
            {
                yield return new ChatGPT.History(
                    user: user,
                    agent: agent,
                    userRequest: lastContent,
                    agentResponse: history.Content
                );
                lastContent = null;
            }
        }
    }
}
