#include "chrome/browser/ui/pmc_container/pmc_container.h"

#include <memory>
#include <string>
#include <utility>

#include "base/command_line.h"
#include "base/one_shot_event.h"
#include "chrome/browser/ui/extensions/extension_action_view_controller.h"
#include "chrome/browser/extensions/extension_service.h"
#include "chrome/browser/profiles/profile.h"
#include "chrome/browser/ui/browser.h"
#include "chrome/browser/ui/layout_constants.h"
#include "chrome/browser/ui/toolbar/toolbar_action_view_controller.h"
#include "chrome/browser/ui/toolbar/toolbar_actions_bar_bubble_delegate.h"
#include "chrome/browser/ui/views/toolbar/toolbar_action_view.h"
#include "components/prefs/pref_service.h"
#include "extensions/browser/extension_action_manager.h"
#include "extensions/browser/extension_registry.h"
#include "extensions/browser/extension_registry_observer.h"
#include "extensions/browser/extension_system.h"
#include "extensions/common/constants.h"
#include "ui/base/dragdrop/drag_drop_types.h"
#include "ui/views/layout/box_layout.h"
#include "ui/views/layout/grid_layout.h"
#include "ui/views/view.h"


PMCContainer::ActionInfo::ActionInfo()
    : position_(ACTION_ANY_POSITION) {}

PMCContainer::ActionInfo::~ActionInfo() {
  Reset();
}

void PMCContainer::ActionInfo::Reset() {
  // Destroy view before view_controller.
  // Destructor for |ToolbarActionView| tries to access controller instance.
  view_.reset();
  view_controller_.reset();
}

PMCContainer::PMCContainer(Browser* browser, Profile* profile)
    : views::View(),
      browser_(browser),
      extension_system_(extensions::ExtensionSystem::Get(profile)),
      extension_action_api_(extensions::ExtensionActionAPI::Get(profile)),
      extension_registry_(extensions::ExtensionRegistry::Get(profile)),
      extension_action_manager_(extensions::ExtensionActionManager::Get(profile)),
      weak_ptr_factory_(this) {
  // Handle when the extension system is ready
  extension_system_->ready().Post(
      FROM_HERE, base::BindOnce(&PMCContainer::OnExtensionSystemReady,
                                weak_ptr_factory_.GetWeakPtr()));
}

PMCContainer::~PMCContainer() {
  actions_.clear();
}

void PMCContainer::Init() {
  // Layout
  auto vertical_container_layout = std::make_unique<views::BoxLayout>(
      views::BoxLayout::Orientation::kHorizontal);
  vertical_container_layout->set_main_axis_alignment(
      views::BoxLayout::MainAxisAlignment::kCenter);
  vertical_container_layout->set_cross_axis_alignment(
      views::BoxLayout::CrossAxisAlignment::kCenter);
  SetLayoutManager(std::move(vertical_container_layout));

  // Separator
  vertical_separator_ = new views::Separator();
  vertical_separator_->SetColor(SkColorSetRGB(0xb2, 0xb5, 0xb7));
  constexpr int kSeparatorMargin = 3;
  constexpr int kSeparatorWidth = 1;
  vertical_separator_->SetPreferredSize(gfx::Size(
                                    kSeparatorWidth + kSeparatorMargin*2,
                                    GetLayoutConstant(LOCATION_BAR_ICON_SIZE)));
  vertical_separator_->SetBorder(
      views::CreateEmptyBorder(0, kSeparatorMargin, 0, kSeparatorMargin));
  
  // PMC extension should always be first
  actions_["ofmkmlimlfoienbhkpbcbjpianemggmj"].position_ = 0;
}

void PMCContainer::Update() {
  bool can_show = false;
  for (auto const& pair : actions_) {
    if (pair.second.view_controller_) {
      pair.second.view_controller_->UpdateState();
    }
    if (!can_show && pair.second.view_ && pair.second.view_->GetVisible()) {
      can_show = true;
    }
  }
  // Only show separator if we're showing any buttons
  const bool visible = !should_hide_ && can_show;
  SetVisible(visible);
  Layout();
}

