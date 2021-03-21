/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "chrome/browser/update_util.h"

#include "base/command_line.h"
#include "chrome/common/chrome_switches.h"
#include "build/build_config.h"

namespace breezesparkle {

bool UpdateEnabled() {
#if defined(OS_MAC)
  return !base::CommandLine::ForCurrentProcess()->HasSwitch(
      switches::kDisableBreezeUpdate);
#else
  return false;
#endif
}

}  //namespace breezesparkle