#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

# Copyright (c) 2020 The ungoogled-chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""Applies unified diff patches"""

import argparse
import os
import shutil
import subprocess
import filecmp
from pathlib import Path

from _common import get_logger, parse_series, add_common_params


def _find_patch_from_env():
    patch_bin_path = None
    patch_bin_env = os.environ.get('PATCH_BIN')
    if patch_bin_env:
        patch_bin_path = Path(patch_bin_env)
        if patch_bin_path.exists():
            get_logger().debug('Found PATCH_BIN with path "%s"', patch_bin_path)
        else:
            patch_which = shutil.which(patch_bin_env)
            if patch_which:
                get_logger().debug('Found PATCH_BIN for command with path "%s"', patch_which)
                patch_bin_path = Path(patch_which)
    else:
        get_logger().debug('PATCH_BIN env variable is not set')
    return patch_bin_path


def _find_patch_from_which():
    patch_which = shutil.which('patch')
    if not patch_which:
        get_logger().debug('Did not find "patch" in PATH environment variable')
        return None
    return Path(patch_which)


def find_and_check_patch(patch_bin_path=None):
    """
    Find and/or check the patch binary is working. It finds a path to patch in this order:

    1. Use patch_bin_path if it is not None
    2. See if "PATCH_BIN" environment variable is set
    3. Do "which patch" to find GNU patch

    Then it does some sanity checks to see if the patch command is valid.

    Returns the path to the patch binary found.
    """
    if patch_bin_path is None:
        patch_bin_path = _find_patch_from_env()
    if patch_bin_path is None:
        patch_bin_path = _find_patch_from_which()
    if not patch_bin_path:
        raise ValueError('Could not find patch from PATCH_BIN env var or "which patch"')

    if not patch_bin_path.exists():
        raise ValueError('Could not find the patch binary: {}'.format(patch_bin_path))

    # Ensure patch actually runs
    cmd = [str(patch_bin_path), '--version']
    result = subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    if result.returncode:
        get_logger().error('"%s" returned non-zero exit code', ' '.join(cmd))
        get_logger().error('stdout:\n%s', result.stdout)
        get_logger().error('stderr:\n%s', result.stderr)
        raise RuntimeError('Got non-zero exit code running "{}"'.format(' '.join(cmd)))
    return patch_bin_path


def dry_run_check(patch_path, tree_path, patch_bin_path=None):
    """
    Run patch --dry-run on a patch

    tree_path is the pathlib.Path of the source tree to patch
    patch_path is a pathlib.Path to check
    reverse is whether the patches should be reversed
    patch_bin_path is the pathlib.Path of the patch binary, or None to find it automatically
        See find_and_check_patch() for logic to find "patch"

    Returns the status code, stdout, and stderr of patch --dry-run
    """
    cmd = [
        str(find_and_check_patch(patch_bin_path)), '-p1', '--ignore-whitespace', '-i',
        str(patch_path), '-d',
        str(tree_path), '--no-backup-if-mismatch', '--dry-run'
    ]
    result = subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    return result.returncode, result.stdout, result.stderr


def apply_patches(patch_path_iter, tree_path, reverse=False, patch_bin_path=None):
    """
    Applies or reverses a list of patches

    tree_path is the pathlib.Path of the source tree to patch
    patch_path_iter is a list or tuple of pathlib.Path to patch files to apply
    reverse is whether the patches should be reversed
    patch_bin_path is the pathlib.Path of the patch binary, or None to find it automatically
        See find_and_check_patch() for logic to find "patch"

    Raises ValueError if the patch binary could not be found.
    """
    patch_paths = list(patch_path_iter)
    patch_bin_path = find_and_check_patch(patch_bin_path=patch_bin_path)
    if reverse:
        patch_paths.reverse()

    logger = get_logger()
    for patch_path, patch_num in zip(patch_paths, range(1, len(patch_paths) + 1)):
        cmd = [
            str(patch_bin_path), '-p1', '--ignore-whitespace', '-i',
            str(patch_path), '-d',
            str(tree_path), '--no-backup-if-mismatch'
        ]
        if reverse:
            cmd.append('--reverse')
            log_word = 'Reversing'
        else:
            cmd.append('--forward')
            log_word = 'Applying'
        logger.info('* %s %s (%s/%s)', log_word, patch_path.name, patch_num, len(patch_paths))
        logger.debug(' '.join(cmd))
        subprocess.run(cmd, check=True)


