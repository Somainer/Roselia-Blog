using System;
using System.Text;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Text.Json;
using RoseliaBlog.RoseliaCore;
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
                TokenTypes.MakeUserCredential(new(1, "", 0));

            var serialized = TokenProcessor.CreateToken(token);
            Assert.IsTrue(serialized.Split('.').Length == 3);

            var payload = serialized.Split('.')[1];
            var decodedPayload = 
                Encoding.UTF8.GetString(Convert.FromBase64String(AutoPadBase64(payload)));
            
            StringAssert.Contains(decodedPayload, TokenTypes.RoseliaTokenType.UserCredential.ToString());
            Assert.IsNotNull(TokenProcessor.ValidateRoseliaToken(serialized));
        }

        [TestMethod]
        public void TestTokenValidation()
        {
            var tokenBase = new TokenTypes.RoseliaUserBase(1, "ABC", 0);
            var token = TokenTypes.MakeUserCredential(tokenBase);
            var tokenString = TokenProcessor.CreateToken(token);

            var decodedToken = TokenProcessor.ValidateRoseliaToken(tokenString);
            Assert.IsNotNull(decodedToken);
            Assert.IsTrue(decodedToken.Value.IsUserCredential);
            
            Assert.IsNull(TokenProcessor.ValidateRoseliaToken(decodedToken + "a"));
        }

        [TestMethod]
        public void TestSaltRefresh()
        {
            var tokenBase = new TokenTypes.RoseliaUserBase(1, "", 0);
            var token = TokenTypes.MakeUserCredential(tokenBase);
            var tokenString = TokenProcessor.CreateToken(token);

            var decodedToken = TokenProcessor.ValidateRoseliaToken(tokenString);
            Assert.IsNotNull(decodedToken);
            Assert.IsTrue(decodedToken.Value.IsUserCredential);
            Config.RefreshSalt();
            Assert.IsNull(TokenProcessor.ValidateRoseliaToken(tokenString));
            tokenString = TokenProcessor.CreateToken(token);
            Assert.IsNotNull(TokenProcessor.ValidateRoseliaToken(tokenString));
        }

        private static string AutoPadBase64(string base64) =>
            base64.PadRight(base64.Length + (4 - base64.Length % 4), '=');
    }
}
