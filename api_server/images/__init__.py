from typing import Dict, List, ClassVar, Optional
from .ImageManager import ImageManager
from .FileSystemImageManager import FileSystemImageManager
from .CheveretoImageManager import CheveretoImageManager
from .SMMSImageManager import SMMSImageManager

_all_channels = [
    FileSystemImageManager,
    CheveretoImageManager,
    SMMSImageManager
]


def _try_construct(channel: ClassVar[ImageManager]) -> Optional[ImageManager]:
    try:
        return channel()
    except AssertionError:
        return None


available_channels: List[ImageManager] = [
    manager for manager in map(_try_construct, _all_channels)
    if manager is not None
] + [SMMSImageManager(anonymous=True)]

image_channels: Dict[str, ImageManager] = {
    manager.identifier: manager
    for manager in available_channels
}
