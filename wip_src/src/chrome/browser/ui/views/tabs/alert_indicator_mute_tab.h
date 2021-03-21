#ifndef CHROME_BROWSER_UI_VIEWS_TABS_ALERT_INDICATOR_MUTE_TAB_H
#define CHROME_BROWSER_UI_VIEWS_TABS_ALERT_INDICATOR_MUTE_TAB_H

#include "chrome/browser/ui/views/tabs/alert_indicator.h"

class AlertIndicatorMuteTab : public AlertIndicator
{
public:
    explicit AlertIndicatorMuteTab(Tab* parent_tab);

private:
    class AlertBackground;

    bool IsTabAudioToggleable() const;

    // views::View overrides:
    bool OnMousePressed(const ui::MouseEvent& event) override;
    void OnMouseReleased(const ui::MouseEvent& event) override;
    bool OnMouseDragged(const ui::MouseEvent& event) override;
    void OnMouseEntered(const ui::MouseEvent& event) override;
    void OnMouseExited(const ui::MouseEvent& event) override;

    SkColor GetBackgroundColor() const;

    bool mouse_pressed_ = false;

    DISALLOW_COPY_AND_ASSIGN(AlertIndicatorMuteTab);
};

#endif //CHROME_BROWSER_UI_VIEWS_TABS_ALERT_INDICATOR_MUTE_TAB_H
