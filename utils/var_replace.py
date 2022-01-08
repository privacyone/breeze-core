#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

# Breeze 2020

import sys
from pathlib import Path


key_vals_src = 'patch_vars.list'            # Name of user configured file 

patch_src = []                              # List of paths to all .patch files 
                                            # in patches/ folders
                                            
key_vals = {}                               # Dictionary that is defined by user in 
                                            # key_vals_src file.
build = Path() / 'build'
OS = Path().resolve()
core = OS / 'core' 

def prep():                                 #radi
    """ Fetches paths and variables for replacement"""
    with Path(core / key_vals_src).open(encoding='UTF-8') as var_file:
        for line in var_file:
            line = parse(line, '=')
            if line[0]: 
                key_vals[line[0]] = line[1]

    # finds .patch files and populates patch_src[] 
    NO_PATCH = True
    for patch in Path(build / "temp_patches").rglob("*.patch"):   
        NO_PATCH = False
        patch_src.append(patch)
    if NO_PATCH : msg("ERROR :: Can't find any patch files.")
    return  not(NO_PATCH)      



def parse(line, separator):
    """ Removes comments and whitespace """
    line = line.partition("##")[0].partition(separator)
    return [line[0].strip(), line[2].strip()]

def msg(m):
    #if not (len(sys.argv) > 1 and sys.argv[1] == '-q'):
    print(":: var-replace.py ::", m)

def replace(key, val, path):
    """ Replaces key for val at path """
    data = path.read_text()
    data = data.replace(key, val)
    path.write_text(data)

def main():
    if prep():
        for p in patch_src:
            data = p.read_text()
            new_data = ""
            for key, val in key_vals.items():
                new_data = data.replace(key, val)
                if data != new_data:
                    msg("Replaced :: '{}' >> '{}' @\
                        \n                    @ {}".format(key, val, str(p)))
                    data = new_data
            if new_data != "": 
                p.write_text(new_data)


if __name__ == '__main__':
    main()