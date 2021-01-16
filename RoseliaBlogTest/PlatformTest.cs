using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;

using RoseliaBlog.RoseliaCore;

namespace RoseliaBlogTest
{
    [TestClass]
    public class PlatformTest
    {
        /// <summary>
        /// Just test if get platform info works.
        /// </summary>
        [TestMethod]
        public void TestPlatformInfo()
        {
            var info = PlatformInfo.CurrentPlatformInfo.Value;

            Assert.IsNotNull(info);
            Assert.AreNotEqual(info.Name, "Unknown");
        }

        /// <summary>
        /// Getting cpu info should not throw.
        /// </summary>
        [TestMethod]
        public void TestCpuInfo()
        {
            var cpuInfo = PlatformInfo.CurrentCpuInfo.Value;

            Assert.IsNotNull(cpuInfo);
            Assert.IsFalse(string.IsNullOrEmpty(cpuInfo.Name));
            Assert.IsTrue(cpuInfo.LogicalCore > 0);
        }

        /// <summary>
        /// Test dummy cpu usage, it should not throw.
        /// </summary>
        [TestMethod]
        public void TestCpuUsage()
        {
            if (OperatingSystem.IsMacOS())
            {
                Assert.Inconclusive("Not supported in macOS");
            }
            var usage = PlatformInfo.CpuUsage.GetUsage;
            Assert.IsNotNull(usage);
        }

        /// <summary>
        /// Test dummy memory usage.
        /// </summary>
        [TestMethod]
        public void TestMemoryUsage()
        {
            if (OperatingSystem.IsMacOS())
            {
                Assert.Inconclusive("Not supported in macOS");
            }
            
            var usage = PlatformInfo.MemoryUsage.GetUsage;
            
            Assert.IsTrue(usage.Available > 0);
            Assert.IsTrue(usage.Total > 0);
            Assert.IsTrue(usage.Used > 0);
        }
    }
}
