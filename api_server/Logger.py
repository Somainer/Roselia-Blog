import os
import datetime
LEVEL_DEBUG = 1
LEVEL_VERBOSE = LEVEL_DEBUG + 1
LEVEL_WARNING = LEVEL_VERBOSE + 1
LEVEL_ERROR = LEVEL_WARNING + 1


class Log:
    def __init__(self, file, level=LEVEL_DEBUG, std_out=False):
        if not os.path.exists(file):
            open(file, 'w').close()
        self.path = file
        self.stdio = std_out
        self.level = level
        self.d = self.debug
        self.v = self.verbose
        self.w = self.warning
        self.e = self.error

    def set_stdio(self, std_out):
        self.stdio = std_out

    def make_studio(self, std_out):
        return Log(self.path, self.level, std_out)

    def set_level(self, level):
        self.level = level

    def make_level(self, level):
        return Log(self.path, level, self.stdio)

    def write_to_fp(self, s):
        if self.stdio:
            print(s)
        with open(self.path, 'a') as f:
            f.write(s + '\n')

    @staticmethod
    def add_time(s):
        return '[{}] '.format(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")) + s

    def verbose(self, *args, **kwargs):
        if self.level <= LEVEL_VERBOSE:
            self.write_to_fp(
                self.add_time('[verbose] ' + self.format_str(*args, **kwargs)))

    def warning(self, *args, **kwargs):
        if self.level <= LEVEL_WARNING:
            self.write_to_fp(
                self.add_time('[warning] ' + self.format_str(*args, **kwargs)))

    def error(self, *args, **kwargs):
        if self.level <= LEVEL_ERROR:
            self.write_to_fp(
                self.add_time('[error] ' + self.format_str(*args, **kwargs)))

    def debug(self, *args, **kwargs):
        if self.level <= LEVEL_DEBUG:
            self.write_to_fp(
                self.add_time('[debug] ' + self.format_str(*args, **kwargs)))

    @staticmethod
    def format_str(*args, **kwargs):
        return ' '.join(map(str, args)) + ' ' + ' '.join(['{}: {}'.format(str(k), str(v))
                                                          for k, v in kwargs.items()])

    def __getattr__(self, item):
        def prt(*args, **kwargs):
            self.write_to_fp(
                self.add_time('[{}] '.format(item) + self.format_str(*args, **kwargs)))
        return prt

log = Log('log.txt', std_out=True)
