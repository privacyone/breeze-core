#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
# Breeze 2020

import sys
from pathlib import Path
import shutil

from _common import parse_series


OS = Path().resolve()
core = OS / 'core' 
os_patches = core / 'patches'
core_patches = OS / 'patches'
breeze_patches = core / 'patches' / 'core' / 'breeze'
build = OS / 'build'
build_src = build / 'src'
unpatched = build / 'unpatched'

def msg(m):
    print(":: test_patches.py ::", m)

def generate_rescue_paths(series_path):
    # Get patch paths from series
    patch_paths = list(parse_series(series_path / 'series'))

    for patch in patch_paths:
        with Path(series_path / patch).open(encoding='UTF-8') as patch_file:
            for line in patch_file:
                if line.startswith('--- a/'):
                    line = line.split('--- a/', 1)[1].strip()
                    yield Path(line)

def main():
    for series_dir in (os_patches, core_patches, breeze_patches):
        for rescue_path in generate_rescue_paths(series_dir):
            src = build_src / rescue_path
            dst = unpatched / rescue_path.parent
            dst.mkdir(parents = True, exist_ok = True)
            try:
                shutil.copy2(str(src), str(dst))
            except:
                msg("NOT FOUND:")
                msg(src)

if __name__ == '__main__':
    main()