def generate_patches_from_series(patches_dir, resolve=False):
    """Generates pathlib.Path for patches from a directory in GNU Quilt format"""
    for patch_path in parse_series(patches_dir / 'series'):
        if resolve:
            yield (patches_dir / patch_path).resolve()
        else:
            yield patch_path


def _copy_files(path_iter, source, destination):
    """Copy files from source to destination with relative paths from path_iter"""
    for path in path_iter:
        (destination / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(source / path), str(destination / path))

def patch_string(patch, patch_name, tree_path, reverse=False, patch_bin_path=None):
    patch_bin_path = find_and_check_patch(patch_bin_path=patch_bin_path)
    tmp_patch_file = open(tree_path  / 'tmp.patch', 'w')
    tmp_patch_file.write(patch)
    tmp_patch_file.close()
    logger = get_logger()
    cmd = [
        str(patch_bin_path), '-p1', '--ignore-whitespace', '-i', 
        str(tree_path  / 'tmp.patch'), '-d',
        str(tree_path), '--no-backup-if-mismatch'
    ]
    if reverse:
        cmd.append('--reverse')
        log_word = 'Reversing'
    else:
        cmd.append('--forward')
        log_word = 'Applying'

    logger.info('* %s %s', log_word, patch_name)
    logger.debug(' '.join(cmd))
    subprocess.run(cmd, check=True)
    os.remove(tree_path  / 'tmp.patch')

def patch_from_line(series_file, dir_dst, file, tree_path, patch_bin_path = None, reverse=False):
    if series_file and reverse:
        print('\n*** Reversing old patches on file: ' + file.partition('+++ b/')[2].partition('\n')[0])
    if series_file and not reverse:
        print('\n*** Applying new patches on file: ' + file.partition('+++ b/')[2].partition('\n')[0])

    for patch_dst in series_file:
        patch_file = open(str(dir_dst / Path(patch_dst)))
        patch = patch_file.readlines()
        patch_file.close()
        hunks_found = False
        for line in patch:
            if hunks_found and line.startswith('---'):
                break
            if line.startswith(file):
                hunks_found = True
                if prev_line.startswith('--- a'):
                    prev_line = prev_line.partition('\n')[0] + '.temp\n'
                hunks = prev_line
                line = line.partition('\n')[0] + '.temp\n'
            if hunks_found:
                hunks += line
            prev_line = line
        if hunks_found:
            patch_string(hunks, Path(patch_dst).name, tree_path, reverse, patch_bin_path)

def combine_patches(series_files_list, dir_dst):
    if dir_dst.exists():
        shutil.rmtree(dir_dst)
    os.makedirs(dir_dst, exist_ok=True)
    f = open(dir_dst / "series", "a")
    for series_file in series_files_list:
        patch_paths = list(generate_patches_from_series(series_file, resolve=True))
        for patch_path in patch_paths:
            local_dst = patch_path.relative_to(series_file)
            dst = os.path.join(dir_dst, local_dst)
            f.write(str(local_dst) + '\n') 
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(str(patch_path), str(dst))
    f.close()

def find_file_hunks(patched_file, patch):
    hunk = ''
    hunk_found = False
    for line in patch:
        if hunk_found and line.startswith('---'):
            break
        if (line == patched_file):
            hunk_found = True
            hunk = prev_line
        if hunk_found:
            hunk += line
        prev_line = line
    if hunk_found:
        return hunk
    else:
        return False

def abs_file_path(tree_path, file_path):
    return tree_path / Path(file_path.partition('+++ b/')[2].partition('\n')[0])

def temp_file(tree_path, file_path, arg):
    file = abs_file_path(tree_path, file_path)
    if arg == 'create':
        if file.exists():
            shutil.copy2(str(file), str(file) + '.temp')
    if arg == 'replace':
        if Path(str(file) + '.temp').exists():
            shutil.copy2(str(file) + '.temp', str(file))
        else:
            os.remove(file)
    if arg == 'remove':
        if Path(str(file) + '.temp').exists():
            os.remove(Path(str(file) + '.temp'))

