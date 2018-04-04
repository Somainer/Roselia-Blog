import houdini as h
import misaka as m
from pygments import highlight
from pygments.formatters import HtmlFormatter, ClassNotFound
from pygments.lexers import get_lexer_by_name

class HighlighterRenderer(m.HtmlRenderer):
    def blockcode(self, text, lang):
        if lang.lower() == 'math':
            return "<p>$$ {} $$</p>".format(h.escape_html(text.strip()))
        try:
            lexer = get_lexer_by_name(lang, stripall=True)
        except ClassNotFound:
            lexer = None

        if lexer:
            formatter = HtmlFormatter()
            return highlight(text, lexer, formatter)
        # default
        return '\n<pre><code>{}</code></pre>\n'.format(
                            h.escape_html(text.strip()))

renderer = HighlighterRenderer()
markdown = m.Markdown(renderer, extensions=('fenced-code',))