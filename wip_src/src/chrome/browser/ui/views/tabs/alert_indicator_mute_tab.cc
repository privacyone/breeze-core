#include "chrome/browser/ui/views/tabs/alert_indicator_mute_tab.h"

#include <memory>
#include <string>

#include "chrome/browser/ui/tabs/tab_strip_model.h"
#include "chrome/browser/ui/tabs/tab_types.h"
#include "chrome/browser/ui/views/tabs/browser_tab_strip_controller.h"
#include "chrome/browser/ui/views/tabs/tab_controller.h"
#include "chrome/browser/ui/views/tabs/tab_strip.h"
#include "chrome/browser/ui/views/tabs/tab_strip_controller.h"
#include "chrome/browser/ui/views/tabs/tab_style_views.h"
#include "content/public/browser/web_contents.h"
#include "third_party/abseil-cpp/absl/types/optional.h"
#include "third_party/skia/include/core/SkPathTypes.h"
#include "ui/gfx/canvas.h"
#include "ui/gfx/color_utils.h"
#include "ui/views/background.h"

namespace {

bool IsAudioState(const absl::optional<TabAlertState>& state) 
{
    return (state.has_value() && (state.value() == TabAlertState::AUDIO_PLAYING ||
                                  state.value() == TabAlertState::AUDIO_MUTING));
}
}  // namespace

class AlertIndicatorMuteTab::AlertBackground : public views::Background
{
public:
    explicit AlertBackground(AlertIndicatorMuteTab* host_view) : host_view_(host_view) {}

    // views::Background overrides
    void Paint(gfx::Canvas* canvas, views::View* view) const override
    {
        if (!host_view_->IsTabAudioToggleable())
        {
            return;
        }

        gfx::Point center = host_view_->GetContentsBounds().CenterPoint();
        SkPath path;
        path.setFillType(SkPathFillType::kEvenOdd);
        path.addCircle(center.x(), center.y(), host_view_->width() / 2);
        cc::PaintFlags flags;
        flags.setAntiAlias(true);
        flags.setColor(host_view_->GetBackgroundColor());
        canvas->DrawPath(path, flags);
    }

private:
    AlertIndicatorMuteTab* host_view_;

    DISALLOW_COPY_AND_ASSIGN(AlertBackground);
};

AlertIndicatorMuteTab::AlertIndicatorMuteTab(Tab* parent_tab) : AlertIndicator(parent_tab)
{
    SetBackground(std::make_unique<AlertBackground>(this));
}

bool AlertIndicatorMuteTab::IsTabAudioToggleable() const
{
    if (parent_tab_->controller()->IsTabPinned(parent_tab_))
    {
        return false;
    }

    return IsAudioState(alert_state_);
}

SkColor AlertIndicatorMuteTab::GetBackgroundColor() const
{
    SkColor fill_color = parent_tab_->controller()->GetTabBackgroundColor(
      parent_tab_->IsActive() ? TabActive::kActive : TabActive::kInactive,
      BrowserFrameActiveState::kUseCurrent);
    if (!IsTabAudioToggleable() || !IsMouseHovered())
    {
        return fill_color;
    }

    return color_utils::BlendTowardMaxContrast(fill_color,
                                               mouse_pressed_ ? 72 : 36);
}

bool AlertIndicatorMuteTab::OnMousePressed(const ui::MouseEvent& event)
{
    mouse_pressed_ = true;
    SchedulePaint();

    if (!IsTabAudioToggleable())
    {
        return AlertIndicator::OnMousePressed(event);
    }

    return true;
}

void AlertIndicatorMuteTab::OnMouseReleased(const ui::MouseEvent& event)
{
    mouse_pressed_ = false;
    SchedulePaint();

    if (!IsTabAudioToggleable() || !IsMouseHovered())
    {
        return AlertIndicator::OnMouseReleased(event);
    }

    auto* tab_strip = static_cast<TabStrip*>(parent_tab_->controller());
    const int tab_index = tab_strip->GetModelIndexOf(parent_tab_);
    if (tab_index == -1)
    {
        return;
    }

    auto* tab_strip_model = static_cast<BrowserTabStripController*>(
            tab_strip->controller())->model();
    auto* web_contents = tab_strip_model->GetWebContentsAt(tab_index);
    if (!web_contents)
    {
        return;
    }

    chrome::SetTabAudioMuted(web_contents,
                             !web_contents->IsAudioMuted(),
                             TabMutedReason::CONTENT_SETTING,
                             std::string());
}

bool AlertIndicatorMuteTab::OnMouseDragged(const ui::MouseEvent& event)
{
    if (IsTabAudioToggleable())
    {
        SchedulePaint();
    }

    return AlertIndicator::OnMouseDragged(event);
}

void AlertIndicatorMuteTab::OnMouseEntered(const ui::MouseEvent& event)
{
    if (IsTabAudioToggleable())
    {
        SchedulePaint();
    }
    AlertIndicator::OnMouseExited(event);
}

void AlertIndicatorMuteTab::OnMouseExited(const ui::MouseEvent& event)
{
    if (IsTabAudioToggleable())
    {
        SchedulePaint();
    }

    AlertIndicator::OnMouseExited(event);
}
