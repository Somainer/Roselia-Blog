import psutil
import platform
import subprocess
import re
import functools
from middleware import transform_to


def want_str(s):
    if isinstance(s, bytes):
        return s.decode()
    return str(s)


def run_once(func):  # Result will not be affected by arguments.
    result = None

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        nonlocal result
        if result is not None:
            return result

        result = func(*args, **kwargs)
        return result

    return wrapper


class RoseliaSysInfo:
    @classmethod
    def cpu_count(cls, logical=True):
        return psutil.cpu_count(logical)

    @classmethod
    @run_once
    @transform_to(want_str)
    def processor_name(cls):
        if psutil.WINDOWS:
            family = platform.processor()
            name = want_str(subprocess.check_output(["wmic", "cpu", "get", "name"]).strip()).split("\n")[1]
            return ' '.join([name, family])
        elif psutil.MACOS:
            command = "/usr/sbin/sysctl -n machdep.cpu.brand_string"
            return subprocess.check_output(command.split(' ')).strip()
        elif psutil.LINUX:
            command = "cat /proc/cpuinfo"
            all_info = want_str(subprocess.check_output(command, shell=True).strip())
            for line in all_info.split("\n"):
                if "model name" in line:
                    return re.sub(r".*model name.*:", "", line, 1)
            else:
                return all_info
        return ""

    @classmethod
    @run_once
    def processor_info(cls):
        return {
            'name': cls.processor_name(),
            'total_core': cls.cpu_count(False),
            'logical_core': cls.cpu_count(True)
        }

    @classmethod
    @run_once
    def os_full_name(cls):
        constants = platform.uname()
        os_name = constants.system
        os_version = constants.version
        if psutil.MACOS:
            mac_version = platform.mac_ver()[0]
            os_version = mac_version
            v0, *v1 = map(int, mac_version.split('.'))
            v1 = v1[0]
            if v0 == 10:
                if v1 < 8:
                    os_name = 'MAC OS X'
                elif v1 < 12:
                    os_name = 'OS X'
                else:
                    os_name = 'macOS'

        return {
            'name': os_name,
            'version': os_version,
            'platform': platform.platform(1, 1),
            'node': constants.node,
            'server_interpreter': platform.python_implementation() + ' ' + platform.python_version()
        }

    @classmethod
    def memory_usage(cls):
        usage = psutil.virtual_memory()
        return {
            'total': usage.total,
            'used': usage.used,
            'percent': usage.percent,
            'available': usage.available
        }

    @classmethod
    def cpu_usage(cls):
        return {
            'total': psutil.cpu_percent(),
            'logic': psutil.cpu_percent(percpu=True)
        }
