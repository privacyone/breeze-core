/* Breeze */

#include "chrome/common/importer/chrome_importer_utils.h"

#include "base/base_paths.h"
#include "base/files/file_path.h"
#include "base/files/file_util.h"
#include "base/path_service.h"
#include "base/strings/string16.h"

base::FilePath GetChromeUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_HOME, &result))
    return base::FilePath();

  result = result.AppendASCII(".config");
  result = result.AppendASCII("google-chrome");

  return result;
}

base::FilePath GetChromiumUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_HOME, &result))
    return base::FilePath();

  result = result.AppendASCII(".config");
  result = result.AppendASCII("chromium");

  return result;
}
