import markdown as pymarkdown
from markdown.extensions import Extension
from markdown.util import etree
from markdown.inlinepatterns import Pattern
from markdown.extensions.codehilite import CodeHiliteExtension
from extensions.lisa import LisaLexer

LisaLexer.register()


class HeimuPattern(Pattern):
    def handleMatch(self, m):
        el = etree.Element('span', {
            'class': 'heimu'
        })
        el.text = m.group(2)
        return el


class RoseliaScriptPattern(Pattern):
    def handleMatch(self, m):
        return m.group(2)


class RoseliaMarkdownExtension(Extension):
    def extendMarkdown(self, md):
        md.registerExtension(self)
        md.inlinePatterns.register(HeimuPattern(r'~((?:~~|[^~])+?)~(?!~)', md), 'inline_heimu', 175)
        md.inlinePatterns.register(RoseliaScriptPattern(r'((?:r|R|Roselia|roselia){{[\s\S]+}})', md), 'roselia_script',
                                   200)


renderer = pymarkdown.Markdown(extensions=[
    RoseliaMarkdownExtension(),
    'footnotes',
    'pymdownx.arithmatex',
    'markdown.extensions.tables',
    'pymdownx.magiclink',
    'pymdownx.betterem',
    'pymdownx.tilde',
    'pymdownx.emoji',
    'pymdownx.tasklist',
    'pymdownx.superfences',
    'pymdownx.details',
    'pymdownx.smartsymbols',
    'pymdownx.inlinehilite',
    'pymdownx.striphtml',
    'pymdownx.mark',
    'pymdownx.keys',
    'pymdownx.highlight',
    CodeHiliteExtension(guess_lang=True)
    # 'fenced_code',
])


def markdown(s):
    return renderer.reset().convert(s)
