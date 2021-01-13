using System;
using System.Text.RegularExpressions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Markdig;
using RoseliaBlog.RoseliaCore;

namespace RoseliaBlogTest
{
    [TestClass]
    public class RFMTest
    {
        [TestMethod]
        public void TestBasicMarkdown()
        {
            const string markdownString = @"
                # Title
                [](/index)
                ![img](/favicon.png)
                ## Subtitle          
            ";
            var rfmPipeline = RoseliaFlavoredMarkdown.RoseliaFlavoredMarkdown.Pipeline;
            var pipeline = ClonePipeline(rfmPipeline);
            RemoveRoselia(pipeline);
            var defaultResult = Markdown.ToHtml(markdownString, pipeline);
            var rfmResult = Markdown.ToHtml(markdownString, rfmPipeline);
            Assert.AreEqual(defaultResult, rfmResult);
        }

        [TestMethod]
        [DataRow(@"This is ~a blocked content~.", DisplayName = "Basic case")]
        [DataRow(@"[~link~](/index)", DisplayName = "Inside link")]
        [DataRow(@"# ~index~", DisplayName = "In headline")]
        public void TestSpoilerBlocking(string markdownString)
        {
            StringAssert.Contains(ConvertUsingRoselia(markdownString), 
                new RoseliaFlavoredMarkdown.SpoilerBlockingExtension().HtmlClassName);
        }

        [TestMethod]
        [DataRow(@"r{{ let a = 1; }}", DisplayName = "Basic case")]
        [DataRow(@"Crap is r{{ const str = `Holy ${crap}.` }}.", DisplayName = "Not escape template strings.")]
        [DataRow("Stop me r{{ let a = 3; \n\n\n\n def('G', 2) }}\n Here.", DisplayName = "Not overriden by blocks.")]
        public void TestRoseliaScript(string markdownString)
        {
            var regex = new Regex(@"(r|R|Roselia|roselia){{([\s\S]+)}}");
            var match = regex.Match(markdownString);
            Assert.IsTrue(match.Success);

            var result = ConvertUsingRoselia(markdownString);
            
            // Label should be overriden.
            StringAssert.Contains(result, new RoseliaFlavoredMarkdown.RoseliaScriptRenderer().OverridenLabel);
            // Result should contains the code exactly.
            StringAssert.Contains(result, match.Groups[2].Value);
        }

        private static string ConvertUsingRoselia(string markdown) =>
            Markdown.ToHtml(markdown, RoseliaFlavoredMarkdown.RoseliaFlavoredMarkdown.Pipeline);
        private static MarkdownPipeline ClonePipeline(MarkdownPipeline oldPipeline)
        {
            var pipeline = new MarkdownPipelineBuilder();
            foreach (var extension in oldPipeline.Extensions)
            {
                pipeline.Extensions.Add(extension);
            }

            return pipeline.Build();
        }

        private static void RemoveRoselia(MarkdownPipeline pipeline)
        {
            _ = pipeline.Extensions
                .RemoveAll(extension => extension is RoseliaFlavoredMarkdown.IRoseliaExtension);
        }
    }
}
