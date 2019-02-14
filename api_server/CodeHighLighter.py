import mistune
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import html
import pygments
import re


class HighlightRenderer(mistune.Renderer):
    def block_code(self, code, lang):
        if not lang:
            return '\n<pre><code>%s</code></pre>\n' % \
                   mistune.escape(code)
        if lang.lower() == 'math':
            return "<p>$$ {} $$</p>".format(mistune.escape(code))
        try:
            lexer = get_lexer_by_name(lang, stripall=True)
        except pygments.util.ClassNotFound as e:
            return self.block_code(code, None)
        formatter = html.HtmlFormatter()
        return '\n<code>%s</code>\n' % highlight(code, lexer, formatter)


class RoseliaRenderer(HighlightRenderer):
    def heimu(self, s):
        return '<span class="heimu">{}</span>'.format(s)

    def rscript(self, s):
        return 'Roselia{{%s}}' % s


class RoseliaGrammar(mistune.InlineGrammar):
    inline_heimu = re.compile(
        r'^~((?:~~|[^~])+?)~(?!~)'
    )


class RoseliaLexer(mistune.InlineLexer):
    grammar_class = RoseliaGrammar

    def register_rules(self):
        for k, v in self.__class__.__dict__.items():
            if hasattr(self, 'output_{}'.format(k)):
                v(self)

    def inline_heimu(self):
        self.default_rules.insert(8, 'inline_heimu')
        self.inline_html_rules.insert(6, 'inline_heimu')

    def formula(self):
        self.rules.formula = re.compile(
            r'(\$\$|\$|\\\()'
            r'([\s\S]+?)'
            r'(\$\$|\$|\\\))'
        )
        self.default_rules.insert(4, 'formula')

    def rscript(self):
        self.rules.rscript = re.compile(
            r'^(?:Roselia|roselia|r|R){{'
            r'([\s\S]+?)'
            r'}}'
        )
        self.default_rules.insert(3, 'rscript')
        self.inline_html_rules.insert(4, 'rscript')

    def output_rscript(self, m):
        return self.renderer.rscript(m.group(1))

    def output_formula(self, m):
        return m.group(1) + m.group(2) + m.group(3)

    def output_inline_heimu(self, m):
        return self.renderer.heimu(self.output(m.group(1)))


renderer = RoseliaRenderer()
rules = RoseliaLexer(renderer)
rules.register_rules()
# rules.heimu()
# rules.inline_heimu()
markdown = mistune.Markdown(renderer=renderer, inline=rules)

if __name__ == '__main__':
    print(markdown('~~~fuck~~~'))