def compare_new_patches(old_dir_dst, new_dir_dst, tree_path, patch_bin_path=None):
    if (old_dir_dst / 'series').exists():
        old_patches_list = list(parse_series(old_dir_dst / 'series'))
    else:
        old_patches_list = list('')
        print('\n *** NO OLD PATCHES FOUND ***')
    new_patches_list = list(parse_series(new_dir_dst / 'series'))
    old_patches_list_rev = list(reversed(old_patches_list))

    patched_files = []

    for patch in (old_patches_list + list(set(new_patches_list) - set(old_patches_list))):
        old_patch_dst = old_dir_dst / Path(patch)
        new_patch_dst = new_dir_dst / Path(patch)
        if patch in old_patches_list and patch in new_patches_list:
            if not (filecmp.cmp(new_patch_dst, old_patch_dst)):
                print('\n[STATUS: Patch ' + Path(patch).name + ' changed, applying updates]')
                new_patch = open(new_patch_dst).readlines()
                old_patch = open(old_patch_dst).readlines()
                hunk_found = False
                new_hunk = ''
                for line in new_patch:
                    if line.startswith('--- '):
                        if hunk_found:
                            old_hunk = find_file_hunks(patched_file, old_patch)
                            if (not old_hunk) or (old_hunk != new_hunk):
                                patched_files.append(patched_file)
                                temp_file(tree_path, patched_file, 'create')
                                patch_from_line(old_patches_list_rev, old_dir_dst, patched_file, tree_path, patch_bin_path, reverse=True)
                                patch_from_line(new_patches_list, new_dir_dst, patched_file, tree_path, patch_bin_path)
                                hunk_found = False
                    elif line.startswith('+++ b'):
                        if line in patched_files:
                            continue
                        hunk_found = True
                        new_hunk = prev_line
                        patched_file = line
                    if hunk_found:
                        new_hunk += line
                    prev_line = line
                if hunk_found:
                    old_hunk = find_file_hunks(patched_file, old_patch)
                    if (not old_hunk) or (old_hunk != new_hunk):
                        patched_files.append(patched_file)
                        temp_file(tree_path, patched_file, 'create')
                        patch_from_line(old_patches_list_rev, old_dir_dst, patched_file, tree_path, patch_bin_path, reverse=True)
                        patch_from_line(new_patches_list, new_dir_dst, patched_file, tree_path, patch_bin_path)
                for line in old_patch:
                    if line.startswith('+++ b') and line not in new_patch:
                        if line not in patched_files:
                            patched_files.append(line)
                            temp_file(tree_path, line, 'create')
                            patch_from_line(old_patches_list_rev, old_dir_dst, line, tree_path, patch_bin_path, reverse=True)
                            patch_from_line(new_patches_list, new_dir_dst, line, tree_path, patch_bin_path)

        elif patch in old_patches_list and patch not in new_patches_list:
            print('\n[STATUS: Reversing removed patch:' + old_patch_dst.name + ']')
            old_patch = open(old_patch_dst).readlines()
            for line in old_patch:
                if line.startswith('+++ b') and line not in patched_files:
                    patched_file = line
                    patched_files.append(patched_file)
                    temp_file(tree_path, patched_file, 'create')
                    patch_from_line(old_patches_list_rev, old_dir_dst, patched_file, tree_path, patch_bin_path, reverse=True)
                    patch_from_line(new_patches_list, new_dir_dst, patched_file, tree_path, patch_bin_path)
                prev_line = line


        elif patch not in old_patches_list and patch in new_patches_list:            
            print('\n[STATUS: Applying new patch:' + new_patch_dst.name +']')
            new_patch = open(new_patch_dst).readlines()
            for line in new_patch:
                if line.startswith('+++ b') and line not in patched_files:
                    patched_file = line
                    patched_files.append(patched_file)
                    if not prev_line.startswith('--- /dev'):
                        temp_file(tree_path, patched_file, 'create')
                    patch_from_line(old_patches_list_rev, old_dir_dst, patched_file, tree_path, patch_bin_path, reverse=True)
                    patch_from_line(new_patches_list, new_dir_dst, patched_file, tree_path, patch_bin_path)
                prev_line = line

    for patched_file in patched_files:
        temp_file(tree_path, patched_file, 'replace')
        temp_file(tree_path, patched_file, 'remove')
    if patched_files:
        print('-------Patches updated!-------')
    else:
        print('-------No new patches!-------')

def merge_patches(source_iter, destination, prepend=False):
    """
    Merges GNU quilt-formatted patches directories from sources into destination

    destination must not already exist, unless prepend is True. If prepend is True, then
    the source patches will be prepended to the destination.
    """
    series = list()
    known_paths = set()
    if destination.exists():
        if prepend:
            if not (destination / 'series').exists():
                raise FileNotFoundError(
                    'Could not find series file in existing destination: {}'.format(
                        destination / 'series'))
            known_paths.update(generate_patches_from_series(destination))
        else:
            raise FileExistsError('destination already exists: {}'.format(destination))
    for source_dir in source_iter:
        patch_paths = tuple(generate_patches_from_series(source_dir))
        patch_intersection = known_paths.intersection(patch_paths)
        if patch_intersection:
            raise FileExistsError(
                'Patches from {} have conflicting paths with other sources: {}'.format(
                    source_dir, patch_intersection))
        series.extend(patch_paths)
        _copy_files(patch_paths, source_dir, destination)
    if prepend and (destination / 'series').exists():
        series.extend(generate_patches_from_series(destination))
    with (destination / 'series').open('w') as series_file:
        series_file.write('\n'.join(map(str, series)))


