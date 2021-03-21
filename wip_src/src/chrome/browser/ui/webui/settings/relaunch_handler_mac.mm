/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "chrome/browser/ui/webui/settings/relaunch_handler_mac.h"

#include "base/bind.h"
#import "chrome/browser/mac/sparkle_glue.h"

namespace settings {

void RelaunchHandler::RegisterMessages() {
  web_ui()->RegisterMessageCallback(
      "relaunchOnMac",
      base::BindRepeating(&RelaunchHandler::Relaunch,
                          base::Unretained(this)));
}

void RelaunchHandler::Relaunch(const base::ListValue* args) {
  [[SparkleGlue sharedSparkleGlue] relaunch];
}
} // namespace settings
