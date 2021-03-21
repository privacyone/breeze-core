#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

# Copyright (c) 2019 The Privacy One Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""Update version file if different"""

import argparse
import filecmp
from pathlib import Path

from _common import ENCODING, get_logger, add_common_params

def update_version(source, version_file_path):
    is_updated = False
    old_version_file_path = source / 'chrome' / 'VERSION'
    if (not filecmp.cmp(old_version_file_path, version_file_path, shallow = False)):
        old_version_file = open(old_version_file_path, 'w')
        new_version_file = open(version_file_path, 'r')

        old_version_file.write(new_version_file.read())

        old_version_file.close()
        new_version_file.close()

        get_logger().info('Breeze version has been updated!')
        is_updated = True
    return is_updated

def _callback(args):
    if not args.src.exists():
        get_logger().error('Specified directory does not exist: %s', args.src)
        exit(1)
    if not args.version_file.exists():
        get_logger().error('Could not find the Breeze version file: %s', args.version_file)
        exit(1)
    update_version(args.src, args.version_file)


def main():
    """CLI Entrypoint"""
    parser = argparse.ArgumentParser()
    parser.add_argument('src', type=Path, help='Chromium source directory.')
    parser.add_argument('version_file', type=Path, help='File containing Breeze version')
    add_common_params(parser)
    parser.set_defaults(callback=_callback)

    args = parser.parse_args()
    args.callback(args)

if __name__ == '__main__':
    main()
