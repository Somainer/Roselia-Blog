from pygments.lexer import RegexLexer, words, include, bygroups
from pygments.token import *

from pygments.lexers.lisp import SchemeLexer
from pygments.lexers.python import Python3Lexer
from pygments.lexers._mapping import LEXERS

__all__ = ['LisaLexer']


class LisaLexer(RegexLexer):
    name = 'Lisa'
    aliases = ['lisa']
    filenames = ['*.lisa']
    mimetypes = ['text/x-lisa', 'application/x-lisa']

    special_forms = (
        '.', 'lambda', 'cond', 'if', 'let', 'else', 'set!', '&'
    )

    declarations = (
        'define', 'define-macro', 'define-mutable!', 'define-phrase'
    )

    builtins = (
        '*', '+', '-', '->', '/', '<', '<=', '=', '>', '>=',
        'print!', 'println!', 'input', 'int', 'truthy?',
        'import-env!', 'list', 'seq', 'wrap-scala', 'wrap',
        'map', 'filter', 'iter', 'length', 'group!', 'block',
        'while', 'help', 'panic!', 'apply', 'limit-arity',
        'get-doc', 'set-doc', 'try-option', 'string->symbol',
        'string', 'returnable', 'expand-macro', 'gen-sym'
    )

    # valid_name = r'(?!#)[\w!$%*+<=>?/.#|-]+'
    valid_name = r'[\w!$%&*+,/:<=>?@^~|-]+'

    tokens = {
        'root': [
            # the comments - always starting with semicolon
            # and going to the end of the line
            (r';.*$', Comment.Single),

            # whitespaces - usually not relevant
            (r'[,\s]+', Text),

            # numbers
            (r'-?\d+\.\d+', Number.Float),
            (r'-?\d+', Number.Integer),
            # (r'0x-?[abcdef\d]+', Number.Hex),

            # strings, symbols and characters
            (r'"(\\\\|\\"|[^"])*"', String),
            (r'\\[\w\W]', String.Escape),
            (r"'" + valid_name, String.Symbol),
            # (r"\\(.|[a-z]+)", String.Char),

            # keywords
            # (r'::?#?' + valid_name, String.Symbol),

            # first variable in a quoted string like
            # '(this is syntactic sugar)
            (r"(?<='\()" + valid_name, Name.Variable),
            (r"(?<=#\()" + valid_name, Name.Variable),

            # special operators
            (r'~@|[`\'#^~&@]', Operator),
            (r"\." + valid_name, Operator),

            # Literal Anonymous Function Literals
            (r'#\d*', Keyword),

            # highlight the special forms
            (words(special_forms, suffix=' '), Keyword),

            # Technically, only the special forms are 'keywords'. The problem
            # is that only treating them as keywords means that things like
            # 'defn' and 'ns' need to be highlighted as builtins. This is ugly
            # and weird for most styles. So, as a compromise we're going to
            # highlight them as Keyword.Declarations.
            (words(declarations, suffix=' '), Keyword.Declaration),

            # highlight the builtins
            (words(builtins, suffix=' '), Name.Builtin),

            # the remaining functions
            (r'(?<=\()' + valid_name, Name.Function),

            # find the remaining variables
            (valid_name, Name.Variable),

            # Lisa does not accept vector notation
            # (r'(\[|\])', Punctuation),

            # Lisa does not accept map notation right now
            # (r'(\{|\})', Punctuation),

            # the famous parentheses!
            (r'(\(|\))', Punctuation),
        ],
        'shebang': [
            (r'\A(#!).*(?=$)', Comment.HashBang)
        ],
        'expression': [
            include('literals'),
            include('sexpr')
        ],
        'literals': [
            include('non-symbolic-literals'),
            include('symbolic-literals')
        ],
        'non-symbolic-literals': [
            include('atoms'),
            include('strings'),
            include('boolean-literals'),
            include('dot-accessors'),
            include('numbers'),
            include('static-field-accessors'),
            include('quoted')
        ],
        'symbolic-literals': [
            include('symbols'),
            include('positional-args')
        ],
        'boolean-literals': [
            ("(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))true(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))",
             Keyword.Constant),
            ("(?<![_$[:alnum:]])(?:(?<=\\.\\.\\.)|(?<!\\.))false(?![_$[:alnum:]])(?:(?=\\.\\.\\.)|(?!\\.))",
             Keyword.Constant)
        ],
        'numbers': [
            (r'\b(([0-9.]*[0-9]+)|(\.[0-9]+))\b', Number)
        ],
        'dot-accessors': [
            (r'(?<!\w)\.' + valid_name + r'\s', Name.Function.Magic)
        ],
        'static-field-accessors': [
            (r'\b([\w\.]+)/(\w+)\b', bygroups(Name.Class, Name.Attribute))
        ],
        'atoms': [
            (r'(?<!\w):[\w\-\/]+\b', String.Symbol),
            (r'(?<!\w):\"')
        ],
        'string-escape': [
            ("\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|u\\{[0-9A-Fa-f]+\\}|[0-2][0-7]{0,2}|3[0-6][0-7]?|37[0-7]?|[4-7][0-7]?|.|$)",
             String.Escape)
        ]
    }

    @classmethod
    def register(cls):
        LEXERS[cls.__name__] = (
            'extensions.lisa', cls.name, tuple(cls.aliases), tuple(cls.filenames), tuple(cls.mimetypes)
        )
