// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_UI_WEBUI_DASHBOARD_UI_H_
#define CHROME_BROWSER_UI_WEBUI_DASHBOARD_UI_H_

#include <string>

#include "base/macros.h"
#include "content/public/browser/web_ui_controller.h"
#include "content/public/browser/web_ui_data_source.h"

namespace content {
    class WebUI;
}

// The Web UI controller for the chrome://dashboard page.
class DashboardUI : public content::WebUIController {
public:
    explicit DashboardUI(content::WebUI* web_ui);
    ~DashboardUI() override;

private:
    DISALLOW_COPY_AND_ASSIGN(DashboardUI);
};

#endif  // CHROME_BROWSER_UI_WEBUI_DASHBOARD_UI_H_
