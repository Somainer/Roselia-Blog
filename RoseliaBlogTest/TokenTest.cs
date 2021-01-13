using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Text.Json;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlogTest
{
    [TestClass]
    public class TokenTest
    {
        [TestMethod]
        public void TestTokenSerialization()
        {
            var token =
                new TokenTypes.UserCredentialToken(1, "Me", 1);
            StringAssert.Contains(JsonSerializer.Serialize(token), token.TokenRole.ToString());
            var deserialize =
                JsonSerializer.Deserialize<TokenTypes.UserCredentialToken>(JsonSerializer.Serialize(token));
            var des = JsonSerializer.Deserialize<TokenTypes.UserCredentialToken>(
                JsonSerializer.Serialize(new TokenTypes.UserRefreshToken(token.Id, token.UserName, token.UserRole)));
            Assert.IsNull(des);
            Assert.IsTrue(deserialize!.TokenRole.IsUserCredential);
            Console.Write(JsonSerializer.Serialize(token));
        }
    }
}