void PMCContainer::SetShouldHide(bool should_hide) {
  should_hide_ = should_hide;
  Update();
}

content::WebContents* PMCContainer::GetCurrentWebContents() {
  return browser_->tab_strip_model()->GetActiveWebContents();
}

views::LabelButton* PMCContainer::GetOverflowReferenceView() const {
  // Our action views should always be visible,
  // so we should not need another view.
  NOTREACHED();
  return nullptr;
}

// ToolbarActionView::Delegate members
gfx::Size PMCContainer::GetToolbarActionSize() {
  // Width > Height to give space for a large bubble
  return gfx::Size(34, 24);
}

// Not supporting drag for action buttons inside this container
void PMCContainer::WriteDragDataForView(View* sender,
                                        const gfx::Point& press_pt,
                                        OSExchangeData* data) {}

int PMCContainer::GetDragOperationsForView(View* sender,
                                           const gfx::Point& p) {
  return ui::DragDropTypes::DRAG_NONE;
}

bool PMCContainer::CanStartDragForView(View* sender,
                                       const gfx::Point& press_pt,
                                       const gfx::Point& p) {
  return false;
}
// end ToolbarActionView::Delegate members

// ExtensionRegistry::Observer
void PMCContainer::OnExtensionLoaded(content::BrowserContext* browser_context,
                                     const extensions::Extension* extension) {
  if (IsContainerAction(extension->id())) {
    AddAction(extension);
  }
}

void PMCContainer::OnExtensionUnloaded(content::BrowserContext* browser_context,
                                       const extensions::Extension* extension,
                                       extensions::UnloadedExtensionReason reason) {
  if (IsContainerAction(extension->id())) {
    RemoveAction(extension->id());
  }
}
// end ExtensionRegistry::Observer

// ExtensionActionAPI::Observer
void PMCContainer::OnExtensionActionUpdated(extensions::ExtensionAction* extension_action,
                                            content::WebContents* web_contents,
                                            content::BrowserContext* browser_context) {
  if (IsContainerAction(extension_action->extension_id())) {
    UpdateActionState(extension_action->extension_id());
  }
}
// end ExtensionActionAPI::Observer

void PMCContainer::ChildPreferredSizeChanged(views::View* child) {
  PreferredSizeChanged();
}

ToolbarActionViewController* PMCContainer::GetActionForId(const std::string& action_id) {
  return nullptr;
}

ToolbarActionViewController* PMCContainer::GetPoppedOutAction() const {
  return nullptr;
}

void PMCContainer::OnContextMenuShown(ToolbarActionViewController* extension) {}

void PMCContainer::OnContextMenuClosed(ToolbarActionViewController* extension) {}

bool PMCContainer::IsActionVisibleOnToolbar(const ToolbarActionViewController* action) const {
  return false;
}

extensions::ExtensionContextMenuModel::ButtonVisibility
PMCContainer::GetActionVisibility(const ToolbarActionViewController* action) const {
  return extensions::ExtensionContextMenuModel::PINNED;
}

void PMCContainer::UndoPopOut() {}

void PMCContainer::SetPopupOwner(ToolbarActionViewController* popup_owner) {
  if (popup_owner) {
    DCHECK(!popup_owner_);
    popup_owner_ = popup_owner;
    UpdateActionVisibility(popup_owner->GetId());
  } 
  else if (popup_owner_) {
    auto* previous_owner = popup_owner_;
    popup_owner_ = nullptr;
    UpdateActionVisibility(previous_owner->GetId());
  }
}

void PMCContainer::HideActivePopup() {
  if (popup_owner_) {
    popup_owner_->HidePopup();
  }
}

bool PMCContainer::CloseOverflowMenuIfOpen() {
  return false;
}

void PMCContainer::PopOutAction(ToolbarActionViewController* action,
                                bool is_sticky,
                                base::OnceClosure closure) {}

bool PMCContainer::ShowToolbarActionPopupForAPICall(const std::string& action_id) {
  return false;
}

void PMCContainer::ShowToolbarActionBubble(std::unique_ptr<ToolbarActionsBarBubbleDelegate> bubble) {}

