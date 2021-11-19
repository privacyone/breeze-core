/* Breeze */

#include "chrome/common/importer/chrome_importer_utils.h"

#include "base/files/file_util.h"
#include "base/path_service.h"

base::FilePath GetChromeUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_LOCAL_APP_DATA, &result))
    return base::FilePath();

  result = result.AppendASCII("Google");
  result = result.AppendASCII("Chrome");
  result = result.AppendASCII("User Data");

  return result;
}

base::FilePath GetCanaryUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_LOCAL_APP_DATA, &result))
    return base::FilePath();

  result = result.AppendASCII("Google");
  result = result.AppendASCII("Chrome SxS");
  result = result.AppendASCII("User Data");

  return result;
}

base::FilePath GetChromiumUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_LOCAL_APP_DATA, &result))
    return base::FilePath();

  result = result.AppendASCII("Chromium");
  result = result.AppendASCII("User Data");

  return result;
}

base::FilePath GetOperaUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_APP_DATA, &result))
    return base::FilePath();

  result = result.AppendASCII("Opera Software");
  result = result.AppendASCII("Opera Stable");

  return result;
}

base::FilePath GetBraveUserDataFolder() {
  base::FilePath result;
  if (!base::PathService::Get(base::DIR_LOCAL_APP_DATA, &result))
    return base::FilePath();

  result = result.AppendASCII("BraveSoftware");
  result = result.AppendASCII("Brave-Browser");
  result = result.AppendASCII("User Data");

  return result;
}