def _apply_callback(args, parser_error):
    logger = get_logger()
    patch_bin_path = None
    if args.patch_bin is not None:
        patch_bin_path = Path(args.patch_bin)
        if not patch_bin_path.exists():
            patch_bin_path = shutil.which(args.patch_bin)
            if patch_bin_path:
                patch_bin_path = Path(patch_bin_path)
            else:
                parser_error(
                    f'--patch-bin "{args.patch_bin}" is not a command or path to executable.')
    for patch_dir in args.patches:
        logger.info('Applying patches from %s', patch_dir)
        apply_patches(
            generate_patches_from_series(patch_dir, resolve=True),
            args.target,
            patch_bin_path=patch_bin_path)


def _merge_callback(args, _):
    merge_patches(args.source, args.destination, args.prepend)


def _compare_callback(args, parser_error):    
    logger = get_logger()
    patch_bin_path = None
    if args.patch_bin is not None:
        patch_bin_path = Path(args.patch_bin)
        if not patch_bin_path.exists():
            patch_bin_path = shutil.which(args.patch_bin)
            if patch_bin_path:
                patch_bin_path = Path(patch_bin_path)
            else:
                parser_error(
                    f'--patch-bin "{args.patch_bin}" is not a command or path to executable.')
    compare_new_patches(
                args.saved_patches,
                args.temp_patches,
                args.target,
                patch_bin_path=(patch_bin_path)
        )
def _combine_callback(args, _):
    combine_patches(
                args.series_files,
                args.target,
        )

def main():
    """CLI Entrypoint"""
    parser = argparse.ArgumentParser()
    add_common_params(parser)
    subparsers = parser.add_subparsers()

    apply_parser = subparsers.add_parser(
        'apply', help='Applies patches (in GNU Quilt format) to the specified source tree')
    apply_parser.add_argument(
        '--patch-bin', help='The GNU patch command to use. Omit to find it automatically.')
    apply_parser.add_argument('target', type=Path, help='The directory tree to apply patches onto.')
    apply_parser.add_argument(
        'patches',
        type=Path,
        nargs='+',
        help='The directories containing patches to apply. They must be in GNU quilt format')
    apply_parser.set_defaults(callback=_apply_callback)

    merge_parser = subparsers.add_parser(
        'merge', help='Merges patches directories in GNU quilt format')
    merge_parser.add_argument(
        '--prepend',
        '-p',
        action='store_true',
        help=('If "destination" exists, prepend patches from sources into it.'
              ' By default, merging will fail if the destination already exists.'))
    merge_parser.add_argument(
        'destination',
        type=Path,
        help=('The directory to write the merged patches to. '
              'The destination must not exist unless --prepend is specified.'))
    merge_parser.add_argument(
        'source', type=Path, nargs='+', help='The GNU quilt patches to merge.')
    merge_parser.set_defaults(callback=_merge_callback)

    compare_parser = subparsers.add_parser(
        'compare', help='Combines all patches into temp dir')
    compare_parser.add_argument(
        '--patch-bin', help='The GNU patch command to use. Omit to find it automatically.')
    compare_parser.add_argument(
        'saved_patches',
        type=Path,
        help='The directories containing patches to revert. They must be in GNU quilt format')
    compare_parser.add_argument(
        'temp_patches',
        type=Path,
        help='The directories containing patches to apply. They must be in GNU quilt format')
    compare_parser.add_argument(
        'target', 
        type=Path, 
        help='The directory tree to apply patches onto.')
    compare_parser.set_defaults(callback=_compare_callback)


    combine_parser = subparsers.add_parser(
        'combine', help='Combines all patches into temp dir')
    combine_parser.add_argument(
        'series_files',
        type=Path,
        nargs='+',
        help='The directories of series files.')
    combine_parser.add_argument(
        'target', 
        type=Path, 
        help='The directory to place combined patches.')
    combine_parser.set_defaults(callback=_combine_callback)

    args = parser.parse_args()
    if 'callback' not in args:
        parser.error('Must specify subcommand apply or merge')
    args.callback(args, parser.error)


if __name__ == '__main__':
    main()