void PMCContainer::ShowToolbarActionBubbleAsync(std::unique_ptr<ToolbarActionsBarBubbleDelegate> bubble) {}

void PMCContainer::ToggleExtensionsMenu() {}

bool PMCContainer::HasAnyExtensions() const {
  return false;
}

bool PMCContainer::ShouldShowAction(const std::string& id) const {
  if (!IsContainerAction(id)) {
    return false;
  }
  if (popup_owner_ && actions_.at(id).view_controller_.get() == popup_owner_) {
    return true;
  }

  return true;
}

bool PMCContainer::IsContainerAction(const std::string& id) const {
  return (actions_.find(id) != actions_.end());
}

void PMCContainer::AddAction(const extensions::Extension* extension) {
  DCHECK(extension);

  const std::string& id = extension->id();
  if (!IsContainerAction(id)) {
    return;
  }

  VLOG(1) << "AddAction (" << id
          << "), was already loaded: " << static_cast<bool>(actions_[id].view_);

  if (!actions_[id].view_controller_) {
    // Remove existing stub view, if present
    actions_[id].Reset();
    // Create a ExtensionActionViewController for the extension
    actions_[id].view_controller_ =
        ExtensionActionViewController::Create(id, browser_, this);
    // The button view
    actions_[id].view_ = std::make_unique<ToolbarActionView>(
                                          actions_[id].view_controller_.get(), this);
    AttachAction(id);
  }
}

void PMCContainer::AddAction(const std::string& id) {
  DCHECK(extension_registry_);
  const extensions::Extension* extension =
      extension_registry_->enabled_extensions().GetByID(id);
  if (extension) {
    AddAction(extension);
    return;
  }
  LOG(ERROR) << "Extension not found for AddAction: " << id;
}

void PMCContainer::RemoveAction(const std::string& id) {
  DCHECK(IsContainerAction(id));
  VLOG(1) << "RemoveAction (" << id << "), was loaded: "
          << static_cast<bool>(actions_[id].view_);
  // This will reset references and automatically remove the child from the
  // parent (us)
  actions_[id].Reset();
  // Layout
  Update();
  PreferredSizeChanged();
}

void PMCContainer::UpdateActionVisibility(const std::string& id) {
  if (views::Button* button = GetActionButton(id)) {
    bool should_show = ShouldShowAction(id);
    if (button->GetVisible() != should_show) {
      button->SetVisible(should_show);
      Update();
    }
  }
}

views::Button* PMCContainer::GetActionButton(const std::string& id) const {
  return IsContainerAction(id) ? actions_.at(id).view_.get() : nullptr;
}

bool PMCContainer::IsActionShown(const std::string& id) const {
  views::Button* button = GetActionButton(id);
  return button && button->GetVisible();
}

void PMCContainer::UpdateActionState(const std::string& id) {
  if (actions_[id].view_controller_) {
    actions_[id].view_controller_->UpdateState();
  }
}

void PMCContainer::OnExtensionSystemReady() {
  // Observe changes in extension system
  extension_registry_observer_.Observe(extension_registry_);
  extension_action_observer_.Observe(extension_action_api_);
  // Check if extensions already loaded
  AddAction("ofmkmlimlfoienbhkpbcbjpianemggmj");
}

void PMCContainer::AttachAction(const std::string& id) {
  DCHECK(IsContainerAction(id));
  DCHECK(actions_[id].view_);

  const auto& action = actions_[id];

  if (!ShouldShowAction(id)) {
    action.view_->SetVisible(false);
  }

  if (action.position_ != ACTION_ANY_POSITION) {
    DCHECK_GT(action.position_, 0);
    AddChildViewAt(action.view_.get(), action.position_);
  } 
  else {
    AddChildView(action.view_.get());
  }
  // TODO: We only add PMC into the container, but if we
  //       decided to add more component extensions,
  //       we should only add separator when all
  //       extensions are already added.
  AddChildView(vertical_separator_);
  
  // Control destruction
  action.view_->set_owned_by_client();
  Update();
  PreferredSizeChanged();
}
