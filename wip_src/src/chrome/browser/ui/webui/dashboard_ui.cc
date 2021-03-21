// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "chrome/browser/ui/webui/dashboard_ui.h"

#include <memory>

#include "build/build_config.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/browser/ui/webui/webui_util.h"
#include "chrome/common/url_constants.h"
#include "components/grit/dev_ui_components_resources.h"
#include "components/strings/grit/components_strings.h"
#include "content/public/browser/web_ui.h"
#include "ui/base/webui/web_ui_util.h"

namespace {

    content::WebUIDataSource* CreateDashboardUIHtmlSource() {
        content::WebUIDataSource* source =
                content::WebUIDataSource::Create(chrome::kBreezeUIDashboardHost);

        source->AddResourcePath("dashboard.css", IDR_DASHBOARD_CSS);
        source->AddResourcePath("dashboard.js", IDR_DASHBOARD_JS);
        source->SetDefaultResource(IDR_DASHBOARD_HTML);
        return source;
    }

}  // namespace

DashboardUI::DashboardUI(content::WebUI* web_ui) : WebUIController(web_ui) {
    content::WebUIDataSource::Add(Profile::FromWebUI(web_ui),
                                  CreateDashboardUIHtmlSource());
}

DashboardUI::~DashboardUI() {
}
