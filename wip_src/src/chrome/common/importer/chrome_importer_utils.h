/* Breeze */

#ifndef BREEZE_COMMON_IMPORTER_CHROME_IMPORTER_UTILS_H_
#define BREEZE_COMMON_IMPORTER_CHROME_IMPORTER_UTILS_H_

#include <string>
#include <vector>

namespace base {
class FilePath;
class ListValue;
class Value;
class DictionaryValue;
}  // namespace base

base::FilePath GetChromeUserDataFolder();
#if !defined(OS_LINUX)
base::FilePath GetCanaryUserDataFolder();
#endif
#if defined(OS_MAC)
base::FilePath GetEdgeUserDataFolder();
#endif
base::FilePath GetOperaUserDataFolder();
base::FilePath GetBraveUserDataFolder();
base::FilePath GetChromiumUserDataFolder();

base::ListValue* GetOperaSourceProfiles(
  const base::FilePath& user_data_folder);
base::ListValue* GetChromeSourceProfiles(
  const base::FilePath& user_data_folder);

bool ChromeImporterCanImport(const base::FilePath& profile,
                             uint16_t* services_supported);

#endif  // BREEZE_COMMON_IMPORTER_CHROME_IMPORTER_UTILS_H_