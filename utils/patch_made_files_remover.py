#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
# Breeze 2020

import sys
from pathlib import Path
import shutil
import os

from _common import parse_series

OS = Path()
core = OS / 'core' 
os_patches = core / 'patches'
core_patches = OS / 'patches'
breeze_patches = core / 'patches' / 'core' / 'breeze'
build = OS / 'build'
build_src = build / 'src'
unpatched = build / 'unpatched'

def msg(m):
    print(":: patch_made_files_remover.py ::", m)

def generate_rescue_paths(series_path):
    # Get patch paths from series
    patch_paths = list(parse_series(series_path / 'series'))

    for patch in patch_paths:
        # Read lines of .patch file
        with Path(series_path / patch).open(encoding='UTF-8') as patch_file:
            found = False
            for line in patch_file:
                if found:
                    first_line = line.split('+++ b/', 1)[1].strip()
                    msg(str(patch))
                    yield Path(first_line)
                    found = False
                    continue
                if line.startswith('--- /dev/null'):
                    found = True

def main():
    for series_dir in (os_patches, core_patches, breeze_patches):
        for rescue_path in generate_rescue_paths(series_dir):
            if os.path.exists(build_src / rescue_path):
                os.remove(build_src / rescue_path)
                msg("File found:")
                msg(str(build_src / rescue_path))
            elif os.path.exists(build_src / rescue_path.with_suffix(rescue_path.suffix+'.temp')):
                os.remove(build_src / rescue_path.with_suffix(rescue_path.suffix+'.temp'))
                msg("File found:")
                msg(str(build_src / rescue_path.with_suffix(rescue_path.suffix+'.temp')))
            else:
                msg("Files not found:")
                msg(str(build_src / rescue_path))
                msg(str(build_src / rescue_path.with_suffix(rescue_path.suffix+'.temp')))

if __name__ == '__main__':
    main()
