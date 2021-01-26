using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using RoseliaBlog.RoseliaCore.StructuralCopy;

namespace RoseliaBlogTest
{
    class F
    {
        public string S { get; set; }
        public int I { get; set; }
        public DateTime Now { get; set; }
    }

    class G
    {
        public string S { get; set; }
        public int I { get; set; }
    }

    class H
    {
        public string S { get; set; }
        public int I { get; set; }
        public DateTime Current { get; set; }
        
        public object Obj { get; set; }
    }
    
    [TestClass]
    public class StructuralCopyTest
    {
        [TestMethod]
        public void TestSameStructure()
        {
            var copier =
                StructuralCopy.NewBuilder<F, G>()
                    .MapTo(x => x.I, x => x.I)
                    .Build();
            var f = new F
            {
                S = "Test",
                I = 114,
                Now = DateTime.Now
            };
            var g = copier.Copy(f);
            
            Assert.AreEqual(f.S, g.S);
            Assert.AreEqual(f.I, g.I);
        }

        [TestMethod]
        [ExpectedException(typeof(ArgumentException))]
        public void TestInvalidMapper()
        {
            StructuralCopy.NewBuilder<F, G>()
                .MapTo(f => f.S, g => g + "S")
                .Build();
        }

        [TestMethod]
        [ExpectedException(typeof(InvalidOperationException))]
        public void TestMissingFieldFailure()
        {
            StructuralCopy.NewBuilder<G, H>()
                .WhenFieldMissing(CopierMissingPolicy.Error)
                .Build()
                .ThrowIfFail();
        }
        
        [TestMethod]
        public void TestMappers()
        {
            var copier =
                StructuralCopy.NewBuilder<F, H>()
                    .MapTo(f => f.Now, h => h.Current)
                    .MapTo(f => f.S, h => h.Obj)
                    .Build();
            var f = new F()
            {
                S = "S",
                I = 114,
                Now = DateTime.Now
            };

            var h = copier.Copy(f);
            
            Assert.AreEqual(f.S, h.S);
            Assert.AreEqual(f.I, h.I);
            Assert.AreEqual(f.Now, h.Current);
            Assert.AreEqual(f.S, h.Obj);
        }

        [TestMethod]
        public void TestMapToValue()
        {
            var now = DateTime.Now;
            var copier =
                StructuralCopy.NewBuilder<G, F>()
                    .MapToValue(g => g.Now, now)
                    .Build();

            var g = new G()
            {
                I = 2,
                S = "2"
            };
            var f = copier.Copy(g);
            
            Assert.AreEqual(now, f.Now);
        }
        
        [TestMethod]
        public void TestMissingPolicy()
        {
            var copier = StructuralCopy
                .NewBuilder<G, H>()
                .WhenFieldMissing(CopierMissingPolicy.Ignore)
                .Build();
            
            var g = new G()
            {
                I = 1,
                S = "Test"
            };

            var h = copier.Copy(g);
            
            Assert.AreEqual(g.I, h.I);
            Assert.AreEqual(g.S, h.S);
            Assert.IsNull(h.Obj);
            Assert.AreEqual(default, h.Current);
        }

        [TestMethod]
        void TestAssignment()
        {
            var copier =
                StructuralCopy.NewBuilder<F, H>()
                    .MapTo(f => f.Now, h => h.Current)
                    .MapTo(f => f.S, h => h.Obj)
                    .Build();
            var f = new F()
            {
                S = null,
                I = 114,
                Now = DateTime.Now
            };

            var h = new H()
            {
                S = "H"
            };
            copier.Assign(f, h);
            
            Assert.AreEqual(f.S, h.S);
            Assert.AreEqual(f.I, h.I);
            Assert.AreEqual(f.Now, h.Current);
            Assert.AreEqual(f.S, h.Obj);
        }

        [TestMethod]
        public void TestNullValueSkipping()
        {
            var copier =
                    StructuralCopy.NewBuilder<F, H>()
                        .MapTo(f => f.Now, h => h.Current)
                        .MapTo(f => f.S, h => h.Obj)
                        .SkipNullValues(true)
                        .Build();
                var f = new F()
                {
                    S = null,
                    I = 114,
                    Now = DateTime.Now
                };
    
                var h = new H()
                {
                    S = "H"
                };
                copier.Assign(f, h);
                
                Assert.AreNotEqual(f.S, h.S);
                Assert.AreEqual(f.I, h.I);
                Assert.AreEqual(f.Now, h.Current);
                Assert.AreEqual(f.S, h.Obj);
        }
    }
}
