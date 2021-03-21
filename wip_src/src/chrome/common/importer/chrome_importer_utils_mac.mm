// Breeze

#include <Cocoa/Cocoa.h>
#include <sys/param.h>

#include "chrome/common/importer/chrome_importer_utils.h"

#include "base/files/file_util.h"
#include "base/mac/foundation_util.h"
#include "base/path_service.h"

base::FilePath GetChromeUserDataFolder() {
    base::FilePath result = base::mac::GetUserLibraryPath();
    return result.Append("Application Support/Google/Chrome");
}

base::FilePath GetCanaryUserDataFolder() {
    base::FilePath result = base::mac::GetUserLibraryPath();
    return result.Append("Application Support/Google/Chrome Canary");
}

base::FilePath GetChromiumUserDataFolder() {
    base::FilePath result = base::mac::GetUserLibraryPath();
    return result.Append("Application Support/Chromium");
}

base::FilePath GetOperaUserDataFolder() {
    base::FilePath result = base::mac::GetUserLibraryPath();
    return result.Append("Application Support/com.operasoftware.Opera");
}

base::FilePath GetEdgeUserDataFolder() {
    base::FilePath result = base::mac::GetUserLibraryPath();
    return result.Append("Application Support/Microsoft Edge");
}

base::FilePath GetBraveUserDataFolder() {
    base::FilePath result = base::mac::GetUserLibraryPath();
    return result.Append("Application Support/BraveSoftware/Brave-Browser");
}
