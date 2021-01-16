using Microsoft.VisualStudio.TestTools.UnitTesting;
using RoseliaBlog.RoseliaCore;

namespace RoseliaBlogTest
{
    [TestClass]
    public class ConfigTest
    {
        [TestMethod]
        public void TestLoadConfig()
        {
            var config = Config.LoadDefaultConfig();
            Assert.IsFalse(string.IsNullOrEmpty(config.Secrets.AppKey));
            Assert.IsTrue(config.Secrets.SecretStorage.TryGetValue("appSecret", out _));
        }

        [TestMethod]
        public void TestConfigIsLoaded()
        {
            var config = Config.LoadDefaultConfig();

            Assert.IsNotNull(Config.Config);
            Assert.AreEqual(Config.Config.Title, config.Title);
        }

        [TestMethod]
        public void TestSecretGeneration()
        {
            var secret1 = Config.GenKey();
            var secret2 = Config.GenKey();
            
            Assert.AreNotEqual(secret1, secret2);
            Assert.AreEqual(secret1.Length, secret2.Length);
        }

        [TestMethod]
        public void TestConfigFetching()
        {
            Assert.IsNull(Config.GetConfig<string>("name"));
            Assert.IsNotNull(Config.GetConfig<string>("title"));
            Assert.IsNull(Config.GetConfig<int>("title"));
        }
    }
}
