using System;
using System.IO.Pipelines;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using RoseliaCore.Managements;

namespace RoseliaBlogTest;

[TestClass]
public class ChatGPTTest
{
    [TestMethod]
    public async Task TestAsk()
    {
        var bot = new ChatGPT.ChatBot(new ChatGPT.ChatBotUser("User", "User"), new ChatGPT.ChatBotUser("ChatGPT", "ChatGPT"));
        var result = bot.AskAsStream("How to write fibonacci in csharp?");
        await foreach (var fragment in result)
        {
            Console.Write(fragment);
        }
    }
}
