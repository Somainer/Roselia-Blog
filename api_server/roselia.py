from api_server import run_server
import sys
sys.path.append('../scripts')
from bootstrap import build_assets

if __name__ == '__main__':
    arg = sys.argv[1]
    operate = {
        'serve': run_server,
        'assets': build_assets
    }
    def otherwise():
        print("No operation")
    operate.get(arg, otherwise)()